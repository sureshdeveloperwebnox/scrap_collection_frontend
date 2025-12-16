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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
      scrapYardId?: string;
      isActive?: boolean;
    }) => vehicleNamesApi.createVehicleName({
      ...vehicleNameData,
      organizationId: organizationId!,
    }),
    onSuccess: () => {
      // Invalidate to fetch the new item
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
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicleNames.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicleNames.lists() });

      // Snapshot the previous value
      const previousVehicleName = queryClient.getQueryData<VehicleName>(queryKeys.vehicleNames.detail(id));

      // Optimistically update to the new value
      if (previousVehicleName) {
        queryClient.setQueryData(queryKeys.vehicleNames.detail(id), {
          ...previousVehicleName,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      // Optimistically update in lists
      queryClient.setQueriesData({ queryKey: queryKeys.vehicleNames.lists() }, (oldData: any) => {
        if (!oldData?.data?.vehicleNames) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            vehicleNames: oldData.data.vehicleNames.map((item: VehicleName) =>
              item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
            ),
          },
        };
      });

      return { previousVehicleName };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      if (context?.previousVehicleName) {
        queryClient.setQueryData(queryKeys.vehicleNames.detail(newTodo.id), context.previousVehicleName);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.lists() });
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure we have the correct server state
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.lists() });
    },
  });
};

// Delete vehicle name mutation
export const useDeleteVehicleName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vehicleNamesApi.deleteVehicleName(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicleNames.lists() });

      // Snapshot values
      const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.vehicleNames.lists() });

      // Optimistically delete
      queryClient.setQueriesData({ queryKey: queryKeys.vehicleNames.lists() }, (oldData: any) => {
        if (!oldData?.data?.vehicleNames) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            vehicleNames: oldData.data.vehicleNames.filter((item: VehicleName) => item.id !== id),
            pagination: {
              ...oldData.data.pagination,
              total: Math.max(0, (oldData.data.pagination?.total || 1) - 1)
            }
          },
        };
      });

      return { previousLists };
    },
    onError: (err, id, context) => {
      // Rollback
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.lists() });
    },
  });
};

// Get vehicle name stats
export const useVehicleNameStats = () => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useQuery({
    queryKey: queryKeys.vehicleNames.stats(organizationId),
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }
      const response = await vehicleNamesApi.getVehicleNameStats(organizationId);
      return response.data;
    },
    enabled: !!organizationId,
    staleTime: 1 * 60 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
