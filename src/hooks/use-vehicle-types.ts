import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleTypesApi, VehicleType } from '@/lib/api/vehicleTypes';
import { queryKeys } from '@/lib/query-client';

// Get all vehicle types with optional filters
export const useVehicleTypes = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) => {
  return useQuery({
    queryKey: queryKeys.vehicleTypes.list(params),
    queryFn: () => vehicleTypesApi.getVehicleTypes(params),
    placeholderData: (previousData) => previousData,
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

  return useMutation({
    mutationFn: (vehicleTypeData: Omit<VehicleType, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => 
      vehicleTypesApi.createVehicleType(vehicleTypeData),
    onSuccess: (newVehicleType) => {
      // Invalidate and refetch vehicle types list
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.lists() });
      
      // Optionally add the new vehicle type to the cache
      queryClient.setQueryData(queryKeys.vehicleTypes.detail(newVehicleType.data.id.toString()), newVehicleType);
    },
  });
};

// Update vehicle type mutation
export const useUpdateVehicleType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleType> }) => 
      vehicleTypesApi.updateVehicleType(id, data),
    onSuccess: (updatedVehicleType) => {
      // Update the vehicle type in cache
      queryClient.setQueryData(queryKeys.vehicleTypes.detail(updatedVehicleType.data.id.toString()), updatedVehicleType);
      
      // Invalidate vehicle types list to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.lists() });
    },
  });
};

// Delete vehicle type mutation
export const useDeleteVehicleType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vehicleTypesApi.deleteVehicleType(id),
    onSuccess: (_, deletedId) => {
      // Remove vehicle type from cache
      queryClient.removeQueries({ queryKey: queryKeys.vehicleTypes.detail(deletedId) });
      
      // Invalidate vehicle types list
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.lists() });
    },
  });
};

// Bulk update vehicle types mutation
export const useBulkUpdateVehicleTypes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<VehicleType> }) => 
      vehicleTypesApi.bulkUpdateVehicleTypes(ids, updates),
    onSuccess: () => {
      // Invalidate all vehicle types queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.all });
    },
  });
};

// Toggle vehicle type status mutation
export const useToggleVehicleTypeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vehicleTypesApi.toggleVehicleTypeStatus(id),
    onSuccess: (updatedVehicleType) => {
      // Update the vehicle type in cache
      queryClient.setQueryData(queryKeys.vehicleTypes.detail(updatedVehicleType.data.id.toString()), updatedVehicleType);
      
      // Invalidate vehicle types list
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.lists() });
    },
  });
}; 