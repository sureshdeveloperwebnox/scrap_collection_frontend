import { apiClient } from './client';

export interface CollectorAssignment {
  id: string;
  collectorId: string;
  collector?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  vehicleNameId?: string;
  vehicleName?: {
    id: string;
    name: string;
    vehicleType?: {
      id: number;
      name: string;
    };
  };
  scrapYardId?: string;
  scrapYard?: {
    id: string;
    yardName: string;
    address?: string;
  };
  organizationId: number;
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

export const collectorAssignmentsApi = {
  // Get all collector assignments with optional filters
  getCollectorAssignments: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    organizationId?: number;
    collectorId?: string;
    vehicleNameId?: string;
    cityId?: number;
    sortBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{
    assignments: CollectorAssignment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>> => {
    const response = await apiClient.get('/collector-assignments', { params });
    return response.data;
  },

  // Get single collector assignment by ID
  getCollectorAssignment: async (id: string): Promise<ApiResponse<CollectorAssignment>> => {
    const response = await apiClient.get(`/collector-assignments/${id}`);
    return response.data;
  },

  // Create new collector assignment
  createCollectorAssignment: async (assignmentData: {
    organizationId: number;
    collectorId: string;
    vehicleNameId?: string;
    scrapYardId?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<CollectorAssignment>> => {
    const response = await apiClient.post('/collector-assignments', assignmentData);
    return response.data;
  },

  // Update existing collector assignment
  updateCollectorAssignment: async (id: string, assignmentData: {
    vehicleNameId?: string | null;
    scrapYardId?: string | null;
    isActive?: boolean;
  }): Promise<ApiResponse<CollectorAssignment>> => {
    const response = await apiClient.put(`/collector-assignments/${id}`, assignmentData);
    return response.data;
  },

  // Delete collector assignment
  deleteCollectorAssignment: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/collector-assignments/${id}`);
    return response.data;
  },
};
