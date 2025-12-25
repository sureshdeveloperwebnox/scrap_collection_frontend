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
const BarChartCard = lazy(() => import('@/components/analytics-card').then(mod => ({ default: mod.BarChartCard })));

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


    // Memoized Stats Section
    const StatsSection = useMemo(() => (
        <section aria-label="Key Performance Metrics">
            <m.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
            >
                {/* 1. TOTAL LEADS - HOLOGRAPHIC CYAN */}
                <m.article
                    variants={cardVariants}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="relative overflow-hidden group h-[200px] rounded-[40px] p-1 transition-all duration-500 shadow-[0_20px_50px_rgba(6,182,212,0.3)] hover:shadow-[0_40px_120px_rgba(6,182,212,0.6)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00D2FF] to-[#3a7bd5]" />

                    {/* Pulsing Central Glow */}
                    <m.div
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_75%)] pointer-events-none"
                    />

                    {/* NEW: Holographic Liquid Wave Shine */}
                    <m.div
                        animate={{
                            x: ['-150%', '150%'],
                            rotate: [25, 35],
                            scaleY: [1, 1.2, 1]
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-y-[-50%] w-[120%] bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[40px] z-20 pointer-events-none"
                    />

                    {/* Glossy Top Edge Light */}
                    <div className="absolute top-[2px] left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent z-30" />

                    {/* Glass Surface Overlay */}
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] m-1 rounded-[39px] border border-white/20 z-10" />

                    <div className="relative z-30 flex flex-col justify-between h-full p-6 text-white">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-[22px] border border-white/40 shadow-xl">
                                <UserPlus className="w-6 h-6 text-white" />
                            </div>
                            <m.div
                                animate={{ boxShadow: ["0 0 0px transparent", "0 0 20px rgba(255,255,255,0.4)", "0 0 0px transparent"] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="px-3 py-1.5 bg-black/10 backdrop-blur-xl rounded-full border border-white/20 text-[11px] font-black tracking-tight"
                            >
                                <TrendingUp size={14} className="inline mr-1" />
                                {stats.leads.trend}%
                            </m.div>
                        </div>

                        <div>
                            <p className="text-[11px] font-bold text-white/60 uppercase tracking-[3px] mb-1">Total Leads</p>
                            <div className="text-5xl font-black tracking-tighter drop-shadow-2xl">
                                {loading ? '...' : stats.leads.total.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </m.article>

                {/* 2. TOTAL CUSTOMERS - HOLOGRAPHIC PURPLE */}
                <m.article
                    variants={cardVariants}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="relative overflow-hidden group h-[200px] rounded-[40px] p-1 transition-all duration-500 shadow-[0_20px_50px_rgba(168,85,247,0.3)] hover:shadow-[0_40px_120px_rgba(168,85,247,0.6)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7] to-[#7E22CE]" />

                    <m.div
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_75%)] pointer-events-none"
                    />

                    <m.div
                        animate={{
                            x: ['-150%', '150%'],
                            rotate: [-25, -35],
                            scaleY: [1, 1.2, 1]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-y-[-50%] w-[120%] bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[40px] z-20 pointer-events-none"
                    />

                    <div className="absolute top-[2px] left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent z-30" />
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] m-1 rounded-[39px] border border-white/20 z-10" />

                    <div className="relative z-30 flex flex-col justify-between h-full p-6 text-white text-shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-[22px] border border-white/40 shadow-xl">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <m.div
                                animate={{ boxShadow: ["0 0 0px transparent", "0 0 20px rgba(255,255,255,0.4)", "0 0 0px transparent"] }}
                                transition={{ duration: 2.2, repeat: Infinity }}
                                className="px-3 py-1.5 bg-black/10 backdrop-blur-xl rounded-full border border-white/20 text-[11px] font-black tracking-tight"
                            >
                                <TrendingUp size={14} className="inline mr-1" />
                                {stats.customers.trend}%
                            </m.div>
                        </div>

                        <div>
                            <p className="text-[11px] font-bold text-white/60 uppercase tracking-[3px] mb-1">Total Customers</p>
                            <div className="text-5xl font-black tracking-tighter drop-shadow-2xl">
                                {loading ? '...' : stats.customers.total.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </m.article>

                {/* 3. TOTAL ORDERS - HOLOGRAPHIC ORANGE */}
                <m.article
                    variants={cardVariants}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="relative overflow-hidden group h-[200px] rounded-[40px] p-1 transition-all duration-500 shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:shadow-[0_40px_120px_rgba(249,115,22,0.6)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF9F0A] to-[#FF3B30]" />

                    <m.div
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_75%)] pointer-events-none"
                    />

                    <m.div
                        animate={{
                            x: ['-150%', '150%'],
                            rotate: [20, 30],
                            scaleY: [1, 1.3, 1]
                        }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-y-[-50%] w-[120%] bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[40px] z-20 pointer-events-none"
                    />

                    <div className="absolute top-[2px] left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent z-30" />
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] m-1 rounded-[39px] border border-white/20 z-10" />

                    <div className="relative z-30 flex flex-col justify-between h-full p-6 text-white text-shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-[22px] border border-white/40 shadow-xl">
                                <ShoppingCart className="w-6 h-6 text-white" />
                            </div>
                            <m.div
                                animate={{ boxShadow: ["0 0 0px transparent", "0 0 20px rgba(255,255,255,0.4)", "0 0 0px transparent"] }}
                                transition={{ duration: 1.8, repeat: Infinity }}
                                className="px-3 py-1.5 bg-black/10 backdrop-blur-xl rounded-full border border-white/20 text-[11px] font-black tracking-tight"
                            >
                                <TrendingUp size={14} className="inline mr-1" />
                                {stats.orders.trend}%
                            </m.div>
                        </div>

                        <div>
                            <p className="text-[11px] font-bold text-white/60 uppercase tracking-[3px] mb-1">Total Orders</p>
                            <div className="text-5xl font-black tracking-tighter drop-shadow-2xl">
                                {loading ? '...' : stats.orders.total.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </m.article>

                {/* 4. TOTAL REVENUE - HOLOGRAPHIC EMERALD */}
                <m.article
                    variants={cardVariants}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="relative overflow-hidden group h-[200px] rounded-[40px] p-1 transition-all duration-500 shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:shadow-[0_40px_120px_rgba(16,185,129,0.6)]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#30D158] to-[#1D976C]" />

                    <m.div
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_75%)] pointer-events-none"
                    />

                    <m.div
                        animate={{
                            x: ['-150%', '150%'],
                            rotate: [-20, -30],
                            scaleY: [1, 1.4, 1]
                        }}
                        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-y-[-50%] w-[120%] bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[40px] z-20 pointer-events-none"
                    />

                    <div className="absolute top-[2px] left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent z-30" />
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] m-1 rounded-[39px] border border-white/20 z-10" />

                    <div className="relative z-30 flex flex-col justify-between h-full p-6 text-white text-shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-[22px] border border-white/40 shadow-xl">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <m.div
                                animate={{ boxShadow: ["0 0 0px transparent", "0 0 20px rgba(255,255,255,0.4)", "0 0 0px transparent"] }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                                className="px-3 py-1.5 bg-black/10 backdrop-blur-xl rounded-full border border-white/20 text-[11px] font-black tracking-tight"
                            >
                                ↗
                                <span className="ml-1">Growth</span>
                            </m.div>
                        </div>

                        <div>
                            <p className="text-[11px] font-bold text-white/60 uppercase tracking-[3px] mb-1">Net Revenue</p>
                            <div className="text-4xl font-extrabold tracking-tighter drop-shadow-2xl">
                                ₹{loading ? '...' : stats.orders.revenue.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </m.article>
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tighter">Dashboard</h1>
                    <p className="text-gray-500 font-medium">Welcome back! Here's what's happening today.</p>
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
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Detailed Analytics</h2>
                        <p className="text-gray-400 font-medium text-sm">Performance metrics and trends across your organization</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 p-1 bg-gray-100/50 rounded-2xl border border-gray-200/50">
                        <button className="px-4 py-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-cyan-600 transition-all">Export Report</button>
                    </div>
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
                        <BarChartCard
                            title="Collector Activity"
                            chartData={(analyticsData?.collectorsChart || [2.5, 3.2, 2.8, 3.5, 4.1, 3.8, 4.5]).map((val: number, i: number) => ({
                                name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] || '',
                                value: val
                            }))}
                            color="green"
                        />
                    </div>
                </Suspense>
            </m.div>
        </main>
    );
}
