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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6 tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="group p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-white hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="flex justify-center items-center w-12 h-12 bg-white rounded-xl shadow-sm group-hover:bg-indigo-50 transition-colors">
                  <span className="text-xl">📄</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">New Order</h3>
                  <p className="text-sm text-gray-500 font-medium">Create a collection order</p>
                </div>
              </div>
            </div>

            <div className="group p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-white hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="flex justify-center items-center w-12 h-12 bg-white rounded-xl shadow-sm group-hover:bg-emerald-50 transition-colors">
                  <span className="text-xl">👥</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Add Lead</h3>
                  <p className="text-sm text-gray-500 font-medium">New potential customer</p>
                </div>
              </div>
            </div>

            <div className="group p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-white hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="flex justify-center items-center w-12 h-12 bg-white rounded-xl shadow-sm group-hover:bg-amber-50 transition-colors">
                  <span className="text-xl">🚛</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Collectors</h3>
                  <p className="text-sm text-gray-500 font-medium">View and manage fleet</p>
                </div>
              </div>
            </div>

            <div className="group p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-white hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="flex justify-center items-center w-12 h-12 bg-white rounded-xl shadow-sm group-hover:bg-cyan-50 transition-colors">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Reports</h3>
                  <p className="text-sm text-gray-500 font-medium">Business analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6 tracking-tight">Activity</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2 ring-4 ring-cyan-50" />
              <div>
                <p className="text-sm font-bold text-gray-900 leading-none">New lead registered</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">12h ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 ring-4 ring-indigo-50" />
              <div>
                <p className="text-sm font-bold text-gray-900 leading-none">Order #4421 shipped</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">15h ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 ring-4 ring-rose-50" />
              <div>
                <p className="text-sm font-bold text-gray-900 leading-none">Payment received</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">1d ago</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-8 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
} 