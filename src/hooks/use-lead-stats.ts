import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLeadStatsStore } from '@/lib/store/lead-stats-store';
import { useEffect } from 'react';

/**
 * Hook to fetch and manage lead statistics
 * Automatically syncs with Zustand store for global state management
 */
export const useLeadStats = () => {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  const { setStats, setLoading } = useLeadStatsStore();

  const query = useQuery({
    queryKey: queryKeys.leads.stats(organizationId),
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }
      const response = await leadsApi.getLeadStats(organizationId);
      return response.data;
    },
    enabled: !!organizationId,
    staleTime: 1 * 60 * 1000, // 1 minute - stats change frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Sync query data to Zustand store
  useEffect(() => {
    if (query.data) {
      const stats = {
        total: query.data.total || 0,
        new: query.data.new || 0,
        contacted: query.data.contacted || 0,
        quoted: query.data.quoted || 0,
        converted: query.data.converted || 0,
        rejected: query.data.rejected || 0,
      };
      setStats(stats);
    }
    setLoading(query.isLoading);
  }, [query.data, query.isLoading, setStats, setLoading]);

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
