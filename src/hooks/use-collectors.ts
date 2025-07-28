import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { collectorsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Collector } from '@/types';

// Get all collectors with optional filters
export const useCollectors = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  workZone?: string;
  available?: boolean;
}) => {
  return useQuery({
    queryKey: queryKeys.collectors.list(params),
    queryFn: () => collectorsApi.getCollectors(params),
    placeholderData: keepPreviousData,
  });
};

// Get single collector
export const useCollector = (id: string) => {
  return useQuery({
    queryKey: queryKeys.collectors.detail(id),
    queryFn: () => collectorsApi.getCollector(id),
    enabled: !!id,
  });
};

// Get collector statistics
export const useCollectorStats = () => {
  return useQuery({
    queryKey: queryKeys.collectors.stats(),
    queryFn: () => collectorsApi.getCollectorStats(),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Get collector performance
export const useCollectorPerformance = (id: string, period?: 'weekly' | 'monthly') => {
  return useQuery({
    queryKey: queryKeys.collectors.performance(id, period),
    queryFn: () => collectorsApi.getCollectorPerformance(id, period),
    enabled: !!id,
  });
};

// Get available collectors
export const useAvailableCollectors = (
  location: { lat: number; lng: number }, 
  radius?: number
) => {
  return useQuery({
    queryKey: queryKeys.collectors.available(location, radius),
    queryFn: () => collectorsApi.getAvailableCollectors(location, radius),
    enabled: !!(location.lat && location.lng),
    staleTime: 1 * 60 * 1000, // 1 minute for real-time data
  });
};

// Get collector reviews
export const useCollectorReviews = (id: string, page?: number) => {
  return useQuery({
    queryKey: queryKeys.collectors.reviews(id, page),
    queryFn: () => collectorsApi.getCollectorReviews(id, page),
    enabled: !!id,
  });
};

// Update collector mutation
export const useUpdateCollector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Collector> }) => 
      collectorsApi.updateCollector(id, data),
    onSuccess: (updatedCollector) => {
      // Update collector in cache
      queryClient.setQueryData(queryKeys.collectors.detail(updatedCollector.id), updatedCollector);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.collectors.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.collectors.stats() });
      
      // Update employee data
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      
      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Update collector location mutation
export const useUpdateCollectorLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, location }: { 
      id: string; 
      location: { lat: number; lng: number } 
    }) => collectorsApi.updateCollectorLocation(id, location),
    onSuccess: (updatedCollector) => {
      // Update collector in cache
      queryClient.setQueryData(queryKeys.collectors.detail(updatedCollector.id), updatedCollector);
      
      // Invalidate location-dependent queries
      queryClient.invalidateQueries({ queryKey: queryKeys.collectors.lists() });
      
      // Invalidate available collectors queries as location changed
      queryClient.invalidateQueries({ 
        queryKey: ['collectors', 'available'] // Partial key match
      });
    },
    // Enable optimistic updates for better UX
    onMutate: async ({ id, location }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.collectors.detail(id) });
      
      // Snapshot previous value
      const previousCollector = queryClient.getQueryData(queryKeys.collectors.detail(id));
      
      // Optimistically update
      if (previousCollector) {
        queryClient.setQueryData(queryKeys.collectors.detail(id), {
          ...previousCollector,
          currentLocation: location,
        });
      }
      
      return { previousCollector };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCollector) {
        queryClient.setQueryData(
          queryKeys.collectors.detail(variables.id), 
          context.previousCollector
        );
      }
    },
  });
};