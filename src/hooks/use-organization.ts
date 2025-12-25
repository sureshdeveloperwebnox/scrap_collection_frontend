import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi, CreateOrganizationRequest, UpdateOrganizationRequest } from '@/lib/api/organizations';
import { toast } from 'sonner';

export const useCreateOrganization = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateOrganizationRequest) => organizationApi.createOrganization(data),
        onSuccess: (response) => {
            toast.success('Organization created successfully!');
            queryClient.invalidateQueries({ queryKey: ['organization'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create organization';
            toast.error('Failed to create organization', {
                description: errorMessage,
            });
        },
    });
};

export const useGetOrganization = (id: number, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['organization', id],
        queryFn: () => organizationApi.getOrganization(id),
        enabled: enabled && !!id,
    });
};

export const useGetMyOrganization = (enabled: boolean = true) => {
    return useQuery({
        queryKey: ['organization', 'me'],
        queryFn: () => organizationApi.getMyOrganization(),
        enabled,
        retry: false, // Don't retry if user doesn't have an organization
    });
};

export const useGetUserOrganization = (userId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['organization', 'user', userId],
        queryFn: () => organizationApi.getUserOrganization(userId),
        enabled: enabled && !!userId,
        retry: false,
    });
};

export const useUpdateOrganization = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateOrganizationRequest }) =>
            organizationApi.updateOrganization(id, data),
        onSuccess: (response) => {
            toast.success('Organization updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['organization'] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update organization';
            toast.error('Failed to update organization', {
                description: errorMessage,
            });
        },
    });
};

export const useDeleteOrganization = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => organizationApi.deleteOrganization(id),
        onSuccess: () => {
            toast.success('Organization deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['organization'] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete organization';
            toast.error('Failed to delete organization', {
                description: errorMessage,
            });
        },
    });
};
