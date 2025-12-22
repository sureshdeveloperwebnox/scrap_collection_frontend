'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initializeFromStorage = useAuthStore((state) => state.initializeFromStorage);

  // Initialize authentication state from localStorage
  useEffect(() => {
    // Quick initialization without blocking
    const initAuth = () => {
      try {
        initializeFromStorage();
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    };

    // Use requestIdleCallback for non-blocking initialization
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(initAuth);
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(initAuth, 0);
    }
  }, [initializeFromStorage]);

  // Render children immediately without any loading state
  return <>{children}</>;
} 