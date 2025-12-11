import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { citiesApi, City } from '@/lib/api/cities';
import { queryKeys } from '@/lib/query-client';

// Get all cities with optional filters and pagination
export const useCities = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean | null;
  sortBy?: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}) => {
  return useQuery({
    queryKey: queryKeys.cities.list(params),
    queryFn: () => citiesApi.getCities({ ...params, isActive: params?.status ?? undefined }),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single city
export const useCity = (id: string) => {
  return useQuery({
    queryKey: queryKeys.cities.detail(id),
    queryFn: () => citiesApi.getCity(id),
    enabled: !!id,
  });
};

// Create city mutation
export const useCreateCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cityData: { name: string; latitude: number; longitude: number; isActive?: boolean }) => 
      citiesApi.createCity(cityData),
    onSuccess: () => {
      // Invalidate all cities list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.cities.lists() });
    },
  });
};

// Update city mutation
export const useUpdateCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; latitude?: number; longitude?: number; isActive?: boolean } }) => 
      citiesApi.updateCity(id, data),
    onSuccess: (updatedCity, variables) => {
      // Update the city in cache
      queryClient.setQueryData(queryKeys.cities.detail(variables.id), updatedCity);
      
      // Invalidate all cities list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.cities.lists() });
    },
  });
};

// Delete city mutation
export const useDeleteCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => citiesApi.deleteCity(id),
    onSuccess: (_, deletedId) => {
      // Remove city from cache
      queryClient.removeQueries({ queryKey: queryKeys.cities.detail(deletedId) });
      
      // Invalidate cities list
      queryClient.invalidateQueries({ queryKey: queryKeys.cities.lists() });
    },
  });
};

