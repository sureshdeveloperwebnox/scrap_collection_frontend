'use client';

import React, { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth-store';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import {
  leadsApi,
  customersApi,
  ordersApi,
  scrapApi,
  collectorsApi,
  scrapYardsApi,
  paymentsApi,
  dashboardApi
} from '@/lib/api';
import { useSidebarStore } from '@/lib/store/sidebar-store';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowUpRight
} from 'lucide-react';

// Navigation item type
type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  prefetchKey?: keyof typeof PREFETCH_CONFIG;
};

/**
 * Prefetch Configuration Map
 * Defines how to warm up the cache for each module.
 */
const PREFETCH_CONFIG = {
  // Dashboard endpoint removed for now to prevent 404s until backend logic is implemented
  dashboard: null,
  leads: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: queryKeys.leads.list({ page: 1, limit: 10, organizationId: orgId }),
      queryFn: () => leadsApi.getLeads({ page: 1, limit: 10, organizationId: orgId })
    });
  },
  customers: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: queryKeys.customers.list({ page: 1, limit: 10, organizationId: orgId }),
      queryFn: () => customersApi.getCustomers({ page: 1, limit: 10, organizationId: orgId })
    });
  },
  orders: (client: any, _orgId: number) => {
    client.prefetchQuery({
      queryKey: queryKeys.orders.list({ page: 1, limit: 10 }),
      queryFn: () => ordersApi.getOrders({ page: 1, limit: 10 })
    });
  },
  scrap: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: ['scrap-categories', { page: 1, limit: 10, organizationId: orgId }],
      queryFn: () => scrapApi.getScrapCategories({ page: 1, limit: 10, organizationId: orgId })
    });
    client.prefetchQuery({
      queryKey: ['scrap-names', { page: 1, limit: 10, organizationId: orgId }],
      queryFn: () => scrapApi.getScrapNames({ page: 1, limit: 10, organizationId: orgId })
    });
  },
  scrapYards: (client: any, _orgId: number) => {
    client.prefetchQuery({
      queryKey: queryKeys.scrapYards.list({ page: 1, limit: 10 }),
      queryFn: () => scrapYardsApi.getScrapYards({ page: 1, limit: 10 })
    });
  },
  collectors: (client: any, _orgId: number) => {
    client.prefetchQuery({
      queryKey: queryKeys.collectors.list({ page: 1, limit: 10 }),
      queryFn: () => collectorsApi.getCollectors({ page: 1, limit: 10 })
    });
  },
  payments: (client: any, _orgId: number) => {
    client.prefetchQuery({
      queryKey: queryKeys.payments.list({ page: 1, limit: 10 }),
      queryFn: () => paymentsApi.getPayments({ page: 1, limit: 10 })
    });
  },
};

// Navigation menu configuration
const NAVIGATION_ITEMS: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, prefetchKey: 'dashboard' },
  { name: 'Leads', href: '/leads', icon: Users, prefetchKey: 'leads' },
  { name: 'Customers', href: '/customers', icon: CircleUserRound, prefetchKey: 'customers' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, prefetchKey: 'orders' },
  { name: 'Scrap Management', href: '/scrap', icon: Truck, prefetchKey: 'scrap' },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
  { name: 'Pickup Requests', href: '/pickup-requests', icon: ClipboardList },
  { name: 'Scrap Yards', href: '/scrap-yards', icon: Building2, prefetchKey: 'scrapYards' },
  { name: 'Payments', href: '/payments', icon: CreditCard, prefetchKey: 'payments' },
  { name: 'Employees', href: '/employees', icon: UserCheck },
  { name: 'Collectors', href: '/collectors', icon: Truck, prefetchKey: 'collectors' },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

/**
 * Memoized Individual Navigation Item
 * Optimized with Hover-Prefetching to warm up API caches.
 */
const NavItem = memo(({
  item,
  isActive,
  isCollapsed,
  onToggle,
  onHover
}: {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
  onToggle?: () => void;
  onHover: (key?: keyof typeof PREFETCH_CONFIG) => void;
}) => {
  return (
    <Link
      href={item.href}
      prefetch={true}
      onMouseEnter={() => onHover(item.prefetchKey)}
      onClick={() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          onToggle?.();
        }
      }}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 px-6 py-3',
        'text-sm font-medium relative transition-all duration-200',
        'rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/20',
        isActive ? 'text-cyan-700' : 'text-white/80 hover:text-white',
        isCollapsed && 'lg:justify-center lg:px-0'
      )}
      title={isCollapsed ? item.name : undefined}
    >
      {/* Active Indicator Background */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 bg-white shadow-lg shadow-cyan-900/10 rounded-full"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
            mass: 1,
          }}
        />
      )}

      {/* Item Icon */}
      <item.icon className={cn(
        "w-5 h-5 flex-shrink-0 relative z-10 transition-colors duration-200",
        isActive ? "text-cyan-600" : "text-white/80 group-hover:text-white"
      )} />

      {/* Item Label */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={cn(
              "truncate relative z-10 font-bold tracking-tight text-[0.9rem]",
              isActive ? "text-cyan-700" : "text-white/80"
            )}
          >
            {item.name}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
});

NavItem.displayName = 'NavItem';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // High-performance Zustand state subscription
  const {
    isCollapsed,
    isMobileOpen,
    toggleMobileOpen
  } = useSidebarStore();

  // Smart Hover Prefetching Controller
  const handlePrefetch = useCallback((key?: keyof typeof PREFETCH_CONFIG) => {
    if (!key || !PREFETCH_CONFIG[key]) return;

    // Ensure we have a valid organizationId before prefetching
    const orgId = user?.organizationId;
    if (!orgId) return;

    // Warm up the specific API cache for this module
    try {
      PREFETCH_CONFIG[key](queryClient, orgId);
    } catch (error) {
      // Silently fail prefetch to avoid disrupting UX
      console.debug('Prefetch failed for', key, error);
    }
  }, [queryClient, user?.organizationId]);

  // Optimized Navigation Items Rendering
  const renderedItems = useMemo(() => {
    return NAVIGATION_ITEMS.map((item) => {
      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
      return (
        <NavItem
          key={item.href}
          item={item}
          isActive={isActive}
          isCollapsed={isCollapsed}
          onToggle={toggleMobileOpen}
          onHover={handlePrefetch}
        />
      );
    });
  }, [pathname, isCollapsed, toggleMobileOpen, handlePrefetch]);

  return (
    <>
      {/* Mobile Overlay with optimized transitions */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden h-full w-full"
            onClick={toggleMobileOpen}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Main Container */}
      <div
        className={cn(
          "fixed left-0 top-0 flex flex-col z-50 h-[100dvh]",
          "transition-[width,transform] duration-300 ease-in-out will-change-[width,transform]",
          "bg-gradient-to-b from-cyan-600 via-cyan-700 to-cyan-800",
          "shadow-2xl shadow-cyan-900/40",
          isCollapsed ? "lg:w-20" : "w-[260px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Section */}
        <div className={cn(
          "flex items-center px-6 py-8 flex-shrink-0",
          isCollapsed && "lg:justify-center lg:px-3"
        )}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0">
              <Image
                src="/images/logo/scraplogo.png"
                alt="AussieScrapX"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-white font-black text-xl tracking-tighter"
              >
                SCRAP<span className="text-cyan-200">X</span>
              </motion.span>
            )}
          </div>

          <button
            onClick={toggleMobileOpen}
            className="lg:hidden absolute top-8 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Optimized Navigation Content */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-hide">
          {renderedItems}
        </nav>

        {/* User Account Section */}
        <div className="p-4 mt-auto border-t border-white/10 bg-black/5">
          {!isCollapsed ? (
            <div className="space-y-4">
              {/* Account Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-cyan-700 font-black text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-xs truncate">
                      {user?.name || 'Administrator'}
                    </div>
                    <div className="text-cyan-100/50 text-[10px] uppercase font-bold tracking-widest">
                      {user?.role || 'Admin'}
                    </div>
                  </div>

                  <button
                    onClick={() => useAuthStore.getState().logout()}
                    className="p-2 text-white/40 hover:text-red-300 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95">
                <span className="text-cyan-700 font-black text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <button
                onClick={() => useAuthStore.getState().logout()}
                className="p-2 text-white/40 hover:text-red-300 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
