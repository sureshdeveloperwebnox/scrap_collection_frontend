import { apiClient } from './client';

export interface Organization {
    id: number;
    name: string;
    email?: string;
    website?: string;
    billingAddress?: string;
    latitude?: number;
    longitude?: number;
    countryId?: number;
    country?: {
        id: number;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateOrganizationRequest {
    name: string;
    email?: string;
    website?: string;
    billingAddress?: string;
    latitude?: number;
    longitude?: number;
    countryId?: number;
}

export interface UpdateOrganizationRequest {
    name?: string;
    email?: string;
    website?: string;
    billingAddress?: string;
    latitude?: number;
    longitude?: number;
    countryId?: number;
}

export const organizationApi = {
    /**
     * Create a new organization
     */
    createOrganization: async (data: CreateOrganizationRequest) => {
        const response = await apiClient.post('/organizations', data);
        return response.data;
    },

    /**
     * Get organization by ID
     */
    getOrganization: async (id: number) => {
        const response = await apiClient.get(`/organizations/${id}`);
        return response.data;
    },

    /**
     * Get current user's organization
     */
    getMyOrganization: async () => {
        const response = await apiClient.get('/organizations/me/organization');
        return response.data;
    },

    /**
     * Get organization by user ID
     */
    getUserOrganization: async (userId: string) => {
        const response = await apiClient.get(`/organizations/user/${userId}`);
        return response.data;
    },

    /**
     * Update organization
     */
    updateOrganization: async (id: number, data: UpdateOrganizationRequest) => {
        const response = await apiClient.put(`/organizations/${id}`, data);
        return response.data;
    },

    /**
     * Delete organization (Admin only)
     */
    deleteOrganization: async (id: number) => {
        const response = await apiClient.delete(`/organizations/${id}`);
        return response.data;
    },
};
