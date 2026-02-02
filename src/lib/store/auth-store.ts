import { create } from 'zustand';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  profileImg?: string;
  role: string;
  organizationId?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  login: (user: User, accessToken?: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  setAccessToken: (token: string | null) => void;
  restoreSession: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  login: (user: User, accessToken?: string) => {
    const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    set({
      user: { ...user, name },
      accessToken: accessToken ?? get().accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setAccessToken: (token: string | null) => {
    set({ accessToken: token });
  },

  updateUser: (userData) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: { ...currentUser, ...userData },
      });
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setHydrated: (hydrated: boolean) => {
    set({ isHydrated: hydrated });
  },

  restoreSession: (user: User) => {
    // Construct name from firstName and lastName if not provided
    const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    set({
      user: { ...user, name },
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