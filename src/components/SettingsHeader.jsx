import React from 'react';
import { Layers, Menu } from 'lucide-react';

export default function SettingsHeader({ onBack, showBack }) {
    return (
        <header className="flex items-center justify-between py-6 mb-8 border-b border-zinc-800">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                    <Layers className="text-zinc-950 w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">German Vocab Master</h1>
            </div>

            {showBack && (
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-1.5 hover:bg-zinc-800 transition-colors"
                >
                    <Menu className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-medium">Config</span>
                </button>
            )}
        </header>
    );
}
