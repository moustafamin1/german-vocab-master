import React, { useState } from 'react';
import { Layers, Menu, Bug, RefreshCw, Check } from 'lucide-react';
import { fetchAndCacheVocab } from '../services/vocabService';

export default function SettingsHeader({ onBack, showBack, devMode, setDevMode, wordCount }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await fetchAndCacheVocab();
            setSyncSuccess(true);

            // Give user a moment to see the success checkmark before reloading to apply changes
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            console.error('Sync error', err);
            setIsSyncing(false);
            alert(`Sync failed: ${err.message}. Check console/URL.`);
        }
    };

    return (
        <header className="flex items-center justify-between py-6 mb-8 border-b border-zinc-800">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="text-xl font-bold tracking-tight hover:text-zinc-400 transition-colors"
                >
                    Vocaccia
                </button>
            </div>

            <div className="flex items-center gap-4">
                {/* Sync Button */}
                <button
                    onClick={handleSync}
                    disabled={isSyncing || syncSuccess}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold
                        ${syncSuccess
                            ? 'bg-green-500/10 border-green-500/50 text-green-500'
                            : isSyncing
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 cursor-wait'
                                : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                        }`}
                    title="Sync with Google Sheet"
                >
                    {syncSuccess ? (
                        <Check className="w-3.5 h-3.5" />
                    ) : (
                        <>
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span className="opacity-70">
                                {isSyncing ? '...' : (wordCount || 0)}
                            </span>
                        </>
                    )}
                </button>

                {/* Dev Mode Toggle */}
                <button
                    onClick={() => setDevMode(!devMode)}
                    className={`p-2 rounded-xl border transition-all ${devMode ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-transparent border-zinc-800 text-zinc-600 hover:text-zinc-400'
                        }`}
                    title="Toggle Dev Mode (SRS Info)"
                >
                    <Bug className="w-4 h-4" />
                </button>

                {showBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-1.5 hover:bg-zinc-800 transition-colors"
                    >
                        <Menu className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm font-medium">Config</span>
                    </button>
                )}
            </div>
        </header>
    );
}
