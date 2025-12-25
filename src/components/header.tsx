'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  MessageCircle,
  ChevronDown,
  Calendar,
  Mail,
  Moon,
  Settings,
  X,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth-store';
import { useSidebarStore } from '@/lib/store/sidebar-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfileDialog } from "./user-profile-dialog";
import { useSignOut } from "@/hooks/use-auth";

import { getImageUrl } from '@/utils/image-utils';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header = memo(({ onToggleSidebar }: HeaderProps) => {
  const { user } = useAuthStore();
  const { isCollapsed, toggleCollapsed, toggleMobileOpen } = useSidebarStore();
  const signOutMutation = useSignOut();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleToggle = useCallback(() => {
    // If a prop is passed, use it, otherwise use store directly
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      // Direct store toggle logic (default fallback)
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        toggleMobileOpen();
      } else {
        toggleCollapsed();
      }
    }
  }, [onToggleSidebar, toggleCollapsed, toggleMobileOpen]);

  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Map pathnames to Titles
  const getPageTitle = (path: string) => {
    // Remove leading slash and split by slash
    const segments = path.split('/').filter(Boolean);

    // Default cases for main routes
    if (segments.length === 0) return 'Dashboard';

    // Check if this is an order detail page (e.g., /orders/uuid)
    if (segments[0] === 'orders' && segments.length === 2 && segments[1].length > 20) {
      // This is likely a UUID, show "Order Details" instead
      return 'Order Details';
    }

    const lastSegment = segments[segments.length - 1];

    // Specific overrides for better look
    const overrides: Record<string, string> = {
      'dashboard': 'Dashboard',
      'leads': 'Leads',
      'customers': 'Customers',
      'orders': 'Orders',
      'scrap': 'Scrap Management',
      'vehicles': 'Vehicles',
      'pickup-requests': 'Pickup Requests',
      'scrap-yards': 'Scrap Yards',
      'payments': 'Payments',
      'employees': 'Employees',
      'collectors': 'Collectors',
      'reports': 'Reports',
      'settings': 'Settings',
      'vehicle-types': 'Vehicle Types'
    };

    return overrides[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
  };

  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAppsDropdownOpen(false);
      }
    };

    if (appsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [appsDropdownOpen]);

  return (
    <header className="h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-gray-100 bg-white sticky top-0 z-30">
      <div className="flex items-center space-x-6">
        {/* Hamburger Menu Button */}
        <button
          onClick={handleToggle}
          className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 flex-shrink-0"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand/Breadcrumb context for Jobie feel */}
        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">{pageTitle}</h1>
      </div>

      {/* SEARCH BAR - Jobie center pill style */}
      <div className="hidden lg:flex flex-1 max-w-xl mx-12">
        <div className="relative w-full group">
          <input
            type="text"
            placeholder="Search something here..."
            className="w-full h-11 pl-6 pr-12 bg-gray-100 hover:bg-gray-200/70 border-none rounded-full text-sm font-medium transition-[background-color,box-shadow,ring] duration-300 focus:ring-4 focus:ring-cyan-500/10 focus:bg-white focus:shadow-md outline-none"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Search className="text-gray-400 h-5 w-5 group-hover:text-cyan-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* Right Side Icons - Jobie style notification/profile */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="hidden sm:flex items-center space-x-2">
          <button
            className="relative p-2.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-[color,background-color]"
            aria-label="Messages"
            title="Messages"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 text-[10px] text-white flex items-center justify-center rounded-full border-2 border-white">18</span>
          </button>

          <button
            className="relative p-2.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-[color,background-color]"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-[10px] text-white flex items-center justify-center rounded-full border-2 border-white">52</span>
          </button>

          <button
            className="p-2.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-[color,background-color]"
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile - Header side */}
        <div className="flex items-center pl-4 border-l border-gray-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer group transition-[transform,color]">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-bold text-gray-900 leading-none group-hover:text-cyan-600 transition-colors">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name || 'Administrator')}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                    {user?.role || 'Super Admin'}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-gray-100 transition-transform group-hover:scale-110">
                  <div className="w-full h-full bg-cyan-100 flex items-center justify-center">
                    {user?.profileImg ? (
                      <img
                        src={getImageUrl(user.profileImg)}
                        alt={user.firstName || user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-cyan-700 font-bold text-xs uppercase">
                        {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'A'}
                        {user?.lastName?.charAt(0) || user?.name?.split(' ')[1]?.charAt(0) || user?.name?.charAt(1) || ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2 rounded-xl border-gray-100 shadow-xl p-2">
              <DropdownMenuLabel className="font-normal p-2">
                <div className="flex flex-col space-y-1.5 overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name || 'Administrator')}
                  </p>
                  <p className="text-xs text-gray-500 truncate" title={user?.email || ''}>
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuItem
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer focus:bg-cyan-50 focus:text-cyan-700 transition-colors"
                onClick={() => setProfileDialogOpen(true)}
              >
                <UserIcon className="w-4 h-4" />
                <span className="font-medium">Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer focus:bg-cyan-50 focus:text-cyan-700 transition-colors"
                onClick={() => { }} // Could add settings link if needed
              >
                <Settings className="w-4 h-4" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuItem
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer focus:bg-red-50 focus:text-red-700 transition-colors"
                onClick={() => signOutMutation.mutate()}
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <UserProfileDialog
        isOpen={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </header>
  );
});

Header.displayName = 'Header';
