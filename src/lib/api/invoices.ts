import { apiClient } from './client';

export const invoicesApi = {
    // Get all invoices with optional filters and pagination
    getInvoices: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        customerId?: string;
        workOrderId?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await apiClient.get('/invoices', { params });
        return response.data;
    },

    // Get single invoice by ID
    getInvoice: async (id: string) => {
        const response = await apiClient.get(`/invoices/${id}`);
        return response.data;
    },

    // Create new invoice
    createInvoice: async (invoiceData: any) => {
        const response = await apiClient.post('/invoices', invoiceData);
        return response.data;
    },

    // Update existing invoice
    updateInvoice: async (id: string, invoiceData: any) => {
        const response = await apiClient.put(`/invoices/${id}`, invoiceData);
        return response.data;
    },

    updateInvoiceStatus: async (id: string, status: string) => {
        const response = await apiClient.put(`/invoices/${id}/status`, { status });
        return response.data;
    },

    // Cancel invoice
    cancelInvoice: async (id: string, reason: string) => {
        const response = await apiClient.post(`/invoices/${id}/cancel`, { reason });
        return response.data;
    },

    // Get invoice statistics
    getInvoiceStats: async () => {
        const response = await apiClient.get('/invoices/stats');
        return response.data;
    },

    // Get invoices by customer
    getInvoicesByCustomer: async (customerId: string) => {
        const response = await apiClient.get(`/invoices/customer/${customerId}`);
        return response.data;
    },

    // Get invoices by work order
    getInvoicesByWorkOrder: async (workOrderId: string) => {
        const response = await apiClient.get(`/invoices/work-order/${workOrderId}`);
        return response.data;
    },

    // Download invoice PDF data
    downloadInvoice: async (id: string) => {
        const response = await apiClient.get(`/invoices/${id}/download`);
        return response.data;
    },

    getInvoiceHistory: async (id: string, params?: { page?: number; limit?: number }) => {
        const response = await apiClient.get(`/invoices/${id}/history`, { params });
        return response.data;
    }
};
