import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Review } from '@/types';

// Get all reviews with optional filters
export const useReviews = (params?: {
  page?: number;
  limit?: number;
  collectorId?: string;
  customerId?: string;
  minRating?: number;
  organizationId?: number;
}) => {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => reviewsApi.getReviews(params),
    placeholderData: (previousData) => previousData,
  });
};

// Get single review
export const useReview = (id: string) => {
  return useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewsApi.getReview(id),
    enabled: !!id,
  });
};

// Create review mutation
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewData: {
      orderId: string;
      customerId: string;
      collectorId: string;
      rating: number;
      comment?: string;
      organizationId: number;
    }) => reviewsApi.createReview(reviewData),
    onSuccess: (newReview) => {
      const review = (newReview as { data: Review })?.data || (newReview as unknown as Review);

      // Invalidate reviews list
      queryClient.invalidateQueries({ queryKey: ['reviews'] });

      // Add new review to cache
      queryClient.setQueryData(['reviews', review.id], review);

      // Update collector rating
      queryClient.invalidateQueries({ queryKey: ['employees', review.collectorId] });
    },
  });
};

// Update review mutation
export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Review> }) =>
      reviewsApi.updateReview(id, data),
    onSuccess: (updatedReview) => {
      const review = (updatedReview as { data: Review })?.data || (updatedReview as unknown as Review);

      // Update review in cache
      queryClient.setQueryData(['reviews', review.id], review);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ['reviews'] });

      // Update collector rating
      queryClient.invalidateQueries({ queryKey: ['employees', review.collectorId] });
    },
  });
};
