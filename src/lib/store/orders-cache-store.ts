import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Order } from '@/types';

interface OrdersCacheState {
  // Cache for paginated orders data
  cachedPages: Record<string, {
    orders: Order[];
    pagination: any;
    timestamp: number;
  }>;

  // Cache TTL in milliseconds (5 minutes)
  cacheTTL: number;

  // Get cached data for a specific query
  getCachedData: (queryKey: string) => { orders: Order[]; pagination: any } | null;

  // Set cached data for a specific query
  setCachedData: (queryKey: string, orders: Order[], pagination: any) => void;

  // Invalidate cache for a specific query or all queries
  invalidateCache: (queryKey?: string) => void;

  // Clear all cache
  clearCache: () => void;

  // Update a single order in all cached pages
  updateOrderInCache: (orderId: string, updatedOrder: Partial<Order>) => void;

  // Remove an order from all cached pages
  removeOrderFromCache: (orderId: string) => void;

  // Add a new order to all relevant cached pages (optimistic update)
  addOrderToCache: (newOrder: Order, queryKey?: string) => void;
}

export const useOrdersCacheStore = create<OrdersCacheState>()(
  devtools(
    persist(
      (set, get) => ({
        cachedPages: {},
        cacheTTL: 5 * 60 * 1000, // 5 minutes

        getCachedData: (queryKey: string) => {
          const state = get();
          const cached = state.cachedPages[queryKey];

          if (!cached) return null;

          // Check if cache is still valid
          const now = Date.now();
          if (now - cached.timestamp > state.cacheTTL) {
            return null;
          }

          return {
            orders: cached.orders,
            pagination: cached.pagination,
          };
        },

        setCachedData: (queryKey: string, orders: Order[], pagination: any) => {
          set((state) => ({
            cachedPages: {
              ...state.cachedPages,
              [queryKey]: {
                orders,
                pagination,
                timestamp: Date.now(),
              },
            },
          }));
        },

        invalidateCache: (queryKey?: string) => {
          if (queryKey) {
            set((state) => {
              const newCachedPages = { ...state.cachedPages };
              delete newCachedPages[queryKey];
              return { cachedPages: newCachedPages };
            });
          } else {
            set({ cachedPages: {} });
          }
        },

        clearCache: () => {
          set({ cachedPages: {} });
        },

        updateOrderInCache: (orderId: string, updatedOrder: Partial<Order>) => {
          set((state) => {
            const newCachedPages = { ...state.cachedPages };

            Object.keys(newCachedPages).forEach((key) => {
              const cached = newCachedPages[key];
              const orderIndex = cached.orders.findIndex((o) => o.id === orderId);

              if (orderIndex !== -1) {
                newCachedPages[key] = {
                  ...cached,
                  orders: cached.orders.map((order, index) =>
                    index === orderIndex ? { ...order, ...updatedOrder } : order
                  ),
                };
              }
            });

            return { cachedPages: newCachedPages };
          });
        },

        removeOrderFromCache: (orderId: string) => {
          set((state) => {
            const newCachedPages = { ...state.cachedPages };

            Object.keys(newCachedPages).forEach((key) => {
              const cached = newCachedPages[key];
              newCachedPages[key] = {
                ...cached,
                orders: cached.orders.filter((order) => order.id !== orderId),
                pagination: {
                  ...cached.pagination,
                  total: Math.max(0, cached.pagination.total - 1),
                },
              };
            });

            return { cachedPages: newCachedPages };
          });
        },

        addOrderToCache: (newOrder: Order, queryKey?: string) => {
          set((state) => {
            const newCachedPages = { ...state.cachedPages };

            if (queryKey) {
              // Add to specific cache entry
              const cached = newCachedPages[queryKey];
              if (cached) {
                // Check if order already exists
                const exists = cached.orders.some(o => o.id === newOrder.id);
                if (!exists) {
                  newCachedPages[queryKey] = {
                    ...cached,
                    orders: [newOrder, ...cached.orders], // Add to beginning
                    pagination: {
                      ...cached.pagination,
                      total: cached.pagination.total + 1,
                    },
                  };
                }
              }
            } else {
              // Add to all cache entries that match the order's status
              Object.keys(newCachedPages).forEach((key) => {
                const cached = newCachedPages[key];
                const shouldInclude = true; // For now, add to all caches for instant visibility
                const exists = cached.orders.some(o => o.id === newOrder.id);

                if (shouldInclude && !exists) {
                  newCachedPages[key] = {
                    ...cached,
                    orders: [newOrder, ...cached.orders], // Add to beginning
                    pagination: {
                      ...cached.pagination,
                      total: cached.pagination.total + 1,
                    },
                  };
                }
              });
            }

            return { cachedPages: newCachedPages };
          });
        },
      }),
      {
        name: 'orders-cache-store',
        // Only persist cache, not TTL
        partialize: (state) => ({ cachedPages: state.cachedPages }),
      }
    ),
    {
      name: 'orders-cache-store',
    }
  )
);
