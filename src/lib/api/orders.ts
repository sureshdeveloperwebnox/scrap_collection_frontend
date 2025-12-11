import { apiClient } from './client';
import { Order, OrderStatus, PaymentStatusEnum } from '@/types';

export const ordersApi = {
  // Get all orders with optional filters
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatusEnum;
    collectorId?: string;
    organizationId?: number;
    dateFrom?: string;
    dateTo?: string;
    location?: string;
  }): Promise<{ data: { orders: Order[], pagination: any } }> => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  // Get single order by ID
  getOrder: async (id: string): Promise<{ data: Order }> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  // Create new order
  createOrder: async (orderData: {
    organizationId: number;
    leadId?: string;
    customerName: string;
    customerPhone: string;
    address: string;
    latitude?: number;
    longitude?: number;
    vehicleDetails: {
      make?: string;
      model?: string;
      year?: number;
      condition?: string;
    };
    assignedCollectorId?: string;
    pickupTime?: Date;
    quotedPrice?: number;
    yardId?: string;
    customerNotes?: string;
    adminNotes?: string;
    customerId?: string;
  }): Promise<{ data: Order }> => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  // Update existing order
  updateOrder: async (id: string, orderData: Partial<Order>): Promise<{ data: Order }> => {
    const response = await apiClient.put(`/orders/${id}`, orderData);
    return response.data;
  },

  // Delete order
  deleteOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },

  // Assign order to collector
  assignOrder: async (orderId: string, collectorId: string): Promise<{ data: Order }> => {
    const response = await apiClient.post(`/orders/${orderId}/assign`, { collectorId });
    return response.data;
  },

  // Assign collector (alias)
  assignCollector: async (orderId: string, collectorId: string): Promise<{ data: Order }> => {
    return ordersApi.assignOrder(orderId, collectorId);
  },

  // Auto-assign collector
  autoAssignCollector: async (orderId: string): Promise<{ data: Order }> => {
    // In a real app, this would call a backend endpoint for auto-assignment
    // For now, we'll just return the order
    const order = await ordersApi.getOrder(orderId);
    return order;
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: string, notes?: string): Promise<{ data: Order }> => {
    const response = await apiClient.put(`/orders/${orderId}`, { orderStatus: status, adminNotes: notes });
    return response.data;
  },

  // Get order timeline
  getOrderTimeline: async (orderId: string): Promise<{ data: any[] }> => {
    const response = await apiClient.get(`/orders/${orderId}/timeline`);
    return response.data;
  },

  // Get order stats
  getOrderStats: async (period?: 'daily' | 'weekly' | 'monthly'): Promise<{ data: any }> => {
    const response = await apiClient.get('/orders/stats', { params: { period } });
    return response.data;
  },

  // Get orders by collector
  getOrdersByCollector: async (collectorId: string): Promise<{ data: { orders: Order[] } }> => {
    const response = await apiClient.get('/orders', { params: { collectorId } });
    return response.data;
  },
};
