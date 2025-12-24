'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check authentication state and redirect accordingly
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth/signin');
    }
  }, [router, isAuthenticated]);

  // Return null to avoid any rendering
  return null;
}