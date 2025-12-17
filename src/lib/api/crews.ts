
import { apiClient } from './client';
import { Crew } from '@/types';

export const crewsApi = {
    // Get all crews
    getCrews: async (): Promise<{ data: { crews: Crew[] } }> => {
        const response = await apiClient.get('/crews');
        return response.data;
    },

    // Get single crew by ID
    getCrew: async (id: string): Promise<{ data: { crew: Crew } }> => {
        const response = await apiClient.get(`/crews/${id}`);
        return response.data;
    },

    // Create new crew
    createCrew: async (crewData: {
        name: string;
        description?: string;
        memberIds: string[];
    }): Promise<{ data: { crew: Crew } }> => {
        const response = await apiClient.post('/crews', crewData);
        return response.data;
    },

    // Update existing crew
    updateCrew: async (id: string, crewData: Partial<Crew> & { memberIds?: string[] }): Promise<{ data: { crew: Crew } }> => {
        const response = await apiClient.put(`/crews/${id}`, crewData);
        return response.data;
    },

    // Delete crew
    deleteCrew: async (id: string): Promise<void> => {
        await apiClient.delete(`/crews/${id}`);
    },
};
