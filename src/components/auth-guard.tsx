'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/signin' 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isLoading) {
      if (requireAuth && !isAuthenticated) {
        // Redirect to login if authentication is required but user is not authenticated
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        // Redirect to dashboard if user is authenticated but shouldn't be on this page (e.g., login page)
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router, isClient]);

  // Render children immediately without any loading states
  return <>{children}</>;
} 