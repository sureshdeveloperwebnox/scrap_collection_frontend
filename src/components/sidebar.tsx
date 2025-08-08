'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  UserCheck,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  Truck,
  ClipboardList,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Employees', href: '/employees', icon: UserCheck },
  { name: 'Collectors', href: '/collectors', icon: Truck },
  { name: 'Scrap Yards', href: '/scrap-yards', icon: Building2 },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onCollapse?: (collapsed: boolean) => void;
  isCollapsed?: boolean;
}

export function Sidebar({ isOpen = true, onToggle, onCollapse, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();

  // Remove internal collapse functionality since header controls everything
  useEffect(() => {
    onCollapse?.(isCollapsed);
  }, [isCollapsed, onCollapse]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <div className={cn(
        "fixed left-0 top-0 flex flex-col bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-[#1F1F1F] transition-all duration-300 ease-in-out shadow-md rounded-r-2xl",
        // Base styles
        "z-50 h-screen",
        // Mobile responsive width
        "w-64", // Default width for mobile
        // Desktop responsive width
        isCollapsed ? "lg:w-16" : "lg:w-64",
        // Mobile slide in/out
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex flex-shrink-0 justify-between items-center px-4 h-16 border-b border-white/20">
          <div className={cn(
            "flex items-center transition-all duration-200",
            isCollapsed ? "lg:justify-center lg:w-full" : "space-x-2"
          )}>
            {/* Logo - Always visible, centered when collapsed */}
            <div className="flex flex-shrink-0 justify-center items-center w-10 h-8">
              <Image src="/images/logo/logo.png" alt="Logo" width={50} height={50} />
            </div>
            <span className={cn(
              "text-xl font-bold whitespace-nowrap transition-opacity duration-200 text-white",
              isCollapsed ? "lg:hidden" : "block"
            )}>
              AussieScrapX 
            </span>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onToggle}
            className="lg:hidden flex items-center justify-center w-8 h-8 bg-white/20 text-[#1F1F1F] rounded-lg hover:bg-white/30 transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation - Scrollable with hidden scrollbar */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-hide">
          <nav className="px-2 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    // Close mobile sidebar on navigation
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      onToggle?.();
                    }
                  }}
                  className={cn(
                    'flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 group relative hover:scale-105',
                    isActive
                      ? 'bg-white/30 text-white shadow-md backdrop-blur-sm'
                      : 'text-white hover:bg-white/20 hover:shadow-md'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <div className={cn(
                    "flex flex-shrink-0 justify-center items-center w-5 h-5",
                    isCollapsed ? "lg:mx-auto" : ""
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "ml-3 transition-all duration-200",
                    isCollapsed ? "lg:opacity-0 lg:w-0 lg:ml-0" : "opacity-100"
                  )}>
                    {item.name}
                  </span>
                  
                  {/* Tooltip for collapsed state - Desktop only */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#1F1F1F] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 hidden lg:block shadow-md">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* User Profile */}
        <div className="flex-shrink-0 p-4 border-t border-white/20">
          <div className={cn(
            "flex items-center transition-all duration-200",
            isCollapsed ? "lg:justify-center lg:w-full" : "space-x-3"
          )}>
            <div className="w-8 h-8 bg-gradient-to-r from-[#1F1F1F] to-[#2d2d2d] rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-sm font-medium text-white">A</span>
            </div>
            <div className={cn(
              "transition-opacity duration-200",
              isCollapsed ? "lg:hidden" : "block"
            )}>
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-white/70">admin@scrap.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Mobile Menu Button Component - Authentic animated burger menu
export function MobileMenuButton({ onToggle, isOpen }: { onToggle: () => void; isOpen: boolean }) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden flex items-center justify-center w-10 h-10 bg-gradient-to-r from-[#a280ed] to-[#8b6fd8] text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-white/20 relative"
      title={isOpen ? "Close menu" : "Open menu"}
    >
      {/* Authentic hamburger menu with 3 lines that animate to X */}
      <div className="flex flex-col justify-center items-center w-5 h-5">
        {/* Top line */}
        <span 
          className={`block w-5 h-0.5 bg-white transform transition-all duration-300 ease-in-out ${
            isOpen ? 'rotate-45 translate-y-1.5' : 'translate-y-0'
          }`}
        />
        {/* Middle line */}
        <span 
          className={`block w-5 h-0.5 bg-white transform transition-all duration-300 ease-in-out mt-1 ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {/* Bottom line */}
        <span 
          className={`block w-5 h-0.5 bg-white transform transition-all duration-300 ease-in-out mt-1 ${
            isOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-0'
          }`}
        />
      </div>
    </button>
  );
}
