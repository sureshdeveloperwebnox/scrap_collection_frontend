'use client';

import { Search, Bell, MessageCircle, Moon, Menu, ChevronDown, Calendar, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { useSignOut } from '@/hooks/use-auth';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onToggleSidebar, isSidebarOpen = false }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    <header className="bg-white shadow-sm border border-gray-200 rounded-2xl h-16 flex items-center justify-between px-4 ml-2 mr-4 mt-4">
      <div className="flex flex-1 items-center min-w-0 space-x-4">
        {/* Hamburger Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="flex items-center justify-center w-9 h-9 text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 flex-shrink-0"
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <span>Apps</span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                appsDropdownOpen && "rotate-180"
              )} />
            </button>
            
            {/* Dropdown Menu */}
            {appsDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  All Apps
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  Recent Apps
                </button>
              </div>
            )}
          </div>
          
          <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
            <MessageCircle className="w-4 h-4 mr-1.5" />
            <span>Chat</span>
          </button>
          
          <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
            <Calendar className="w-4 h-4 mr-1.5" />
            <span>Calendar</span>
          </button>
          
          <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
            <Mail className="w-4 h-4 mr-1.5" />
            <span>Email</span>
          </button>
        </div>
      </div>
      
      {/* Center Search Bar */}
      <div className="hidden lg:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Try to searching..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-gray-50"
          />
        </div>
      </div>
      
      {/* Right Side Icons and User */}
      <div className="flex flex-shrink-0 items-center space-x-3">
        {/* Dark Mode Toggle */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
          <Moon className="w-5 h-5" />
        </button>
        
        {/* Chat Icon */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all relative">
          <MessageCircle className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        {/* Notifications */}
        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        {/* User Profile */}
        <div className="flex items-center space-x-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'M'}
            </span>
          </div>
          <div className="hidden xl:flex flex-col">
            <span className="text-sm font-semibold text-gray-900">
              {user?.name || 'Mike Nielsen'}
            </span>
            <span className="text-xs text-gray-600">
              {user?.role || 'Admin'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
