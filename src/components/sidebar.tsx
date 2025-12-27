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
  dashboardApi,
  employeesApi,
  vehicleNamesApi,
  pickupRequestsApi,
  apiClient
} from '@/lib/api';
import { useSidebarStore } from '@/lib/store/sidebar-store';
import { m, AnimatePresence } from 'framer-motion';
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
  XCircle,
  ChevronLeft,
  Menu,
  LogOut,
  ArrowUpRight
} from 'lucide-react';
import { useSignOut } from '@/hooks/use-auth';
import { getImageUrl } from '@/utils/image-utils';

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
  dashboard: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: ['dashboard', 'combined', orgId],
      queryFn: async () => {
        const [leadsResponse, customersResponse, ordersResponse] = await Promise.all([
          leadsApi.getLeads({ organizationId: orgId }).catch(() => ({ data: { leads: [], pagination: {} } })),
          customersApi.getCustomers({ organizationId: orgId }).catch(() => ({ data: { customers: [], pagination: {} } })),
          ordersApi.getOrders({ organizationId: orgId }).catch(() => ({ data: { orders: [], pagination: {} } }))
        ]);
        const leads = Array.isArray(leadsResponse?.data?.leads) ? leadsResponse.data.leads : [];
        const customers = Array.isArray(customersResponse?.data?.customers) ? customersResponse.data.customers : [];
        const orders = Array.isArray(ordersResponse?.data?.orders) ? ordersResponse.data.orders : [];
        const totalRevenue = orders.reduce((sum: number, order: any) => sum + (parseFloat(order.totalAmount) || 0), 0);
        const completedOrders = orders.filter((order: any) => order.status === 'completed' || order.status === 'COMPLETED').length;
        return {
          stats: {
            leads: { total: leads.length, new: leads.length, converted: 0, trend: 0 },
            customers: { total: customers.length, active: customers.length, inactive: 0, trend: 0 },
            orders: { total: orders.length, pending: orders.length - completedOrders, completed: completedOrders, revenue: totalRevenue, trend: 0 }
          },
          analytics: {
            totalRevenue,
            totalOrders: orders.length,
            revenueGrowth: 0,
            ordersGrowth: 0,
            revenueChart: [1543, 1650, 1720, 1580, 1890, 1750, 2100, 1950, 2200, 2543],
            ordersChart: [45, 52, 48, 58, 65, 62, 70],
            collectorsChart: [2.5, 3.2, 2.8, 3.5, 4.1, 3.8, 4.5]
          }
        };
      }
    });
  },
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
  orders: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: queryKeys.orders.list({ page: 1, limit: 10, organizationId: orgId }),
      queryFn: () => ordersApi.getOrders({ page: 1, limit: 10, organizationId: orgId })
    });
  },
  scrap: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: ['scrap-categories', { page: 1, limit: 10, organizationId: orgId }],
      queryFn: () => scrapApi.getScrapCategories({ page: 1, limit: 10, organizationId: orgId })
    });
  },
  scrapYards: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: queryKeys.scrapYards.list({ page: 1, limit: 10, organizationId: orgId }),
      queryFn: () => scrapYardsApi.getScrapYards({ page: 1, limit: 10, organizationId: orgId })
    });
  },
  collectors: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: queryKeys.collectors.list({ page: 1, limit: 10, organizationId: orgId }),
      queryFn: () => collectorsApi.getCollectors({ page: 1, limit: 10, organizationId: orgId })
    });
  },
  payments: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: queryKeys.payments.list({ page: 1, limit: 10, organizationId: orgId }),
      queryFn: () => paymentsApi.getPayments({ page: 1, limit: 10, organizationId: orgId })
    });
  },
  employees: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: queryKeys.employees.list({ page: 1, limit: 10, organizationId: orgId }),
      queryFn: () => employeesApi.getEmployees({ page: 1, limit: 10, organizationId: orgId })
    });
  },
  vehicles: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: queryKeys.vehicleNames.list({ page: 1, limit: 10, organizationId: orgId }),
      queryFn: () => vehicleNamesApi.getVehicleNames({ page: 1, limit: 10, organizationId: orgId })
    });
  },
  pickupRequests: (client: any, orgId: number) => {
    if (!orgId) return;
    client.prefetchQuery({
      queryKey: ['pickup-requests', { page: 1, limit: 10, organizationId: orgId }],
      queryFn: () => pickupRequestsApi.getPickupRequests({ page: 1, limit: 10, organizationId: orgId })
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
  { name: 'Vehicles', href: '/vehicles', icon: Car, prefetchKey: 'vehicles' },
  { name: 'Pickup Requests', href: '/pickup-requests', icon: ClipboardList, prefetchKey: 'pickupRequests' },
  { name: 'Scrap Yards', href: '/scrap-yards', icon: Building2, prefetchKey: 'scrapYards' },
  { name: 'Payments', href: '/payments', icon: CreditCard, prefetchKey: 'payments' },
  { name: 'Employees', href: '/employees', icon: UserCheck, prefetchKey: 'employees' },
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
        'group flex items-center relative transition-[color,padding,gap] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'text-sm font-medium rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/20',
        'py-3 h-12',
        isActive ? 'text-cyan-700' : 'text-white/80 hover:text-white',
        isCollapsed ? 'px-0 justify-center' : 'px-6 gap-3'
      )}
      title={isCollapsed ? item.name : undefined}
    >
      {/* Active Indicator Background */}
      {isActive && (
        <m.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 bg-white shadow-lg shadow-cyan-900/10 rounded-full"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 35,
          }}
        />
      )}

      {/* Item Icon Wrapper - Fixed width prevents jump */}
      <div className={cn(
        "flex items-center justify-center flex-shrink-0 relative z-10 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform-gpu",
        isCollapsed ? "w-12" : "w-5"
      )}>
        <item.icon className={cn(
          "w-5 h-5 transition-colors duration-200",
          isActive ? "text-cyan-600" : "text-white/80 group-hover:text-white"
        )} />
      </div>

      {/* Item Label */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <m.span
            initial={{ opacity: 0, width: 0, x: -10 }}
            animate={{ opacity: 1, width: 'auto', x: 0 }}
            exit={{ opacity: 0, width: 0, x: -10 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "truncate relative z-10 font-bold tracking-tight text-[0.9rem] whitespace-nowrap",
              isActive ? "text-cyan-700" : "text-white/80"
            )}
          >
            {item.name}
          </m.span>
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
  const { mutate: signOut } = useSignOut();

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
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden h-full w-full"
            onClick={toggleMobileOpen}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Main Container */}
      <aside
        className={cn(
          "fixed left-0 top-0 flex flex-col z-50 h-[100dvh] transform-gpu",
          "bg-gradient-to-b from-cyan-600 via-cyan-700 to-cyan-800 shadow-2xl shadow-cyan-900/40 transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          // Width: collapsed on desktop, full width on mobile
          isCollapsed ? "lg:w-20" : "lg:w-[260px]",
          "w-[260px]",
          // Transform: hidden on mobile by default, visible when open or on desktop
          "-translate-x-full",
          isMobileOpen && "translate-x-0",
          "lg:translate-x-0"
        )}
      >
        {/* Close Button - Top Right Corner */}
        <button
          onClick={toggleMobileOpen}
          className="lg:hidden absolute top-3 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:rotate-90 z-50"
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Section - Unified structure to prevent snapping */}
        <div className={cn(
          "flex items-center px-6 py-8 flex-shrink-0 transition-[padding,gap] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isCollapsed ? "lg:px-3 lg:justify-center" : "gap-3"
        )}>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-white/20 transition-[transform,shadow] duration-200 hover:scale-105 active:scale-95 flex-shrink-0">
              <Image
                src="/images/logo/scraplogo.png"
                alt="AussieScrapX"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <m.div
                  initial={{ opacity: 0, width: 0, x: -10 }}
                  animate={{ opacity: 1, width: 'auto', x: 0 }}
                  exit={{ opacity: 0, width: 0, x: -10 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="flex items-center ml-3 overflow-hidden"
                >
                  <span className="text-white font-black text-xl tracking-tighter whitespace-nowrap">
                    <span className="text-cyan-200">A</span>USSIE SCRAP<span className="text-cyan-200">X</span>
                  </span>
                </m.div>
              )}
            </AnimatePresence>
          </div>


        </div>

        {/* Optimized Navigation Content */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-hide">
          {renderedItems}
        </nav>

        {/* User Account Section - Unified structure for smooth transition */}
        <div className="p-4 mt-auto border-t border-white/10 bg-black/5">
          <div className={cn(
            "bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 transition-[padding,gap] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isCollapsed ? "p-2 flex flex-col items-center gap-4 border-transparent bg-transparent" : "p-3"
          )}>
            <div className="flex items-center gap-3 w-full">
              <div className={cn(
                "rounded-xl bg-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-[transform,shadow] duration-200 flex-shrink-0 overflow-hidden",
                isCollapsed ? "w-10 h-10" : "w-10 h-10"
              )}>
                {user?.profileImg ? (
                  <img
                    src={getImageUrl(user.profileImg)}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-cyan-700 font-black text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {!isCollapsed && (
                  <m.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 min-w-0 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-xs truncate">
                        {user?.name || 'Administrator'}
                      </div>
                      <div className="text-cyan-100/50 text-[10px] uppercase font-bold tracking-widest">
                        {user?.role || 'Admin'}
                      </div>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="p-2 text-white/40 hover:text-red-300 hover:bg-white/10 rounded-lg transition-[color,background-color] ml-2"
                      aria-label="Logout"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            {isCollapsed && (
              <button
                onClick={() => signOut()}
                className="p-2 text-white/40 hover:text-red-300 transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
