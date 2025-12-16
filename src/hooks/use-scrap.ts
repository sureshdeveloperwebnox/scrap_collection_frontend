import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scrapApi, ScrapCategoryDto, ScrapNameDto } from '@/lib/api/scrap';
import { useAuthStore } from '@/lib/store/auth-store';

// Scrap Categories
export const useScrapCategories = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
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
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; isActive?: boolean } }) =>
      scrapApi.updateScrapCategory(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['scrap-categories'] });
      const previousCategories = queryClient.getQueriesData({ queryKey: ['scrap-categories'] });

      queryClient.setQueriesData({ queryKey: ['scrap-categories'] }, (old: any) => {
        if (!old?.data?.scrapCategories) return old;
        return {
          ...old,
          data: {
            ...old.data,
            scrapCategories: old.data.scrapCategories.map((cat: ScrapCategoryDto) =>
              cat.id === id ? { ...cat, ...data } : cat
            ),
          },
        };
      });

      return { previousCategories };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousCategories) {
        context.previousCategories.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-categories'] });
    },
  });
};

export const useDeleteScrapCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scrapApi.deleteScrapCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['scrap-categories'] });
      const previousCategories = queryClient.getQueriesData({ queryKey: ['scrap-categories'] });

      queryClient.setQueriesData({ queryKey: ['scrap-categories'] }, (old: any) => {
        if (!old?.data?.scrapCategories) return old;
        return {
          ...old,
          data: {
            ...old.data,
            scrapCategories: old.data.scrapCategories.filter((cat: ScrapCategoryDto) => cat.id !== id),
          },
        };
      });

      return { previousCategories };
    },
    onError: (_err, _id, context) => {
      if (context?.previousCategories) {
        context.previousCategories.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-categories'] });
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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['scrap-names'] });
      const previousNames = queryClient.getQueriesData({ queryKey: ['scrap-names'] });

      queryClient.setQueriesData({ queryKey: ['scrap-names'] }, (old: any) => {
        if (!old?.data?.scrapNames) return old;
        return {
          ...old,
          data: {
            ...old.data,
            scrapNames: old.data.scrapNames.map((item: ScrapNameDto) =>
              item.id === id ? { ...item, ...data } : item
            ),
          },
        };
      });

      return { previousNames };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousNames) {
        context.previousNames.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-names'] });
    },
  });
};

export const useDeleteScrapName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scrapApi.deleteScrapName(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['scrap-names'] });
      const previousNames = queryClient.getQueriesData({ queryKey: ['scrap-names'] });

      queryClient.setQueriesData({ queryKey: ['scrap-names'] }, (old: any) => {
        if (!old?.data?.scrapNames) return old;
        return {
          ...old,
          data: {
            ...old.data,
            scrapNames: old.data.scrapNames.filter((item: ScrapNameDto) => item.id !== id),
          },
        };
      });

      return { previousNames };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNames) {
        context.previousNames.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-names'] });
    },
  });
};
