import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Payment } from '@/types';

// Get all payments with optional filters
export const usePayments = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  method?: string;
  customerId?: string;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => paymentsApi.getPayments(params),
    placeholderData: (previousData) => previousData,
  });
};

// Get single payment
export const usePayment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: () => paymentsApi.getPayment(id),
    enabled: !!id,
  });
};

// Get payment statistics
export const usePaymentStats = (period?: 'daily' | 'weekly' | 'monthly') => {
  return useQuery({
    queryKey: queryKeys.payments.stats(period),
    queryFn: () => paymentsApi.getPaymentStats(period),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get payments by customer
export const usePaymentsByCustomer = (customerId: string) => {
  return useQuery({
    queryKey: queryKeys.payments.byCustomer(customerId),
    queryFn: () => paymentsApi.getPaymentsByCustomer(customerId),
    enabled: !!customerId,
  });
};

// Get payments by order
export const usePaymentsByOrder = (orderId: string) => {
  return useQuery({
    queryKey: queryKeys.payments.byOrder(orderId),
    queryFn: () => paymentsApi.getPaymentsByOrder(orderId),
    enabled: !!orderId,
  });
};

// Create payment mutation
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => 
      paymentsApi.createPayment(paymentData),
    onSuccess: (newPayment) => {
      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      
      // Add new payment to cache
      queryClient.setQueryData(queryKeys.payments.detail(newPayment.id), newPayment);
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      
      // Update customer and order specific data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.payments.byCustomer(newPayment.customerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.payments.byOrder(newPayment.orderId) 
      });
    },
  });
};

// Update payment status mutation
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { 
      id: string; 
      status: string; 
      notes?: string 
    }) => paymentsApi.updatePaymentStatus(id, status, notes),
    onSuccess: (updatedPayment) => {
      // Update payment in cache
      queryClient.setQueryData(queryKeys.payments.detail(updatedPayment.id), updatedPayment);
      
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      
      // Update related data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.payments.byCustomer(updatedPayment.customerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.payments.byOrder(updatedPayment.orderId) 
      });
    },
  });
};

// Process refund mutation
export const useProcessRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, amount, reason }: { 
      paymentId: string; 
      amount?: number; 
      reason?: string 
    }) => paymentsApi.processRefund(paymentId, amount, reason),
    onSuccess: (refundedPayment) => {
      // Update payment in cache
      queryClient.setQueryData(queryKeys.payments.detail(refundedPayment.id), refundedPayment);
      
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      
      // Update related data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.payments.byCustomer(refundedPayment.customerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.payments.byOrder(refundedPayment.orderId) 
      });
    },
  });
};

// Retry payment mutation
export const useRetryPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => paymentsApi.retryPayment(paymentId),
    onSuccess: (retriedPayment) => {
      // Update payment in cache
      queryClient.setQueryData(queryKeys.payments.detail(retriedPayment.id), retriedPayment);
      
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.stats() });
      
      // Update related data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.payments.byCustomer(retriedPayment.customerId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.payments.byOrder(retriedPayment.orderId) 
      });
    },
  });
};

// Generate payment report mutation
export const useGeneratePaymentReport = () => {
  return useMutation({
    mutationFn: (params: {
      dateFrom: string;
      dateTo: string;
      format?: 'pdf' | 'csv' | 'excel';
    }) => paymentsApi.generatePaymentReport(params),
    onSuccess: (result) => {
      // Open download URL in new tab
      if (result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
      }
    },
  });
};