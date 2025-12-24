'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats as DashboardStatsType } from '@/types';
import {
  Users,
  ShoppingCart,
  Truck,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react';

export const DashboardStats = () => {
  // Mock data for now - you can replace with actual data later
  const stats: DashboardStatsType = {
    totalLeads: 150,
    totalOrders: 89,
    activeCollectors: 12,
    todayRevenue: 2500,
    weeklyOrders: 45,
    monthlyRevenue: 15000,
  };

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Collectors',
      value: stats.activeCollectors.toString(),
      icon: Truck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Today Revenue',
      value: `$${stats.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Weekly Orders',
      value: stats.weeklyOrders.toString(),
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-[2rem] p-6 shadow-sm border-none transition-all hover:shadow-xl hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center flex-shrink-0 shadow-inner`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">
                {stat.title}
              </div>
              <div className="text-2xl font-black text-gray-900 mt-1">
                {stat.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};