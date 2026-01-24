import React from 'react';

export default function StatsBar({ stats }) {
    return (
        <div className="flex justify-center gap-6 py-1.5 border-b border-zinc-900/50 bg-[#09090b]/50 backdrop-blur-md sticky top-0 z-50">
            <span className="text-[10px] font-mono font-bold text-zinc-600 tracking-tighter" title="Total Answers">
                {stats.total}
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-600/80 tracking-tighter" title="Correct Answers">
                {stats.correct}
            </span>
            <span className="text-[10px] font-mono font-bold text-rose-600/80 tracking-tighter" title="Incorrect Answers">
                {stats.incorrect}
            </span>
        </div>
    );
}
