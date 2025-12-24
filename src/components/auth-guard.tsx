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
  const { isAuthenticated, isLoading, isHydrated } = useAuthStore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && isHydrated && !isLoading) {
      if (requireAuth && !isAuthenticated) {
        // Redirect to login if authentication is required but user is not authenticated
        router.push(redirectTo);
      } else if (!requireAuth && isAuthenticated) {
        // Redirect to dashboard if user is authenticated but shouldn't be on this page (e.g., login page)
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, isHydrated, requireAuth, redirectTo, router, isClient]);

  // Don't render protected content until we've checked authentication
  if (requireAuth && (!isClient || !isHydrated || isLoading || !isAuthenticated)) {
    return null;
  }

  // Render children (either a guest page or authenticated content)
  return <>{children}</>;
} 