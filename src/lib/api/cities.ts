import { apiClient } from './client';

export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
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

export const citiesApi = {
  // Get all cities with optional filters
  getCities: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    cities: City[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>> => {
    const response = await apiClient.get('/cities', { params });
    return response.data;
  },

  // Get single city by ID
  getCity: async (id: string): Promise<ApiResponse<City>> => {
    const response = await apiClient.get(`/cities/${id}`);
    return response.data;
  },

  // Create new city
  createCity: async (cityData: {
    name: string;
    latitude: number;
    longitude: number;
    isActive?: boolean;
  }): Promise<ApiResponse<City>> => {
    const response = await apiClient.post('/cities', cityData);
    return response.data;
  },

  // Update existing city
  updateCity: async (id: string, cityData: {
    name?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<City>> => {
    const response = await apiClient.put(`/cities/${id}`, cityData);
    return response.data;
  },

  // Delete city
  deleteCity: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/cities/${id}`);
    return response.data;
  },
};

