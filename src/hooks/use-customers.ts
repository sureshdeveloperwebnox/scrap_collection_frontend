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
      // Check Zustand cache first
      const cached = getCachedData(cacheKey);
      if (cached) {
        // Return cached data immediately, but still fetch in background
        return { data: { customers: cached.customers, pagination: cached.pagination } };
      }
      
      // Fetch from API
      const response = await customersApi.getCustomers(queryParams);
      
      // Store in Zustand cache
      if (response?.data?.customers && response?.data?.pagination) {
        setCachedData(cacheKey, response.data.customers, response.data.pagination);
      }
      
      return response;
    },
    placeholderData: (previousData) => {
      // First check Zustand cache
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

// Create customer mutation
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { incrementStatus } = useCustomerStatsStore();
  const { invalidateCache } = useCustomersCacheStore();

  return useMutation({
    mutationFn: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => 
      customersApi.createCustomer({ ...customerData, organizationId }),
    onSuccess: (newCustomer) => {
      // Update Zustand store - increment ACTIVE status count by default
      incrementStatus('ACTIVE');
      
      // Invalidate Zustand cache to force fresh fetch
      invalidateCache();
      
      // Invalidate all customers list queries (all pages and filters)
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.stats(organizationId) });
      
      // Optionally add the new customer to the cache
      const customerData = (newCustomer as { data: Customer })?.data || newCustomer;
      if (customerData?.id) {
        queryClient.setQueryData(queryKeys.customers.detail(customerData.id), { data: customerData });
      }
      
      // Invalidate dashboard stats as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
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
