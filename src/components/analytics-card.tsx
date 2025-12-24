'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
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
        text: 'text-cyan-500',
        bg: 'bg-cyan-500',
    },
    blue: {
        stroke: '#3b82f6',
        fill: '#3b82f6',
        text: 'text-blue-500',
        bg: 'bg-blue-500',
    },
    green: {
        stroke: '#10b981',
        fill: '#10b981',
        text: 'text-emerald-500',
        bg: 'bg-emerald-500',
    },
    purple: {
        stroke: '#8b5cf6',
        fill: '#8b5cf6',
        text: 'text-purple-500',
        bg: 'bg-purple-500',
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
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col gap-6 transition-all duration-300"
        >
            <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-gray-400 tracking-tight leading-none uppercase text-[10px] tracking-widest opacity-80">{title}</h3>
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-3xl font-semibold text-gray-900 tracking-tight leading-none">{mainValue}</span>
                        {change !== undefined && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium">{changeLabel || 'vs rest'}</span>
                                <span className={cn(
                                    "flex items-center gap-0.5 text-xs font-bold",
                                    change >= 0 ? "text-emerald-500" : "text-rose-500"
                                )}>
                                    {change >= 0 ? <TrendingUp size={12} className="stroke-[3]" /> : <TrendingDown size={12} className="stroke-[3]" />}
                                    {Math.abs(change)}%
                                </span>
                            </div>
                        )}
                    </div>
                    {metrics.length > 0 && (
                        <div className="flex flex-col gap-3 text-right">
                            {metrics.map((m, idx) => (
                                <div key={idx} className="flex flex-col leading-tight">
                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold opacity-60">{m.label}</span>
                                    <span className="text-xs font-bold text-gray-800 tracking-tight">{m.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="h-44 w-full -mx-4">
                <ResponsiveContainer width="105%" height="100%">
                    <AreaChart data={data} margin={{ top: 15, right: 30, left: 30, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme.fill} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={theme.fill} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            cursor={{ stroke: theme.stroke, strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{
                                borderRadius: '14px',
                                border: 'none',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '8px 12px'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={theme.stroke}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#gradient-${color})`}
                            dot={false}
                            activeDot={{ r: 5, fill: theme.stroke, strokeWidth: 3, stroke: '#fff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {showFilters && (
                <div className="flex items-center gap-1 mt-auto flex-wrap">
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-200 uppercase tracking-tight",
                                activeFilter === f
                                    ? "bg-cyan-500 text-white shadow-md shadow-cyan-100"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-[10px]"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}
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
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col gap-6 transition-all duration-300"
            >
                <h3 className="text-sm font-medium text-gray-400 tracking-widest uppercase text-[10px] opacity-70 leading-none">{title}</h3>

                <div style={{ height: `${height}px` }} className="w-full -ml-6">
                    <ResponsiveContainer width="108%" height="100%">
                        <AreaChart data={data} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`gradient-area-${color}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={theme.fill} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={theme.fill} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                domain={[0, maxValue || 'auto']}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '14px',
                                    border: 'none',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    padding: '8px 12px'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={theme.stroke}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#gradient-area-${color})`}
                                dot={false}
                                activeDot={{ r: 5, fill: theme.stroke, strokeWidth: 3, stroke: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        );
    };
