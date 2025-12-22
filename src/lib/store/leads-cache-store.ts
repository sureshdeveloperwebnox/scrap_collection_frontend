import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Lead } from '@/types';

interface LeadsCacheState {
  // Cache for paginated leads data
  cachedPages: Record<string, {
    leads: Lead[];
    pagination: any;
    timestamp: number;
  }>;

  // Cache TTL in milliseconds (5 minutes)
  cacheTTL: number;

  // Get cached data for a specific query
  getCachedData: (queryKey: string) => { leads: Lead[]; pagination: any } | null;

  // Set cached data for a specific query
  setCachedData: (queryKey: string, leads: Lead[], pagination: any) => void;

  // Invalidate cache for a specific query or all queries
  invalidateCache: (queryKey?: string) => void;

  // Clear all cache
  clearCache: () => void;

  // Update a single lead in all cached pages
  updateLeadInCache: (leadId: string, updatedLead: Partial<Lead>) => void;

  // Remove a lead from all cached pages
  removeLeadFromCache: (leadId: string) => void;
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

export const useLeadsCacheStore = create<LeadsCacheState>()(
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
            leads: cached.leads,
            pagination: cached.pagination,
          };
        },

        setCachedData: (queryKey: string, leads: Lead[], pagination: any) => {
          set((state) => ({
            cachedPages: {
              ...state.cachedPages,
              [queryKey]: {
                leads,
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

        updateLeadInCache: (leadId: string, updatedLead: Partial<Lead>) => {
          set((state) => {
            const newCachedPages = { ...state.cachedPages };

            Object.keys(newCachedPages).forEach((key) => {
              const cached = newCachedPages[key];
              const leadIndex = cached.leads.findIndex((l) => l.id === leadId);

              if (leadIndex !== -1) {
                newCachedPages[key] = {
                  ...cached,
                  leads: cached.leads.map((lead, index) =>
                    index === leadIndex ? { ...lead, ...updatedLead } : lead
                  ),
                };
              }
            });

            return { cachedPages: newCachedPages };
          });
        },

        removeLeadFromCache: (leadId: string) => {
          set((state) => {
            const newCachedPages = { ...state.cachedPages };

            Object.keys(newCachedPages).forEach((key) => {
              const cached = newCachedPages[key];
              newCachedPages[key] = {
                ...cached,
                leads: cached.leads.filter((lead) => lead.id !== leadId),
                pagination: {
                  ...cached.pagination,
                  total: Math.max(0, cached.pagination.total - 1),
                },
              };
            });

            return { cachedPages: newCachedPages };
          });
        },
      }),
      {
        name: 'leads-cache-store',
        // Only persist cache, not TTL
        partialize: (state) => ({ cachedPages: state.cachedPages }),
      }
    ),
    {
      name: 'leads-cache-store',
    }
  )
);
