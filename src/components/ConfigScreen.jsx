import React from 'react';
import { Play, Check, X } from 'lucide-react';

const MODES = [
    { id: 'multipleChoice', name: 'Multiple Choice' },
    { id: 'written', name: 'Write' },
    { id: 'article', name: 'Article Master' },
    { id: 'wordOrder', name: 'Word Order' }
];

const TYPES = ['Noun', 'Phrase', 'Grammar'];

export default function ConfigScreen({
    levels,
    selectedLevels,
    setSelectedLevels,
    selectedModes,
    setSelectedModes,
    selectedTypes,
    setSelectedTypes,
    onStart
}) {
    const toggleLevel = (level) => {
        if (selectedLevels.includes(level)) {
            setSelectedLevels(selectedLevels.filter(l => l !== level));
        } else {
            setSelectedLevels([...selectedLevels, level]);
        }
    };

    const toggleMode = (modeId) => {
        if (selectedModes.includes(modeId)) {
            if (selectedModes.length > 1) {
                setSelectedModes(selectedModes.filter(m => m !== modeId));
            }
        } else {
            setSelectedModes([...selectedModes, modeId]);
        }
    };

    const toggleType = (type) => {
        if (selectedTypes.includes(type)) {
            if (selectedTypes.length > 1) {
                setSelectedTypes(selectedTypes.filter(t => t !== type));
            }
        } else {
            setSelectedTypes([...selectedTypes, type]);
        }
    };

    const selectAllLevels = () => setSelectedLevels([...levels]);
    const deselectAllLevels = () => setSelectedLevels([]);

    const isReady = selectedLevels.length > 0 && selectedModes.length > 0 && selectedTypes.length > 0;

    return (
        <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">Practice Set Up</h2>
            </div>

            <div className="space-y-6">
                {/* Word Types Section */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Word Types</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {TYPES.map(type => {
                            const isActive = selectedTypes.includes(type);
                            return (
                                <button
                                    key={type}
                                    onClick={() => toggleType(type)}
                                    className={`btn text-center py-3 px-4 border flex justify-center items-center gap-2 transition-all text-sm ${isActive
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/40'
                                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                                        }`}
                                >
                                    <span className="font-semibold">{type}s</span>
                                    {isActive && <Check className="w-4 h-4" />}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Modes Section */}
                <section className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Quiz Modes</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {MODES.map(mode => {
                            const isActive = selectedModes.includes(mode.id);
                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => toggleMode(mode.id)}
                                    className={`btn py-3 px-4 border flex justify-between items-center transition-all text-sm ${isActive
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/40'
                                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                                        }`}
                                >
                                    <span className="font-semibold">{mode.name}</span>
                                    {isActive && <Check className="w-4 h-4" />}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Levels Section */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Levels</h3>
                        <div className="flex gap-4">
                            <button
                                onClick={selectAllLevels}
                                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-100 transition-colors"
                            >
                                Select All
                            </button>
                            <button
                                onClick={deselectAllLevels}
                                className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-100 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {levels.map(level => {
                            const isActive = selectedLevels.includes(level);
                            return (
                                <button
                                    key={level}
                                    onClick={() => toggleLevel(level)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${isActive
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/40'
                                        : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600'
                                        }`}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            <div className="pt-4">
                <button
                    disabled={!isReady}
                    onClick={onStart}
                    className="btn btn-primary w-full py-4 text-base flex items-center justify-center gap-3 shadow-xl disabled:shadow-none"
                >
                    <Play className="w-4 h-4 fill-current" />
                    Start Practice
                </button>
            </div>
        </div>
    );
}
