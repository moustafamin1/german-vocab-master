import React, { useState, useEffect } from 'react';
import { X, Check, ArrowLeft, Info, HelpCircle } from 'lucide-react';

export default function SkippingTool({ vocabPool, onToggleStatus, onBack }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(null); // 'left' or 'right' for animation

    // Filter to only show words that are currently in 'study' status? 
    // Or show everything to allow rapid skip/unskip?
    // User wants to process "all words right away", so let's show all.
    const currentWord = vocabPool[currentIndex];

    const handleAction = (status) => {
        if (!currentWord) return;

        // If user wants to skip but it's already skip, or study but it's already study, 
        // we just move on. Otherwise we toggle.
        if (currentWord.status !== status) {
            onToggleStatus(currentWord);
        }

        setDirection(status === 'skip' ? 'left' : 'right');

        // Brief delay for animation feel before moving to next
        setTimeout(() => {
            setDirection(null);
            if (currentIndex < vocabPool.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                // End of list
                alert('🎉 All words processed!');
                onBack();
            }
        }, 200);
    };

    if (!currentWord) return <div>No words found.</div>;

    const progress = ((currentIndex / vocabPool.length) * 100).toFixed(0);

    return (
        <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-zinc-400" />
                </button>
                <div className="text-center">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Skipping Tool</h2>
                    <p className="text-[10px] text-zinc-600 font-mono mt-1">{currentIndex + 1} / {vocabPool.length} ({progress}%)</p>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-zinc-900 rounded-full mb-12 overflow-hidden">
                <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Card Container */}
            <div className="flex-1 flex items-center justify-center relative perspective-1000">
                <div
                    className={`w-full max-w-sm aspect-[3/4] bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 transform-gpu
                        ${direction === 'left' ? '-translate-x-full -rotate-12 opacity-0' : ''}
                        ${direction === 'right' ? 'translate-x-full rotate-12 opacity-0' : ''}
                    `}
                >
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
                                {currentWord.level || 'Unknown'} • {currentWord.type}
                            </span>
                            <h1 className="text-4xl font-bold tracking-tight text-white pt-4">
                                {currentWord.article && (
                                    <span className="text-zinc-500 mr-2 lowercase">{currentWord.article}</span>
                                )}
                                {currentWord.word}
                            </h1>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xl text-zinc-400 font-medium italic">{currentWord.english}</p>
                            {currentWord.plural && (
                                <p className="text-sm text-zinc-600">Plural: {currentWord.plural}</p>
                            )}
                        </div>

                        {currentWord.trivia && (
                            <div className="pt-6 border-t border-zinc-800/50 max-w-[240px] mx-auto text-zinc-500 text-sm leading-relaxed">
                                <Info className="w-4 h-4 mx-auto mb-2 opacity-50" />
                                {currentWord.trivia}
                            </div>
                        )}
                    </div>

                    {/* Status Indicator Badge */}
                    <div className="absolute top-6 right-8">
                        {currentWord.status === 'skip' ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                                <X className="w-3 h-3" /> Skipped
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                <Check className="w-3 h-3" /> Studying
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Interactive Footer */}
            <div className="mt-12 flex items-center justify-center gap-6 pb-8">
                {/* Skip Button */}
                <button
                    onClick={() => handleAction('skip')}
                    className="group flex flex-col items-center gap-3"
                >
                    <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-zinc-500 group-active:scale-95 group-active:bg-rose-500/10 group-active:border-rose-500 transition-all shadow-lg overflow-hidden relative">
                        <X className="w-8 h-8 group-active:text-rose-500" />
                        <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-active:text-rose-500">Skip</span>
                </button>

                {/* Info Text */}
                <div className="px-6 text-center">
                    <p className="text-[10px] text-zinc-600 font-medium leading-tight max-w-[100px]">
                        Tap <span className="text-emerald-500">Study</span> to keep, <span className="text-rose-500">Skip</span> to remove.
                    </p>
                </div>

                {/* Study Button */}
                <button
                    onClick={() => handleAction('study')}
                    className="group flex flex-col items-center gap-3"
                >
                    <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-zinc-500 group-active:scale-95 group-active:bg-emerald-500/10 group-active:border-emerald-500 transition-all shadow-lg overflow-hidden relative">
                        <Check className="w-8 h-8 group-active:text-emerald-500" />
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-active:text-emerald-500">Study</span>
                </button>
            </div>
        </div>
    );
}
