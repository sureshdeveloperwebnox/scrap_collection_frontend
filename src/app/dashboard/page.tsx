'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/components/dashboard-stats';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { useSignOut } from '@/hooks/use-auth';

export default function DashboardPage() {
  const router = useRouter();
  const signOutMutation = useSignOut();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/auth/signin');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleSignOut = () => {
    signOutMutation.mutate();
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {/* Welcome Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user.name}!
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Here's what's happening with your scrap collection service today.
                  </p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  disabled={signOutMutation.isPending}
                >
                  {signOutMutation.isPending ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            </div>

            {/* Dashboard Stats */}
            <DashboardStats />

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/orders">
                  <Card className="p-6 transition-shadow cursor-pointer hover:shadow-md">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">New Order</h3>
                        <p className="text-sm text-gray-500">Create a new collection order</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/leads">
                  <Card className="p-6 transition-shadow cursor-pointer hover:shadow-md">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M18 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Add Lead</h3>
                        <p className="text-sm text-gray-500">Add a new potential customer</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/collectors">
                  <Card className="p-6 transition-shadow cursor-pointer hover:shadow-md">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0h6m-6 0l-1 12a1 1 0 01-1 1h8a1 1 0 01-1-1L15 7H9z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Manage Collectors</h3>
                        <p className="text-sm text-gray-500">View and manage collectors</p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/reports">
                  <Card className="p-6 transition-shadow cursor-pointer hover:shadow-md">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">View Reports</h3>
                        <p className="text-sm text-gray-500">Generate business reports</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Recent Activity</h2>
              <Card className="p-6">
                <div className="py-8 text-center">
                  <p className="text-gray-500">No recent activity to display</p>
                  <p className="mt-2 text-sm text-gray-400">
                    Recent orders, collections, and updates will appear here
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 