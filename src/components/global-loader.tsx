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

  const isLoading = useLoadingStore((state) => state.isLoading);
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
      console.log('GlobalLoader: Loading animation...');
      try {
        const response = await fetch('/animation/loader.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('GlobalLoader: Animation loaded successfully');
        // Cache the animation data
        (window as any).__lottieLoaderCache = data;
        if (mounted) {
          setAnimationData(data);
          setIsAnimationLoading(false);
        }
      } catch (error) {
        console.error('GlobalLoader: Failed to load loader animation:', error);
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

  // Determine if we should show loader
  const shouldShowLoader = isLoading;

  // Handle loader visibility with minimum delay to prevent flickering (optimized)
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (shouldShowLoader) {
      // Threshold to avoid flashing on near-instant operations
      // Reduced to 10ms for faster appearance on refresh
      timeoutRef.current = setTimeout(() => {
        if (!showLoader) {
          loaderStartTimeRef.current = Date.now();
          setShowLoader(true);
        }
      }, 10);
    } else {
      if (showLoader && loaderStartTimeRef.current) {
        const elapsed = Date.now() - loaderStartTimeRef.current;
        const remainingDelay = Math.max(0, 150 - elapsed);

        timeoutRef.current = setTimeout(() => {
          setShowLoader(false);
          loaderStartTimeRef.current = null;
          timeoutRef.current = null;
        }, remainingDelay);
      } else {
        setShowLoader(false);
        loaderStartTimeRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shouldShowLoader, showLoader]);

  // Don't render anything if loader shouldn't be shown
  if (!showLoader) {
    return null;
  }

  // Fallback or while animation is loading
  if (isAnimationLoading || !animationData) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-xl transition-all duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <div className="absolute inset-0 border-4 border-transparent border-b-cyan-300 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1.5 animate-pulse">
            <p className="text-cyan-700 font-bold tracking-[0.2em] uppercase text-[10px]">
              Initializing
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-xl transition-all duration-500"
      aria-label="Loading"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center scale-110">
        <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 bg-cyan-400/15 rounded-full blur-3xl animate-pulse" />

          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '240px',
              maxHeight: '240px',
            }}
            className="lottie-loader relative z-10"
          />
        </div>

        {/* Progress Text */}
        <div className="mt-4 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          <p className="text-cyan-700 font-bold tracking-[0.2em] uppercase text-[10px]">
            Please wait
          </p>
          <p className="text-gray-400 text-sm font-medium">
            Preparing your experience...
          </p>
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const GlobalLoader = memo(GlobalLoaderComponent);
