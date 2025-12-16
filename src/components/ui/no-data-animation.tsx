'use client';

import { useState, useEffect, memo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import Lottie to reduce initial bundle size
const Lottie = dynamic(() => import('lottie-react'), {
    loading: () => (
        <div className="flex items-center justify-center w-64 h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
    ),
    ssr: false,
});

interface NoDataAnimationProps {
    message?: string;
    description?: string;
}

// Memoized component to prevent unnecessary re-renders
const NoDataAnimation = memo(({
    message = 'No data found',
    description = 'Try adjusting your filters or create a new item'
}: NoDataAnimationProps) => {
    const [animationData, setAnimationData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load animation data only when component mounts (client-side only)
        const loadAnimation = async () => {
            try {
                const response = await fetch('/animation/nodatafoundanimation.json');
                if (!response.ok) {
                    throw new Error('Failed to load animation');
                }
                const data = await response.json();
                setAnimationData(data);
            } catch (error) {
                console.error('Failed to load animation:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAnimation();
    }, []);

    if (isLoading) {
        // Fallback while loading
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <div className="mt-2 text-gray-400 text-sm">Loading...</div>
            </div>
        );
    }

    if (!animationData) {
        // Fallback if animation fails to load
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <div className="text-gray-400 text-sm">{message}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
            <p className="mt-4 text-gray-600 text-sm font-medium">{message}</p>
            <p className="mt-1 text-gray-400 text-xs">{description}</p>
        </div>
    );
});

NoDataAnimation.displayName = 'NoDataAnimation';

export default NoDataAnimation;
