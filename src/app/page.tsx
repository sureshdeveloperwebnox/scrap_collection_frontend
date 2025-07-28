'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    
    if (token) {
      // If authenticated, redirect to dashboard
      router.replace('/dashboard');
    } else {
      // If not authenticated, redirect to signin
      router.replace('/auth/signin');
    }
  }, [router]);

  // Show loading spinner while redirecting
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}