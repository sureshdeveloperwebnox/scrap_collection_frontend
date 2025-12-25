import { apiClient } from './client';
import { Collector } from '@/types';

export const collectorsApi = {
  // Get all collectors with optional filters
  getCollectors: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    workZone?: string;
    available?: boolean;
    organizationId?: number;
  }): Promise<{ data: Collector[], total: number, page: number, limit: number }> => {
    const response = await apiClient.get('/collectors', { params });
    return response.data;
  },

  // Get single collector by ID
  getCollector: async (id: string): Promise<Collector> => {
    const response = await apiClient.get(`/collectors/${id}`);
    return response.data;
  },

  // Update collector information
  updateCollector: async (id: string, collectorData: Partial<Collector>): Promise<Collector> => {
    const response = await apiClient.put(`/collectors/${id}`, collectorData);
    return response.data;
  },

  // Update collector location
  updateCollectorLocation: async (id: string, location: { lat: number; lng: number }): Promise<Collector> => {
    const response = await apiClient.patch(`/collectors/${id}/location`, { location });
    return response.data;
  },

  // Get collector performance metrics
  getCollectorPerformance: async (id: string, period?: 'weekly' | 'monthly'): Promise<{
    totalPickups: number;
    averageRating: number;
    completionRate: number;
    revenue: number;
    recentOrders: any[];
  }> => {
    const response = await apiClient.get(`/collectors/${id}/performance`, { params: { period } });
    return response.data;
  },

  // Get available collectors for auto-assignment
  getAvailableCollectors: async (location: { lat: number; lng: number }, radius?: number): Promise<Collector[]> => {
    const response = await apiClient.get('/collectors/available', {
      params: { lat: location.lat, lng: location.lng, radius }
    });
    return response.data;
  },

  // Get collector statistics
  getCollectorStats: async (): Promise<{
    total: number;
    active: number;
    available: number;
    busy: number;
    totalPickups: number;
    averageRating: number;
    topPerformers: Collector[];
  }> => {
    const response = await apiClient.get('/collectors/stats');
    return response.data;
  },

  // Get collector reviews/ratings
  getCollectorReviews: async (id: string, page?: number): Promise<{
    reviews: any[];
    averageRating: number;
    totalReviews: number;
  }> => {
    const response = await apiClient.get(`/collectors/${id}/reviews`, { params: { page } });
    return response.data;
  },
};