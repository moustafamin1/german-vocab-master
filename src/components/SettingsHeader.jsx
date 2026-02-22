import { Menu, X } from 'lucide-react';

export default function SettingsHeader({ onLogoClick, onSettingsClick, wordCount, isSettingsOpen }) {
    return (
        <header className="flex items-center justify-between py-6 mb-4 border-b border-border">
            <div className="flex items-center gap-4">
                <button
                    onClick={onLogoClick}
                    className="text-xl font-bold tracking-tight hover:text-primary-muted transition-colors"
                >
                    Vocaccia
                </button>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={isSettingsOpen ? onLogoClick : onSettingsClick}
                    className="p-2.5 rounded-xl border border-border text-primary-muted hover:text-primary hover:border-zinc-600 transition-all bg-card/50"
                    title={isSettingsOpen ? "Close Settings" : "Settings"}
                >
                    {isSettingsOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>
        </header>
    );
}
