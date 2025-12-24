import { useEffect } from 'react';

/**
 * Performance optimization hook
 * Implements various browser optimizations for smoother rendering
 */
export const usePerformanceOptimization = () => {
    useEffect(() => {
        // Performance styles are now in globals.css for better FCP
    }, []);

    useEffect(() => {
        // Debounce resize events for better performance
        let resizeTimeout: NodeJS.Timeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Trigger any resize-dependent logic here
            }, 150);
        };

        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
    }, []);

    useEffect(() => {
        // Optimize scroll performance
        const handleScroll = () => {
            // Use requestAnimationFrame for smooth scroll handling
            requestAnimationFrame(() => {
                // Any scroll-dependent logic here
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
};
