'use client';

import { useEffect, useState, memo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useLoadingStore } from '@/lib/store/loading-store';

// Dynamically import Lottie for better performance (code splitting)
const Lottie = dynamic(() => import('lottie-react'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-32 h-32">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface GlobalLoaderProps {
  minDelay?: number; // Minimum display time to prevent flickering
}

function GlobalLoaderComponent({ minDelay = 300 }: GlobalLoaderProps) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [isAnimationLoading, setIsAnimationLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const loaderStartTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isLoading } = useLoadingStore();
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  const [isRouteChanging, setIsRouteChanging] = useState(false);

  // Load animation data once (optimized - cached)
  useEffect(() => {
    let mounted = true;
    
    // Check if animation is already cached in memory
    const cachedAnimation = (window as any).__lottieLoaderCache;
    if (cachedAnimation) {
      if (mounted) {
        setAnimationData(cachedAnimation);
        setIsAnimationLoading(false);
      }
      return;
    }
    
    const loadAnimation = async () => {
      try {
        const response = await fetch('/animation/loader.json');
        if (!response.ok) throw new Error('Failed to load animation');
        const data = await response.json();
        // Cache the animation data
        (window as any).__lottieLoaderCache = data;
        if (mounted) {
          setAnimationData(data);
          setIsAnimationLoading(false);
        }
      } catch (error) {
        console.error('Failed to load loader animation:', error);
        if (mounted) {
          setIsAnimationLoading(false);
        }
      }
    };

    loadAnimation();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Detect route changes (optimized)
  useEffect(() => {
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
      setIsRouteChanging(true);
      const timer = setTimeout(() => setIsRouteChanging(false), 400);
      return () => clearTimeout(timer);
    }
    prevPathnameRef.current = pathname;
  }, [pathname]);

  // Determine if we should show loader
  const shouldShowLoader = isLoading || isRouteChanging;

  // Handle loader visibility with minimum delay to prevent flickering (optimized)
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (shouldShowLoader) {
      if (!showLoader) {
        loaderStartTimeRef.current = Date.now();
        setShowLoader(true);
      }
    } else {
      if (showLoader && loaderStartTimeRef.current) {
        const elapsed = Date.now() - loaderStartTimeRef.current;
        const remainingDelay = Math.max(0, minDelay - elapsed);
        
        timeoutRef.current = setTimeout(() => {
          setShowLoader(false);
          loaderStartTimeRef.current = null;
          timeoutRef.current = null;
        }, remainingDelay);
      } else if (!shouldShowLoader) {
        setShowLoader(false);
        loaderStartTimeRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [shouldShowLoader, showLoader, minDelay]);

  // Don't render anything if loader shouldn't be shown
  if (!showLoader || isAnimationLoading) {
    return null;
  }

  // Fallback if animation data failed to load
  if (!animationData) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity duration-300"
      aria-label="Loading"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ 
              width: '100%', 
              height: '100%',
              maxWidth: '160px',
              maxHeight: '160px',
            }}
            className="lottie-loader"
          />
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const GlobalLoader = memo(GlobalLoaderComponent);
