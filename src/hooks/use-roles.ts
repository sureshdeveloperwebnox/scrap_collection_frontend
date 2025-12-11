import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, Role } from '@/lib/api/roles';
import { queryKeys } from '@/lib/query-client';

// Get all roles with optional filters and pagination
export const useRoles = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean | null;
  sortBy?: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}) => {
  return useQuery({
    queryKey: queryKeys.roles.list(params),
    queryFn: () => rolesApi.getRoles({ ...params, isActive: params?.status ?? undefined }),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single role
export const useRole = (id: string) => {
  return useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: () => rolesApi.getRole(id),
    enabled: !!id,
  });
};

// Create role mutation
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleData: { name: string; description?: string; isActive?: boolean }) => 
      rolesApi.createRole(roleData),
    onSuccess: () => {
      // Invalidate all roles list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
};

// Update role mutation
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; isActive?: boolean } }) => 
      rolesApi.updateRole(id, data),
    onSuccess: (updatedRole, variables) => {
      // Update the role in cache
      queryClient.setQueryData(queryKeys.roles.detail(variables.id), updatedRole);
      
      // Invalidate all roles list queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
};

// Delete role mutation
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: (_, deletedId) => {
      // Remove role from cache
      queryClient.removeQueries({ queryKey: queryKeys.roles.detail(deletedId) });
      
      // Invalidate roles list
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
};

// Activate role mutation
export const useActivateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.activateRole(id),
    onSuccess: (_, activatedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.detail(activatedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
};

// Deactivate role mutation
export const useDeactivateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rolesApi.deactivateRole(id),
    onSuccess: (_, deactivatedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.detail(deactivatedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
};

