import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCustomerStatsStore } from '@/lib/store/customer-stats-store';
import { useEffect } from 'react';

/**
 * Hook to fetch and sync customer stats to Zustand store
 * Similar to useLeadStats hook
 */
export const useCustomerStats = () => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { setStats, setLoading } = useCustomerStatsStore();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.customers.stats(organizationId),
    queryFn: () => customersApi.getCustomerStats(organizationId!),
    enabled: !!organizationId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Sync stats to Zustand store whenever data changes
  // Only update if the new stats are different to avoid unnecessary re-renders
  useEffect(() => {
    if (data?.data) {
      const stats = data.data;
      const newStats = {
        total: stats.total || 0,
        active: stats.active || 0,
        inactive: stats.inactive || 0,
        vip: stats.vip || 0,
        blocked: stats.blocked || 0,
      };
      
      // Only update if stats have actually changed
      const currentStats = useCustomerStatsStore.getState().stats;
      if (!currentStats || 
          currentStats.total !== newStats.total ||
          currentStats.active !== newStats.active ||
          currentStats.inactive !== newStats.inactive ||
          currentStats.vip !== newStats.vip ||
          currentStats.blocked !== newStats.blocked) {
        setStats(newStats);
      }
    }
  }, [data, setStats]);

  // Sync loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  return { data, isLoading, error };
};
