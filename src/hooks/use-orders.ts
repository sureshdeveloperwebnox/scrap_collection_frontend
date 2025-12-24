import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Order, OrderStatus, PaymentStatusEnum } from '@/types';
import { useAuthStore } from '@/lib/store/auth-store';
import { useOrderStatsStore } from '@/lib/store/order-stats-store';
import { useOrdersCacheStore } from '@/lib/store/orders-cache-store';
import { useMemo, useEffect } from 'react';

// Get all orders with optional filters and pagination
export const useOrders = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatusEnum;
  collectorId?: string;
  organizationId?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'customerName' | 'createdAt' | 'orderStatus' | 'paymentStatus';
  sortOrder?: 'asc' | 'desc';
}) => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  // Generate query key for cache lookup
  const queryParams = useMemo(() => ({ ...params, organizationId }), [params, organizationId]);

  return useQuery({
    queryKey: queryKeys.orders.list(queryParams),
    queryFn: () => ordersApi.getOrders(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes - keep data fresh for longer
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    placeholderData: (previousData: any) => previousData, // Smooth transitions between pages
  });
};

// Get single order
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.getOrder(id),
    enabled: !!id, // Only run query if id is provided
  });
};

// Get order statistics
export const useOrderStats = (period?: 'daily' | 'weekly' | 'monthly') => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { setStats, setLoading } = useOrderStatsStore();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.orders.stats(period),
    queryFn: async () => {
      const response = await ordersApi.getOrderStats(period);
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!organizationId,
  });

  // Sync stats to Zustand store
  useEffect(() => {
    if (data?.data) {
      // Transform API response to match OrderStats interface
      const stats = {
        total: data.data.total || 0,
        pending: data.data.pending || 0,
        assigned: data.data.assigned || 0,
        inProgress: data.data.inProgress || 0,
        completed: data.data.completed || 0,
        cancelled: data.data.cancelled || 0,
        unpaid: data.data.unpaid || 0,
        paid: data.data.paid || 0,
        refunded: data.data.refunded || 0,
      };
      setStats(stats);
    }
  }, [data, setStats]);

  // Sync loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  return { data, isLoading, error };
};

// Get orders by collector
export const useOrdersByCollector = (collectorId: string) => {
  return useQuery({
    queryKey: queryKeys.orders.byCollector(collectorId),
    queryFn: () => ordersApi.getOrdersByCollector(collectorId),
    enabled: !!collectorId,
  });
};

// Create order mutation with optimistic updates
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { incrementStatus, incrementPaymentStatus } = useOrderStatsStore();
  const { invalidateCache, addOrderToCache } = useOrdersCacheStore();

  return useMutation({
    mutationFn: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) =>
      ordersApi.createOrder({ ...orderData, organizationId } as any),
    onMutate: async (newOrderData) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.lists() });

      // Snapshot previous values for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.orders.lists() });

      // Create optimistic order object
      const optimisticOrder: Order = {
        ...newOrderData,
        id: `temp-${Date.now()}`, // Temporary ID
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistically add to Zustand cache for instant visibility
      addOrderToCache(optimisticOrder);

      // Optimistically update TanStack Query cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.orders.lists() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              orders: [optimisticOrder, ...(old.data.orders || [])],
              pagination: {
                ...old.data.pagination,
                total: (old.data.pagination?.total || 0) + 1,
              },
            },
          };
        }
      );

      // Optimistically update stats
      incrementStatus(newOrderData.orderStatus);
      incrementPaymentStatus(newOrderData.paymentStatus);

      return { previousQueries, optimisticOrder };
    },
    onError: (err, newOrderData, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Rollback Zustand cache
      invalidateCache();

      // Rollback stats
      useOrderStatsStore.getState().decrementStatus(newOrderData.orderStatus);
      useOrderStatsStore.getState().decrementPaymentStatus(newOrderData.paymentStatus);
    },
    onSuccess: (newOrder, variables, context) => {
      // Extract the actual order from API response
      const createdOrder = (newOrder as { data: Order })?.data || (newOrder as unknown as Order);

      // Replace optimistic order with real one in Zustand cache
      if (context?.optimisticOrder) {
        invalidateCache(); // Clear optimistic entry
        addOrderToCache(createdOrder); // Add real order
      }

      // Update TanStack Query cache with real order data
      queryClient.setQueriesData(
        { queryKey: queryKeys.orders.lists() },
        (old: any) => {
          if (!old?.data) return old;
          // Replace optimistic order with real one
          const orders = old.data.orders.map((o: Order) =>
            o.id === context?.optimisticOrder?.id ? createdOrder : o
          );
          return {
            ...old,
            data: {
              ...old.data,
              orders,
            },
          };
        }
      );

      // Set detail query
      if (createdOrder?.id) {
        queryClient.setQueryData(queryKeys.orders.detail(createdOrder.id), { data: createdOrder });
      }

      // Stats were already updated optimistically in onMutate
      // Just ensure they're correct by refetching in background (non-blocking)
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.stats(),
          refetchType: 'active' // Only refetch active queries, not all
        });
      }, 500);

      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
    onSettled: () => {
      // Refetch to ensure consistency (but use cached data if available)
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
};

// Update order mutation
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { incrementStatus, decrementStatus, incrementPaymentStatus, decrementPaymentStatus } = useOrderStatsStore();
  const { updateOrderInCache } = useOrdersCacheStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) =>
      ordersApi.updateOrder(id, data),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.lists() });

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.orders.lists() });

      // Optimistically update Zustand cache
      updateOrderInCache(variables.id, variables.data);

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (response, variables) => {
      // Extract the order from the API response structure
      const updatedOrder = (response as { data: Order })?.data || response;

      // If status changed, update Zustand store
      if (variables.data.orderStatus && updatedOrder?.orderStatus) {
        // Get old status from cache if available
        const oldOrder = queryClient.getQueryData<{ data: Order }>(queryKeys.orders.detail(variables.id));
        if (oldOrder?.data?.orderStatus && oldOrder.data.orderStatus !== updatedOrder.orderStatus) {
          decrementStatus(oldOrder.data.orderStatus);
          incrementStatus(updatedOrder.orderStatus);
        }
      }

      // If payment status changed, update Zustand store
      if (variables.data.paymentStatus && updatedOrder?.paymentStatus) {
        const oldOrder = queryClient.getQueryData<{ data: Order }>(queryKeys.orders.detail(variables.id));
        if (oldOrder?.data?.paymentStatus && oldOrder.data.paymentStatus !== updatedOrder.paymentStatus) {
          decrementPaymentStatus(oldOrder.data.paymentStatus);
          incrementPaymentStatus(updatedOrder.paymentStatus);
        }
      }

      // Update the order in TanStack Query cache
      if (updatedOrder && variables.id) {
        queryClient.setQueryData(queryKeys.orders.detail(variables.id), { data: updatedOrder });
      }

      // Update Zustand cache with final data
      updateOrderInCache(variables.id, updatedOrder);

      // Invalidate all orders list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });

      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });

      // Update dashboard stats if needed
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Delete order mutation
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { decrementStatus, decrementPaymentStatus } = useOrderStatsStore();
  const { removeOrderFromCache } = useOrdersCacheStore();

  return useMutation({
    mutationFn: (id: string) => ordersApi.deleteOrder(id),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.lists() });

      // Snapshot the previous value
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.orders.lists() });
      const deletedOrder = queryClient.getQueryData<{ data: Order }>(queryKeys.orders.detail(deletedId));

      // Optimistically remove from Zustand cache
      removeOrderFromCache(deletedId);

      return { previousQueries, deletedOrder };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (_, deletedId, context) => {
      // Get deleted order from cache to know which status to decrement
      const deletedOrder = context?.deletedOrder as { data: Order } | undefined;
      if (deletedOrder?.data) {
        if (deletedOrder.data.orderStatus) {
          decrementStatus(deletedOrder.data.orderStatus);
        }
        if (deletedOrder.data.paymentStatus) {
          decrementPaymentStatus(deletedOrder.data.paymentStatus);
        }
      }

      // Remove order from TanStack Query cache
      queryClient.removeQueries({ queryKey: queryKeys.orders.detail(deletedId) });

      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });

      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });

      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Assign collector mutation
export const useAssignCollector = () => {
  const queryClient = useQueryClient();
  const { updateOrderInCache } = useOrdersCacheStore();

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: any }) =>
      ordersApi.assignOrder(orderId, data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.lists() });
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.orders.lists() });

      // Optimistically update cache
      const updates: any = { orderStatus: 'ASSIGNED' };
      if (variables.data.collectorId) updates.assignedCollectorId = variables.data.collectorId;
      if (variables.data.collectorIds?.length > 0) updates.assignedCollectorId = variables.data.collectorIds[0];
      if (variables.data.crewId) updates.crewId = variables.data.crewId;

      updateOrderInCache(variables.orderId, updates);

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (updatedOrder) => {
      const order = (updatedOrder as { data: Order })?.data || (updatedOrder as unknown as Order);

      // Update order in cache
      queryClient.setQueryData(queryKeys.orders.detail(order.id), { data: order });
      updateOrderInCache(order.id, order);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byCollector(order.assignedCollectorId!)
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.collectors.stats() });
    },
  });
};

// Auto-assign collector mutation
export const useAutoAssignCollector = () => {
  const queryClient = useQueryClient();
  const { updateOrderInCache } = useOrdersCacheStore();

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.autoAssignCollector(orderId),
    onSuccess: (updatedOrder) => {
      const order = (updatedOrder as { data: Order })?.data || (updatedOrder as unknown as Order);

      // Update order in cache
      queryClient.setQueryData(queryKeys.orders.detail(order.id), { data: order });
      updateOrderInCache(order.id, order);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      if (order.assignedCollectorId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byCollector(order.assignedCollectorId)
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.collectors.stats() });
    },
  });
};

// Update order status mutation
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { incrementStatus, decrementStatus } = useOrderStatsStore();
  const { updateOrderInCache } = useOrdersCacheStore();

  return useMutation({
    mutationFn: ({ orderId, status, notes }: {
      orderId: string;
      status: OrderStatus;
      notes?: string
    }) => ordersApi.updateOrderStatus(orderId, status, notes),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.lists() });
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.orders.lists() });

      // Get old order to track status change
      const oldOrder = queryClient.getQueryData<{ data: Order }>(queryKeys.orders.detail(variables.orderId));

      // Optimistically update cache
      updateOrderInCache(variables.orderId, { orderStatus: variables.status, adminNotes: variables.notes });

      // Optimistically update stats
      if (oldOrder?.data?.orderStatus && oldOrder.data.orderStatus !== variables.status) {
        decrementStatus(oldOrder.data.orderStatus);
        incrementStatus(variables.status);
      }

      return { previousQueries, oldOrder };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // Rollback stats
      if (context?.oldOrder?.data?.orderStatus) {
        const oldStatus = context.oldOrder.data.orderStatus;
        if (oldStatus !== variables.status) {
          useOrderStatsStore.getState().incrementStatus(oldStatus);
          useOrderStatsStore.getState().decrementStatus(variables.status);
        }
      }
    },
    onSuccess: (updatedOrder) => {
      const order = (updatedOrder as { data: Order })?.data || (updatedOrder as unknown as Order);

      // Update order in cache
      queryClient.setQueryData(queryKeys.orders.detail(order.id), { data: order });
      updateOrderInCache(order.id, order);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });

      if (order.assignedCollectorId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byCollector(order.assignedCollectorId)
        });
      }
    },
  });
};
