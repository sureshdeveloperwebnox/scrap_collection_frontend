'use client';

import { useState, useEffect } from 'react';
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

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="flex relative h-screen bg-gradient-to-b from-cyan-600 via-cyan-700 to-cyan-800 overflow-hidden">
        <Sidebar />

        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-w-0 h-full",
          !isMobile && isCollapsed ? "lg:ml-20" : !isMobile ? "lg:ml-[260px]" : "ml-0"
        )}>
          {/* THE STAGE: A single, solid off-white background container */}
          <div className="flex-1 flex flex-col bg-[#F3F4F7] rounded-tl-[3.5rem] shadow-2xl relative overflow-hidden mt-0">
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