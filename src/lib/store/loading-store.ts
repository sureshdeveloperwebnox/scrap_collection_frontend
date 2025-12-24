import { create } from 'zustand';

interface LoadingState {
  isAuthLoading: boolean;
  isApiLoading: boolean;
  isHydrating: boolean;
  isLoading: boolean; // Computed aggregate

  setAuthLoading: (loading: boolean) => void;
  setApiLoading: (loading: boolean) => void;
  setHydrating: (loading: boolean) => void;

  // For API Interceptors
  loadingCount: number;
  incrementApiLoading: () => void;
  decrementApiLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isAuthLoading: false,
  isApiLoading: false,
  isHydrating: true, // Start as true
  isLoading: true,
  loadingCount: 0,

  setAuthLoading: (loading: boolean) => {
    set((state) => ({
      isAuthLoading: loading,
      isLoading: loading || state.isApiLoading || state.isHydrating
    }));
  },

  setApiLoading: (loading: boolean) => {
    set((state) => ({
      isApiLoading: loading,
      isLoading: state.isAuthLoading || loading || state.isHydrating
    }));
  },

  setHydrating: (loading: boolean) => {
    set((state) => ({
      isHydrating: loading,
      isLoading: state.isAuthLoading || state.isApiLoading || loading
    }));
  },

  incrementApiLoading: () => {
    set((state) => {
      const newCount = state.loadingCount + 1;
      return {
        loadingCount: newCount,
        isApiLoading: true,
        isLoading: true
      };
    });
  },

  decrementApiLoading: () => {
    set((state) => {
      const newCount = Math.max(0, state.loadingCount - 1);
      const isApiLoading = newCount > 0;
      return {
        loadingCount: newCount,
        isApiLoading,
        isLoading: state.isAuthLoading || isApiLoading || state.isHydrating
      };
    });
  }
}));
