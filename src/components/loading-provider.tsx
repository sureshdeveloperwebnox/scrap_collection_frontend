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
  const setAuthLoading = useLoadingStore((state) => state.setAuthLoading);
  const setHydrating = useLoadingStore((state) => state.setHydrating);
  const authLoadingInProgress = useAuthStore((state) => state.isLoading);
  const isHydratedInProgress = useAuthStore((state) => state.isHydrated);

  // Sync Auth Loading
  useEffect(() => {
    setAuthLoading(authLoadingInProgress);
  }, [authLoadingInProgress, setAuthLoading]);

  // Sync Hydration
  useEffect(() => {
    setHydrating(!isHydratedInProgress);
  }, [isHydratedInProgress, setHydrating]);

  return <>{children}</>;
}
