import { apiClient } from './client';

export interface ScrapCategoryDto {
  id: string;
  name: string;
  description?: string;
  organizationId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScrapNameDto {
  id: string;
  name: string;
  scrapCategoryId: string;
  organizationId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  scrapCategory?: ScrapCategoryDto;
}

export interface PaginatedResponse<T> {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: {
    [key: string]: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
    };
  };
}

export const scrapApi = {
  // Scrap Categories
  getScrapCategories: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    organizationId?: number;
    isActive?: boolean;
  }): Promise<
    PaginatedResponse<ScrapCategoryDto> & {
      data: {
        scrapCategories: ScrapCategoryDto[];
        pagination: PaginatedResponse<ScrapCategoryDto>['data']['pagination'];
      };
    }
  > => {
    const response = await apiClient.get('/scrap-categories', { params });
    return response.data;
  },

  getScrapCategory: async (id: string): Promise<{
    version: string;
    validationErrors: any[];
    code: number;
    status: string;
    message: string;
    data: ScrapCategoryDto;
  }> => {
    const response = await apiClient.get(`/scrap-categories/${id}`);
    return response.data;
  },

  createScrapCategory: async (data: {
    organizationId: number;
    name: string;
    description?: string;
    isActive?: boolean;
  }): Promise<{
    version: string;
    validationErrors: any[];
    code: number;
    status: string;
    message: string;
    data: ScrapCategoryDto;
  }> => {
    const response = await apiClient.post('/scrap-categories', data);
    return response.data;
  },

  updateScrapCategory: async (
    id: string,
    data: { name?: string; description?: string; isActive?: boolean },
  ): Promise<{
    version: string;
    validationErrors: any[];
    code: number;
    status: string;
    message: string;
    data: ScrapCategoryDto;
  }> => {
    const response = await apiClient.put(`/scrap-categories/${id}`, data);
    return response.data;
  },

  deleteScrapCategory: async (id: string): Promise<{
    version: string;
    validationErrors: any[];
    code: number;
    status: string;
    message: string;
    data: null;
  }> => {
    const response = await apiClient.delete(`/scrap-categories/${id}`);
    return response.data;
  },

  // Scrap Names
  getScrapNames: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    scrapCategoryId?: string;
    organizationId?: number;
    isActive?: boolean;
  }): Promise<
    PaginatedResponse<ScrapNameDto> & {
      data: {
        scrapNames: ScrapNameDto[];
        pagination: PaginatedResponse<ScrapNameDto>['data']['pagination'];
      };
    }
  > => {
    const response = await apiClient.get('/scrap-names', { params });
    return response.data;
  },

  getScrapName: async (id: string): Promise<{
    version: string;
    validationErrors: any[];
    code: number;
    status: string;
    message: string;
    data: ScrapNameDto;
  }> => {
    const response = await apiClient.get(`/scrap-names/${id}`);
    return response.data;
  },

  createScrapName: async (data: {
    name: string;
    scrapCategoryId: string;
    organizationId: number;
    isActive?: boolean;
  }): Promise<{
    version: string;
    validationErrors: any[];
    code: number;
    status: string;
    message: string;
    data: ScrapNameDto;
  }> => {
    const response = await apiClient.post('/scrap-names', data);
    return response.data;
  },

  updateScrapName: async (
    id: string,
    data: { name?: string; scrapCategoryId?: string; isActive?: boolean },
  ): Promise<{
    version: string;
    validationErrors: any[];
    code: number;
    status: string;
    message: string;
    data: ScrapNameDto;
  }> => {
    const response = await apiClient.put(`/scrap-names/${id}`, data);
    return response.data;
  },

  deleteScrapName: async (id: string): Promise<{
    version: string;
    validationErrors: any[];
    code: number;
    status: string;
    message: string;
    data: null;
  }> => {
    const response = await apiClient.delete(`/scrap-names/${id}`);
    return response.data;
  },
};

