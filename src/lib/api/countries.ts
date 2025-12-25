import { apiClient } from './client';

export interface Country {
    id: number;
    name: string;
    currency?: string;
    createdAt: string;
    updatedAt: string;
}

export const countriesApi = {
    /**
     * Get all countries
     */
    getCountries: async () => {
        const response = await apiClient.get('/country');
        return response.data;
    },

    /**
     * Create a new country (Admin only)
     */
    createCountry: async (data: { name: string; currency?: string }) => {
        const response = await apiClient.post('/country', data);
        return response.data;
    },
};
