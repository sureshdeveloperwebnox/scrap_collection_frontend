'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './auth-provider';
import { GoogleMapsProvider } from './google-maps-provider';
import { LoadingProvider } from './loading-provider';
import { LazyMotion, domAnimation } from 'framer-motion';
import { useState } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '569647250637-hjfil6urujje9gu70j65clao3kubtrmj.apps.googleusercontent.com';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        networkMode: 'online',
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <GoogleMapsProvider>
          <AuthProvider>
            <LoadingProvider>
              <LazyMotion features={domAnimation}>
                {children}
              </LazyMotion>
            </LoadingProvider>
          </AuthProvider>
        </GoogleMapsProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
} 