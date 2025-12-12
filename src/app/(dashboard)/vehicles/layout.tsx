'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Car, List, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const vehiclesMenu = [
    {
      name: 'Vehicle Types',
      href: '/vehicles/types',
      icon: Car,
    },
    {
      name: 'Vehicle Names',
      href: '/vehicles/names',
      icon: List,
    },
    {
      name: 'Collector Assignment',
      href: '/vehicles/collectors',
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submenu */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {vehiclesMenu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  );
}
