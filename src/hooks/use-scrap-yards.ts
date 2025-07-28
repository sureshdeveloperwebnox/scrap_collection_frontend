import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scrapYardsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { ScrapYard } from '@/types';

// Get all scrap yards with optional filters
export const useScrapYards = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  city?: string;
  state?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.scrapYards.list(params),
    queryFn: () => scrapYardsApi.getScrapYards(params),
    keepPreviousData: true,
  });
};

// Get single scrap yard
export const useScrapYard = (id: string) => {
  return useQuery({
    queryKey: queryKeys.scrapYards.detail(id),
    queryFn: () => scrapYardsApi.getScrapYard(id),
    enabled: !!id,
  });
};

// Get scrap yard statistics
export const useScrapYardStats = () => {
  return useQuery({
    queryKey: queryKeys.scrapYards.stats(),
    queryFn: () => scrapYardsApi.getScrapYardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get capacity status
export const useCapacityStatus = () => {
  return useQuery({
    queryKey: queryKeys.scrapYards.capacityStatus(),
    queryFn: () => scrapYardsApi.getCapacityStatus(),
    staleTime: 2 * 60 * 1000, // 2 minutes for critical data
  });
};

// Get scrap yards by region
export const useScrapYardsByRegion = (region: string) => {
  return useQuery({
    queryKey: queryKeys.scrapYards.byRegion(region),
    queryFn: () => scrapYardsApi.getScrapYardsByRegion(region),
    enabled: !!region,
  });
};

// Find nearest scrap yard
export const useNearestScrapYard = (location: { lat: number; lng: number }) => {
  return useQuery({
    queryKey: queryKeys.scrapYards.nearest(location),
    queryFn: () => scrapYardsApi.findNearestScrapYard(location),
    enabled: !!(location.lat && location.lng),
  });
};

// Create scrap yard mutation
export const useCreateScrapYard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (yardData: Omit<ScrapYard, 'id' | 'createdAt' | 'updatedAt'>) => 
      scrapYardsApi.createScrapYard(yardData),
    onSuccess: (newYard) => {
      // Invalidate scrap yards list
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.lists() });
      
      // Add new scrap yard to cache
      queryClient.setQueryData(queryKeys.scrapYards.detail(newYard.id), newYard);
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.capacityStatus() });
      
      // Update region-specific data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.scrapYards.byRegion(newYard.state) 
      });
    },
  });
};

// Update scrap yard mutation
export const useUpdateScrapYard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScrapYard> }) => 
      scrapYardsApi.updateScrapYard(id, data),
    onSuccess: (updatedYard) => {
      // Update scrap yard in cache
      queryClient.setQueryData(queryKeys.scrapYards.detail(updatedYard.id), updatedYard);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.capacityStatus() });
      
      // Update region-specific data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.scrapYards.byRegion(updatedYard.state) 
      });
    },
  });
};

// Update current load mutation with optimistic updates
export const useUpdateCurrentLoad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currentLoad }: { id: string; currentLoad: number }) => 
      scrapYardsApi.updateCurrentLoad(id, currentLoad),
    onSuccess: (updatedYard) => {
      // Update scrap yard in cache
      queryClient.setQueryData(queryKeys.scrapYards.detail(updatedYard.id), updatedYard);
      
      // Invalidate capacity-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.capacityStatus() });
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.stats() });
    },
    // Optimistic update for better UX
    onMutate: async ({ id, currentLoad }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.scrapYards.detail(id) });
      
      // Snapshot previous value
      const previousYard = queryClient.getQueryData(queryKeys.scrapYards.detail(id));
      
      // Optimistically update
      if (previousYard) {
        queryClient.setQueryData(queryKeys.scrapYards.detail(id), {
          ...previousYard,
          currentLoad,
          updatedAt: new Date(),
        });
      }
      
      return { previousYard };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousYard) {
        queryClient.setQueryData(
          queryKeys.scrapYards.detail(variables.id), 
          context.previousYard
        );
      }
    },
  });
};