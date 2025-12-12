import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectorAssignmentsApi, CollectorAssignment } from '@/lib/api/collector-assignments';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/store/auth-store';

// Get all collector assignments with optional filters
export const useCollectorAssignments = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  organizationId?: number;
  collectorId?: string;
  vehicleNameId?: string;
  cityId?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}) => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useQuery({
    queryKey: queryKeys.collectorAssignments.list({ ...params, organizationId }),
    queryFn: () => collectorAssignmentsApi.getCollectorAssignments({ ...params, organizationId }),
    placeholderData: (previousData) => previousData,
    enabled: !!organizationId,
  });
};

// Get single collector assignment
export const useCollectorAssignment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.collectorAssignments.detail(id),
    queryFn: () => collectorAssignmentsApi.getCollectorAssignment(id),
    enabled: !!id,
  });
};

// Create collector assignment mutation
export const useCreateCollectorAssignment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useMutation({
    mutationFn: (assignmentData: {
      collectorId: string;
      vehicleNameId?: string;
      cityId?: number;
      isActive?: boolean;
    }) => collectorAssignmentsApi.createCollectorAssignment({
      ...assignmentData,
      organizationId: organizationId!,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collectorAssignments.lists() });
    },
  });
};

// Update collector assignment mutation
export const useUpdateCollectorAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CollectorAssignment> }) =>
      collectorAssignmentsApi.updateCollectorAssignment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collectorAssignments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.collectorAssignments.detail(variables.id) });
    },
  });
};

// Delete collector assignment mutation
export const useDeleteCollectorAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => collectorAssignmentsApi.deleteCollectorAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collectorAssignments.lists() });
    },
  });
};
