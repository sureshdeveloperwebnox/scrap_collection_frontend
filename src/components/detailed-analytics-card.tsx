'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, PieChart, LineChart } from 'lucide-react';

interface DetailedAnalyticsCardProps {
    title: string;
    subtitle?: string;
    mainValue: string | number;
    change?: number;
    trend?: 'up' | 'down';
    chartData?: number[];
    labels?: string[];
    color?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan' | 'indigo';
    type?: 'line' | 'bar' | 'donut';
}

export const DetailedAnalyticsCard = ({
    title,
    subtitle,
    mainValue,
    change,
    trend = 'up',
    chartData = [],
    labels = [],
    color = 'blue',
    type = 'line'
}: DetailedAnalyticsCardProps) => {
    const colorClasses = {
        blue: {
            gradient: 'from-blue-500 via-blue-600 to-blue-700',
            light: 'from-blue-50 to-blue-100',
            text: 'text-blue-600',
            bg: 'bg-blue-500',
            border: 'border-blue-200',
            shadow: 'shadow-blue-500/20'
        },
        purple: {
            gradient: 'from-purple-500 via-purple-600 to-purple-700',
            light: 'from-purple-50 to-purple-100',
            text: 'text-purple-600',
            bg: 'bg-purple-500',
            border: 'border-purple-200',
            shadow: 'shadow-purple-500/20'
        },
        green: {
            gradient: 'from-green-500 via-green-600 to-green-700',
            light: 'from-green-50 to-green-100',
            text: 'text-green-600',
            bg: 'bg-green-500',
            border: 'border-green-200',
            shadow: 'shadow-green-500/20'
        },
        orange: {
            gradient: 'from-orange-500 via-orange-600 to-orange-700',
            light: 'from-orange-50 to-orange-100',
            text: 'text-orange-600',
            bg: 'bg-orange-500',
            border: 'border-orange-200',
            shadow: 'shadow-orange-500/20'
        },
        pink: {
            gradient: 'from-pink-500 via-pink-600 to-pink-700',
            light: 'from-pink-50 to-pink-100',
            text: 'text-pink-600',
            bg: 'bg-pink-500',
            border: 'border-pink-200',
            shadow: 'shadow-pink-500/20'
        },
        cyan: {
            gradient: 'from-cyan-500 via-cyan-600 to-cyan-700',
            light: 'from-cyan-50 to-cyan-100',
            text: 'text-cyan-600',
            bg: 'bg-cyan-500',
            border: 'border-cyan-200',
            shadow: 'shadow-cyan-500/20'
        },
        indigo: {
            gradient: 'from-indigo-500 via-indigo-600 to-indigo-700',
            light: 'from-indigo-50 to-indigo-100',
            text: 'text-indigo-600',
            bg: 'bg-indigo-500',
            border: 'border-indigo-200',
            shadow: 'shadow-indigo-500/20'
        }
    };

    const colors = colorClasses[color];

    const renderLineChart = () => {
        if (chartData.length === 0) return null;

        const max = Math.max(...chartData);
        const min = Math.min(...chartData);
        const range = max - min || 1;

        const points = chartData.map((val, idx) => {
            const x = (idx / (chartData.length - 1)) * 100;
            const y = 100 - ((val - min) / range) * 70 - 10;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className="relative h-48 mt-4">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`line-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((y) => (
                        <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2="100"
                            y2={y}
                            stroke="currentColor"
                            strokeWidth="0.2"
                            className="text-gray-300"
                        />
                    ))}

                    {/* Area under curve */}
                    <motion.polygon
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        points={`0,100 ${points} 100,100`}
                        fill={`url(#line-gradient-${color})`}
                        className={colors.text}
                    />

                    {/* Line */}
                    <motion.polyline
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        points={points}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={colors.text}
                    />

                    {/* Data points */}
                    {chartData.map((val, idx) => {
                        const x = (idx / (chartData.length - 1)) * 100;
                        const y = 100 - ((val - min) / range) * 70 - 10;
                        return (
                            <g key={idx}>
                                <motion.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: idx * 0.1, duration: 0.3 }}
                                    cx={x}
                                    cy={y}
                                    r="2"
                                    className={colors.text}
                                    fill="currentColor"
                                />
                                <motion.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: idx * 0.1, duration: 0.3 }}
                                    cx={x}
                                    cy={y}
                                    r="1"
                                    fill="white"
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Labels */}
                {labels.length > 0 && (
                    <div className="flex justify-between mt-2 px-2">
                        {labels.map((label, idx) => (
                            <span key={idx} className="text-xs text-gray-500">
                                {label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderBarChart = () => {
        if (chartData.length === 0) return null;

        const max = Math.max(...chartData);

        return (
            <div className="mt-4">
                <div className="flex items-end justify-between gap-2 h-40">
                    {chartData.map((val, idx) => {
                        const height = (val / max) * 100;
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                                    className={`w-full bg-gradient-to-t ${colors.gradient} rounded-t-lg relative group cursor-pointer`}
                                >
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {val}
                                    </div>
                                </motion.div>
                                {labels[idx] && (
                                    <span className="text-xs text-gray-500">{labels[idx]}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDonutChart = () => {
        if (chartData.length === 0) return null;

        const total = chartData.reduce((sum, val) => sum + val, 0);
        let currentAngle = -90;
        const radius = 40;
        const centerX = 50;
        const centerY = 50;

        const segments = chartData.map((val, idx) => {
            const percentage = (val / total) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            return {
                path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
                percentage,
                value: val,
                label: labels[idx] || `Segment ${idx + 1}`
            };
        });

        const donutColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];

        return (
            <div className="flex items-center gap-6 mt-4">
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        {segments.map((segment, idx) => (
                            <motion.path
                                key={idx}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                d={segment.path}
                                fill={donutColors[idx % donutColors.length]}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        ))}
                        <circle cx="50" cy="50" r="25" fill="white" />
                        <text
                            x="50"
                            y="50"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-sm font-bold fill-gray-900"
                        >
                            {total}
                        </text>
                    </svg>
                </div>
                <div className="flex-1 space-y-2">
                    {segments.map((segment, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: donutColors[idx % donutColors.length] }}
                                />
                                <span className="text-sm text-gray-700">{segment.label}</span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                                {segment.percentage.toFixed(1)}%
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className={`bg-white rounded-2xl p-6 shadow-xl ${colors.shadow} border ${colors.border} hover:shadow-2xl transition-all`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
                {type === 'line' && <LineChart className={`w-5 h-5 ${colors.text}`} />}
                {type === 'bar' && <BarChart3 className={`w-5 h-5 ${colors.text}`} />}
                {type === 'donut' && <PieChart className={`w-5 h-5 ${colors.text}`} />}
            </div>

            {/* Main Value */}
            <div className="flex items-end gap-3 mb-2">
                <h2 className="text-4xl font-bold text-gray-900">{mainValue}</h2>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mb-1 ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {trend === 'up' ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>

            {/* Chart */}
            {type === 'line' && renderLineChart()}
            {type === 'bar' && renderBarChart()}
            {type === 'donut' && renderDonutChart()}
        </motion.div>
    );
};
