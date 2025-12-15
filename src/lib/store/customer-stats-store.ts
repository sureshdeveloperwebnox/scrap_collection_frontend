import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  vip: number;
  blocked: number;
}

interface CustomerStatsState {
  stats: CustomerStats | null;
  isLoading: boolean;
  lastUpdated: number | null;
  setStats: (stats: CustomerStats) => void;
  setLoading: (loading: boolean) => void;
  updateCount: (status: keyof CustomerStats, change: number) => void;
  incrementStatus: (status: 'ACTIVE' | 'INACTIVE' | 'VIP' | 'BLOCKED') => void;
  decrementStatus: (status: 'ACTIVE' | 'INACTIVE' | 'VIP' | 'BLOCKED') => void;
  reset: () => void;
}

const initialStats: CustomerStats = {
  total: 0,
  active: 0,
  inactive: 0,
  vip: 0,
  blocked: 0,
};

const statusToKeyMap: Record<string, keyof CustomerStats> = {
  'ACTIVE': 'active',
  'INACTIVE': 'inactive',
  'VIP': 'vip',
  'BLOCKED': 'blocked',
};

export const useCustomerStatsStore = create<CustomerStatsState>()(
  devtools(
    (set, get) => ({
      stats: null,
      isLoading: false,
      lastUpdated: null,

      setStats: (stats: CustomerStats) => {
        set({ stats, lastUpdated: Date.now() });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      updateCount: (status: keyof CustomerStats, change: number) => {
        const currentStats = get().stats;
        if (!currentStats) {
          // If stats don't exist, initialize with the change
          const newStats = { ...initialStats };
          if (status !== 'total') {
            newStats[status] = Math.max(0, change);
            newStats.total = Math.max(0, change);
          } else {
            newStats.total = Math.max(0, change);
          }
          set({ stats: newStats });
        } else {
          set({
            stats: {
              ...currentStats,
              [status]: Math.max(0, (currentStats[status] || 0) + change),
              total: Math.max(0, currentStats.total + change),
            },
          });
        }
      },

      incrementStatus: (status: 'ACTIVE' | 'INACTIVE' | 'VIP' | 'BLOCKED') => {
        const key = statusToKeyMap[status];
        if (key) {
          get().updateCount(key, 1);
        }
      },

      decrementStatus: (status: 'ACTIVE' | 'INACTIVE' | 'VIP' | 'BLOCKED') => {
        const key = statusToKeyMap[status];
        if (key) {
          get().updateCount(key, -1);
        }
      },

      reset: () => {
        set({ stats: null, lastUpdated: null, isLoading: false });
      },
    }),
    {
      name: 'customer-stats-store',
    }
  )
);
