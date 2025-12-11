'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, DollarSign, Truck, Calendar, Download } from 'lucide-react';

export default function ReportsPage() {
  const reportData = {
    daily: {
      pickups: 25,
      revenue: 12500,
      collectors: 8,
      leads: 45,
    },
    weekly: {
      pickups: 167,
      revenue: 87500,
      collectors: 12,
      leads: 324,
    },
    monthly: {
      pickups: 689,
      revenue: 345000,
      collectors: 15,
      leads: 1250,
    },
  };

  const collectorPerformance = [
    { name: 'Tom Collector', pickups: 45, revenue: 22500, rating: 4.8 },
    { name: 'Lisa Driver', pickups: 38, revenue: 19000, rating: 4.6 },
    { name: 'Mark Handler', pickups: 32, revenue: 16000, rating: 4.9 },
    { name: 'Sam Pickup', pickups: 28, revenue: 14000, rating: 4.7 },
  ];

  const revenueByVehicleType = [
    { type: 'Car', revenue: 145000, percentage: 42 },
    { type: 'Truck', revenue: 120000, percentage: 35 },
    { type: 'Bike', revenue: 60000, percentage: 17 },
    { type: 'Boat', revenue: 20000, percentage: 6 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex items-center space-x-2">
          <Select defaultValue="monthly">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Truck className="mr-2 h-4 w-4 text-blue-500" />
              Monthly Pickups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.monthly.pickups}</div>
            <div className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${reportData.monthly.revenue.toLocaleString()}</div>
            <div className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3" />
              +8.3% from last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="mr-2 h-4 w-4 text-violet-500" />
              Active Collectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.monthly.collectors}</div>
            <div className="text-sm text-gray-500 mt-1">
              3 new this month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="mr-2 h-4 w-4 text-orange-500" />
              Monthly Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.monthly.leads}</div>
            <div className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3" />
              +15.2% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collector Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Collectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collectorPerformance.map((collector, index) => (
                <div key={collector.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-violet-600">#{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{collector.name}</div>
                      <div className="text-sm text-gray-500">
                        {collector.pickups} pickups • Rating: {collector.rating}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${collector.revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Vehicle Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Vehicle Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueByVehicleType.map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.type}</span>
                    <span className="text-sm text-gray-500">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-violet-600 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Revenue</span>
                    <span className="font-medium">${item.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-600">{reportData.weekly.pickups}</div>
              <div className="text-sm text-gray-600">Pickups This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${reportData.weekly.revenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Revenue This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-600">{reportData.weekly.leads}</div>
              <div className="text-sm text-gray-600">New Leads This Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}