'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { AuthGuard } from '@/components/auth-guard';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="flex relative h-screen bg-gray-50">
        <Sidebar 
          isOpen={isMobile ? mobileSidebarOpen : true} 
          onToggle={isMobile ? closeMobileSidebar : toggleSidebar}
          onCollapse={setSidebarCollapsed}
          isCollapsed={sidebarCollapsed}
        />
        
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-w-0",
          // Adjust main content based on sidebar collapse state (desktop only)
          !isMobile && sidebarCollapsed ? "lg:ml-20" : !isMobile ? "lg:ml-[260px]" : "ml-0"
        )}>
          <Header 
            onToggleSidebar={toggleSidebar} 
            isSidebarOpen={isMobile ? mobileSidebarOpen : !sidebarCollapsed} 
          />
          <main className="overflow-y-auto overflow-x-hidden flex-1 p-2 sm:p-4 lg:p-6">
            <div className="min-h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
} 