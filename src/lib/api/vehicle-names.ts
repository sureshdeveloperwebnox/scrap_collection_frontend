import { apiClient } from './client';
import { VehicleName, VehicleConditionEnum } from '@/types';

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
    name?: string; // Optional - will be auto-generated from make and model if not provided
    vehicleTypeId: number;
    make?: string;
    model?: string;
    year?: number;
    vehicleId: string; // Required
    condition?: VehicleConditionEnum;
    isActive?: boolean;
  }): Promise<ApiResponse<VehicleName>> => {
    const response = await apiClient.post('/vehicle-names', vehicleNameData);
    return response.data;
  },

  // Update existing vehicle name
  updateVehicleName: async (id: string, vehicleNameData: {
    name?: string;
    vehicleTypeId?: number;
    make?: string;
    model?: string;
    year?: number;
    vehicleId?: string;
    condition?: VehicleConditionEnum;
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
};
