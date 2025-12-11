import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  quoted: number;
  converted: number;
  rejected: number;
}

interface LeadStatsState {
  stats: LeadStats | null;
  isLoading: boolean;
  lastUpdated: number | null;
  setStats: (stats: LeadStats) => void;
  setLoading: (loading: boolean) => void;
  updateCount: (status: keyof LeadStats, change: number) => void;
  incrementStatus: (status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'REJECTED') => void;
  decrementStatus: (status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'REJECTED') => void;
  reset: () => void;
}

const initialStats: LeadStats = {
  total: 0,
  new: 0,
  contacted: 0,
  quoted: 0,
  converted: 0,
  rejected: 0,
};

const statusToKeyMap: Record<string, keyof LeadStats> = {
  'NEW': 'new',
  'CONTACTED': 'contacted',
  'QUOTED': 'quoted',
  'CONVERTED': 'converted',
  'REJECTED': 'rejected',
};

export const useLeadStatsStore = create<LeadStatsState>()(
  devtools(
    (set, get) => ({
      stats: null,
      isLoading: false,
      lastUpdated: null,

      setStats: (stats: LeadStats) => {
        set({ stats, lastUpdated: Date.now() });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      updateCount: (status: keyof LeadStats, change: number) => {
        const currentStats = get().stats || initialStats;
        set({
          stats: {
            ...currentStats,
            [status]: Math.max(0, (currentStats[status] || 0) + change),
            total: Math.max(0, currentStats.total + change),
          },
        });
      },

      incrementStatus: (status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'REJECTED') => {
        const key = statusToKeyMap[status];
        if (key) {
          get().updateCount(key, 1);
        }
      },

      decrementStatus: (status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'REJECTED') => {
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
      name: 'lead-stats-store',
    }
  )
);
