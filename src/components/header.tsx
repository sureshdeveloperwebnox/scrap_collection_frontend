'use client';

import { Search, Bell, Grid3X3, Maximize, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { useSignOut } from '@/hooks/use-auth';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onToggleSidebar, isSidebarOpen = false }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const signOutMutation = useSignOut();
  
  const handleSignOut = () => {
    signOutMutation.mutate();
  };
  
  return (
    <header className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-md rounded-b-2xl h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 mx-2 sm:mx-4 lg:mx-6 mt-2 sm:mt-4">
      <div className="flex flex-1 items-center min-w-0">
        {/* Burger Menu Button - Mobile and Desktop */}
        <button
          onClick={onToggleSidebar}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white/30 text-[#1F1F1F] rounded-lg hover:bg-white/50 transition-all duration-300 hover:scale-105 mr-2 sm:mr-3 lg:mr-4 border border-white/20 flex-shrink-0"
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {/* Animated burger menu icon */}
          <div className="flex flex-col justify-center items-center w-4 h-4 sm:w-5 sm:h-5">
            {/* Top line */}
            <span 
              className={`block w-4 sm:w-5 h-0.5 bg-[#1F1F1F] transform transition-all duration-300 ease-in-out ${
                isSidebarOpen ? 'rotate-45 translate-y-1.5' : 'translate-y-0'
              }`}
            />
            {/* Middle line */}
            <span 
              className={`block w-4 sm:w-5 h-0.5 bg-[#1F1F1F] transform transition-all duration-300 ease-in-out mt-1 ${
                isSidebarOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            {/* Bottom line */}
            <span 
              className={`block w-4 sm:w-5 h-0.5 bg-[#1F1F1F] transform transition-all duration-300 ease-in-out mt-1 ${
                isSidebarOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-0'
              }`}
            />
          </div>
        </button>
        
        <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-white truncate">
          Scrap Collection Admin
        </h1>
      </div>
      
      <div className="flex flex-shrink-0 items-center space-x-1 sm:space-x-2 lg:space-x-4">
        {/* Search - Responsive */}
        <div className="hidden relative sm:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1F1F1F]/60 h-4 w-4" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-32 sm:w-40 lg:w-64 border border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm bg-white/20 backdrop-blur-sm text-[#1F1F1F] placeholder-[#1F1F1F]/60"
          />
        </div>
        
        {/* Search icon for mobile */}
        <button className="sm:hidden p-2 text-[#1F1F1F] hover:text-[#1F1F1F]/80 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105">
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        {/* Action buttons - Responsive visibility */}
        <button className="hidden md:flex p-2 text-[#1F1F1F] hover:text-[#1F1F1F]/80 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105">
          <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        <button className="hidden lg:flex p-2 text-[#1F1F1F] hover:text-[#1F1F1F]/80 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105">
          <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        <button className="p-2 text-[#1F1F1F] hover:text-[#1F1F1F]/80 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 relative">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        
        {/* User Avatar - Responsive */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-[#1F1F1F] to-[#2d2d2d] rounded-full flex items-center justify-center shadow-md flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-medium text-[#1F1F1F]">
              {user?.name || 'User'}
            </span>
            <span className="text-xs text-[#1F1F1F]/70">
              {user?.role || 'Admin'}
            </span>
          </div>
          <button 
            onClick={handleSignOut}
            disabled={signOutMutation.isPending}
            className="hidden sm:flex items-center space-x-1 text-xs sm:text-sm text-[#1F1F1F] hover:text-[#1F1F1F]/80 transition-all duration-300 hover:scale-105 whitespace-nowrap disabled:opacity-50"
          >
            <LogOut className="w-3 h-3" />
            <span>{signOutMutation.isPending ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
