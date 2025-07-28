import { apiClient } from './client';
import { Lead } from '@/types';

export const leadsApi = {
  // Get all leads with optional filters
  getLeads: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vehicleType?: string;
  }): Promise<{ data: Lead[], total: number, page: number, limit: number }> => {
    const response = await apiClient.get('/leads', { params });
    return response.data;
  },

  // Get single lead by ID
  getLead: async (id: string): Promise<Lead> => {
    const response = await apiClient.get(`/leads/${id}`);
    return response.data;
  },

  // Create new lead
  createLead: async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> => {
    const response = await apiClient.post('/leads', leadData);
    return response.data;
  },

  // Update existing lead
  updateLead: async (id: string, leadData: Partial<Lead>): Promise<Lead> => {
    const response = await apiClient.put(`/leads/${id}`, leadData);
    return response.data;
  },

  // Delete lead
  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },

  // Bulk operations
  bulkUpdateLeads: async (ids: string[], updates: Partial<Lead>): Promise<Lead[]> => {
    const response = await apiClient.patch('/leads/bulk', { ids, updates });
    return response.data;
  },

  // Convert lead to order
  convertToOrder: async (leadId: string): Promise<{ leadId: string, orderId: string }> => {
    const response = await apiClient.post(`/leads/${leadId}/convert`);
    return response.data;
  },
};