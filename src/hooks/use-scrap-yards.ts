import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scrapYardsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { ScrapYard } from '@/types';
import { useScrapYardsStore } from '@/lib/store/scrap-yards-store';

// Get all scrap yards with optional filters - OPTIMIZED
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
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection time (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce API calls
    refetchOnMount: false, // Don't refetch on mount if data is fresh
  });
};

// Get single scrap yard - OPTIMIZED
export const useScrapYard = (id: string) => {
  return useQuery({
    queryKey: queryKeys.scrapYards.detail(id),
    queryFn: () => scrapYardsApi.getScrapYard(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Get scrap yard statistics - OPTIMIZED
export const useScrapYardStats = () => {
  return useQuery({
    queryKey: queryKeys.scrapYards.stats(),
    queryFn: () => scrapYardsApi.getScrapYardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
};

// Get scrap yards by region - OPTIMIZED
export const useScrapYardsByRegion = (region: string) => {
  return useQuery({
    queryKey: queryKeys.scrapYards.byRegion(region),
    queryFn: () => scrapYardsApi.getScrapYardsByRegion(region),
    enabled: !!region,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
  });
};

// Find nearest scrap yard - OPTIMIZED
export const useNearestScrapYard = (location: { lat: number; lng: number }) => {
  return useQuery({
    queryKey: queryKeys.scrapYards.nearest(location),
    queryFn: () => scrapYardsApi.findNearestScrapYard(location),
    enabled: !!(location.lat && location.lng),
    staleTime: 1 * 60 * 1000, // 1 minute for location-based queries
    gcTime: 5 * 60 * 1000,
  });
};

// Create scrap yard mutation - OPTIMIZED WITH OPTIMISTIC UPDATES
export const useCreateScrapYard = () => {
  const queryClient = useQueryClient();
  const addScrapYardToCache = useScrapYardsStore((state) => state.addScrapYardToCache);

  return useMutation({
    mutationFn: (yardData: Omit<ScrapYard, 'id' | 'createdAt' | 'updatedAt'> & { managerId?: string }) =>
      scrapYardsApi.createScrapYard(yardData),
    onMutate: async (newYardData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.scrapYards.lists() });

      // Snapshot the previous value
      const previousYards = queryClient.getQueriesData({ queryKey: queryKeys.scrapYards.lists() });

      // Optimistically update to the new value
      const optimisticYard = {
        ...newYardData,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any as ScrapYard;

      // Update Zustand cache
      addScrapYardToCache(optimisticYard);

      return { previousYards };
    },
    onError: (_err, _newYard, context) => {
      // Rollback on error
      if (context?.previousYards) {
        context.previousYards.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (newYard) => {
      // Update cache with real data
      queryClient.setQueryData(queryKeys.scrapYards.detail(newYard.id), newYard);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.stats() });
    },
  });
};

// Update scrap yard mutation - OPTIMIZED WITH OPTIMISTIC UPDATES
export const useUpdateScrapYard = () => {
  const queryClient = useQueryClient();
  const updateScrapYardInCache = useScrapYardsStore((state) => state.updateScrapYardInCache);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScrapYard> }) =>
      scrapYardsApi.updateScrapYard(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.scrapYards.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.scrapYards.detail(id) });

      // Snapshot the previous values
      const previousYards = queryClient.getQueriesData({ queryKey: queryKeys.scrapYards.lists() });
      const previousYard = queryClient.getQueryData(queryKeys.scrapYards.detail(id));

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: queryKeys.scrapYards.lists() }, (old: any) => {
        if (!old?.data?.scrapYards) return old;
        return {
          ...old,
          data: {
            ...old.data,
            scrapYards: old.data.scrapYards.map((yard: ScrapYard) =>
              yard.id === id ? { ...yard, ...data } : yard
            ),
          },
        };
      });

      // Update detail cache
      queryClient.setQueryData(queryKeys.scrapYards.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      // Update Zustand cache
      updateScrapYardInCache(id, data);

      return { previousYards, previousYard };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousYards) {
        context.previousYards.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousYard) {
        queryClient.setQueryData(queryKeys.scrapYards.detail(id), context.previousYard);
      }
    },
    onSuccess: (updatedYard) => {
      // Update cache with real data
      queryClient.setQueryData(queryKeys.scrapYards.detail(updatedYard.id), updatedYard);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.stats() });
    },
  });
};

// Delete scrap yard mutation - OPTIMIZED WITH OPTIMISTIC UPDATES
export const useDeleteScrapYard = () => {
  const queryClient = useQueryClient();
  const removeScrapYardFromCache = useScrapYardsStore((state) => state.removeScrapYardFromCache);

  return useMutation({
    mutationFn: (id: string) => scrapYardsApi.deleteScrapYard(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.scrapYards.lists() });

      // Snapshot the previous value
      const previousYards = queryClient.getQueriesData({ queryKey: queryKeys.scrapYards.lists() });

      // Optimistically remove from cache
      queryClient.setQueriesData({ queryKey: queryKeys.scrapYards.lists() }, (old: any) => {
        if (!old?.data?.scrapYards) return old;
        return {
          ...old,
          data: {
            ...old.data,
            scrapYards: old.data.scrapYards.filter((yard: ScrapYard) => yard.id !== id),
          },
        };
      });

      // Update Zustand cache
      removeScrapYardFromCache(id);

      return { previousYards };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousYards) {
        context.previousYards.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapYards.stats() });
    },
  });
};