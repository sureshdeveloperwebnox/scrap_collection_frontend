import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scrapApi, ScrapCategoryDto, ScrapNameDto } from '@/lib/api/scrap';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/store/auth-store';

// Scrap Categories
export const useScrapCategories = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useQuery({
    queryKey: ['scrap-categories', { ...params, organizationId }],
    queryFn: () => scrapApi.getScrapCategories({ ...params, organizationId }),
    enabled: !!organizationId,
    placeholderData: (previousData) => previousData,
  });
};

export const useScrapCategory = (id: string) => {
  return useQuery({
    queryKey: ['scrap-categories', 'detail', id],
    queryFn: () => scrapApi.getScrapCategory(id),
    enabled: !!id,
  });
};

export const useCreateScrapCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      scrapApi.createScrapCategory({ ...data, organizationId: organizationId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-categories'] });
    },
  });
};

export const useUpdateScrapCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
      scrapApi.updateScrapCategory(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scrap-categories'] });
      queryClient.invalidateQueries({ queryKey: ['scrap-categories', 'detail', variables.id] });
    },
  });
};

export const useDeleteScrapCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scrapApi.deleteScrapCategory(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['scrap-categories'] });
      queryClient.invalidateQueries({ queryKey: ['scrap-categories', 'detail', id] });
    },
  });
};

// Scrap Names
export const useScrapNames = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  scrapCategoryId?: string;
  isActive?: boolean;
}) => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useQuery({
    queryKey: ['scrap-names', { ...params, organizationId }],
    queryFn: () => scrapApi.getScrapNames({ ...params, organizationId }),
    enabled: !!organizationId,
    placeholderData: (previousData) => previousData,
  });
};

export const useScrapName = (id: string) => {
  return useQuery({
    queryKey: ['scrap-names', 'detail', id],
    queryFn: () => scrapApi.getScrapName(id),
    enabled: !!id,
  });
};

export const useCreateScrapName = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useMutation({
    mutationFn: (data: { name: string; scrapCategoryId: string; isActive?: boolean }) =>
      scrapApi.createScrapName({ ...data, organizationId: organizationId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-names'] });
    },
  });
};

export const useUpdateScrapName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; scrapCategoryId?: string; isActive?: boolean };
    }) => scrapApi.updateScrapName(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scrap-names'] });
      queryClient.invalidateQueries({ queryKey: ['scrap-names', 'detail', variables.id] });
    },
  });
};

export const useDeleteScrapName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scrapApi.deleteScrapName(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['scrap-names'] });
      queryClient.invalidateQueries({ queryKey: ['scrap-names', 'detail', id] });
    },
  });
};

