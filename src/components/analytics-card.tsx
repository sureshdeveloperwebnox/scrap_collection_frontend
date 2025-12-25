'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Metric {
    label: string;
    value: string | number;
}

interface AnalyticsCardProps {
    title: string;
    mainValue: string | number;
    change?: number;
    changeLabel?: string;
    metrics?: Metric[];
    chartData?: number[];
    labels?: string[];
    color?: 'cyan' | 'blue' | 'green' | 'purple';
    showFilters?: boolean;
}

const colorMap = {
    cyan: {
        stroke: '#06b6d4',
        fill: '#06b6d4',
        text: 'text-cyan-600',
        bg: 'from-cyan-500/10 to-blue-500/5',
        border: 'border-cyan-100',
        glow: 'bg-cyan-500/10'
    },
    blue: {
        stroke: '#3b82f6',
        fill: '#3b82f6',
        text: 'text-blue-600',
        bg: 'from-blue-500/10 to-indigo-500/5',
        border: 'border-blue-100',
        glow: 'bg-blue-500/10'
    },
    green: {
        stroke: '#10b981',
        fill: '#10b981',
        text: 'text-emerald-600',
        bg: 'from-emerald-500/10 to-green-500/5',
        border: 'border-emerald-100',
        glow: 'bg-emerald-500/10'
    },
    purple: {
        stroke: '#8b5cf6',
        fill: '#8b5cf6',
        text: 'text-purple-600',
        bg: 'from-purple-500/10 to-fuchsia-500/5',
        border: 'border-purple-100',
        glow: 'bg-purple-500/10'
    }
};

export const MinimalAnalyticsCard: React.FC<AnalyticsCardProps> = ({
    title,
    mainValue,
    change,
    changeLabel,
    metrics = [],
    chartData = [],
    labels = [],
    color = 'cyan',
    showFilters = false
}) => {
    const theme = colorMap[color] || colorMap.cyan;
    const data = chartData.map((val, i) => ({
        name: labels[i] || '',
        value: val
    }));

    const filters = ['1D', '1W', '1M', '3M', '1Y', 'ALL TIME'];
    const [activeFilter, setActiveFilter] = React.useState('1W');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, scale: 1.01 }}
            className={cn(
                "relative overflow-hidden group rounded-[32px] p-6 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-6 transition-all duration-500",
                theme.border
            )}
        >
            {/* Background Gradient Accents */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.4] pointer-events-none", theme.bg)} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1.5">
                        <h3 className="text-[10px] font-black uppercase tracking-[2.5px] text-slate-500 opacity-100">{title}</h3>
                        <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{mainValue}</span>
                        {change !== undefined && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black transition-all",
                                    change >= 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                                )}>
                                    {change >= 0 ? <TrendingUp size={11} className="stroke-[4]" /> : <TrendingDown size={11} className="stroke-[4]" />}
                                    {Math.abs(change)}%
                                </span>
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{changeLabel || 'vs rest'}</span>
                            </div>
                        )}
                    </div>
                    {metrics.length > 0 && (
                        <div className="flex flex-col gap-4 text-right">
                            {metrics.map((m, idx) => (
                                <div key={idx} className="flex flex-col leading-tight">
                                    <span className="text-[9px] uppercase tracking-[1.5px] text-slate-500 font-black opacity-80">{m.label}</span>
                                    <span className="text-[11px] font-black text-slate-900 tracking-tight">{m.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="relative z-10 h-48 w-full -mx-4">
                <ResponsiveContainer width="105%" height="100%">
                    <AreaChart data={data} margin={{ top: 15, right: 30, left: 30, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.fill} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={theme.fill} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            cursor={{ stroke: theme.stroke, strokeWidth: 2, strokeDasharray: '4 4' }}
                            contentStyle={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(12px)',
                                borderRadius: '18px',
                                border: '2px solid rgba(255, 255, 255, 0.8)',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                fontSize: '11px',
                                fontWeight: '800',
                                padding: '12px 18px',
                                color: '#0f172a',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em'
                            }}
                            itemStyle={{ color: '#0f172a', fontWeight: '900' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={theme.stroke}
                            strokeWidth={4}
                            fillOpacity={1}
                            fill={`url(#gradient-${color})`}
                            dot={false}
                            activeDot={{
                                r: 6,
                                fill: theme.stroke,
                                strokeWidth: 4,
                                stroke: '#fff'
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {showFilters && (
                <div className="relative z-10 flex items-center justify-center gap-1 mt-auto bg-slate-100 p-1.5 rounded-[22px] border border-slate-200">
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={cn(
                                "flex-1 px-1 py-2 rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-widest",
                                activeFilter === f
                                    ? "bg-white text-slate-900 shadow-md border border-slate-300"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}

            {/* Holographic Liquid Wave Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        </motion.div>
    );
};

export const AreaChartCard: React.FC<{
    title: string;
    chartData?: number[];
    labels?: string[];
    color?: 'cyan' | 'blue' | 'green' | 'purple';
    maxValue?: number;
    height?: number;
}> = ({
    title,
    chartData = [],
    labels = [],
    color = 'cyan',
    maxValue,
    height = 200
}) => {
        const theme = colorMap[color] || colorMap.cyan;
        const data = chartData.map((val, i) => ({
            name: labels[i] || '',
            value: val
        }));

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className={cn(
                    "relative overflow-hidden group rounded-[32px] p-8 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-8 transition-all duration-500",
                    theme.border
                )}
            >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.4] pointer-events-none", theme.bg)} />

                <div className="relative z-10 flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full animate-pulse", theme.glow)} />
                    <h3 className="text-[11px] font-black tracking-[2.5px] uppercase text-slate-500 opacity-100 leading-none">{title}</h3>
                </div>

                <div style={{ height: `${height}px` }} className="relative z-10 w-full -ml-8">
                    <ResponsiveContainer width="112%" height="100%">
                        <AreaChart data={data} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`gradient-area-${color}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.fill} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={theme.fill} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#475569', fontWeight: 800 }}
                                dy={10}
                            />
                            <YAxis
                                domain={[0, maxValue || 'auto']}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#475569', fontWeight: 800 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(15, 23, 42, 0.98)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: '16px',
                                    border: 'none',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    padding: '12px 18px',
                                    color: '#fff',
                                    textTransform: 'uppercase'
                                }}
                                itemStyle={{ color: '#fff', fontWeight: '900' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={theme.stroke}
                                strokeWidth={4}
                                fillOpacity={1}
                                fill={`url(#gradient-area-${color})`}
                                dot={false}
                                activeDot={{
                                    r: 7,
                                    fill: theme.stroke,
                                    strokeWidth: 4,
                                    stroke: '#fff'
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Holographic liquid shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            </motion.div>
        );
    };
export const BarChartCard: React.FC<{
    title: string;
    chartData?: any[];
    color?: 'cyan' | 'blue' | 'green' | 'purple';
    height?: number;
}> = ({
    title,
    chartData = [],
    color = 'cyan',
    height = 200
}) => {
        const theme = colorMap[color] || colorMap.cyan;

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className={cn(
                    "relative overflow-hidden group rounded-[32px] p-8 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-8 transition-all duration-500",
                    theme.border
                )}
            >
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.4] pointer-events-none", theme.bg)} />

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full animate-pulse", theme.glow)} />
                        <h3 className="text-[11px] font-black tracking-[2.5px] uppercase text-slate-500 opacity-100 leading-none">{title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.stroke }} />
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Activity Level</span>
                    </div>
                </div>

                <div style={{ height: `${height}px` }} className="relative z-10 w-full -ml-8">
                    <ResponsiveContainer width="112%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 30, left: 10, bottom: 0 }} barSize={12}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#475569', fontWeight: 800 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#475569', fontWeight: 800 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    background: 'rgba(15, 23, 42, 0.98)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: '16px',
                                    border: 'none',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    padding: '12px 18px',
                                    color: '#fff',
                                    textTransform: 'uppercase'
                                }}
                                itemStyle={{ color: '#fff', fontWeight: '900' }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[20, 20, 20, 20]}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index % 2 === 0 ? theme.stroke : `${theme.stroke}40`}
                                        className="transition-all duration-300 hover:opacity-80"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Holographic liquid shine overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            </motion.div>
        );
    };
