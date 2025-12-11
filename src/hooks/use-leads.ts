import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Lead } from '@/types';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLeadStatsStore } from '@/lib/store/lead-stats-store';

// Get all leads with optional filters and pagination
export const useLeads = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vehicleType?: string;
  vehicleCondition?: string;
  sortBy?: 'fullName' | 'phone' | 'email' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  }) => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useQuery({
    queryKey: queryKeys.leads.list({ ...params, organizationId }),
    queryFn: () => leadsApi.getLeads({ ...params, organizationId }),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter for paginated data
    gcTime: 5 * 60 * 1000, // 5 minutes
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

  return useMutation({
    mutationFn: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => 
      leadsApi.createLead({ ...leadData, organizationId }),
    onSuccess: (newLead) => {
      // Update Zustand store - increment NEW status count
      incrementStatus('NEW');
      
      // Invalidate all leads list queries (all pages and filters)
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });
      
      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.stats(organizationId) });
      
      // Optionally add the new lead to the cache
      queryClient.setQueryData(queryKeys.leads.detail(newLead.id), newLead);
      
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

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => 
      leadsApi.updateLead(id, data),
    onSuccess: (response, variables) => {
      // Extract the lead from the API response structure
      // API returns { data: Lead }, so response is already { data: Lead }
      const updatedLead = (response as { data: Lead })?.data || response;
      
      // If status changed, update Zustand store
      if (variables.data.status && updatedLead?.status && updatedLead.status !== variables.data.status) {
        // Get old status from cache if available
        const oldLead = queryClient.getQueryData<{ data: Lead }>(queryKeys.leads.detail(variables.id));
        if (oldLead?.data?.status) {
          decrementStatus(oldLead.data.status as any);
        }
        // Increment new status
        incrementStatus(updatedLead.status as any);
      }
      
      // Update the lead in cache - use variables.id to ensure we have the correct ID
      if (updatedLead && variables.id) {
        queryClient.setQueryData(queryKeys.leads.detail(variables.id), { data: updatedLead });
      }
      
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

  return useMutation({
    mutationFn: (id: string) => leadsApi.deleteLead(id),
    onSuccess: (_, deletedId) => {
      // Get deleted lead from cache to know which status to decrement
      const deletedLead = queryClient.getQueryData<{ data: Lead }>(queryKeys.leads.detail(deletedId));
      if (deletedLead?.data?.status) {
        decrementStatus(deletedLead.data.status as any);
      }
      
      // Remove lead from cache
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
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<Lead> }) => 
      leadsApi.bulkUpdateLeads(ids, updates),
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