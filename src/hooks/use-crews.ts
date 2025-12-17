
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crewsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Crew } from '@/types';

// Get all crews
export const useCrews = () => {
    return useQuery({
        queryKey: queryKeys.crews.lists(),
        queryFn: () => crewsApi.getCrews(),
        placeholderData: (previousData) => previousData,
    });
};

// Get single crew
export const useCrew = (id: string) => {
    return useQuery({
        queryKey: queryKeys.crews.detail(id),
        queryFn: () => crewsApi.getCrew(id),
        enabled: !!id,
    });
};

// Create crew mutation
export const useCreateCrew = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (crewData: {
            name: string;
            description?: string;
            memberIds: string[];
        }) => crewsApi.createCrew(crewData),
        onSuccess: (response: any) => {
            // Invalidate crews list
            queryClient.invalidateQueries({ queryKey: queryKeys.crews.lists() });
        },
    });
};

// Update crew mutation
export const useUpdateCrew = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Crew> & { memberIds?: string[] } }) =>
            crewsApi.updateCrew(id, data),
        onSuccess: (response: any) => {
            const data = response.data?.crew;
            if (data) {
                // Update crew in cache
                queryClient.setQueryData(queryKeys.crews.detail(data.id), data);
            }

            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: queryKeys.crews.lists() });
        },
    });
};

// Delete crew mutation
export const useDeleteCrew = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => crewsApi.deleteCrew(id),
        onSuccess: (_, deletedId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: queryKeys.crews.detail(deletedId) });

            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: queryKeys.crews.lists() });
        },
    });
};
