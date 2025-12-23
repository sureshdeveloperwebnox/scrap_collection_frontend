'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth-store';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  ShoppingCart,
  UserCheck,
  Building2,
  CreditCard,
  Truck,
  ClipboardList,
  Settings,
  CircleUserRound,
  Car,
  X,
  LogOut,
  Search,
  ArrowUpRight,
  ChevronLeft
} from 'lucide-react';

// Navigation item type
type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Navigation structure - Your complete menu with Jobio style
const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Customers', href: '/customers', icon: CircleUserRound },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Scrap Management', href: '/scrap', icon: Truck },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
  { name: 'Pickup Requests', href: '/pickup-requests', icon: ClipboardList },
  { name: 'Scrap Yards', href: '/scrap-yards', icon: Building2 },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Employees', href: '/employees', icon: UserCheck },
  { name: 'Collectors', href: '/collectors', icon: Truck },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isCollapsed?: boolean;
}

export function Sidebar({ isOpen = true, onToggle, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container - Matching Jobio's deep purple with cyan */}
      <div
        className={cn(
          "fixed left-0 top-0 flex flex-col transition-all duration-300 ease-in-out",
          "z-50",
          // Jobio-style gradient background using cyan
          "bg-gradient-to-b from-cyan-600 via-cyan-700 to-cyan-800",
          // Sharp right edge to highlight the content curve
          "rounded-none",
          "shadow-2xl shadow-cyan-900/20",
          // Height and width
          "h-screen",
          isCollapsed ? "lg:w-20" : "w-[260px] lg:w-[260px]", // Matched with layout margin
          // Mobile behavior
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section - Jobio style */}
        <div className={cn(
          "flex items-center px-6 py-8 flex-shrink-0",
          isCollapsed && "lg:justify-center lg:px-3"
        )}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              {/* Circular Logo Container */}
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-white/20 transition-transform duration-300 hover:scale-105">
                <Image
                  src="/images/logo/scraplogo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              {/* Brand Name */}
              <span className="text-white font-bold text-lg tracking-tight">
                AussieScrapX
              </span>
            </div>
          )}

          {isCollapsed && (
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-white/20">
              <Image
                src="/images/logo/scraplogo.png"
                alt="Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
          )}

          {/* Close button for mobile */}
          <button
            onClick={onToggle}
            className="lg:hidden absolute top-6 right-4 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Jobio style */}
        <nav className={cn(
          "flex-1 overflow-y-auto px-6 py-6 space-y-2 sidebar-scroll",
          "scrollbar-hide hover:scrollbar-default" // Optional: hide by default and show on hover if desired, but we'll stick to our custom sleek one
        )}>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    onToggle?.();
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-6 py-3', // Increased padding for sleeker Jobie pill
                  'text-sm font-medium',
                  'relative transition-all duration-300',
                  'rounded-full',
                  isActive
                    ? 'text-cyan-700'
                    : 'text-white/80 hover:text-white',
                  isCollapsed && 'lg:justify-center lg:px-0'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {/* 🌊 LIQUID ANIMATED BACKGROUND */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-white shadow-md rounded-full"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 30,
                      mass: 0.8,
                    }}
                  />
                )}

                {/* Icon - positioned above background */}
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0 relative z-10 transition-colors duration-300",
                  isActive ? "text-cyan-600" : "text-white/80"
                )} />

                {/* Label - positioned above background */}
                {!isCollapsed && (
                  <span className={cn(
                    "truncate relative z-10 font-bold tracking-tight transition-all duration-300",
                    isActive ? "text-cyan-700" : "text-white/80"
                  )}>
                    {item.name}
                  </span>
                )}


              </Link>
            );
          })}
        </nav>

        {/* User Profile Section - Jobio style */}
        {!isCollapsed && (
          <div className="p-6 mt-auto">
            {/* Visit Site Button - Jobio specialty */}
            <a
              href="/"
              target="_blank"
              className="group flex items-center justify-between w-full h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl px-6 mb-6 transition-all duration-300 border border-white/10 hover:border-white/30"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-sm tracking-tight">Visit Frontend</span>
              </div>
            </a>

            {/* Profile Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 border border-white/20 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 flex-shrink-0">
                  <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-lg transform rotate-3">
                    <span className="text-cyan-700 font-extrabold text-sm -rotate-3">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-cyan-800 shadow-sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate tracking-tight">
                    {user?.name || 'Oda Dink'}
                  </div>
                  <div className="text-white/50 text-[10px] uppercase font-bold tracking-widest truncate">
                    {user?.role || 'Programmer'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const { logout } = useAuthStore.getState();
                    logout();
                  }}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed state user avatar */}
        {isCollapsed && (
          <div className="p-3 mt-auto flex justify-center">
            <div className="relative w-10 h-10">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-cyan-100 flex items-center justify-center border-2 border-white/30">
                <span className="text-cyan-700 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-cyan-700" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
