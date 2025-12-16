import { apiClient } from './client';
import { VehicleName } from '@/types';

export interface ApiResponse<T> {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: T;
}

export const vehicleNamesApi = {
  // Get all vehicle names with optional filters
  getVehicleNames: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    organizationId?: number;
    vehicleTypeId?: number;
    scrapYardId?: string;
    sortBy?: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    vehicleNames: VehicleName[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>> => {
    const response = await apiClient.get('/vehicle-names', { params });
    return response.data;
  },

  // Get single vehicle name by ID
  getVehicleName: async (id: string): Promise<ApiResponse<VehicleName>> => {
    const response = await apiClient.get(`/vehicle-names/${id}`);
    return response.data;
  },

  // Create new vehicle name
  createVehicleName: async (vehicleNameData: {
    organizationId: number;
    name: string;
    vehicleTypeId: number;
    scrapYardId?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<VehicleName>> => {
    const response = await apiClient.post('/vehicle-names', vehicleNameData);
    return response.data;
  },

  // Update existing vehicle name
  updateVehicleName: async (id: string, vehicleNameData: {
    name?: string;
    vehicleTypeId?: number;
    scrapYardId?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<VehicleName>> => {
    const response = await apiClient.put(`/vehicle-names/${id}`, vehicleNameData);
    return response.data;
  },

  // Delete vehicle name
  deleteVehicleName: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/vehicle-names/${id}`);
    return response.data;
  },
  // Get vehicle name stats
  getVehicleNameStats: async (organizationId: number): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
  }>> => {
    const response = await apiClient.get(`/vehicle-names/stats/${organizationId}`);
    return response.data;
  },
};
