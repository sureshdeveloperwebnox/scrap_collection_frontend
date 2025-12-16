import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleTypesApi, VehicleType } from '@/lib/api/vehicleTypes';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/store/auth-store';
import { useVehicleTypeStore } from '@/lib/store/vehicle-type-store';

// Get all vehicle types with optional filters and pagination
export const useVehicleTypes = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean | null;
  sortBy?: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}) => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  // Construct API params explicitly to map status -> isActive
  const { status, ...restParams } = params || {};
  const apiParams = {
    ...restParams,
    isActive: status !== null && status !== undefined ? status : undefined,
    organizationId,
  };

  return useQuery({
    queryKey: queryKeys.vehicleTypes.list({ ...params, organizationId }),
    queryFn: () => vehicleTypesApi.getVehicleTypes(apiParams),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000,
    enabled: !!organizationId,
  });
};

// Get single vehicle type
export const useVehicleType = (id: string) => {
  return useQuery({
    queryKey: queryKeys.vehicleTypes.detail(id),
    queryFn: () => vehicleTypesApi.getVehicleType(id),
    enabled: !!id,
  });
};

// Create vehicle type mutation
export const useCreateVehicleType = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { resetFilters } = useVehicleTypeStore();

  return useMutation({
    mutationFn: (vehicleTypeData: { name: string; isActive?: boolean }) =>
      vehicleTypesApi.createVehicleType({ ...vehicleTypeData, organizationId: organizationId! }),
    onSuccess: () => {
      // Invalidate all vehicle types list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.lists() });

      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.stats(organizationId) });

      // Reset filters to show the new item
      resetFilters();
    },
  });
};

// Update vehicle type mutation
export const useUpdateVehicleType = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; isActive?: boolean } }) =>
      vehicleTypesApi.updateVehicleType(id, data),
    onSuccess: (updatedVehicleType, variables) => {
      // Update the vehicle type in cache
      queryClient.setQueryData(queryKeys.vehicleTypes.detail(variables.id), updatedVehicleType);

      // Invalidate all vehicle types list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.lists() });

      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.stats(organizationId) });
    },
  });
};

// Delete vehicle type mutation
export const useDeleteVehicleType = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useMutation({
    mutationFn: (id: string) => vehicleTypesApi.deleteVehicleType(id),
    onSuccess: (_, deletedId) => {
      // Remove vehicle type from cache
      queryClient.removeQueries({ queryKey: queryKeys.vehicleTypes.detail(deletedId) });

      // Invalidate vehicle types list
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.lists() });

      // Invalidate stats query
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.stats(organizationId) });
    },
  });
};

// Get vehicle type stats
export const useVehicleTypeStats = () => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useQuery({
    queryKey: queryKeys.vehicleTypes.stats(organizationId),
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }
      const response = await vehicleTypesApi.getVehicleTypeStats(organizationId);
      return response.data;
    },
    enabled: !!organizationId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
};
