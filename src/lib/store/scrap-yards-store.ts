import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ScrapYard } from '@/types';

interface ScrapYardsState {
    // Cache for paginated scrap yards data
    cachedPages: Record<string, {
        scrapYards: ScrapYard[];
        pagination: any;
        timestamp: number;
    }>;

    // Cache TTL in milliseconds (5 minutes)
    cacheTTL: number;

    // Active tab state
    activeTab: 'All' | 'Active' | 'Inactive';
    setActiveTab: (tab: 'All' | 'Active' | 'Inactive') => void;

    // Search state
    searchTerm: string;
    setSearchTerm: (term: string) => void;

    // Pagination state
    page: number;
    setPage: (page: number) => void;

    limit: number;
    setLimit: (limit: number) => void;

    // Get cached data for a specific query
    getCachedData: (queryKey: string) => { scrapYards: ScrapYard[]; pagination: any } | null;

    // Set cached data for a specific query
    setCachedData: (queryKey: string, scrapYards: ScrapYard[], pagination: any) => void;

    // Invalidate cache for a specific query or all queries
    invalidateCache: (queryKey?: string) => void;

    // Clear all cache
    clearCache: () => void;

    // Update a single scrap yard in all cached pages
    updateScrapYardInCache: (scrapYardId: string, updatedScrapYard: Partial<ScrapYard>) => void;

    // Remove a scrap yard from all cached pages
    removeScrapYardFromCache: (scrapYardId: string) => void;

    // Add a new scrap yard to all relevant cached pages (optimistic update)
    addScrapYardToCache: (newScrapYard: ScrapYard, queryKey?: string) => void;

    // Reset pagination when filters change
    resetPagination: () => void;
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

export const useScrapYardsStore = create<ScrapYardsState>()(
    devtools(
        persist(
            (set, get) => ({
                cachedPages: {},
                cacheTTL: 5 * 60 * 1000, // 5 minutes
                activeTab: 'All',
                searchTerm: '',
                page: 1,
                limit: 10,

                setActiveTab: (tab) => {
                    set({ activeTab: tab, page: 1 });
                },

                setSearchTerm: (term) => {
                    set({ searchTerm: term, page: 1 });
                },

                setPage: (page) => {
                    set({ page });
                },

                setLimit: (limit) => {
                    set({ limit, page: 1 });
                },

                resetPagination: () => {
                    set({ page: 1 });
                },

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
                        scrapYards: cached.scrapYards,
                        pagination: cached.pagination,
                    };
                },

                setCachedData: (queryKey: string, scrapYards: ScrapYard[], pagination: any) => {
                    set((state) => ({
                        cachedPages: {
                            ...state.cachedPages,
                            [queryKey]: {
                                scrapYards,
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

                updateScrapYardInCache: (scrapYardId: string, updatedScrapYard: Partial<ScrapYard>) => {
                    set((state) => {
                        const newCachedPages = { ...state.cachedPages };

                        Object.keys(newCachedPages).forEach((key) => {
                            const cached = newCachedPages[key];
                            const scrapYardIndex = cached.scrapYards.findIndex((sy) => sy.id === scrapYardId);

                            if (scrapYardIndex !== -1) {
                                newCachedPages[key] = {
                                    ...cached,
                                    scrapYards: cached.scrapYards.map((scrapYard, index) =>
                                        index === scrapYardIndex ? { ...scrapYard, ...updatedScrapYard } : scrapYard
                                    ),
                                };
                            }
                        });

                        return { cachedPages: newCachedPages };
                    });
                },

                removeScrapYardFromCache: (scrapYardId: string) => {
                    set((state) => {
                        const newCachedPages = { ...state.cachedPages };

                        Object.keys(newCachedPages).forEach((key) => {
                            const cached = newCachedPages[key];
                            newCachedPages[key] = {
                                ...cached,
                                scrapYards: cached.scrapYards.filter((scrapYard) => scrapYard.id !== scrapYardId),
                                pagination: {
                                    ...cached.pagination,
                                    total: Math.max(0, cached.pagination.total - 1),
                                },
                            };
                        });

                        return { cachedPages: newCachedPages };
                    });
                },

                addScrapYardToCache: (newScrapYard: ScrapYard, queryKey?: string) => {
                    set((state) => {
                        const newCachedPages = { ...state.cachedPages };

                        if (queryKey) {
                            // Add to specific cache entry
                            const cached = newCachedPages[queryKey];
                            if (cached) {
                                // Check if scrap yard already exists
                                const exists = cached.scrapYards.some(sy => sy.id === newScrapYard.id);
                                if (!exists) {
                                    newCachedPages[queryKey] = {
                                        ...cached,
                                        scrapYards: [newScrapYard, ...cached.scrapYards], // Add to beginning
                                        pagination: {
                                            ...cached.pagination,
                                            total: cached.pagination.total + 1,
                                        },
                                    };
                                }
                            }
                        } else {
                            // Add to all cache entries that match the scrap yard's status
                            Object.keys(newCachedPages).forEach((key) => {
                                const cached = newCachedPages[key];
                                const shouldInclude = true; // For now, add to all caches for instant visibility
                                const exists = cached.scrapYards.some(sy => sy.id === newScrapYard.id);

                                if (shouldInclude && !exists) {
                                    newCachedPages[key] = {
                                        ...cached,
                                        scrapYards: [newScrapYard, ...cached.scrapYards], // Add to beginning
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
                name: 'scrap-yards-store',
                // Only persist UI state, not cache
                partialize: (state) => ({
                    activeTab: state.activeTab,
                    limit: state.limit,
                }),
            }
        ),
        {
            name: 'scrap-yards-store',
        }
    )
);
