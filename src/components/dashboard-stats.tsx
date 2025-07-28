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
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row justify-between items-center pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-md ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};