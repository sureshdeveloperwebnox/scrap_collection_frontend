'use client';

import { useState } from 'react';
import { Sidebar, MobileMenuButton } from '@/components/sidebar';
import { Header } from '@/components/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex relative h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar}
        onCollapse={handleSidebarCollapse}
      />
      <MobileMenuButton onToggle={toggleSidebar} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      } ml-0`}>
        <Header />
        <main className="overflow-y-auto overflow-x-hidden flex-1 p-4 lg:p-6">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 