import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ScrapCategoryDto, ScrapNameDto } from '@/lib/api/scrap';

interface CategoryCache {
    data: ScrapCategoryDto[];
    total: number;
    timestamp: number;
}

interface NameCache {
    data: ScrapNameDto[];
    total: number;
    timestamp: number;
}

interface ScrapState {
    // UI State
    activeTab: 'categories' | 'names';

    // Categories State
    categorySearch: string;
    categoryPage: number;
    categoryLimit: number;
    categoryStatusFilter: 'all' | 'active' | 'inactive';

    // Names State
    nameSearch: string;
    namePage: number;
    nameLimit: number;
    nameStatusFilter: 'all' | 'active' | 'inactive';
    selectedCategoryId: string | 'all';

    // Cache
    categoryCache: Map<string, CategoryCache>;
    nameCache: Map<string, NameCache>;
    cacheTTL: number; // 5 minutes in milliseconds

    // Actions
    setActiveTab: (tab: 'categories' | 'names') => void;

    // Category Actions
    setCategorySearch: (search: string) => void;
    setCategoryPage: (page: number) => void;
    setCategoryLimit: (limit: number) => void;
    setCategoryStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;

    // Name Actions
    setNameSearch: (search: string) => void;
    setNamePage: (page: number) => void;
    setNameLimit: (limit: number) => void;
    setNameStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;
    setSelectedCategoryId: (id: string | 'all') => void;

    // Cache Actions
    getCachedCategories: (key: string) => CategoryCache | null;
    setCachedCategories: (key: string, data: CategoryCache) => void;
    getCachedNames: (key: string) => NameCache | null;
    setCachedNames: (key: string, data: NameCache) => void;
    invalidateCategoryCache: () => void;
    invalidateNameCache: () => void;

    // Optimistic Updates
    updateCategoryInCache: (id: string, updates: Partial<ScrapCategoryDto>) => void;
    removeCategoryFromCache: (id: string) => void;
    addCategoryToCache: (category: ScrapCategoryDto) => void;

    updateNameInCache: (id: string, updates: Partial<ScrapNameDto>) => void;
    removeNameFromCache: (id: string) => void;
    addNameToCache: (name: ScrapNameDto) => void;
}

export const useScrapStore = create<ScrapState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial UI State
                activeTab: 'categories',

                // Initial Categories State
                categorySearch: '',
                categoryPage: 1,
                categoryLimit: 10,
                categoryStatusFilter: 'all',

                // Initial Names State
                nameSearch: '',
                namePage: 1,
                nameLimit: 10,
                nameStatusFilter: 'all',
                selectedCategoryId: 'all',

                // Initial Cache
                categoryCache: new Map(),
                nameCache: new Map(),
                cacheTTL: 5 * 60 * 1000, // 5 minutes

                // UI Actions
                setActiveTab: (tab) => set({ activeTab: tab }),

                // Category Actions
                setCategorySearch: (search) => set({ categorySearch: search, categoryPage: 1 }),
                setCategoryPage: (page) => set({ categoryPage: page }),
                setCategoryLimit: (limit) => set({ categoryLimit: limit, categoryPage: 1 }),
                setCategoryStatusFilter: (filter) => set({ categoryStatusFilter: filter, categoryPage: 1 }),

                // Name Actions
                setNameSearch: (search) => set({ nameSearch: search, namePage: 1 }),
                setNamePage: (page) => set({ namePage: page }),
                setNameLimit: (limit) => set({ nameLimit: limit, namePage: 1 }),
                setNameStatusFilter: (filter) => set({ nameStatusFilter: filter, namePage: 1 }),
                setSelectedCategoryId: (id) => set({ selectedCategoryId: id, namePage: 1 }),

                // Cache Actions
                getCachedCategories: (key) => {
                    const cache = get().categoryCache.get(key);
                    if (!cache) return null;

                    const now = Date.now();
                    if (now - cache.timestamp > get().cacheTTL) {
                        // Cache expired
                        const newCache = new Map(get().categoryCache);
                        newCache.delete(key);
                        set({ categoryCache: newCache });
                        return null;
                    }

                    return cache;
                },

                setCachedCategories: (key, data) => {
                    const newCache = new Map(get().categoryCache);
                    newCache.set(key, data);
                    set({ categoryCache: newCache });
                },

                getCachedNames: (key) => {
                    const cache = get().nameCache.get(key);
                    if (!cache) return null;

                    const now = Date.now();
                    if (now - cache.timestamp > get().cacheTTL) {
                        // Cache expired
                        const newCache = new Map(get().nameCache);
                        newCache.delete(key);
                        set({ nameCache: newCache });
                        return null;
                    }

                    return cache;
                },

                setCachedNames: (key, data) => {
                    const newCache = new Map(get().nameCache);
                    newCache.set(key, data);
                    set({ nameCache: newCache });
                },

                invalidateCategoryCache: () => set({ categoryCache: new Map() }),
                invalidateNameCache: () => set({ nameCache: new Map() }),

                // Optimistic Updates for Categories
                updateCategoryInCache: (id, updates) => {
                    const newCache = new Map(get().categoryCache);
                    newCache.forEach((cache, key) => {
                        const updatedData = cache.data.map((cat) =>
                            cat.id === id ? { ...cat, ...updates } : cat
                        );
                        newCache.set(key, { ...cache, data: updatedData });
                    });
                    set({ categoryCache: newCache });
                },

                removeCategoryFromCache: (id) => {
                    const newCache = new Map(get().categoryCache);
                    newCache.forEach((cache, key) => {
                        const filteredData = cache.data.filter((cat) => cat.id !== id);
                        newCache.set(key, {
                            ...cache,
                            data: filteredData,
                            total: cache.total - 1,
                        });
                    });
                    set({ categoryCache: newCache });
                },

                addCategoryToCache: (category) => {
                    const newCache = new Map(get().categoryCache);
                    newCache.forEach((cache, key) => {
                        // Add to the beginning of the list
                        const updatedData = [category, ...cache.data];
                        newCache.set(key, {
                            ...cache,
                            data: updatedData,
                            total: cache.total + 1,
                        });
                    });
                    set({ categoryCache: newCache });
                },

                // Optimistic Updates for Names
                updateNameInCache: (id, updates) => {
                    const newCache = new Map(get().nameCache);
                    newCache.forEach((cache, key) => {
                        const updatedData = cache.data.map((name) =>
                            name.id === id ? { ...name, ...updates } : name
                        );
                        newCache.set(key, { ...cache, data: updatedData });
                    });
                    set({ nameCache: newCache });
                },

                removeNameFromCache: (id) => {
                    const newCache = new Map(get().nameCache);
                    newCache.forEach((cache, key) => {
                        const filteredData = cache.data.filter((name) => name.id !== id);
                        newCache.set(key, {
                            ...cache,
                            data: filteredData,
                            total: cache.total - 1,
                        });
                    });
                    set({ nameCache: newCache });
                },

                addNameToCache: (name) => {
                    const newCache = new Map(get().nameCache);
                    newCache.forEach((cache, key) => {
                        // Add to the beginning of the list
                        const updatedData = [name, ...cache.data];
                        newCache.set(key, {
                            ...cache,
                            data: updatedData,
                            total: cache.total + 1,
                        });
                    });
                    set({ nameCache: newCache });
                },
            }),
            {
                name: 'scrap-store',
                partialize: (state) => ({
                    // Only persist UI state, not cache
                    activeTab: state.activeTab,
                    categoryLimit: state.categoryLimit,
                    nameLimit: state.nameLimit,
                }),
            }
        ),
        { name: 'ScrapStore' }
    )
);
