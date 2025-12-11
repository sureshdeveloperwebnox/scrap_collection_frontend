import { apiClient } from './client';
import { Payment, PaymentStatusEnum, PaymentTypeEnum } from '@/types';

export const paymentsApi = {
  // Get all payments with optional filters
  getPayments: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PaymentStatusEnum;
    paymentType?: PaymentTypeEnum;
    customerId?: string;
    collectorId?: string;
    organizationId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ data: { payments: Payment[], pagination: any } }> => {
    const response = await apiClient.get('/payments', { params });
    return response.data;
  },

  // Get single payment by ID
  getPayment: async (id: string): Promise<{ data: Payment }> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  },

  // Create new payment
  createPayment: async (paymentData: {
    orderId: string;
    customerId: string;
    collectorId?: string;
    amount: number;
    paymentType: PaymentTypeEnum;
    receiptUrl?: string;
  }): Promise<{ data: Payment }> => {
    const response = await apiClient.post('/payments', paymentData);
    return response.data;
  },

  // Update existing payment
  updatePayment: async (id: string, paymentData: Partial<Payment>): Promise<{ data: Payment }> => {
    const response = await apiClient.put(`/payments/${id}`, paymentData);
    return response.data;
  },

  // Create refund
  createRefund: async (paymentId: string, refundData: {
    amount: number;
    reason?: string;
    processedByAdmin: string;
  }): Promise<{ data: any }> => {
    const response = await apiClient.post(`/payments/${paymentId}/refund`, refundData);
    return response.data;
  },

  // Process refund (alias for createRefund with simplified params)
  processRefund: async (paymentId: string, amount?: number, reason?: string): Promise<{ data: Payment }> => {
    const response = await apiClient.post(`/payments/${paymentId}/refund`, {
      amount: amount || undefined,
      reason: reason || undefined,
      processedByAdmin: 'system' // In real app, get from auth context
    });
    return response.data;
  },

  // Update payment status
  updatePaymentStatus: async (id: string, status: string, notes?: string): Promise<{ data: Payment }> => {
    const response = await apiClient.put(`/payments/${id}`, { status, notes });
    return response.data;
  },

  // Retry payment
  retryPayment: async (paymentId: string): Promise<{ data: Payment }> => {
    // In a real app, this would call a backend endpoint to retry
    const payment = await paymentsApi.getPayment(paymentId);
    return payment;
  },

  // Get payment stats
  getPaymentStats: async (period?: 'daily' | 'weekly' | 'monthly'): Promise<{ data: any }> => {
    const response = await apiClient.get('/payments/stats', { params: { period } });
    return response.data;
  },

  // Get payments by customer
  getPaymentsByCustomer: async (customerId: string): Promise<{ data: { payments: Payment[] } }> => {
    const response = await apiClient.get('/payments', { params: { customerId } });
    return response.data;
  },

  // Get payments by order
  getPaymentsByOrder: async (orderId: string): Promise<{ data: { payments: Payment[] } }> => {
    const response = await apiClient.get('/payments', { params: { orderId } });
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
