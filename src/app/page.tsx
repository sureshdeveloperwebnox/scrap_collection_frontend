'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Instant redirect without any loading
    if (typeof window !== 'undefined') {
      // Check localStorage directly for immediate response
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          if (parsed?.state?.isAuthenticated) {
            router.push('/dashboard');
            return;
          }
        } catch (error) {
          // If parsing fails, continue to signin
        }
      }
      
      // If no auth data, redirect to signin immediately
      router.push('/auth/signin');
    }
  }, [router]);

  // Return null to avoid any rendering
  return null;
} 