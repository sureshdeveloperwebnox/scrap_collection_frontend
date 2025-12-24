import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Lead } from '@/types';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLeadStatsStore } from '@/lib/store/lead-stats-store';
import { useLeadsCacheStore } from '@/lib/store/leads-cache-store';
import { useMemo } from 'react';

// Get all leads with optional filters and pagination
export const useLeads = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: import('@/types').LeadStatus;
  vehicleType?: string;
  vehicleCondition?: string;
  sortBy?: 'fullName' | 'phone' | 'email' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}) => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  // Generate query key for cache lookup
  const queryParams = useMemo(() => ({ ...params, organizationId }), [params, organizationId]);

  return useQuery({
    queryKey: queryKeys.leads.list(queryParams),
    queryFn: () => leadsApi.getLeads(queryParams),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData: any) => previousData,
  });
};

// Get single lead
export const useLead = (id: string) => {
  return useQuery({
    queryKey: queryKeys.leads.detail(id),
    queryFn: () => leadsApi.getLead(id),
    enabled: !!id, // Only run query if id is provided
  });
};

// Create lead mutation
export const useCreateLead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { incrementStatus } = useLeadStatsStore();
  const { invalidateCache } = useLeadsCacheStore();

  return useMutation({
    mutationFn: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) =>
      leadsApi.createLead({ ...leadData, organizationId: organizationId! }),
    onSuccess: (newLead) => {
      // Update Zustand store - increment NEW status count
      incrementStatus('NEW');

      // Invalidate Zustand cache to force fresh fetch
      invalidateCache();

      // Invalidate all leads list queries (all pages and filters)
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });

      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats(organizationId) });

      // Optionally add the new lead to the cache
      const leadData = (newLead as { data: Lead })?.data || newLead;
      if (leadData?.id) {
        queryClient.setQueryData(queryKeys.leads.detail(leadData.id), { data: leadData });
      }

      // Invalidate dashboard stats as they might be affected
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Update lead mutation
export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { incrementStatus, decrementStatus } = useLeadStatsStore();
  const { updateLeadInCache } = useLeadsCacheStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      leadsApi.updateLead(id, data),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.leads.lists() });

      // Snapshot the previous value for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.leads.lists() });

      // Optimistically update Zustand cache
      updateLeadInCache(variables.id, variables.data);

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
      // Extract the lead from the API response structure
      const updatedLead = (response as { data: Lead })?.data || response;

      // If status changed, update Zustand store
      if (variables.data.status && updatedLead?.status) {
        // Get old status from cache if available
        const oldLead = queryClient.getQueryData<{ data: Lead }>(queryKeys.leads.detail(variables.id));
        if (oldLead?.data?.status && oldLead.data.status !== updatedLead.status) {
          decrementStatus(oldLead.data.status as any);
          incrementStatus(updatedLead.status as any);
        }
      }

      // Update the lead in TanStack Query cache
      if (updatedLead && variables.id) {
        queryClient.setQueryData(queryKeys.leads.detail(variables.id), { data: updatedLead });
      }

      // Update Zustand cache with final data
      updateLeadInCache(variables.id, updatedLead);

      // Invalidate all leads list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });

      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats(organizationId) });

      // Update dashboard stats if needed
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Delete lead mutation
export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { decrementStatus } = useLeadStatsStore();
  const { removeLeadFromCache } = useLeadsCacheStore();

  return useMutation({
    mutationFn: (id: string) => leadsApi.deleteLead(id),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.leads.lists() });

      // Snapshot the previous value
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.leads.lists() });
      const deletedLead = queryClient.getQueryData<{ data: Lead }>(queryKeys.leads.detail(deletedId));

      // Optimistically remove from Zustand cache
      removeLeadFromCache(deletedId);

      return { previousQueries, deletedLead };
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
      // Get deleted lead from cache to know which status to decrement
      const deletedLead = context?.deletedLead as { data: Lead } | undefined;
      if (deletedLead?.data?.status) {
        decrementStatus(deletedLead.data.status as any);
      }

      // Remove lead from TanStack Query cache
      queryClient.removeQueries({ queryKey: queryKeys.leads.detail(deletedId) });

      // Invalidate leads list
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });

      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats(organizationId) });

      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Bulk update leads mutation
export const useBulkUpdateLeads = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<Lead> }) => {
      // Since bulkUpdateLeads doesn't exist in API, update leads one by one
      return Promise.all(ids.map(id => leadsApi.updateLead(id, updates)));
    },
    onSuccess: () => {
      // Invalidate all leads queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Convert lead to order mutation
export const useConvertLeadToOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { incrementStatus, decrementStatus } = useLeadStatsStore();

  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data?: any }) =>
      leadsApi.convertToOrder(leadId, data || {}),
    onSuccess: (result, variables) => {
      const leadId = variables.leadId;
      // Get the lead from cache to know which status to decrement
      const lead = queryClient.getQueryData<{ data: Lead }>(queryKeys.leads.detail(leadId));
      if (lead?.data?.status) {
        decrementStatus(lead.data.status as any);
        // Status changes to CONVERTED when converted to order
        incrementStatus('CONVERTED');
      }

      // Invalidate leads list
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });

      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats(organizationId) });

      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });

      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};