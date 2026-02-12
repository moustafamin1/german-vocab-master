import React, { useState } from 'react';
import { ChevronLeft, Eye, EyeOff, Search, Filter, BarChart2, CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import { calculateWeight } from '../utils/srs-logic';
import { ttsService } from '../services/ttsService';

export default function AllWordsScreen({ vocabPool, onToggleStatus, srsOffset, onBack }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, study, skip
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all'); // all, nouns, phrases

    // Extract unique levels
    const levels = ['All', ...Array.from(new Set(vocabPool.map(v => v.level))).filter(Boolean).sort()];

    const filteredWords = vocabPool.filter(word => {
        const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
            word.english.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'study' && word.status !== 'skip') ||
            (filterStatus === 'skip' && word.status === 'skip');
        const matchesLevel = selectedLevel === 'All' || word.level === selectedLevel;
        const matchesType = typeFilter === 'all' ||
            (typeFilter === 'nouns' && word.type === 'Noun') ||
            (typeFilter === 'phrases' && word.type === 'Phrase');

        return matchesSearch && matchesStatus && matchesLevel && matchesType;
    });

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-zinc-900 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-zinc-400" />
                </button>
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight">All Words</h2>
                    <p className="text-xs text-zinc-500">
                        {vocabPool.length} total
                        {filteredWords.length !== vocabPool.length && (
                            <span className="text-zinc-400"> · {filteredWords.length} filtered</span>
                        )}
                    </p>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Compact Search and Filters */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-2 space-y-2">
                {/* Line 1: Search (expanded) OR Search Icon + Type + Status Filters */}
                {searchExpanded ? (
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search words..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onBlur={() => {
                                if (!searchTerm) setSearchExpanded(false);
                            }}
                            autoFocus
                            className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg py-1 pl-8 pr-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all"
                        />
                    </div>
                ) : (
                    <div className="flex gap-1.5">
                        {/* Search Icon */}
                        <button
                            onClick={() => setSearchExpanded(true)}
                            className="p-1 rounded-lg bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 transition-all flex-shrink-0"
                        >
                            <Search className="w-3.5 h-3.5 text-zinc-500" />
                        </button>

                        {/* Type Filter */}
                        <div className="flex bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-0.5 flex-shrink-0">
                            {['all', 'nouns', 'phrases'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold capitalize transition-all ${typeFilter === type
                                        ? 'bg-zinc-800 text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-400'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Status Filter */}
                        <div className="flex bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-0.5 flex-shrink-0">
                            {['all', 'study', 'skip'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold capitalize transition-all ${filterStatus === status
                                        ? 'bg-zinc-800 text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-400'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Line 2: Level Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {levels.map(level => (
                        <button
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                            className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[9px] font-bold transition-all border ${selectedLevel === level
                                ? 'bg-zinc-100 border-zinc-100 text-zinc-950'
                                : 'bg-transparent border-zinc-800/50 text-zinc-500 hover:border-zinc-700'
                                }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* Word List */}
            <div className="space-y-2 max-h-[60vh] overflow-y-scroll pr-2">
                {filteredWords.length > 0 ? (
                    filteredWords.map((word) => {
                        const weight = calculateWeight(word, srsOffset);
                        const isSkipped = word.status === 'skip';

                        return (
                            <div
                                key={word.uniqueId}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isSkipped
                                    ? 'bg-zinc-950/50 border-zinc-900/50 opacity-60'
                                    : 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="space-y-1 pr-4 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm truncate">
                                            {word.type === 'Noun' ? (
                                                <>
                                                    <span className="text-zinc-500 font-bold mr-1.5 opacity-70 uppercase first-letter:uppercase lowercase">
                                                        {word.article}
                                                    </span>
                                                    {word.word}
                                                </>
                                            ) : word.word}
                                        </p>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-bold border border-zinc-700/50">
                                            {word.level}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-xs text-zinc-500 truncate italic">{word.english}</p>
                                        <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
                                            <div className="flex items-center gap-1">
                                                <CheckCircle2 className="w-2.5 h-2.5 text-green-500/50" />
                                                <span className="text-[10px] font-mono font-bold text-zinc-500">{word.successCount}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <XCircle className="w-2.5 h-2.5 text-red-500/50" />
                                                <span className="text-[10px] font-mono font-bold text-zinc-500">{word.failCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 flex-shrink-0">
                                    {/* SRS Weight */}
                                    <div className="flex flex-col items-end opacity-60">
                                        <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Weight</span>
                                        <span className="text-xs font-mono font-bold text-zinc-400">{weight}</span>
                                    </div>

                                    {/* Audio Button */}
                                    <button
                                        onClick={() => ttsService.speak(word.article ? `${word.article} ${word.word}` : word.word)}
                                        className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors"
                                        title="Play Audio"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>

                                    {/* Toggle */}
                                    <button
                                        onClick={() => onToggleStatus(word)}
                                        className={`p-2 rounded-xl border transition-all duration-300 ${isSkipped
                                            ? 'bg-red-500/5 border-red-500/20 text-red-500/60'
                                            : 'bg-green-500/5 border-green-500/20 text-green-500/60 hover:bg-green-500/10'
                                            }`}
                                    >
                                        {isSkipped ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 space-y-2">
                        <Filter className="w-8 h-8 text-zinc-800 mx-auto" />
                        <p className="text-zinc-600 text-sm">No words found for this filter.</p>
                    </div>
                )}
            </div>

            <div className="pt-4">
                <button
                    onClick={onBack}
                    className="w-full py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-800 hover:text-zinc-100 transition-all"
                >
                    Back to Settings
                </button>
            </div>
        </div>
    );
}
