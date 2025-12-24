'use client';

import { useState, useEffect } from 'react';
import { ShellSkeleton } from '@/components/ui/skeleton-shell';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { AuthGuard } from '@/components/auth-guard';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/store/sidebar-store';
import { usePerformanceOptimization } from '@/hooks/use-performance';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isCollapsed, isMobileOpen, toggleCollapsed, toggleMobileOpen, setMobileOpen } = useSidebarStore();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Enable performance optimizations
  usePerformanceOptimization();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) {
      toggleMobileOpen();
    } else {
      toggleCollapsed();
    }
  };

  // Improved loading state with high-fidelity skeleton
  if (!mounted) {
    return <ShellSkeleton />;
  }

  return (
    <AuthGuard requireAuth={true}>
      <div
        className="flex relative h-screen bg-gradient-to-b from-cyan-600 via-cyan-700 to-cyan-800 overflow-hidden"
        style={{
          // @ts-ignore
          '--sidebar-width': isMobile ? '0px' : (isCollapsed ? '80px' : '260px')
        }}
      >
        <Sidebar />

        <div className={cn(
          "flex-1 flex flex-col min-w-0 h-full main-content-wrapper",
          "lg:pl-[var(--sidebar-width)]"
        )}>
          {/* THE STAGE: A single, solid off-white background container */}
          <div className="flex-1 flex flex-col bg-[#F3F4F7] rounded-tl-[3.5rem] shadow-2xl relative overflow-hidden mt-0 transform-gpu">
            <Header onToggleSidebar={handleToggleSidebar} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-5 lg:px-6 py-8 scrollbar-animate-pulse">
              <div className="min-h-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}