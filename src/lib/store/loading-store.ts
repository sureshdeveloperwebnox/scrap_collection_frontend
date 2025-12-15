import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  loadingCount: number;
  setLoading: (loading: boolean) => void;
  incrementLoading: () => void;
  decrementLoading: () => void;
  resetLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  loadingCount: 0,
  setLoading: (loading: boolean) => {
    set({ isLoading: loading, loadingCount: loading ? 1 : 0 });
  },
  incrementLoading: () => {
    set((state) => ({
      loadingCount: state.loadingCount + 1,
      isLoading: true,
    }));
  },
  decrementLoading: () => {
    set((state) => {
      const newCount = Math.max(0, state.loadingCount - 1);
      return {
        loadingCount: newCount,
        isLoading: newCount > 0,
      };
    });
  },
  resetLoading: () => {
    set({ isLoading: false, loadingCount: 0 });
  },
}));
