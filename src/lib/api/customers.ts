import { apiClient } from './client';
import { Customer, CustomerStatus, VehicleTypeEnum, VehicleConditionEnum } from '@/types';

export const customersApi = {
  // Get all customers with optional filters and pagination
  getCustomers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: CustomerStatus;
    vehicleType?: string;
    scrapCategory?: string;
    organizationId?: number;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'name' | 'phone' | 'email' | 'status' | 'accountStatus' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: { customers: Customer[], pagination: any } }> => {
    // Map 'status' to 'accountStatus' for backend compatibility
    const apiParams: any = params ? {
      ...params,
      accountStatus: params.status,
      status: undefined
    } : {};
    // Remove undefined status to avoid sending it
    if (apiParams.status === undefined) {
      delete apiParams.status;
    }
    const response = await apiClient.get('/customers', { params: apiParams });
    return response.data;
  },

  // Get single customer by ID
  getCustomer: async (id: string): Promise<{ data: Customer }> => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  // Create new customer
  createCustomer: async (customerData: {
    organizationId: number;
    name: string;
    phone: string;
    countryCode?: string;
    email?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    vehicleType?: VehicleTypeEnum;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleNumber?: string;
    vehicleYear?: number;
    vehicleCondition?: VehicleConditionEnum;
    accountStatus: CustomerStatus;
  }): Promise<{ data: Customer }> => {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  },

  // Update existing customer
  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<{ data: Customer }> => {
    const response = await apiClient.put(`/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  // Bulk operations
  bulkUpdateCustomers: async (ids: string[], updates: Partial<Customer>): Promise<{ data: Customer[] }> => {
    const response = await apiClient.patch('/customers/bulk', { ids, updates });
    return response.data;
  },

  // Get customer statistics
  getCustomerStats: async (organizationId: number): Promise<{ data: any }> => {
    const response = await apiClient.get(`/customers/stats/${organizationId}`);
    return response.data;
  },

  // Get single customer statistics
  getCustomerDetailStats: async (customerId: string): Promise<{
    data: {
      totalOrders: number;
      totalSpent: number;
      lastOrderDate?: string;
      averageOrderValue: number;
    };
  }> => {
    const response = await apiClient.get(`/customers/${customerId}/stats`);
    return response.data;
  },

  // Convert lead to customer
  convertLeadToCustomer: async (leadId: string): Promise<{ data: { leadId: string, customerId: string } }> => {
    const response = await apiClient.post(`/leads/${leadId}/convert-to-customer`);
    return response.data;
  },
};
