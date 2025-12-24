'use client';

import { useEffect, useState, lazy, Suspense, useMemo } from 'react';
import { m } from 'framer-motion';
import {
    Users,
    UserPlus,
    ShoppingCart,
    TrendingUp,
    TrendingDown,
    Package,
    Calendar,
    DollarSign,
    Activity
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useDashboardCombinedData } from '@/hooks';
import { cn } from '@/lib/utils';
import { leadsApi } from '@/lib/api/leads';
import { customersApi } from '@/lib/api/customers';
import { ordersApi } from '@/lib/api/orders';

// Dynamic imports for better code splitting
const MinimalAnalyticsCard = lazy(() => import('@/components/analytics-card').then(mod => ({ default: mod.MinimalAnalyticsCard })));
const AreaChartCard = lazy(() => import('@/components/analytics-card').then(mod => ({ default: mod.AreaChartCard })));

interface DashboardStats {
    leads: {
        total: number;
        new: number;
        converted: number;
        trend: number;
    };
    customers: {
        total: number;
        active: number;
        inactive: number;
        trend: number;
    };
    orders: {
        total: number;
        pending: number;
        completed: number;
        revenue: number;
        trend: number;
    };
}

import { DashboardSkeleton } from '@/components/ui/skeleton-dashboard';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const organizationId = user?.organizationId;
    const { data: dashboardData, isLoading: loading } = useDashboardCombinedData(organizationId);

    const stats = dashboardData?.stats || {
        leads: { total: 0, new: 0, converted: 0, trend: 0 },
        customers: { total: 0, active: 0, inactive: 0, trend: 0 },
        orders: { total: 0, pending: 0, completed: 0, revenue: 0, trend: 0 }
    };

    const analyticsData: any = dashboardData?.analytics || {
        totalRevenue: 0,
        totalOrders: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        revenueChart: [1543, 1650, 1720, 1580, 1890, 1750, 2100, 1950, 2200, 2543],
        ordersChart: [45, 52, 48, 58, 65, 62, 70],
        collectorsChart: [2.5, 3.2, 2.8, 3.5, 4.1, 3.8, 4.5]
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 12
            }
        }
    };



    // Memoized Stats Section to prevent re-renders
    const StatsSection = useMemo(() => (
        <section aria-label="Key Performance Metrics">
            <m.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                role="region"
                aria-label="Statistics overview"
            >
                {/* Total Leads Card */}
                <m.article
                    variants={cardVariants}
                    whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 group"
                    aria-label={`Total leads: ${stats.leads.total}`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-cyan-50 rounded-2xl group-hover:bg-cyan-100 transition-colors duration-300" aria-hidden="true">
                            <UserPlus className="w-6 h-6 text-cyan-600" />
                        </div>
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
                            stats.leads.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )} aria-label={`Trend: ${stats.leads.trend >= 0 ? 'up' : 'down'} ${Math.abs(stats.leads.trend)} percent`}>
                            {stats.leads.trend >= 0 ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
                            {Math.abs(stats.leads.trend)}%
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-3xl font-semibold text-gray-900 tracking-tight" aria-live="polite">{loading ? '...' : stats.leads.total.toLocaleString()}</span>
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest opacity-80">Total Leads</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">New Today</span>
                        <span className="text-xs font-bold text-gray-700">{stats.leads.new}</span>
                    </div>
                </m.article>

                {/* Total Customers Card */}
                <m.div
                    variants={cardVariants}
                    whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-2xl group-hover:bg-purple-100 transition-colors duration-300">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
                            stats.customers.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                            {stats.customers.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(stats.customers.trend)}%
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-3xl font-semibold text-gray-900 tracking-tight">{loading ? '...' : stats.customers.total.toLocaleString()}</span>
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest opacity-80">Total Customers</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Active Now</span>
                        <span className="text-xs font-bold text-gray-700">{stats.customers.active}</span>
                    </div>
                </m.div>

                {/* Total Orders Card */}
                <m.div
                    variants={cardVariants}
                    whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-50 rounded-2xl group-hover:bg-orange-100 transition-colors duration-300">
                            <ShoppingCart className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
                            stats.orders.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                            {stats.orders.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(stats.orders.trend)}%
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-3xl font-semibold text-gray-900 tracking-tight">{loading ? '...' : stats.orders.total.toLocaleString()}</span>
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest opacity-80">Total Orders</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Completed</span>
                        <span className="text-xs font-bold text-gray-700">{stats.orders.completed}</span>
                    </div>
                </m.div>

                {/* Revenue Card */}
                <m.div
                    variants={cardVariants}
                    whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-100 transition-colors duration-300">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className={cn(
                            "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full",
                            stats.orders.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                            {stats.orders.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(stats.orders.trend)}%
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-3xl font-semibold text-gray-900 tracking-tight">₹{loading ? '...' : stats.orders.revenue.toLocaleString()}</span>
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest opacity-80">Total Revenue</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">This Month</span>
                        <span className="text-xs font-bold text-gray-700">₹{stats.orders.revenue.toLocaleString()}</span>
                    </div>
                </m.div>
            </m.div>
        </section>
    ), [stats, loading, containerVariants, cardVariants]);

    // Show high-fidelity skeleton while loading
    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 lg:p-8" role="main" aria-label="Dashboard">
            {/* Header */}
            <header>
                <m.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                    <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
                </m.div>
            </header>

            {/* Stats Cards - Memoized */}
            {StatsSection}


            {/* Detailed Analytics Section */}
            <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
            >
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
                    <p className="text-gray-600">Performance metrics and trends</p>
                </div>

                <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px] items-center justify-center p-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200"><Activity className="h-8 w-8 animate-spin text-gray-400" /></div>}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue Trends */}
                        <MinimalAnalyticsCard
                            title="Revenue Trends"
                            mainValue={`₹${(analyticsData?.totalRevenue || 40450).toLocaleString()}`}
                            change={analyticsData?.revenueGrowth || 5.45}
                            changeLabel={`₹${((analyticsData?.totalRevenue || 40450) * 0.35).toLocaleString()}`}
                            metrics={[
                                { label: '24h Vol', value: `₹${((analyticsData?.totalRevenue || 40450) * 0.6).toLocaleString()}` },
                                { label: 'High Price', value: `₹${((analyticsData?.totalRevenue || 40450) * 0.038).toLocaleString()}` },
                                { label: 'Low Price', value: `₹${((analyticsData?.totalRevenue || 40450) * 0.063).toLocaleString()}` }
                            ]}
                            chartData={analyticsData?.revenueChart || [1543, 1650, 1720, 1580, 1890, 1750, 2100, 1950, 2200, 2543]}
                            labels={['1D', '1W', '1M', '3M', '1Y']}
                            color="cyan"
                            showFilters={true}
                        />

                        {/* Orders Performance */}
                        <AreaChartCard
                            title="Orders Status"
                            chartData={analyticsData?.ordersChart || [3.2, 4.1, 3.8, 4.5, 4.2, 3.9, 4.8]}
                            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                            color="cyan"
                            maxValue={5}
                        />

                        {/* Weekly Performance */}
                        <MinimalAnalyticsCard
                            title="Weekly Performance"
                            mainValue={analyticsData?.totalOrders || 1835}
                            change={analyticsData?.ordersGrowth || 8.3}
                            changeLabel="vs last week"
                            chartData={analyticsData?.ordersChart || [45, 52, 48, 58, 65, 62, 70]}
                            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                            color="blue"
                            showFilters={false}
                        />

                        {/* Collectors Activity */}
                        <AreaChartCard
                            title="Collector Activity"
                            chartData={analyticsData?.collectorsChart || [2.5, 3.2, 2.8, 3.5, 4.1, 3.8, 4.5]}
                            labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                            color="green"
                            maxValue={5}
                        />
                    </div>
                </Suspense>
            </m.div>
        </main>
    );
}
