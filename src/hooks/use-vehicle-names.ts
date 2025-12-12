import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleNamesApi } from '@/lib/api/vehicle-names';
import { queryKeys } from '@/lib/query-client';
import { VehicleName } from '@/types';
import { useAuthStore } from '@/lib/store/auth-store';

// Get all vehicle names with optional filters
export const useVehicleNames = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  organizationId?: number;
  vehicleTypeId?: number;
  scrapYardId?: string;
  sortBy?: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}) => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useQuery({
    queryKey: queryKeys.vehicleNames.list({ ...params, organizationId }),
    queryFn: () => vehicleNamesApi.getVehicleNames({ ...params, organizationId }),
    placeholderData: (previousData) => previousData,
    enabled: !!organizationId,
  });
};

// Get single vehicle name
export const useVehicleName = (id: string) => {
  return useQuery({
    queryKey: queryKeys.vehicleNames.detail(id),
    queryFn: () => vehicleNamesApi.getVehicleName(id),
    enabled: !!id,
  });
};

// Create vehicle name mutation
export const useCreateVehicleName = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useMutation({
    mutationFn: (vehicleNameData: {
      name: string;
      vehicleTypeId: number;
      scrapYardId: string;
      isActive?: boolean;
    }) => vehicleNamesApi.createVehicleName({
      ...vehicleNameData,
      organizationId: organizationId!,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.lists() });
    },
  });
};

// Update vehicle name mutation
export const useUpdateVehicleName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleName> }) =>
      vehicleNamesApi.updateVehicleName(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.detail(variables.id) });
    },
  });
};

// Delete vehicle name mutation
export const useDeleteVehicleName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vehicleNamesApi.deleteVehicleName(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.lists() });
    },
  });
};
