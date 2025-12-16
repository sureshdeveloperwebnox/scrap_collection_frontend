'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth-store';
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
  ChevronRight,
  X,
  LogOut
} from 'lucide-react';

// Navigation item type
type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: NavigationItem[];
};

// Navigation structure matching the image design
const navigationSections: Array<{
  title: string;
  items: NavigationItem[];
}> = [
    {
      title: 'HOME',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'APPS',
      items: [
        { name: 'Leads', href: '/leads', icon: Users, hasChevron: true },
        { name: 'Customers', href: '/customers', icon: CircleUserRound, hasChevron: true },
        { name: 'Orders', href: '/orders', icon: ShoppingCart, hasChevron: true },
        { name: 'Scrap Management', href: '/scrap', icon: Truck, hasChevron: true },
        { name: 'Vehicles', href: '/vehicles/types', icon: Car, hasChevron: true },
        { name: 'Pickup Requests', href: '/pickup-requests', icon: ClipboardList, hasChevron: true },
        { name: 'Scrap Yards', href: '/scrap-yards', icon: Building2, hasChevron: true },
        { name: 'Payments', href: '/payments', icon: CreditCard, hasChevron: true },
        { name: 'Employees', href: '/employees', icon: UserCheck, hasChevron: true },
        { name: 'Reports', href: '/reports', icon: BarChart3, hasChevron: true },
        { name: 'Settings', href: '/settings', icon: Settings, hasChevron: true },
      ]
    }
  ];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isCollapsed?: boolean;
}

export function Sidebar({ isOpen = true, onToggle, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
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

      <div
        className={cn(
          "fixed left-0 top-0 flex flex-col bg-white transition-all duration-300 ease-in-out",
          "z-50 shadow-xl border-r border-gray-200",
          "w-64 rounded-r-3xl",
          "my-2 ml-2 mr-0",
          "h-[calc(100vh-1rem)]",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          isOpen ? "translate-x-0 animate-in slide-in-from-left-5" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header with Logo and Name */}
        <div className="flex flex-shrink-0 justify-between items-center pl-4 pr-1 py-4 border-b border-gray-200 relative min-h-[80px]">
          <div className={cn(
            "flex items-center transition-all duration-200 w-full",
            isCollapsed ? "lg:justify-center" : "justify-start space-x-3"
          )}>
            {/* Logo Image */}
            <div className={cn(
              "flex items-center justify-center flex-shrink-0 transition-all duration-300",
              isCollapsed ? "lg:w-10 lg:h-10" : "w-12 h-12"
            )}>
              <Image
                src="/images/logo/scraplogo.png"
                alt="AussieScrapX Logo"
                width={isCollapsed ? 40 : 48}
                height={isCollapsed ? 40 : 48}
                className={cn(
                  "object-contain transition-all duration-300 transform hover:scale-110",
                  isCollapsed ? "lg:w-10 lg:h-10" : "w-12 h-12"
                )}
                priority
              />
            </div>

            {/* Brand Name - Left aligned */}
            <div className={cn(
              "transition-all duration-300 ease-in-out",
              isCollapsed ? "lg:opacity-0 lg:w-0 lg:hidden" : "opacity-100 block animate-in fade-in slide-in-from-left-2"
            )}>
              <span className="text-base font-bold text-gray-900 tracking-tight">
                AUSSIESCRAPX
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onToggle}
            className="lg:hidden absolute top-4 right-1 flex items-center justify-center w-8 h-8 text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            <X className="w-5 h-5 transition-transform duration-200 hover:rotate-90" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-hide">
          <nav className="pl-3 pr-1 py-4 space-y-6">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-2">
                {/* Section Title */}
                <h3 className={cn(
                  "font-semibold text-gray-400 text-xs uppercase tracking-wider pl-3 pr-1 transition-all duration-300",
                  isCollapsed ? "lg:opacity-0 lg:hidden" : "opacity-100 block animate-in fade-in slide-in-from-left-1"
                )}>
                  {section.title}
                </h3>

                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item, index) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const isHovered = hoveredItem === item.name;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                            onToggle?.();
                          }
                        }}
                        onMouseEnter={() => setHoveredItem(item.name)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                          'flex items-center py-2.5 text-sm font-medium transition-all duration-300 relative group',
                          'transform hover:scale-105 active:scale-95',
                          isActive
                            ? 'bg-cyan-500 text-white rounded-r-full shadow-lg shadow-cyan-500/50 animate-glow pl-3 pr-1'
                            : isHovered && section.title === 'APPS'
                              ? 'bg-gray-100 text-gray-900 rounded-r-full pl-3 pr-1'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg px-3',
                          !isCollapsed && !isActive && 'animate-in fade-in slide-in-from-left-2',
                          !isCollapsed && !isActive && `delay-[${index * 50}ms]`
                        )}
                        style={!isCollapsed ? { animationDelay: `${index * 50}ms` } : {}}
                        title={isCollapsed ? item.name : undefined}
                      >
                        {/* Shining effect overlay for active item */}
                        {isActive && (
                          <>
                            <div className="absolute inset-0 rounded-r-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine pointer-events-none" />
                            <div className="absolute inset-0 rounded-r-full animate-shine-sweep pointer-events-none" />
                          </>
                        )}

                        {/* Icon */}
                        <div className={cn(
                          "flex flex-shrink-0 justify-center items-center w-5 h-5 relative z-10",
                          isCollapsed ? "lg:mx-auto" : ""
                        )}>
                          <item.icon className={cn(
                            "w-5 h-5 transition-all duration-300 transform",
                            isActive
                              ? "text-white scale-110 drop-shadow-lg"
                              : isHovered && section.title === 'APPS'
                                ? "text-gray-900 scale-110 rotate-12"
                                : "text-gray-600 group-hover:scale-110 group-hover:rotate-3"
                          )} />
                        </div>

                        {/* Text */}
                        <span className={cn(
                          "ml-3 transition-all duration-300 flex-1 relative z-10",
                          isCollapsed ? "lg:opacity-0 lg:w-0 lg:ml-0 lg:hidden" : "opacity-100 block",
                          !isActive && "animate-in fade-in"
                        )}>
                          {item.name}
                        </span>

                        {/* Chevron - only show if item has submenu */}
                        {item.submenu && item.submenu.length > 0 && !isCollapsed && (
                          <ChevronRight className={cn(
                            "w-4 h-4 transition-all duration-300 transform relative z-10",
                            isActive
                              ? "text-white translate-x-1 drop-shadow-lg"
                              : isHovered && section.title === 'APPS'
                                ? "text-gray-900 translate-x-1 scale-110"
                                : "text-gray-400 group-hover:translate-x-1 group-hover:scale-110"
                          )} />
                        )}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-50 hidden lg:block shadow-md transform translate-x-[-4px] group-hover:translate-x-0">
                            {item.name}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile Card at Bottom */}
        <div className={cn(
          "flex-shrink-0 p-3 ml-3 mr-1 mb-3 bg-gray-50 rounded-xl border border-gray-200 transition-all duration-300",
          isCollapsed ? "lg:opacity-0 lg:hidden" : "opacity-100 block animate-in fade-in slide-in-from-bottom-2"
        )}>
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-md hover:shadow-lg">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate transition-all duration-300">
                {user?.name || 'Mike'}
              </div>
              <div className="text-xs text-gray-600 truncate transition-all duration-300">
                {user?.role || 'Admin'}
              </div>
            </div>

            {/* Logout Arrow */}
            <button
              onClick={() => {
                const { logout } = useAuthStore.getState();
                logout();
              }}
              className="flex-shrink-0 p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all duration-300 transform hover:scale-110 hover:rotate-12 active:scale-95"
            >
              <LogOut className="w-4 h-4 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
