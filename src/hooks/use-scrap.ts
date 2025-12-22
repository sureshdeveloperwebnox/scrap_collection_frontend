import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scrapApi, ScrapCategoryDto, ScrapNameDto } from '@/lib/api/scrap';
import { useAuthStore } from '@/lib/store/auth-store';
import { useScrapStore } from '@/lib/store/scrap-store';
import { toast } from 'sonner';

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
    staleTime: 30 * 1000, // 30 seconds - shorter for more responsive updates
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false, // We invalidate explicitly when order form opens
    placeholderData: (previousData: any) => previousData,
  });
};

export const useScrapCategory = (id: string) => {
  return useQuery({
    queryKey: ['scrap-categories', 'detail', id],
    queryFn: () => scrapApi.getScrapCategory(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateScrapCategory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { addCategoryToCache, invalidateCategoryCache } = useScrapStore();

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      scrapApi.createScrapCategory({ ...data, organizationId: organizationId! }),
    onMutate: async (newCategory) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['scrap-categories'] });

      // Snapshot previous value
      const previousCategories = queryClient.getQueriesData({ queryKey: ['scrap-categories'] });

      // Optimistically update cache
      const optimisticCategory: ScrapCategoryDto = {
        id: `temp-${Date.now()}`,
        name: newCategory.name,
        description: newCategory.description,
        organizationId: organizationId!,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addCategoryToCache(optimisticCategory);

      return { previousCategories };
    },
    onError: (err, newCategory, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        context.previousCategories.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      invalidateCategoryCache();
      toast.error('Failed to create category');
    },
    onSuccess: (response) => {
      // Update with actual server data
      invalidateCategoryCache();
      toast.success('Category created successfully');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['scrap-categories'] });
    },
  });
};

export const useUpdateScrapCategory = () => {
  const queryClient = useQueryClient();
  const { updateCategoryInCache, invalidateCategoryCache } = useScrapStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; isActive?: boolean } }) =>
      scrapApi.updateScrapCategory(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['scrap-categories'] });

      const previousCategories = queryClient.getQueriesData({ queryKey: ['scrap-categories'] });

      // Optimistically update
      updateCategoryInCache(id, data);

      return { previousCategories };
    },
    onError: (err, variables, context) => {
      if (context?.previousCategories) {
        context.previousCategories.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      invalidateCategoryCache();
      toast.error('Failed to update category');
    },
    onSuccess: () => {
      invalidateCategoryCache();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-categories'] });
    },
  });
};

export const useDeleteScrapCategory = () => {
  const queryClient = useQueryClient();
  const { removeCategoryFromCache, invalidateCategoryCache } = useScrapStore();

  return useMutation({
    mutationFn: (id: string) => scrapApi.deleteScrapCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['scrap-categories'] });

      const previousCategories = queryClient.getQueriesData({ queryKey: ['scrap-categories'] });

      // Optimistically remove
      removeCategoryFromCache(id);

      return { previousCategories };
    },
    onError: (err, id, context) => {
      if (context?.previousCategories) {
        context.previousCategories.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      invalidateCategoryCache();
      toast.error('Failed to delete category');
    },
    onSuccess: () => {
      invalidateCategoryCache();
      toast.success('Category deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-categories'] });
      queryClient.invalidateQueries({ queryKey: ['scrap-names'] });
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
    staleTime: 30 * 1000, // 30 seconds - shorter for more responsive updates
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // We invalidate explicitly when order form opens
    placeholderData: (previousData: any) => previousData,
  });
};

export const useScrapName = (id: string) => {
  return useQuery({
    queryKey: ['scrap-names', 'detail', id],
    queryFn: () => scrapApi.getScrapName(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateScrapName = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { addNameToCache, invalidateNameCache } = useScrapStore();

  return useMutation({
    mutationFn: (data: { name: string; scrapCategoryId: string; isActive?: boolean }) =>
      scrapApi.createScrapName({ ...data, organizationId: organizationId! }),
    onMutate: async (newName) => {
      await queryClient.cancelQueries({ queryKey: ['scrap-names'] });

      const previousNames = queryClient.getQueriesData({ queryKey: ['scrap-names'] });

      // Optimistically update
      const optimisticName: ScrapNameDto = {
        id: `temp-${Date.now()}`,
        name: newName.name,
        scrapCategoryId: newName.scrapCategoryId,
        organizationId: organizationId!,
        isActive: newName.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addNameToCache(optimisticName);

      return { previousNames };
    },
    onError: (err, newName, context) => {
      if (context?.previousNames) {
        context.previousNames.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      invalidateNameCache();
      toast.error('Failed to create scrap name');
    },
    onSuccess: () => {
      invalidateNameCache();
      toast.success('Scrap name created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-names'] });
    },
  });
};

export const useUpdateScrapName = () => {
  const queryClient = useQueryClient();
  const { updateNameInCache, invalidateNameCache } = useScrapStore();

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

      // Optimistically update
      updateNameInCache(id, data);

      return { previousNames };
    },
    onError: (err, variables, context) => {
      if (context?.previousNames) {
        context.previousNames.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      invalidateNameCache();
      toast.error('Failed to update scrap name');
    },
    onSuccess: () => {
      invalidateNameCache();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-names'] });
    },
  });
};

export const useDeleteScrapName = () => {
  const queryClient = useQueryClient();
  const { removeNameFromCache, invalidateNameCache } = useScrapStore();

  return useMutation({
    mutationFn: (id: string) => scrapApi.deleteScrapName(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['scrap-names'] });

      const previousNames = queryClient.getQueriesData({ queryKey: ['scrap-names'] });

      // Optimistically remove
      removeNameFromCache(id);

      return { previousNames };
    },
    onError: (err, id, context) => {
      if (context?.previousNames) {
        context.previousNames.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      invalidateNameCache();
      toast.error('Failed to delete scrap name');
    },
    onSuccess: () => {
      invalidateNameCache();
      toast.success('Scrap name deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scrap-names'] });
    },
  });
};
