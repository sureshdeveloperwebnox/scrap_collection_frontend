'use client';

import { DashboardStats } from '@/components/dashboard-stats';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, !</h1>
                     <p className="text-gray-600">Here&apos;s what&apos;s happening with your scrap collection service today.</p>
        </div>
      </div>
      
      <DashboardStats />
      
      {/* Quick Actions */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-lg border border-gray-200 transition-shadow cursor-pointer hover:shadow-md">
            <div className="flex items-center space-x-3">
              <div className="flex justify-center items-center w-10 h-10 bg-primary/10 rounded-lg">
                <span className="text-primary">📄</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">New Order</h3>
                <p className="text-sm text-gray-500">Create a new collection order</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-gray-200 transition-shadow cursor-pointer hover:shadow-md">
            <div className="flex items-center space-x-3">
              <div className="flex justify-center items-center w-10 h-10 bg-green-100 rounded-lg">
                <span className="text-green-600">👥</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Add Lead</h3>
                <p className="text-sm text-gray-500">Add a new potential customer</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-gray-200 transition-shadow cursor-pointer hover:shadow-md">
            <div className="flex items-center space-x-3">
              <div className="flex justify-center items-center w-10 h-10 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600">🚛</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Manage Collectors</h3>
                <p className="text-sm text-gray-500">View and manage collectors</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-gray-200 transition-shadow cursor-pointer hover:shadow-md">
            <div className="flex items-center space-x-3">
              <div className="flex justify-center items-center w-10 h-10 bg-violet-100 rounded-lg">
                <span className="text-violet-600">📊</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">View Reports</h3>
                <p className="text-sm text-gray-500">Generate business reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h2>
        {/* Add recent activity content here */}
      </div>
    </div>
  );
} 