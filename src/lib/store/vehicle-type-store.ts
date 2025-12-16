import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface VehicleType {
  id: number;
  organizationId?: number;
  name: string;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: {
    name: string;
  };
}

interface VehicleTypeState {
  vehicleTypes: VehicleType[];
  selectedVehicleType: VehicleType | null;
  filters: {
    search: string;
    isActive: boolean | null;
    page: number;
    limit: number;
    sortBy: 'name' | 'isActive' | 'createdAt' | 'updatedAt';
    sortOrder: 'asc' | 'desc';
  };
  setVehicleTypes: (vehicleTypes: VehicleType[]) => void;
  setSelectedVehicleType: (vehicleType: VehicleType | null) => void;
  setSearch: (search: string) => void;
  setIsActiveFilter: (isActive: boolean | null) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSortBy: (sortBy: 'name' | 'isActive' | 'createdAt' | 'updatedAt') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;
}

const initialFilters = {
  search: '',
  isActive: null,
  page: 1,
  limit: 10,
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const,
};

export const useVehicleTypeStore = create<VehicleTypeState>()(
  devtools(
    (set) => ({
      vehicleTypes: [],
      selectedVehicleType: null,
      filters: { ...initialFilters },

      setVehicleTypes: (vehicleTypes) => {
        set({ vehicleTypes });
      },

      setSelectedVehicleType: (selectedVehicleType) => {
        set({ selectedVehicleType });
      },

      setSearch: (search) => {
        set((state) => ({
          filters: { ...state.filters, search, page: 1 }, // Reset to page 1 on search
        }));
      },

      setIsActiveFilter: (isActive) => {
        set((state) => ({
          filters: { ...state.filters, isActive, page: 1 }, // Reset to page 1 on filter change
        }));
      },

      setPage: (page) => {
        set((state) => ({
          filters: { ...state.filters, page },
        }));
      },

      setLimit: (limit) => {
        set((state) => ({
          filters: { ...state.filters, limit, page: 1 }, // Reset to page 1 on limit change
        }));
      },

      setSortBy: (sortBy) => {
        set((state) => ({
          filters: { ...state.filters, sortBy, page: 1 }, // Reset to page 1 on sort change
        }));
      },

      setSortOrder: (sortOrder) => {
        set((state) => ({
          filters: { ...state.filters, sortOrder, page: 1 }, // Reset to page 1 on sort change
        }));
      },

      resetFilters: () => {
        set({
          filters: { ...initialFilters },
        });
      },
    }),
    {
      name: 'vehicle-type-store',
    }
  )
);
