import { apiClient } from './client';
import { Order } from '@/types';

export const ordersApi = {
  // Get all orders with optional filters
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    collectorId?: string;
    scrapYardId?: string;
  }): Promise<{ data: Order[], total: number, page: number, limit: number }> => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  // Get single order by ID
  getOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  // Create new order
  createOrder: async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  // Update existing order
  updateOrder: async (id: string, orderData: Partial<Order>): Promise<Order> => {
    const response = await apiClient.put(`/orders/${id}`, orderData);
    return response.data;
  },

  // Delete order
  deleteOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },

  // Assign collector to order
  assignCollector: async (orderId: string, collectorId: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderId}/assign`, { collectorId });
    return response.data;
  },

  // Auto-assign collector based on location and availability
  autoAssignCollector: async (orderId: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderId}/auto-assign`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: string, notes?: string): Promise<Order> => {
    const response = await apiClient.patch(`/orders/${orderId}/status`, { status, notes });
    return response.data;
  },

  // Get orders by collector
  getOrdersByCollector: async (collectorId: string): Promise<Order[]> => {
    const response = await apiClient.get(`/collectors/${collectorId}/orders`);
    return response.data;
  },

  // Get order statistics
  getOrderStats: async (period?: 'daily' | 'weekly' | 'monthly'): Promise<{
    total: number;
    pending: number;
    assigned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }> => {
    const response = await apiClient.get('/orders/stats', { params: { period } });
    return response.data;
  },
};