import React, { useState } from 'react';
import { Layers, Menu, Bug, RefreshCw, Check } from 'lucide-react';

export default function SettingsHeader({ onBack, showBack, devMode, setDevMode, wordCount }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/sync');
            const data = await res.json();

            if (data.success) {
                setSyncSuccess(true);
                // Give user a moment to see the success checkmark before reloading
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                console.error('Sync failed', data);
                setIsSyncing(false);
                alert(`Sync failed: ${data.error}`);
            }
        } catch (err) {
            console.error('Sync error', err);
            setIsSyncing(false);
            alert('Failed to contact sync server');
        }
    };

    return (
        <header className="flex items-center justify-between py-6 mb-8 border-b border-zinc-800">
            <div className="flex items-center gap-3">
                <div className="text-2xl flex items-center justify-center">
                    🇩🇪🧯
                </div>
                <h1 className="text-xl font-bold tracking-tight">German Hellper</h1>
            </div>

            <div className="flex items-center gap-3">
                {/* Sync Button */}
                <button
                    onClick={handleSync}
                    disabled={isSyncing || syncSuccess}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium uppercase tracking-wider
                        ${syncSuccess
                            ? 'bg-green-500/10 border-green-500/50 text-green-500'
                            : isSyncing
                                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 cursor-wait'
                                : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                        }`}
                    title="Sync with Google Sheet"
                >
                    {syncSuccess ? (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Done</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>
                                {isSyncing ? 'Syncing...' : `Sync (${wordCount || 0})`}
                            </span>
                        </>
                    )}
                </button>

                <div className="w-px h-4 bg-zinc-800 mx-1"></div>

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
