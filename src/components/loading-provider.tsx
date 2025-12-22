'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient, useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useLoadingStore } from '@/lib/store/loading-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { usePathname } from 'next/navigation';

/**
 * LoadingProvider - Manages global loading state based on:
 * - React Query fetching states (using optimized hooks)
 * - Auth loading states
 * - Route transitions
 */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const setLoading = useLoadingStore((state) => state.setLoading);
  const authLoading = useAuthStore((state) => state.isLoading);
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const [isRouteChanging, setIsRouteChanging] = useState(false);

  // Use React Query's optimized hooks for fetching/mutating states
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  // Track route changes for loading indication
  useEffect(() => {
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
      // Route changed - set loading state
      setIsRouteChanging(true);
      setLoading(true);

      const timer = setTimeout(() => {
        setIsRouteChanging(false);
        // Check if queries are still loading after route change
        const hasAnyLoading = authLoading || isFetching > 0 || isMutating > 0;
        if (!hasAnyLoading) {
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, authLoading, isFetching, isMutating, setLoading]);

  // Update loading state based on all conditions (debounced for performance)
  useEffect(() => {
    const hasAnyLoading = authLoading || isFetching > 0 || isMutating > 0 || isRouteChanging;

    // Use a small delay to batch rapid state changes
    const timer = setTimeout(() => {
      setLoading(hasAnyLoading);
    }, 50);

    return () => clearTimeout(timer);
  }, [authLoading, isFetching, isMutating, isRouteChanging, setLoading]);

  return <>{children}</>;
}
