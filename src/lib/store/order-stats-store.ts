import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { OrderStatus, PaymentStatusEnum } from '@/types';

export interface OrderStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  unpaid: number;
  paid: number;
  refunded: number;
}

interface OrderStatsState {
  stats: OrderStats | null;
  isLoading: boolean;
  lastUpdated: number | null;
  setStats: (stats: OrderStats) => void;
  setLoading: (loading: boolean) => void;
  updateCount: (status: keyof OrderStats, change: number) => void;
  incrementStatus: (status: OrderStatus) => void;
  decrementStatus: (status: OrderStatus) => void;
  incrementPaymentStatus: (status: PaymentStatusEnum) => void;
  decrementPaymentStatus: (status: PaymentStatusEnum) => void;
  reset: () => void;
}

const initialStats: OrderStats = {
  total: 0,
  pending: 0,
  assigned: 0,
  inProgress: 0,
  completed: 0,
  cancelled: 0,
  unpaid: 0,
  paid: 0,
  refunded: 0,
};

const statusToKeyMap: Record<OrderStatus, keyof OrderStats> = {
  'PENDING': 'pending',
  'ASSIGNED': 'assigned',
  'IN_PROGRESS': 'inProgress',
  'COMPLETED': 'completed',
  'CANCELLED': 'cancelled',
};

const paymentStatusToKeyMap: Record<PaymentStatusEnum, keyof OrderStats> = {
  'UNPAID': 'unpaid',
  'PAID': 'paid',
  'REFUNDED': 'refunded',
};

export const useOrderStatsStore = create<OrderStatsState>()(
  devtools(
    (set, get) => ({
      stats: null,
      isLoading: false,
      lastUpdated: null,

      setStats: (stats: OrderStats) => {
        set({ stats, lastUpdated: Date.now() });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      updateCount: (status: keyof OrderStats, change: number) => {
        const currentStats = get().stats;
        if (!currentStats) {
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
              total: status !== 'total' ? currentStats.total : Math.max(0, currentStats.total + change),
            },
          });
        }
      },

      incrementStatus: (status: OrderStatus) => {
        const key = statusToKeyMap[status];
        if (key) {
          get().updateCount(key, 1);
        }
      },

      decrementStatus: (status: OrderStatus) => {
        const key = statusToKeyMap[status];
        if (key) {
          get().updateCount(key, -1);
        }
      },

      incrementPaymentStatus: (status: PaymentStatusEnum) => {
        const key = paymentStatusToKeyMap[status];
        if (key) {
          get().updateCount(key, 1);
        }
      },

      decrementPaymentStatus: (status: PaymentStatusEnum) => {
        const key = paymentStatusToKeyMap[status];
        if (key) {
          get().updateCount(key, -1);
        }
      },

      reset: () => {
        set({ stats: null, lastUpdated: null, isLoading: false });
      },
    }),
    {
      name: 'order-stats-store',
    }
  )
);
