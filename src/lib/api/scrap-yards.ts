import { apiClient } from './client';
import { ScrapYard } from '@/types';

export const scrapYardsApi = {
  // Get all scrap yards with optional filters
  getScrapYards: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    city?: string;
    state?: string;
  }): Promise<{ data: ScrapYard[], total: number, page: number, limit: number }> => {
    const response = await apiClient.get('/scrap-yards', { params });
    return response.data;
  },

  // Get single scrap yard by ID
  getScrapYard: async (id: string): Promise<ScrapYard> => {
    const response = await apiClient.get(`/scrap-yards/${id}`);
    return response.data;
  },

  // Create new scrap yard
  createScrapYard: async (yardData: Omit<ScrapYard, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScrapYard> => {
    const response = await apiClient.post('/scrap-yards', yardData);
    return response.data;
  },

  // Update existing scrap yard
  updateScrapYard: async (id: string, yardData: Partial<ScrapYard>): Promise<ScrapYard> => {
    const response = await apiClient.put(`/scrap-yards/${id}`, yardData);
    return response.data;
  },

  // Update scrap yard current load
  updateCurrentLoad: async (id: string, currentLoad: number): Promise<ScrapYard> => {
    const response = await apiClient.patch(`/scrap-yards/${id}/load`, { currentLoad });
    return response.data;
  },

  // Get scrap yard capacity status
  getCapacityStatus: async (): Promise<{
    totalCapacity: number;
    totalCurrentLoad: number;
    utilizationPercentage: number;
    nearCapacityYards: ScrapYard[];
    availableCapacity: number;
  }> => {
    const response = await apiClient.get('/scrap-yards/capacity-status');
    return response.data;
  },

  // Get scrap yards by region
  getScrapYardsByRegion: async (region: string): Promise<ScrapYard[]> => {
    const response = await apiClient.get('/scrap-yards', { params: { region } });
    return response.data.data;
  },

  // Get scrap yard statistics
  getScrapYardStats: async (): Promise<{
    total: number;
    active: number;
    maintenance: number;
    totalCapacity: number;
    totalCurrentLoad: number;
    averageUtilization: number;
    byState: Record<string, number>;
  }> => {
    const response = await apiClient.get('/scrap-yards/stats');
    return response.data;
  },

  // Find nearest scrap yard to location
  findNearestScrapYard: async (location: { lat: number; lng: number }): Promise<ScrapYard> => {
    const response = await apiClient.get('/scrap-yards/nearest', {
      params: { lat: location.lat, lng: location.lng }
    });
    return response.data;
  },
};