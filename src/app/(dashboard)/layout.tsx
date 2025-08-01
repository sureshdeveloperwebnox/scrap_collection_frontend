'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prevState => !prevState);
  };

  return (
    <div className="flex relative h-screen bg-gray-50">
      <Sidebar 
        isOpen={true} 
        onToggle={toggleSidebar}
        onCollapse={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 min-w-0",
        // Adjust main content based on sidebar collapse state
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <Header onToggleSidebar={toggleSidebar} isSidebarOpen={!sidebarCollapsed} />
        <main className="overflow-y-auto overflow-x-hidden flex-1 p-4 lg:p-6">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 