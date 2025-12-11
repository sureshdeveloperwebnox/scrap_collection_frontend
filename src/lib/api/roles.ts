import { apiClient } from './client';

export interface Role {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    employees: number;
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

export const rolesApi = {
  // Get all roles with optional filters
  getRoles: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    sortBy?: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    roles: Role[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>> => {
    const response = await apiClient.get('/roles', { params });
    return response.data;
  },

  // Get single role by ID
  getRole: async (id: string): Promise<ApiResponse<Role>> => {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data;
  },

  // Create new role
  createRole: async (roleData: {
    name: string;
    description?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Role>> => {
    const response = await apiClient.post('/roles', roleData);
    return response.data;
  },

  // Update existing role
  updateRole: async (id: string, roleData: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Role>> => {
    const response = await apiClient.put(`/roles/${id}`, roleData);
    return response.data;
  },

  // Delete role
  deleteRole: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  },

  // Activate role
  activateRole: async (id: string): Promise<ApiResponse<Role>> => {
    const response = await apiClient.put(`/roles/${id}/activate`);
    return response.data;
  },

  // Deactivate role
  deactivateRole: async (id: string): Promise<ApiResponse<Role>> => {
    const response = await apiClient.put(`/roles/${id}/deactivate`);
    return response.data;
  },
};

