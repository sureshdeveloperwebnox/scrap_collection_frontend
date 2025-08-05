import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Lead } from '@/types';

// Get all leads with optional filters
export const useLeads = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vehicleType?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.leads.list(params),
    queryFn: () => leadsApi.getLeads(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
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

  return useMutation({
    mutationFn: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => 
      leadsApi.createLead(leadData),
    onSuccess: (newLead) => {
      // Invalidate and refetch leads list
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });
      
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

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => 
      leadsApi.updateLead(id, data),
    onSuccess: (updatedLead) => {
      // Update the lead in cache
      queryClient.setQueryData(queryKeys.leads.detail(updatedLead.id), updatedLead);
      
      // Invalidate leads list to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });
      
      // Update dashboard stats if needed
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Delete lead mutation
export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => leadsApi.deleteLead(id),
    onSuccess: (_, deletedId) => {
      // Remove lead from cache
      queryClient.removeQueries({ queryKey: queryKeys.leads.detail(deletedId) });
      
      // Invalidate leads list
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });
      
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

  return useMutation({
    mutationFn: (leadId: string) => leadsApi.convertToOrder(leadId),
    onSuccess: (result) => {
      // Invalidate leads list
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.lists() });
      
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      
      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};