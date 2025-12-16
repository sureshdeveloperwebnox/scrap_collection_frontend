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
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicleTypes.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicleTypes.lists() });

      // Snapshot previous data
      const previousVehicleType = queryClient.getQueryData<VehicleType>(queryKeys.vehicleTypes.detail(id));

      // Optimistic update for detail
      if (previousVehicleType) {
        queryClient.setQueryData(queryKeys.vehicleTypes.detail(id), {
          ...previousVehicleType,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      // Optimistic update for lists
      queryClient.setQueriesData({ queryKey: queryKeys.vehicleTypes.lists() }, (oldData: any) => {
        if (!oldData?.data?.vehicleTypes) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            vehicleTypes: oldData.data.vehicleTypes.map((item: VehicleType) =>
              item.id.toString() === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
            ),
          },
        };
      });

      return { previousVehicleType };
    },
    onSuccess: (data, variables) => {
      // Update detail with server response
      queryClient.setQueryData(queryKeys.vehicleTypes.detail(variables.id), data.data);

      // Update lists with server response - filter out items that don't match current filter
      queryClient.setQueriesData({ queryKey: queryKeys.vehicleTypes.lists() }, (oldData: any) => {
        if (!oldData?.data?.vehicleTypes) return oldData;

        const updatedItem = data.data;

        // Get the filter from the query key to determine if item should be shown
        // The query key structure is: ['vehicle-types', 'list', { filters }]
        const queryKey = queryClient.getQueryCache().findAll({ queryKey: queryKeys.vehicleTypes.lists() })[0]?.queryKey;
        const filters = queryKey?.[2] as any;
        const statusFilter = filters?.status;

        // Check if the updated item matches the current filter
        const shouldShowItem =
          statusFilter === null ||
          statusFilter === undefined ||
          updatedItem.isActive === statusFilter;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            vehicleTypes: shouldShowItem
              ? oldData.data.vehicleTypes.map((item: VehicleType) =>
                item.id.toString() === variables.id.toString() ? updatedItem : item
              )
              : oldData.data.vehicleTypes.filter((item: VehicleType) =>
                item.id.toString() !== variables.id.toString()
              ),
            pagination: {
              ...oldData.data.pagination,
              total: shouldShowItem
                ? oldData.data.pagination.total
                : Math.max(0, oldData.data.pagination.total - 1)
            }
          },
        };
      });

      // Invalidate stats to keep counts accurate
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.stats(organizationId) });

      // Invalidate all lists to refetch and show correct filtered data
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.lists() });
    },
    onError: (err, newTodo, context) => {
      // Rollback
      if (context?.previousVehicleType) {
        queryClient.setQueryData(queryKeys.vehicleTypes.detail(newTodo.id), context.previousVehicleType);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.lists() });
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicleTypes.lists() });

      const previousLists = queryClient.getQueriesData({ queryKey: queryKeys.vehicleTypes.lists() });

      // Optimistic delete
      queryClient.setQueriesData({ queryKey: queryKeys.vehicleTypes.lists() }, (oldData: any) => {
        if (!oldData?.data?.vehicleTypes) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            vehicleTypes: oldData.data.vehicleTypes.filter((item: VehicleType) => item.id.toString() !== id),
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
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.vehicleTypes.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicleTypes.lists() });
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
