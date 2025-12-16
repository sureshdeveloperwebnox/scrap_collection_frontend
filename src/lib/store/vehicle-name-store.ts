import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { VehicleName } from '@/types';

interface VehicleNameState {
    // We can optionally store data here, but usually TanStack Query handles the "list".
    // Storing "selected" is good.
    selectedVehicleName: VehicleName | null;
    filters: {
        search: string;
        isActive: boolean | undefined; // Using undefined for 'All' to match common patterns
        page: number;
        limit: number;
        sortBy: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
        sortOrder: 'asc' | 'desc';
        vehicleTypeId?: number;
    };
    setSelectedVehicleName: (vehicleName: VehicleName | null) => void;
    setSearch: (search: string) => void;
    setIsActiveFilter: (isActive: boolean | undefined) => void;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSortBy: (sortBy: 'name' | 'isActive' | 'createdAt' | 'updatedAt') => void;
    setSortOrder: (sortOrder: 'asc' | 'desc') => void;
    setVehicleTypeId: (vehicleTypeId: number | undefined) => void;
    resetFilters: () => void;
}

const initialFilters = {
    search: '',
    isActive: undefined,
    page: 1,
    limit: 10,
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
    vehicleTypeId: undefined,
};

export const useVehicleNameStore = create<VehicleNameState>()(
    devtools(
        (set) => ({
            selectedVehicleName: null,
            filters: { ...initialFilters },

            setSelectedVehicleName: (selectedVehicleName) => {
                set({ selectedVehicleName });
            },

            setSearch: (search) => {
                set((state) => ({
                    filters: { ...state.filters, search, page: 1 },
                }));
            },

            setIsActiveFilter: (isActive) => {
                set((state) => ({
                    filters: { ...state.filters, isActive, page: 1 },
                }));
            },

            setPage: (page) => {
                set((state) => ({
                    filters: { ...state.filters, page },
                }));
            },

            setLimit: (limit) => {
                set((state) => ({
                    filters: { ...state.filters, limit, page: 1 },
                }));
            },

            setSortBy: (sortBy) => {
                set((state) => ({
                    filters: { ...state.filters, sortBy },
                }));
            },

            setSortOrder: (sortOrder) => {
                set((state) => ({
                    filters: { ...state.filters, sortOrder },
                }));
            },

            setVehicleTypeId: (vehicleTypeId) => {
                set((state) => ({
                    filters: { ...state.filters, vehicleTypeId, page: 1 },
                }));
            },

            resetFilters: () => {
                set({
                    filters: { ...initialFilters },
                });
            },
        }),
        {
            name: 'vehicle-name-store',
        }
    )
);
