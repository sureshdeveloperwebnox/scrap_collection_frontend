import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Order } from '@/types';

// Get all orders with optional filters
export const useOrders = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  collectorId?: string;
  scrapYardId?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => ordersApi.getOrders(params),
    keepPreviousData: true,
  });
};

// Get single order
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.getOrder(id),
    enabled: !!id,
  });
};

// Get order statistics
export const useOrderStats = (period?: 'daily' | 'weekly' | 'monthly') => {
  return useQuery({
    queryKey: queryKeys.orders.stats(period),
    queryFn: () => ordersApi.getOrderStats(period),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get orders by collector
export const useOrdersByCollector = (collectorId: string) => {
  return useQuery({
    queryKey: queryKeys.orders.byCollector(collectorId),
    queryFn: () => ordersApi.getOrdersByCollector(collectorId),
    enabled: !!collectorId,
  });
};

// Create order mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => 
      ordersApi.createOrder(orderData),
    onSuccess: (newOrder) => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      
      // Add new order to cache
      queryClient.setQueryData(queryKeys.orders.detail(newOrder.id), newOrder);
      
      // Update related data
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      
      // If collector assigned, update collector's orders
      if (newOrder.collectorId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.orders.byCollector(newOrder.collectorId) 
        });
      }
    },
  });
};

// Update order mutation
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) => 
      ordersApi.updateOrder(id, data),
    onSuccess: (updatedOrder) => {
      // Update order in cache
      queryClient.setQueryData(queryKeys.orders.detail(updatedOrder.id), updatedOrder);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      
      // Update collector orders if changed
      if (updatedOrder.collectorId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.orders.byCollector(updatedOrder.collectorId) 
        });
      }
    },
  });
};

// Delete order mutation
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.deleteOrder(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.orders.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Assign collector mutation
export const useAssignCollector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, collectorId }: { orderId: string; collectorId: string }) => 
      ordersApi.assignCollector(orderId, collectorId),
    onSuccess: (updatedOrder) => {
      // Update order in cache
      queryClient.setQueryData(queryKeys.orders.detail(updatedOrder.id), updatedOrder);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.byCollector(updatedOrder.collectorId!) 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.collectors.stats() });
    },
  });
};

// Auto-assign collector mutation
export const useAutoAssignCollector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.autoAssignCollector(orderId),
    onSuccess: (updatedOrder) => {
      // Update order in cache
      queryClient.setQueryData(queryKeys.orders.detail(updatedOrder.id), updatedOrder);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      if (updatedOrder.collectorId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.orders.byCollector(updatedOrder.collectorId) 
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.collectors.stats() });
    },
  });
};

// Update order status mutation
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status, notes }: { 
      orderId: string; 
      status: string; 
      notes?: string 
    }) => ordersApi.updateOrderStatus(orderId, status, notes),
    onSuccess: (updatedOrder) => {
      // Update order in cache
      queryClient.setQueryData(queryKeys.orders.detail(updatedOrder.id), updatedOrder);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      
      if (updatedOrder.collectorId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.orders.byCollector(updatedOrder.collectorId) 
        });
      }
    },
  });
};