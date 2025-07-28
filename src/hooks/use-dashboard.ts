import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

// Get dashboard statistics
export const useDashboardStats = (period?: 'daily' | 'weekly' | 'monthly') => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(period),
    queryFn: () => dashboardApi.getDashboardStats(period),
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard stats
  });
};

// Get recent activity
export const useRecentActivity = (limit?: number) => {
  return useQuery({
    queryKey: queryKeys.dashboard.recentActivity(limit),
    queryFn: () => dashboardApi.getRecentActivity(limit),
    staleTime: 1 * 60 * 1000, // 1 minute for recent activity
  });
};

// Get performance metrics
export const usePerformanceMetrics = (period?: 'weekly' | 'monthly') => {
  return useQuery({
    queryKey: queryKeys.dashboard.performance(period),
    queryFn: () => dashboardApi.getPerformanceMetrics(period),
  });
};

// Get analytics data
export const useAnalyticsData = (type: 'orders' | 'revenue' | 'leads', period?: 'weekly' | 'monthly') => {
  return useQuery({
    queryKey: queryKeys.dashboard.analytics(type, period),
    queryFn: () => dashboardApi.getAnalyticsData(type, period),
  });
};

// Get top collectors
export const useTopCollectors = (limit?: number) => {
  return useQuery({
    queryKey: queryKeys.dashboard.topCollectors(limit),
    queryFn: () => dashboardApi.getTopCollectors(limit),
  });
};

// Get alerts
export const useAlerts = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.alerts(),
    queryFn: () => dashboardApi.getAlerts(),
    staleTime: 30 * 1000, // 30 seconds for alerts
  });
};

// Acknowledge alert mutation
export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => dashboardApi.acknowledgeAlert(alertId),
    onSuccess: () => {
      // Invalidate alerts query to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.alerts() });
    },
  });
};