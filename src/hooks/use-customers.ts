import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Customer } from '@/types';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCustomerStatsStore } from '@/lib/store/customer-stats-store';
import { useCustomersCacheStore } from '@/lib/store/customers-cache-store';
import { useMemo } from 'react';

// Get all customers with optional filters and pagination
export const useCustomers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vehicleType?: string;
  scrapCategory?: string;
  sortBy?: 'name' | 'phone' | 'email' | 'status' | 'accountStatus' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}) => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { getCachedData, setCachedData } = useCustomersCacheStore();
  
  // Generate query key for cache lookup
  const queryParams = useMemo(() => ({ ...params, organizationId }), [params, organizationId]);
  const cacheKey = useMemo(() => {
    const sortedParams = Object.keys(queryParams)
      .sort()
      .reduce((acc, key) => {
        if (queryParams[key as keyof typeof queryParams] !== undefined && queryParams[key as keyof typeof queryParams] !== null) {
          acc[key] = queryParams[key as keyof typeof queryParams];
        }
        return acc;
      }, {} as Record<string, any>);
    return JSON.stringify(sortedParams);
  }, [queryParams]);

  return useQuery({
    queryKey: queryKeys.customers.list(queryParams),
    queryFn: async () => {
      // Check Zustand cache first for instant data
      const cached = getCachedData(cacheKey);
      if (cached) {
        // Return cached data immediately, but still fetch in background for freshness
        // This provides instant UI updates while ensuring data accuracy
        const backgroundFetch = customersApi.getCustomers(queryParams).then((response) => {
          // Update cache with fresh data
          if (response?.data?.customers && response?.data?.pagination) {
            setCachedData(cacheKey, response.data.customers, response.data.pagination);
          }
          return response;
        }).catch(() => {
          // Silently fail background fetch, use cached data
          return { data: { customers: cached.customers, pagination: cached.pagination } };
        });
        
        // Return cached data immediately
        return { data: { customers: cached.customers, pagination: cached.pagination } };
      }
      
      // Fetch from API if no cache
      const response = await customersApi.getCustomers(queryParams);
      
      // Store in Zustand cache
      if (response?.data?.customers && response?.data?.pagination) {
        setCachedData(cacheKey, response.data.customers, response.data.pagination);
      }
      
      return response;
    },
    placeholderData: (previousData) => {
      // First check Zustand cache for instant data
      const cached = getCachedData(cacheKey);
      if (cached) {
        return { data: { customers: cached.customers, pagination: cached.pagination } };
      }
      // Fallback to previous query data
      return previousData;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - data is fresh for 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
    refetchOnMount: false, // Use cached data if available
    refetchInterval: false, // Don't auto-refetch, rely on mutations for updates
  });
};

// Get single customer
export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customersApi.getCustomer(id),
    enabled: !!id, // Only run query if id is provided
  });
};

// Create customer mutation with optimistic updates
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { incrementStatus } = useCustomerStatsStore();
  const { invalidateCache, addCustomerToCache } = useCustomersCacheStore();
  
  return useMutation({
    mutationFn: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => 
      customersApi.createCustomer({ ...customerData, organizationId }),
    onMutate: async (newCustomerData) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.lists() });
      
      // Snapshot previous values for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.customers.lists() });
      
      // Create optimistic customer object
      const optimisticCustomer: Customer = {
        ...newCustomerData,
        id: `temp-${Date.now()}`, // Temporary ID
        createdAt: new Date(),
        updatedAt: new Date(),
        joinedDate: newCustomerData.joinedDate || new Date(),
      };
      
      // Optimistically add to Zustand cache for instant visibility
      addCustomerToCache(optimisticCustomer);
      
      // Optimistically update TanStack Query cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.customers.lists() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              customers: [optimisticCustomer, ...(old.data.customers || [])],
              pagination: {
                ...old.data.pagination,
                total: (old.data.pagination?.total || 0) + 1,
              },
            },
          };
        }
      );
      
      // Optimistically update stats
      incrementStatus(newCustomerData.accountStatus || 'ACTIVE');
      
      return { previousQueries, optimisticCustomer };
    },
    onError: (err, newCustomerData, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      // Rollback Zustand cache
      invalidateCache();
      
      // Rollback stats
      const status = newCustomerData.accountStatus || 'ACTIVE';
      useCustomerStatsStore.getState().decrementStatus(status);
    },
    onSuccess: (newCustomer, variables, context) => {
      // Extract the actual customer from API response
      const createdCustomer = (newCustomer as { data: Customer })?.data || newCustomer as Customer;
      
      // Replace optimistic customer with real one in Zustand cache
      if (context?.optimisticCustomer) {
        invalidateCache(); // Clear optimistic entry
        addCustomerToCache(createdCustomer); // Add real customer
      }
      
      // Update TanStack Query cache with real customer data
      queryClient.setQueriesData(
        { queryKey: queryKeys.customers.lists() },
        (old: any) => {
          if (!old?.data) return old;
          // Replace optimistic customer with real one
          const customers = old.data.customers.map((c: Customer) =>
            c.id === context?.optimisticCustomer?.id ? createdCustomer : c
          );
          return {
            ...old,
            data: {
              ...old.data,
              customers,
    },
          };
        }
      );
      
      // Set detail query
      if (createdCustomer?.id) {
        queryClient.setQueryData(queryKeys.customers.detail(createdCustomer.id), { data: createdCustomer });
      }
      
      // Stats were already updated optimistically in onMutate
      // Just ensure they're correct by refetching in background (non-blocking)
      // Use a small delay to allow optimistic update to be visible first
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.customers.stats(organizationId),
          refetchType: 'active' // Only refetch active queries, not all
        });
      }, 500);
      
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
    onSettled: () => {
      // Refetch to ensure consistency (but use cached data if available)
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
};

// Update customer mutation
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { incrementStatus, decrementStatus } = useCustomerStatsStore();
  const { updateCustomerInCache } = useCustomersCacheStore();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      customersApi.updateCustomer(id, data),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.lists() });
      
      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.customers.lists() });
      
      // Optimistically update Zustand cache
      updateCustomerInCache(variables.id, variables.data);
      
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
      // Extract the customer from the API response structure
      const updatedCustomer = (response as { data: Customer })?.data || response;
      
      // If status changed, update Zustand store
      if (variables.data.accountStatus && updatedCustomer?.accountStatus) {
        // Get old status from cache if available
        const oldCustomer = queryClient.getQueryData<{ data: Customer }>(queryKeys.customers.detail(variables.id));
        if (oldCustomer?.data?.accountStatus && oldCustomer.data.accountStatus !== updatedCustomer.accountStatus) {
          decrementStatus(oldCustomer.data.accountStatus as any);
          incrementStatus(updatedCustomer.accountStatus as any);
        }
      }
      
      // Update the customer in TanStack Query cache
      if (updatedCustomer && variables.id) {
        queryClient.setQueryData(queryKeys.customers.detail(variables.id), { data: updatedCustomer });
      }
      
      // Update Zustand cache with final data
      updateCustomerInCache(variables.id, updatedCustomer);
      
      // Invalidate all customers list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.stats(organizationId) });
      
      // Update dashboard stats if needed
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Delete customer mutation
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { decrementStatus } = useCustomerStatsStore();
  const { removeCustomerFromCache } = useCustomersCacheStore();
  
  return useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.lists() });
      
      // Snapshot the previous value
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.customers.lists() });
      const deletedCustomer = queryClient.getQueryData<{ data: Customer }>(queryKeys.customers.detail(deletedId));
      
      // Optimistically remove from Zustand cache
      removeCustomerFromCache(deletedId);
      
      return { previousQueries, deletedCustomer };
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
      // Get deleted customer from cache to know which status to decrement
      const deletedCustomer = context?.deletedCustomer as { data: Customer } | undefined;
      if (deletedCustomer?.data?.accountStatus) {
        decrementStatus(deletedCustomer.data.accountStatus as any);
      }
      
      // Remove customer from TanStack Query cache
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(deletedId) });
      
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.stats(organizationId) });
      
      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Bulk update customers mutation
export const useBulkUpdateCustomers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<Customer> }) =>
      customersApi.bulkUpdateCustomers(ids, updates),
    onSuccess: () => {
      // Invalidate all customers queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Convert lead to customer mutation
export const useConvertLeadToCustomer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { incrementStatus } = useCustomerStatsStore();
  
  return useMutation({
    mutationFn: (leadId: string) => 
      customersApi.convertLeadToCustomer(leadId),
    onSuccess: () => {
      // Increment ACTIVE status count
      incrementStatus('ACTIVE');
      
      // Invalidate customers list
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.stats(organizationId) });
      
      // Invalidate leads list
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });
      
      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};
