import { apiClient } from './client';
import { DashboardStats } from '@/types';

export const dashboardApi = {
  // Get dashboard statistics
  getDashboardStats: async (period?: 'daily' | 'weekly' | 'monthly'): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/stats', { params: { period } });
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (limit?: number): Promise<{
    recentOrders: any[];
    recentLeads: any[];
    recentPayments: any[];
  }> => {
    const response = await apiClient.get('/dashboard/recent-activity', { params: { limit } });
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (period?: 'weekly' | 'monthly'): Promise<{
    ordersGrowth: number;
    revenueGrowth: number;
    leadsGrowth: number;
    collectorEfficiency: number;
    customerSatisfaction: number;
  }> => {
    const response = await apiClient.get('/dashboard/performance', { params: { period } });
    return response.data;
  },

  // Get analytics data for charts
  getAnalyticsData: async (type: 'orders' | 'revenue' | 'leads', period?: 'weekly' | 'monthly'): Promise<{
    labels: string[];
    data: number[];
    comparison?: {
      previous: number[];
      change: number;
    };
  }> => {
    const response = await apiClient.get(`/dashboard/analytics/${type}`, { params: { period } });
    return response.data;
  },

  // Get top performing collectors
  getTopCollectors: async (limit?: number): Promise<{
    id: string;
    name: string;
    totalPickups: number;
    revenue: number;
    rating: number;
  }[]> => {
    const response = await apiClient.get('/dashboard/top-collectors', { params: { limit } });
    return response.data;
  },

  // Get alerts and notifications
  getAlerts: async (): Promise<{
    alerts: {
      id: string;
      type: 'warning' | 'error' | 'info';
      title: string;
      message: string;
      timestamp: Date;
      acknowledged: boolean;
    }[];
    unreadCount: number;
  }> => {
    const response = await apiClient.get('/dashboard/alerts');
    return response.data;
  },

  // Acknowledge alert
  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await apiClient.patch(`/dashboard/alerts/${alertId}/acknowledge`);
  },
};