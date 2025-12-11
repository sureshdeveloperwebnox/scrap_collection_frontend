import { apiClient } from './client';
import { Lead, LeadStatus } from '@/types';

export const leadsApi = {
  // Get all leads with optional filters and pagination
  getLeads: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: LeadStatus;
    vehicleType?: string;
    vehicleCondition?: string;
    leadSource?: string;
    organizationId?: number;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'fullName' | 'phone' | 'email' | 'status' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: { leads: Lead[], pagination: any } }> => {
    const response = await apiClient.get('/leads', { params });
    return response.data;
  },

  // Get single lead by ID
  getLead: async (id: string): Promise<{ data: Lead }> => {
    const response = await apiClient.get(`/leads/${id}`);
    return response.data;
  },

  // Create new lead
  createLead: async (leadData: {
    organizationId: number;
    fullName: string;
    phone: string;
    countryCode?: string;
    email?: string;
    vehicleType: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    vehicleCondition: string;
    locationAddress?: string;
    latitude?: number;
    longitude?: number;
    leadSource: string;
    photos?: string[];
    notes?: string;
    customerId?: string;
  }): Promise<{ data: Lead }> => {
    const response = await apiClient.post('/leads', leadData);
    return response.data;
  },

  // Update existing lead
  updateLead: async (id: string, leadData: Partial<Lead>): Promise<{ data: Lead }> => {
    const response = await apiClient.put(`/leads/${id}`, leadData);
    return response.data;
  },

  // Delete lead
  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },

  // Convert lead to order
  convertToOrder: async (leadId: string, data: {
    quotedPrice?: number;
    pickupTime?: Date;
    assignedCollectorId?: string;
    yardId?: string;
    customerNotes?: string;
    adminNotes?: string;
  }): Promise<{ data: any }> => {
    const response = await apiClient.put(`/leads/${leadId}/convert`, data);
    return response.data;
  },

  // Get lead timeline
  getLeadTimeline: async (leadId: string): Promise<{ data: any[] }> => {
    const response = await apiClient.get(`/leads/${leadId}/timeline`);
    return response.data;
  },

  // Get lead stats
  getLeadStats: async (organizationId: number): Promise<{ data: any }> => {
    const response = await apiClient.get(`/leads/stats/${organizationId}`);
    return response.data;
  },
};
