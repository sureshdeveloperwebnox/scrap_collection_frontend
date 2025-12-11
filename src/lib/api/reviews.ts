import { apiClient } from './client';
import { Review } from '@/types';

export const reviewsApi = {
  // Get all reviews with optional filters
  getReviews: async (params?: {
    page?: number;
    limit?: number;
    collectorId?: string;
    customerId?: string;
    minRating?: number;
    organizationId?: number;
  }): Promise<{ data: { reviews: Review[], pagination: any } }> => {
    const response = await apiClient.get('/reviews', { params });
    return response.data;
  },

  // Get single review by ID
  getReview: async (id: string): Promise<{ data: Review }> => {
    const response = await apiClient.get(`/reviews/${id}`);
    return response.data;
  },

  // Create new review
  createReview: async (reviewData: {
    orderId: string;
    customerId: string;
    collectorId: string;
    rating: number;
    comment?: string;
    organizationId: number;
  }): Promise<{ data: Review }> => {
    const response = await apiClient.post('/reviews', reviewData);
    return response.data;
  },

  // Update existing review
  updateReview: async (id: string, reviewData: Partial<Review>): Promise<{ data: Review }> => {
    const response = await apiClient.put(`/reviews/${id}`, reviewData);
    return response.data;
  },
};
