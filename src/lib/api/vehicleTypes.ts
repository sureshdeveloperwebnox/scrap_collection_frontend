import { apiClient } from './client';

export interface VehicleType {
  id: number;
  organizationId?: number;
  name: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: {
    name: string;
  };
}

export interface ApiResponse<T> {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: T;
}

export const vehicleTypesApi = {
  // Get all vehicle types with optional filters
  getVehicleTypes: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    organizationId?: number;
    sortBy?: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    vehicleTypes: VehicleType[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>> => {
    const response = await apiClient.get('/vehicle-types', { params });
    return response.data;
  },

  // Get single vehicle type by ID
  getVehicleType: async (id: string): Promise<ApiResponse<VehicleType>> => {
    const response = await apiClient.get(`/vehicle-types/${id}`);
    return response.data;
  },

  // Create new vehicle type
  createVehicleType: async (vehicleTypeData: {
    organizationId: number;
    name: string;
    icon?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<VehicleType>> => {
    const response = await apiClient.post('/vehicle-types', vehicleTypeData);
    return response.data;
  },

  // Update existing vehicle type
  updateVehicleType: async (id: string, vehicleTypeData: {
    name?: string;
    icon?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<VehicleType>> => {
    const response = await apiClient.put(`/vehicle-types/${id}`, vehicleTypeData);
    return response.data;
  },

  // Delete vehicle type
  deleteVehicleType: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/vehicle-types/${id}`);
    return response.data;
  },

  // Get vehicle type stats
  getVehicleTypeStats: async (organizationId: number): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
  }>> => {
    const response = await apiClient.get(`/vehicle-types/stats/${organizationId}`);
    return response.data;
  },
};
