import { useQuery } from '@tanstack/react-query';
import { dashboardApi, leadsApi, customersApi, ordersApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

export const useDashboardStats = (period?: 'daily' | 'weekly' | 'monthly') => {
    return useQuery({
        queryKey: queryKeys.dashboard.stats(period),
        queryFn: () => dashboardApi.getDashboardStats(period),
        staleTime: 5 * 60 * 1000,
    });
};

export const useRecentActivity = (limit?: number) => {
    return useQuery({
        queryKey: queryKeys.dashboard.recentActivity(limit),
        queryFn: () => dashboardApi.getRecentActivity(limit),
        staleTime: 2 * 60 * 1000,
    });
};

export const usePerformanceMetrics = (period?: 'weekly' | 'monthly') => {
    return useQuery({
        queryKey: queryKeys.dashboard.performance(period),
        queryFn: () => dashboardApi.getPerformanceMetrics(period),
        staleTime: 5 * 60 * 1000,
    });
};

export const useAnalyticsData = (type: 'orders' | 'revenue' | 'leads', period?: 'weekly' | 'monthly') => {
    return useQuery({
        queryKey: queryKeys.dashboard.analytics(type, period),
        queryFn: () => dashboardApi.getAnalyticsData(type, period),
        staleTime: 10 * 60 * 1000,
    });
};

/**
 * Combined hook for the main dashboard data using existing list APIs
 * This mirrors the logic currently in DashboardPage but with caching
 */
export const useDashboardCombinedData = (organizationId?: number) => {
    return useQuery({
        queryKey: ['dashboard', 'combined', organizationId],
        queryFn: async () => {
            if (!organizationId) return null;

            const [leadsResponse, customersResponse, ordersResponse] = await Promise.all([
                leadsApi.getLeads({ organizationId }).catch(() => ({ data: { leads: [], pagination: {} } })),
                customersApi.getCustomers({ organizationId }).catch(() => ({ data: { customers: [], pagination: {} } })),
                ordersApi.getOrders({ organizationId }).catch(() => ({ data: { orders: [], pagination: {} } }))
            ]);

            const leads = Array.isArray(leadsResponse?.data?.leads) ? leadsResponse.data.leads : [];
            const customers = Array.isArray(customersResponse?.data?.customers) ? customersResponse.data.customers : [];
            const orders = Array.isArray(ordersResponse?.data?.orders) ? ordersResponse.data.orders : [];

            const totalRevenue = orders.reduce((sum: number, order: any) => {
                return sum + (parseFloat(order.totalAmount) || 0);
            }, 0);

            const completedOrders = orders.filter((order: any) =>
                order.status === 'completed' || order.status === 'COMPLETED'
            ).length;

            return {
                stats: {
                    leads: { total: leads.length, new: leads.length, converted: 0, trend: 0 },
                    customers: { total: customers.length, active: customers.length, inactive: 0, trend: 0 },
                    orders: { total: orders.length, pending: orders.length - completedOrders, completed: completedOrders, revenue: totalRevenue, trend: 0 }
                },
                analytics: {
                    totalRevenue,
                    totalOrders: orders.length,
                    revenueChart: [1543, 1650, 1720, 1580, 1890, 1750, 2100, 1950, 2200, 2543],
                    ordersChart: [45, 52, 48, 58, 65, 62, 70],
                    collectorsChart: [2.5, 3.2, 2.8, 3.5, 4.1, 3.8, 4.5]
                }
            };
        },
        enabled: !!organizationId,
        staleTime: 3 * 60 * 1000,
    });
};
