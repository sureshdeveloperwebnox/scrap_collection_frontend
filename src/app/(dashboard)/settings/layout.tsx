'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const settingsMenu = [
    {
      name: 'Admin Settings',
      href: '/settings/admin',
      icon: Settings,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your application settings</p>
      </div>

      {/* Submenu */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {settingsMenu.map((item) => {
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

