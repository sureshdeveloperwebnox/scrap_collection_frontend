'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { authApi } from '@/lib/api/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { login, logout, setHydrated, setLoading } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const checkSession = async () => {
      // Don't set global loading here to avoid flicker if session is already there
      // We rely on the initial state being false
      try {
        const response = await authApi.getMe();
        if (response?.data?.user) {
          login(response.data.user);
        } else {
          logout();
        }
      } catch (error) {
        // Only logout if it's a 401, otherwise might be a network issue
        logout();
      } finally {
        setHydrated(true);
      }
    };

    checkSession();
  }, [login, logout, setHydrated, setLoading]);

  // Render children immediately
  return <>{children}</>;
}