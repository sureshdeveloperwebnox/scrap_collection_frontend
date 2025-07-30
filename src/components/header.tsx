'use client';

import { Search, Bell, Grid3X3, Maximize } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-gradient-to-r from-[#a280ed] to-[#a280ed] shadow-md rounded-b-2xl h-16 flex items-center justify-between px-4 lg:px-6 mx-4 lg:mx-6 mt-4">
      <div className="flex flex-1 items-center">
        <h1 className="text-lg lg:text-xl font-semibold text-[#1F1F1F] ml-12 lg:ml-0">
          Scrap Collection Admin
        </h1>
      </div>
      
      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* Search - Hidden on small mobile */}
        <div className="hidden relative sm:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#1F1F1F]/60 h-4 w-4" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-40 lg:w-64 border border-white/30 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm bg-white/20 backdrop-blur-sm text-[#1F1F1F] placeholder-[#1F1F1F]/60"
          />
        </div>
        
        {/* Search icon for mobile */}
        <button className="sm:hidden p-2 text-[#1F1F1F] hover:text-[#1F1F1F]/80 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105">
          <Search className="w-5 h-5" />
        </button>
        
        {/* Action buttons - Some hidden on mobile */}
        <button className="hidden lg:flex p-2 text-[#1F1F1F] hover:text-[#1F1F1F]/80 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105">
          <Grid3X3 className="w-5 h-5" />
        </button>
        
        <button className="hidden lg:flex p-2 text-[#1F1F1F] hover:text-[#1F1F1F]/80 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105">
          <Maximize className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-[#1F1F1F] hover:text-[#1F1F1F]/80 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 relative">
          <Bell className="w-5 h-5" />
        </button>
        
        {/* User Avatar */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-[#1F1F1F] to-[#2d2d2d] rounded-full flex items-center justify-center shadow-md">
            <span className="text-sm font-medium text-white">A</span>
          </div>
          <button className="hidden sm:block text-sm text-[#1F1F1F] hover:text-[#1F1F1F]/80 transition-all duration-300 hover:scale-105">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
