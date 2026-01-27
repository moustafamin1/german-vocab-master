import { Settings } from 'lucide-react';

export default function SettingsHeader({ onLogoClick, onSettingsClick, wordCount }) {
    return (
        <header className="flex items-center justify-between py-6 mb-4 border-b border-zinc-800">
            <div className="flex items-center gap-4">
                <button
                    onClick={onLogoClick}
                    className="text-xl font-bold tracking-tight hover:text-zinc-400 transition-colors"
                >
                    Vocaccia
                </button>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onSettingsClick}
                    className="p-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-zinc-100 hover:border-zinc-600 transition-all bg-zinc-900/50"
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
