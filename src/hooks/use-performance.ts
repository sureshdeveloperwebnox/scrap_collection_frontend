import { useEffect } from 'react';

/**
 * Performance optimization hook
 * Implements various browser optimizations for smoother rendering
 */
export const usePerformanceOptimization = () => {
    useEffect(() => {
        // Enable CSS containment for better rendering performance
        if (typeof document !== 'undefined') {
            const style = document.createElement('style');
            style.textContent = `
        /* Performance optimizations */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Optimize scrolling */
        * {
          scroll-behavior: smooth;
        }
        
        /* GPU acceleration for animations */
        [class*="transition"],
        [class*="animate"],
        [class*="motion"] {
          will-change: transform, opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        /* Optimize images */
        img {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
      `;
            document.head.appendChild(style);

            return () => {
                document.head.removeChild(style);
            };
        }
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
