import React, { useState, useRef, useMemo } from 'react';
import { TrendingUp, TestTube, Info } from 'lucide-react';

export default function StatsCard({ dailyStats: realDailyStats, globalStats, useDummyData = false }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, p: 50 });
    const containerRef = useRef(null);

    // Generate dummy data for testing
    const getDummyData = () => {
        const data = [];
        const now = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const total = Math.floor(Math.random() * 50) + 20; // Some points will cross 50
            const correct = Math.floor(Math.random() * (total - 5)) + 5;
            const incorrect = total - correct;
            data.push({
                date: d.toISOString().split('T')[0],
                total,
                correct,
                incorrect
            });
        }
        return data;
    };

    const dailyStats = useMemo(() =>
        useDummyData ? getDummyData() : realDailyStats,
        [useDummyData, realDailyStats]);

    const recentData = useMemo(() => dailyStats.slice(-14), [dailyStats]);
    const maxValue = useMemo(() => {
        const vals = recentData.map(d => Math.max(d.total || 0, d.correct || 0, d.incorrect || 0));
        // Ensure maxValue is at least 60 to show the 50 threshold line clearly
        return Math.max(...vals, 60);
    }, [recentData]);

    if (!dailyStats || dailyStats.length === 0) {
        return (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
                <div className="flex items-center justify-between mb-6 relative">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-inner">
                            <TrendingUp className="w-6 h-6 text-zinc-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Daily Progress</h3>
                            <p className="text-sm text-zinc-500 font-medium">Your learning journey starts here</p>
                        </div>
                    </div>
                </div>
                <div className="py-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-950 rounded-full border border-zinc-800 flex items-center justify-center mx-auto shadow-inner">
                        <Info className="w-8 h-8 text-zinc-700" />
                    </div>
                    <p className="text-zinc-500 font-medium">No practice data yet.</p>
                </div>
            </div>
        );
    }

    const baseChartHeight = 160;
    const baseChartWidth = 400;
    const yAxisWidth = 35;
    const xAxisHeight = 30;
    const padding = 20;

    const totalWidth = baseChartWidth + yAxisWidth;
    const totalHeight = baseChartHeight + xAxisHeight;

    // Threshold Y calculation
    const thresholdValue = 50;
    const thresholdY = baseChartHeight - ((thresholdValue / maxValue) * (baseChartHeight - padding * 2)) - padding;

    // Helper for smooth Bezier curves
    const getCurvedPath = (data, key) => {
        if (!data || data.length < 2) return '';

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * baseChartWidth + yAxisWidth;
            const val = d[key] || 0;
            const y = baseChartHeight - ((val / maxValue) * (baseChartHeight - padding * 2)) - padding;
            return { x, y };
        });

        let path = `M ${points[0].x},${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            const cp1x = curr.x + (next.x - curr.x) / 3;
            const cp2x = curr.x + 2 * (next.x - curr.x) / 3;
            path += ` C ${cp1x},${curr.y} ${cp2x},${next.y} ${next.x},${next.y}`;
        }
        return path;
    };

    // Helper for rounded stepped trendlines (preserved for future use)
    const getSteppedPath = (data, key) => {
        if (!data || data.length < 2) return '';

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * baseChartWidth + yAxisWidth;
            const val = d[key] || 0;
            const y = baseChartHeight - ((val / maxValue) * (baseChartHeight - padding * 2)) - padding;
            return { x, y };
        });

        const radius = 8;
        let path = `M ${points[0].x},${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];

            // Midpoint X for "step-after" (or we can do step-middle)
            // For a clean step-after with rounded corners:
            const midX = next.x;

            // Draw horizontal to near the corner
            path += ` L ${midX - radius},${curr.y}`;
            // Quadratic curve for corner
            path += ` Q ${midX},${curr.y} ${midX},${curr.y + (next.y > curr.y ? radius : -radius)}`;
            // Vertical to next point
            path += ` L ${next.x},${next.y}`;
        }
        return path;
    };

    const handleInteraction = (e) => {
        if (!containerRef.current || !recentData.length) return;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);

        if (clientX === undefined) return;

        const x = clientX - rect.left - yAxisWidth;
        const relativeX = Math.max(0, Math.min(x / (rect.width - yAxisWidth), 1));
        const index = Math.round(relativeX * (recentData.length - 1));

        if (!isNaN(index) && index >= 0 && index < recentData.length) {
            setHoveredIndex(index);
            const itemX = (index / (recentData.length - 1)) * (rect.width - yAxisWidth) + yAxisWidth;
            const percentage = (itemX / rect.width) * 100;
            setTooltipPos({ x: itemX, y: 0, p: percentage });
        }
    };

    const formatDateShort = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const totalSum = globalStats ? globalStats.total : dailyStats.reduce((sum, d) => sum + (d.total || 0), 0);
    const correctSum = globalStats ? globalStats.correct : dailyStats.reduce((sum, d) => sum + (d.correct || 0), 0);
    const accuracy = totalSum > 0 ? Math.round((correctSum / totalSum) * 100) : 0;

    return (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-inner transition-colors">
                        <TrendingUp className="w-6 h-6 text-zinc-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Daily Progress</h3>
                        <p className="text-sm text-zinc-500 font-medium">Activity from last {recentData.length} days</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: totalSum, color: 'text-white', bg: 'bg-white/5' },
                    { label: 'Right', value: correctSum, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                    { label: 'Wrong', value: totalSum - correctSum, color: 'text-rose-500', bg: 'bg-rose-500/5' },
                    { label: 'Accuracy', value: `${accuracy}%`, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} backdrop-blur-sm rounded-xl p-3 border border-zinc-800/40 relative group/stat overflow-hidden shadow-sm`}>
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                        <p className={`text-xl font-black ${stat.color} mb-0.5 transition-transform group-hover/stat:scale-110 duration-500`}>{stat.value}</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest opacity-80">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="relative pt-2 px-2 select-none">
                <div
                    ref={containerRef}
                    className="relative w-full h-48 cursor-crosshair pb-6 touch-none"
                    onMouseMove={handleInteraction}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onTouchMove={handleInteraction}
                    onTouchEnd={() => setHoveredIndex(null)}
                >
                    <svg
                        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
                        className="w-full h-full"
                        preserveAspectRatio="none"
                    >
                        {/* Define Threshold Gradient */}
                        <defs>
                            <linearGradient id="total-threshold" x1="0" y1={baseChartHeight} x2="0" y2="0" gradientUnits="userSpaceOnUse">
                                <stop offset={(baseChartHeight - thresholdY) / baseChartHeight} stopColor="#a1a1aa" />
                                <stop offset={(baseChartHeight - thresholdY) / baseChartHeight} stopColor="#f59e0b" />
                            </linearGradient>
                        </defs>

                        {[0, 25, 50, 75, 100].map((percent) => {
                            const y = baseChartHeight - (percent / 100) * (baseChartHeight - padding * 2) - padding;
                            const val = Math.round((percent / 100) * maxValue);
                            return (
                                <g key={percent} className="opacity-10">
                                    <line x1={yAxisWidth} y1={y} x2={totalWidth} y2={y} stroke="#52525b" strokeWidth="0.5" strokeDasharray="4,4" />
                                    <text x={yAxisWidth - 10} y={y + 3} fill="#a1a1aa" fontSize="10" textAnchor="end" className="font-bold">{val}</text>
                                </g>
                            );
                        })}

                        {/* Threshold Line at 50 */}
                        <g className="opacity-30">
                            <line
                                x1={yAxisWidth} y1={thresholdY}
                                x2={totalWidth} y2={thresholdY}
                                stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,4"
                            />
                            <text x={totalWidth - 5} y={thresholdY - 5} fill="#f59e0b" fontSize="8" textAnchor="end" className="font-bold uppercase tracking-widest">Goal 50</text>
                        </g>

                        {hoveredIndex !== null && (
                            <line
                                x1={(hoveredIndex / (recentData.length - 1)) * baseChartWidth + yAxisWidth}
                                y1={0}
                                x2={(hoveredIndex / (recentData.length - 1)) * baseChartWidth + yAxisWidth}
                                y2={baseChartHeight}
                                stroke="#71717a"
                                strokeWidth="1"
                                strokeDasharray="4,4"
                                className="animate-in fade-in transition-all duration-300"
                            />
                        )}

                        <path d={getCurvedPath(recentData, 'total')} fill="none" stroke="url(#total-threshold)" strokeWidth="2.5" strokeLinecap="round" strokeJoin="round" className="transition-all duration-1000" />
                        <path d={getCurvedPath(recentData, 'correct')} fill="none" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeJoin="round" className="opacity-60 transition-all duration-1000" />
                        <path d={getCurvedPath(recentData, 'incorrect')} fill="none" stroke="#f43f5e" strokeWidth="1.0" strokeLinecap="round" strokeJoin="round" className="opacity-40 transition-all duration-1000" />

                        {recentData.map((d, i) => {
                            if (i % (recentData.length > 7 ? 3 : 1) !== 0 && i !== recentData.length - 1) return null;
                            const x = (i / (recentData.length - 1)) * baseChartWidth + yAxisWidth;
                            return (
                                <text key={i} x={x} y={baseChartHeight + 20} fill="#71717a" fontSize="9" textAnchor="middle" className="font-bold uppercase tracking-tight">
                                    {formatDateShort(d.date)}
                                </text>
                            );
                        })}

                        {hoveredIndex !== null && (
                            <g className="animate-in zoom-in-50 duration-200">
                                {['total', 'correct', 'incorrect'].map((key, j) => {
                                    const d = recentData[hoveredIndex];
                                    const rawColors = { total: d.total > 50 ? '#f59e0b' : '#a1a1aa', correct: '#10b981', incorrect: '#f43f5e' };
                                    const y = baseChartHeight - ((d[key] / maxValue) * (baseChartHeight - padding * 2)) - padding;
                                    const x = (hoveredIndex / (recentData.length - 1)) * baseChartWidth + yAxisWidth;
                                    return <circle key={j} cx={x} cy={y} r="4" fill={rawColors[key]} stroke="#18181b" strokeWidth="1.5" />;
                                })}
                            </g>
                        )}
                    </svg>

                    {hoveredIndex !== null && (
                        <div
                            className="absolute z-50 pointer-events-none transition-all duration-200 ease-out"
                            style={{
                                left: `${tooltipPos.x}px`,
                                top: `-10px`,
                                transform: `translateX(-${tooltipPos.p}%) translateY(-100%)`,
                            }}
                        >
                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl min-w-[140px] animate-in slide-in-from-bottom-2">
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2 border-b border-zinc-800 pb-1">
                                    {new Date(recentData[hoveredIndex].date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-xs text-zinc-400 font-medium">Total</span>
                                        <span className={`text-sm font-black ${recentData[hoveredIndex].total > 50 ? 'text-amber-500' : 'text-zinc-400'}`}>{recentData[hoveredIndex].total}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-xs text-zinc-400 font-medium">Right</span>
                                        <span className="text-sm font-black text-emerald-500">{recentData[hoveredIndex].correct}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                        <span className="text-xs text-zinc-400 font-medium">Wrong</span>
                                        <span className="text-sm font-black text-rose-500">{recentData[hoveredIndex].incorrect}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 pt-1 border-t border-zinc-900">
                                        <span className="text-xs text-zinc-500 font-medium">Accuracy</span>
                                        <span className="text-sm font-black text-blue-500">
                                            {recentData[hoveredIndex].total > 0 ? Math.round((recentData[hoveredIndex].correct / recentData[hoveredIndex].total) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className="absolute -bottom-2 translate-y-[2px] -translate-x-1/2 w-4 h-4 bg-zinc-950 border-r border-b border-zinc-800 rotate-45"
                                    style={{ left: `${tooltipPos.p}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
