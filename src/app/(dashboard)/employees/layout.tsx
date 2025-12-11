'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserCheck, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmployeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const employeesMenu = [
    {
      name: 'Employees',
      href: '/employees',
      icon: UserCheck,
    },
    {
      name: 'Roles',
      href: '/employees/roles',
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submenu */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {employeesMenu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/employees' && pathname.startsWith(item.href));
            
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

