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
      if (organizationId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.stats(organizationId) });
      }
    },
  });
};

// Update vehicle name mutation
export const useUpdateVehicleName = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleName> }) =>
      vehicleNamesApi.updateVehicleName(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicleNames.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicleNames.lists() });

      // Snapshot the previous value
      const previousVehicleName = queryClient.getQueryData<VehicleName>(queryKeys.vehicleNames.detail(id));

      // Optimistically update to the new value in detail
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
    onSuccess: (data, variables) => {
      // Update detail with server response
      queryClient.setQueryData(queryKeys.vehicleNames.detail(variables.id), data.data);

      // Update lists with server response
      queryClient.setQueriesData({ queryKey: queryKeys.vehicleNames.lists() }, (oldData: any) => {
        if (!oldData?.data?.vehicleNames) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            vehicleNames: oldData.data.vehicleNames.map((item: VehicleName) =>
              item.id === variables.id ? data.data : item
            ),
          },
        };
      });

      // Invalidate stats to keep counts accurate (lightweight)
      if (organizationId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.stats(organizationId) });
      }
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      if (context?.previousVehicleName) {
        queryClient.setQueryData(queryKeys.vehicleNames.detail(newTodo.id), context.previousVehicleName);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.lists() });
    },
    // No onSettled to avoid refetching list
  });
};

// Delete vehicle name mutation
export const useDeleteVehicleName = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

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
      if (organizationId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.vehicleNames.stats(organizationId) });
      }
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
