import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  restoreSession: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  login: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    set({
      user: null,
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

  restoreSession: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      isHydrated: true,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    // This will be called to verify the cookie-based session
    // The actual auth check will be done via API call
    set({ isHydrated: true });
  },
}));