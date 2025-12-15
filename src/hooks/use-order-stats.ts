import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { useOrderStatsStore } from '@/lib/store/order-stats-store';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';

export const useOrderStats = (period?: 'daily' | 'weekly' | 'monthly') => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { setStats, setLoading } = useOrderStatsStore();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.orders.stats(period),
    queryFn: async () => {
      try {
        const response = await ordersApi.getOrderStats(period);
        return response;
      } catch (err: any) {
        // If stats endpoint doesn't exist (404), return default stats
        if (err?.response?.status === 404) {
          return {
            data: {
              total: 0,
              pending: 0,
              assigned: 0,
              inProgress: 0,
              completed: 0,
              cancelled: 0,
              unpaid: 0,
              paid: 0,
              refunded: 0,
            }
          };
        }
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!organizationId,
    retry: false, // Don't retry on 404
  });

  // Sync stats to Zustand store
  useEffect(() => {
    if (data?.data) {
      // Transform API response to match OrderStats interface
      const stats = {
        total: data.data.total || 0,
        pending: data.data.pending || 0,
        assigned: data.data.assigned || 0,
        inProgress: data.data.inProgress || 0,
        completed: data.data.completed || 0,
        cancelled: data.data.cancelled || 0,
        unpaid: data.data.unpaid || 0,
        paid: data.data.paid || 0,
        refunded: data.data.refunded || 0,
      };
      setStats(stats);
    }
  }, [data, setStats]);

  // Sync loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  return { data, isLoading, error };
};
