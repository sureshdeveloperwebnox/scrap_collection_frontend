import { apiClient } from './client';
import { Payment } from '@/types';

export const paymentsApi = {
  // Get all payments with optional filters
  getPayments: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    method?: string;
    customerId?: string;
    orderId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ data: Payment[], total: number, page: number, limit: number }> => {
    const response = await apiClient.get('/payments', { params });
    return response.data;
  },

  // Get single payment by ID
  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  },

  // Create new payment
  createPayment: async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> => {
    const response = await apiClient.post('/payments', paymentData);
    return response.data;
  },

  // Update payment status
  updatePaymentStatus: async (id: string, status: string, notes?: string): Promise<Payment> => {
    const response = await apiClient.patch(`/payments/${id}/status`, { status, notes });
    return response.data;
  },

  // Process refund
  processRefund: async (paymentId: string, amount?: number, reason?: string): Promise<Payment> => {
    const response = await apiClient.post(`/payments/${paymentId}/refund`, { amount, reason });
    return response.data;
  },

  // Retry failed payment
  retryPayment: async (paymentId: string): Promise<Payment> => {
    const response = await apiClient.post(`/payments/${paymentId}/retry`);
    return response.data;
  },

  // Get payment statistics
  getPaymentStats: async (period?: 'daily' | 'weekly' | 'monthly'): Promise<{
    totalRevenue: number;
    pendingAmount: number;
    refundedAmount: number;
    failedCount: number;
    completedCount: number;
    byMethod: Record<string, { count: number; amount: number }>;
    recentTransactions: Payment[];
  }> => {
    const response = await apiClient.get('/payments/stats', { params: { period } });
    return response.data;
  },

  // Get payments by customer
  getPaymentsByCustomer: async (customerId: string): Promise<Payment[]> => {
    const response = await apiClient.get(`/customers/${customerId}/payments`);
    return response.data;
  },

  // Get payments by order
  getPaymentsByOrder: async (orderId: string): Promise<Payment[]> => {
    const response = await apiClient.get(`/orders/${orderId}/payments`);
    return response.data;
  },

  // Generate payment report
  generatePaymentReport: async (params: {
    dateFrom: string;
    dateTo: string;
    format?: 'pdf' | 'csv' | 'excel';
  }): Promise<{ downloadUrl: string }> => {
    const response = await apiClient.post('/payments/reports', params);
    return response.data;
  },
};