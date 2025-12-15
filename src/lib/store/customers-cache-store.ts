import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Customer } from '@/types';

interface CustomersCacheState {
  // Cache for paginated customers data
  cachedPages: Record<string, {
    customers: Customer[];
    pagination: any;
    timestamp: number;
  }>;
  
  // Cache TTL in milliseconds (5 minutes)
  cacheTTL: number;
  
  // Get cached data for a specific query
  getCachedData: (queryKey: string) => { customers: Customer[]; pagination: any } | null;
  
  // Set cached data for a specific query
  setCachedData: (queryKey: string, customers: Customer[], pagination: any) => void;
  
  // Invalidate cache for a specific query or all queries
  invalidateCache: (queryKey?: string) => void;
  
  // Clear all cache
  clearCache: () => void;
  
  // Update a single customer in all cached pages
  updateCustomerInCache: (customerId: string, updatedCustomer: Partial<Customer>) => void;
  
  // Remove a customer from all cached pages
  removeCustomerFromCache: (customerId: string) => void;
  
  // Add a new customer to all relevant cached pages (optimistic update)
  addCustomerToCache: (newCustomer: Customer, queryKey?: string) => void;
}

const generateQueryKey = (params: Record<string, any>): string => {
  // Sort keys to ensure consistent key generation
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        acc[key] = params[key];
      }
      return acc;
    }, {} as Record<string, any>);
  
  return JSON.stringify(sortedParams);
};

export const useCustomersCacheStore = create<CustomersCacheState>()(
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
            // Cache expired, remove it
            set((state) => {
              const newCachedPages = { ...state.cachedPages };
              delete newCachedPages[queryKey];
              return { cachedPages: newCachedPages };
            });
            return null;
          }
          
          return {
            customers: cached.customers,
            pagination: cached.pagination,
          };
        },

        setCachedData: (queryKey: string, customers: Customer[], pagination: any) => {
          set((state) => ({
            cachedPages: {
              ...state.cachedPages,
              [queryKey]: {
                customers,
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

        updateCustomerInCache: (customerId: string, updatedCustomer: Partial<Customer>) => {
          set((state) => {
            const newCachedPages = { ...state.cachedPages };
            
            Object.keys(newCachedPages).forEach((key) => {
              const cached = newCachedPages[key];
              const customerIndex = cached.customers.findIndex((c) => c.id === customerId);
              
              if (customerIndex !== -1) {
                newCachedPages[key] = {
                  ...cached,
                  customers: cached.customers.map((customer, index) =>
                    index === customerIndex ? { ...customer, ...updatedCustomer } : customer
                  ),
                };
              }
            });
            
            return { cachedPages: newCachedPages };
          });
        },

        removeCustomerFromCache: (customerId: string) => {
          set((state) => {
            const newCachedPages = { ...state.cachedPages };
            
            Object.keys(newCachedPages).forEach((key) => {
              const cached = newCachedPages[key];
              newCachedPages[key] = {
                ...cached,
                customers: cached.customers.filter((customer) => customer.id !== customerId),
                pagination: {
                  ...cached.pagination,
                  total: Math.max(0, cached.pagination.total - 1),
                },
              };
            });
            
            return { cachedPages: newCachedPages };
          });
        },

        addCustomerToCache: (newCustomer: Customer, queryKey?: string) => {
          set((state) => {
            const newCachedPages = { ...state.cachedPages };
            
            if (queryKey) {
              // Add to specific cache entry
              const cached = newCachedPages[queryKey];
              if (cached) {
                // Check if customer already exists
                const exists = cached.customers.some(c => c.id === newCustomer.id);
                if (!exists) {
                  newCachedPages[queryKey] = {
                    ...cached,
                    customers: [newCustomer, ...cached.customers], // Add to beginning
                    pagination: {
                      ...cached.pagination,
                      total: cached.pagination.total + 1,
                    },
                  };
                }
              }
            } else {
              // Add to all cache entries that match the customer's status
              Object.keys(newCachedPages).forEach((key) => {
                const cached = newCachedPages[key];
                // Check if this cache entry should include this customer
                // (e.g., if it's "All" tab or matches the customer's status)
                const shouldInclude = true; // For now, add to all caches for instant visibility
                const exists = cached.customers.some(c => c.id === newCustomer.id);
                
                if (shouldInclude && !exists) {
                  newCachedPages[key] = {
                    ...cached,
                    customers: [newCustomer, ...cached.customers], // Add to beginning
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
        name: 'customers-cache-store',
        // Only persist cache, not TTL
        partialize: (state) => ({ cachedPages: state.cachedPages }),
      }
    ),
    {
      name: 'customers-cache-store',
    }
  )
);
