'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useAuthInit } from '@/hooks/use-auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initializeFromStorage, isHydrated } = useAuthStore();
  
  // Initialize authentication state from localStorage
  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  // Show loading while initializing
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return <>{children}</>;
} 