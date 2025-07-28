'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStatsCards } from '@/components/dashboard-stats';
import { DashboardStats, Order, Lead } from '@/types';

const mockStats: DashboardStats = {
  totalLeads: 245,
  totalOrders: 189,
  activeCollectors: 12,
  todayRevenue: 15750,
  weeklyOrders: 67,
  monthlyRevenue: 125000,
};

const recentOrders: Partial<Order>[] = [
  {
    id: '1',
    pickupAddress: '123 Main St, Sydney',
    vehicleType: 'car',
    status: 'pending',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2', 
    pickupAddress: '456 Oak Ave, Melbourne',
    vehicleType: 'truck',
    status: 'assigned',
    createdAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    pickupAddress: '789 Pine Rd, Brisbane',
    vehicleType: 'bike',
    status: 'in-progress',
    createdAt: new Date('2024-01-13'),
  },
];

const recentLeads: Partial<Lead>[] = [
  {
    id: '1',
    name: 'John Smith',
    phone: '+61 400 123 456',
    vehicleType: 'car',
    status: 'new',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    phone: '+61 400 789 123',
    vehicleType: 'truck',
    status: 'contacted',
    createdAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    name: 'Mike Wilson',
    phone: '+61 400 456 789',
    vehicleType: 'bike',
    status: 'qualified',
    createdAt: new Date('2024-01-13'),
  },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      <DashboardStatsCards stats={mockStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{order.pickupAddress}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.vehicleType} • {order.createdAt?.toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'in-progress' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.phone} • {lead.vehicleType}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    lead.status === 'new' ? 'bg-gray-100 text-gray-800' :
                    lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                    lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}