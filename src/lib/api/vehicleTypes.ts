import { apiClient } from './client';

export interface VehicleType {
  id: number;
  organizationId: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  }): Promise<ApiResponse<{
    vehicleTypes: VehicleType[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
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
  createVehicleType: async (vehicleTypeData: Omit<VehicleType, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<VehicleType>> => {
    const response = await apiClient.post('/vehicle-types', vehicleTypeData);
    return response.data;
  },

  // Update existing vehicle type
  updateVehicleType: async (id: string, vehicleTypeData: Partial<VehicleType>): Promise<ApiResponse<VehicleType>> => {
    const response = await apiClient.put(`/vehicle-types/${id}`, vehicleTypeData);
    return response.data;
  },

  // Delete vehicle type
  deleteVehicleType: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/vehicle-types/${id}`);
    return response.data;
  },

  // Bulk operations
  bulkUpdateVehicleTypes: async (ids: string[], updates: Partial<VehicleType>): Promise<ApiResponse<VehicleType[]>> => {
    const response = await apiClient.patch('/vehicle-types/bulk', { ids, updates });
    return response.data;
  },

  // Toggle vehicle type status
  toggleVehicleTypeStatus: async (id: string): Promise<ApiResponse<VehicleType>> => {
    const response = await apiClient.patch(`/vehicle-types/${id}/toggle-status`);
    return response.data;
  },
};
