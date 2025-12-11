'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from './auth-provider';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '569647250637-hjfil6urujje9gu70j65clao3kubtrmj.apps.googleusercontent.com';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        {children}
      </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
} 