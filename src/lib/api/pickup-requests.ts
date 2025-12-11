import { apiClient } from './client';
import { PickupRequest, PickupRequestStatus } from '@/types';

export const pickupRequestsApi = {
  // Get all pickup requests with optional filters
  getPickupRequests: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PickupRequestStatus;
    assignedTo?: string;
    customerId?: string;
    organizationId?: number;
  }): Promise<{ data: { pickupRequests: PickupRequest[], pagination: any } }> => {
    const response = await apiClient.get('/pickup-requests', { params });
    return response.data;
  },

  // Get single pickup request by ID
  getPickupRequest: async (id: string): Promise<{ data: PickupRequest }> => {
    const response = await apiClient.get(`/pickup-requests/${id}`);
    return response.data;
  },

  // Create new pickup request
  createPickupRequest: async (pickupRequestData: {
    customerId: string;
    vehicleDetails: {
      make?: string;
      model?: string;
      year?: number;
      condition?: string;
      type?: string;
    };
    pickupAddress: string;
    latitude?: number;
    longitude?: number;
    organizationId: number;
  }): Promise<{ data: PickupRequest }> => {
    const response = await apiClient.post('/pickup-requests', pickupRequestData);
    return response.data;
  },

  // Update existing pickup request
  updatePickupRequest: async (id: string, pickupRequestData: Partial<PickupRequest>): Promise<{ data: PickupRequest }> => {
    const response = await apiClient.put(`/pickup-requests/${id}`, pickupRequestData);
    return response.data;
  },

  // Delete pickup request
  deletePickupRequest: async (id: string): Promise<void> => {
    await apiClient.delete(`/pickup-requests/${id}`);
  },

  // Assign pickup request to collector
  assignPickupRequest: async (requestId: string, collectorId: string): Promise<{ data: PickupRequest }> => {
    const response = await apiClient.post(`/pickup-requests/${requestId}/assign`, { collectorId });
    return response.data;
  },
};
