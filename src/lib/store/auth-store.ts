import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  initializeFromStorage: () => void;
}

// Custom storage for SSR safety
const createSafeStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      
      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },
      
      initializeFromStorage: () => {
        try {
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('auth-storage');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.state) {
                set({
                  user: parsed.state.user,
                  token: parsed.state.token,
                  isAuthenticated: parsed.state.isAuthenticated,
                  isHydrated: true,
                });
                return;
              }
            }
          }
          set({ isHydrated: true });
        } catch (error) {
          console.error('Error initializing auth from storage:', error);
          set({ isHydrated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => createSafeStorage()),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
      // Skip hydration on server side
      skipHydration: typeof window === 'undefined',
    }
  )
); 