'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { gsap } from 'gsap';
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
import Image from 'next/image';

// Navigation structure organized into sections like BERRY design
const navigationSections = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Leads', href: '/leads', icon: Users },
      { name: 'Orders', href: '/orders', icon: ShoppingCart },
      { name: 'Employees', href: '/employees', icon: UserCheck },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Collectors', href: '/collectors', icon: Truck },
      { name: 'Scrap Yards', href: '/scrap-yards', icon: Building2 },
      { name: 'Payments', href: '/payments', icon: CreditCard },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onCollapse?: (collapsed: boolean) => void;
  isCollapsed?: boolean;
}

export function Sidebar({ isOpen = true, onToggle, onCollapse, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  useEffect(() => {
    onCollapse?.(isCollapsed);
  }, [isCollapsed, onCollapse]);

  // Enhanced shining effect for active items
  const createShiningEffect = useCallback((element: HTMLElement) => {
    const shine = document.createElement('div');
    shine.className = 'absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12 -translate-x-full';
    
    element.appendChild(shine);
    
    gsap.to(shine, {
      x: '200%',
      duration: 1.2,
      ease: "power2.inOut",
      onComplete: () => {
        if (element.contains(shine)) {
          element.removeChild(shine);
        }
      }
    });
  }, []);

  // GSAP animations for menu items
  useEffect(() => {
    if (!sidebarRef.current) return;

    // Animate menu items on mount with stagger effect
    const menuItems = sidebarRef.current.querySelectorAll('.menu-item');
    
    gsap.fromTo(menuItems, 
      { 
        opacity: 0, 
        x: -30,
        scale: 0.8,
        rotationY: -15
      },
      { 
        opacity: 1, 
        x: 0,
        scale: 1,
        rotationY: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out"
      }
    );

    // Enhanced hover animations with GSAP
    menuItems.forEach((item) => {
      const icon = item.querySelector('.menu-icon');
      const text = item.querySelector('.menu-text');
      const itemElement = item as HTMLElement;
      
      if (icon && text) {
        // Mouse enter animations
        item.addEventListener('mouseenter', () => {
          gsap.to(icon, {
            scale: 1.3,
            rotation: 360,
            duration: 0.5,
            ease: "back.out(1.7)"
          });
          
          gsap.to(text, {
            x: 8,
            duration: 0.4,
            ease: "power2.out"
          });

          gsap.to(itemElement, {
            scale: 1.02,
            duration: 0.3,
            ease: "power2.out"
          });
        });

        // Mouse leave animations
        item.addEventListener('mouseleave', () => {
          gsap.to(icon, {
            scale: 1,
            rotation: 0,
            duration: 0.4,
            ease: "power2.out"
          });
          
          gsap.to(text, {
            x: 0,
            duration: 0.4,
            ease: "power2.out"
          });

          gsap.to(itemElement, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        });

        // Click animation for active items
        item.addEventListener('click', () => {
          if (item.classList.contains('active')) {
            createShiningEffect(itemElement);
            
            gsap.to(icon, {
              scale: 1.5,
              duration: 0.2,
              yoyo: true,
              repeat: 1,
              ease: "power2.inOut"
            });
          }
        });
      }
    });

    return () => {
      // Cleanup animations
      gsap.killTweensOf(menuItems);
    };
  }, [isOpen, createShiningEffect]);

  // Auto-shining effect for active items
  useEffect(() => {
    const activeMenuItem = sidebarRef.current?.querySelector('.menu-item.active') as HTMLElement;
    if (activeMenuItem && activeItem !== pathname) {
      setActiveItem(pathname);
      createShiningEffect(activeMenuItem);
    }
  }, [pathname, createShiningEffect, activeItem]);

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
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 flex flex-col bg-white text-gray-800 transition-all duration-300 ease-in-out shadow-lg border-r border-gray-200",
          "z-50 h-screen",
          "w-64",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header with BERRY Logo */}
        <div className="flex flex-shrink-0 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 justify-between items-center px-4 h-16 border-b border-gray-200 bg-white">
          <div className={cn(
            "flex items-center transition-all duration-200",
            isCollapsed ? "lg:justify-center lg:w-full" : "space-x-3"
          )}>
            {/* Logo */}
            <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 rounded-lg">
              <Image src="/images/logo/logo.png" alt="Logo" width={40} height={40} />
            </div>
            
            {/* Brand Text */}
            <div className={cn(
              "flex flex-col transition-opacity duration-200",
              isCollapsed ? "lg:hidden" : "block"
            )}>
              <span className="text-lg font-bold text-white">
                AussieScrapX
              </span>
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onToggle}
            className="lg:hidden flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation Sections */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-hide bg-white">
          <nav className="px-4 py-6 space-y-8">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-3">
                {/* Section Title */}
                <h3 className={cn(
                  "font-bold text-gray-800 text-sm uppercase tracking-wide",
                  isCollapsed ? "lg:hidden" : "block"
                )}>
                  {section.title}
                </h3>
                
                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item) => {
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
                          'menu-item flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden',
                          isActive
                            ? 'active bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 shadow-lg'
                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-md'
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        {/* Enhanced shining effect for active items */}
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-pulse" />
                        )}
                        
                        {/* Icon Container with Enhanced Animation */}
                        <div className={cn(
                          "menu-icon flex flex-shrink-0 justify-center items-center w-5 h-5 relative",
                          isCollapsed ? "lg:mx-auto" : ""
                        )}>
                          <item.icon className={cn(
                            "w-5 h-5 transition-all duration-300",
                            isActive ? "text-purple-700" : "text-gray-600 group-hover:text-gray-900"
                          )} />
                          
                          {/* Enhanced glow effect for active icons */}
                          {isActive && (
                            <div className="absolute inset-0 bg-purple-400/30 rounded-full blur-sm animate-pulse" />
                          )}
                          
                          {/* Hover glow effect */}
                          {isHovered && !isActive && (
                            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-sm animate-pulse" />
                          )}
                        </div>
                        
                        {/* Text with Enhanced Animation */}
                        <span className={cn(
                          "menu-text ml-3 transition-all duration-200",
                          isCollapsed ? "lg:opacity-0 lg:w-0 lg:ml-0" : "opacity-100"
                        )}>
                          {item.name}
                        </span>
                        
                        {/* Tooltip for collapsed state - Desktop only */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 hidden lg:block shadow-md">
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
      </div>
    </>
  );
}

// Mobile Menu Button Component - Updated to match the design
export function MobileMenuButton({ onToggle, isOpen }: { onToggle: () => void; isOpen: boolean }) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden flex items-center justify-center w-10 h-10 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all duration-200"
      title={isOpen ? "Close menu" : "Open menu"}
    >
      <div className="flex flex-col justify-center items-center w-5 h-4 space-y-0.5">
        <span className={`block w-5 h-0.5 bg-purple-600 rounded-full transform transition-all duration-200 ${
          isOpen ? 'rotate-45 translate-y-1.5' : 'translate-y-0'
        }`} />
        <span className={`block w-5 h-0.5 bg-purple-600 rounded-full transition-all duration-200 ${
          isOpen ? 'opacity-0' : 'opacity-100'
        }`} />
        <span className={`block w-5 h-0.5 bg-purple-600 rounded-full transform transition-all duration-200 ${
          isOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-0'
        }`} />
      </div>
    </button>
  );
}
