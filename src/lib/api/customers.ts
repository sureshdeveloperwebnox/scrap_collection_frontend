import { apiClient } from './client';
import { Customer } from '@/types';

export const customersApi = {
  // Get all customers with optional filters
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vehicleType?: string;
    organizationId?: number;
  }): Promise<{ data: Customer[], total: number, page: number, limit: number }> => {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  // Get single customer by ID
  getCustomer: async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  // Create new customer
  createCustomer: async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalSpent' | 'lastOrderDate'>): Promise<Customer> => {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  },

  // Update existing customer
  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.put(`/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  // Bulk operations
  bulkUpdateCustomers: async (ids: string[], updates: Partial<Customer>): Promise<Customer[]> => {
    const response = await apiClient.patch('/customers/bulk', { ids, updates });
    return response.data;
  },

  // Get customer statistics
  getCustomerStats: async (customerId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: string;
    averageOrderValue: number;
  }> => {
    const response = await apiClient.get(`/customers/${customerId}/stats`);
    return response.data;
  },

  // Convert lead to customer
  convertLeadToCustomer: async (leadId: string): Promise<{ leadId: string, customerId: string }> => {
    const response = await apiClient.post(`/leads/${leadId}/convert-to-customer`);
    return response.data;
  },
};
