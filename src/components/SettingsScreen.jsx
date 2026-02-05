import React, { useState } from 'react';
import { RefreshCw, Bug, Check, ChevronRight, Settings2, Download, Upload, Copy } from 'lucide-react';
import { fetchAndCacheVocab } from '../services/vocabService';

export default function SettingsScreen({
    srsOffset,
    setSrsOffset,
    devMode,
    setDevMode,
    wordCount,
    onBack,
    onOpenAllWords
}) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await fetchAndCacheVocab();
            setSyncSuccess(true);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            console.error('Sync error', err);
            setIsSyncing(false);
            alert(`Sync failed: ${err.message}. Check console/URL.`);
        }
    };

    const handleExport = () => {
        try {
            const data = {
                'vocab-srs-data': localStorage.getItem('vocab-srs-data'),
                'vocab-global-stats': localStorage.getItem('vocab-global-stats'),
                'vocab-app-settings': localStorage.getItem('vocab-app-settings'),
                'cached-vocab': localStorage.getItem('cached-vocab')
            };

            const jsonStr = JSON.stringify(data);
            // Robust base64 encoding for UTF-8 strings
            const exportStr = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode('0x' + p1);
            }));

            navigator.clipboard.writeText(exportStr).then(() => {
                setCopySuccess(true);
                console.log(`✅ Exported ${exportStr.length} characters.`);
                setTimeout(() => setCopySuccess(false), 2000);
            });
        } catch (err) {
            console.error('Export failed', err);
            alert('❌ Export failed. Check console for details.');
        }
    };

    const handleImport = () => {
        const rawInput = prompt('Paste your Exported Data string here:');
        if (!rawInput) return;

        const input = rawInput.trim(); // 🛡️ CRITICAL: Remove accidental spaces/newlines

        try {
            console.log(`📥 Attempting import of ${input.length} characters...`);

            // Robust base64 decoding for UTF-8 strings
            const decoded = decodeURIComponent(atob(input).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const data = JSON.parse(decoded);

            // Validate that we have some expected keys (support both new and old formats if needed)
            const hasData = data['vocab-srs-data'] || data['vocab-global-stats'] || data['vocab-app-settings'] || data['cached-vocab'];
            if (!hasData) {
                throw new Error('Data format invalid: no recognizeable progress found.');
            }

            Object.entries(data).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                    localStorage.setItem(key, stringValue);
                    console.log(`✅ Restored key: ${key}`);
                }
            });

            alert('🎉 Progress Imported Successfully! The app will now reload.');
            window.location.reload();
        } catch (err) {
            console.error('❌ Import failed:', err);
            alert(`❌ Failed to import data.\n\nReason: ${err.message}\n\nPlease ensure you copied the ENTIRE string without missing characters.`);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-zinc-500">Fine-tune your learning experience</p>
            </div>

            <div className="space-y-6">
                {/* SRS Configuration */}
                <section className="space-y-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Settings2 className="w-5 h-5 text-zinc-400" />
                        <h3 className="text-lg font-semibold">SRS Algorithm</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">SRS Offset Value</p>
                                <p className="text-xs text-zinc-500">Lower values focus aggressively on mistakes. Higher values balance the session with more variety.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    value={srsOffset}
                                    onChange={(e) => setSrsOffset(Number(e.target.value))}
                                    className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 px-3 text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-zinc-700"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Navigation */}
                <section className="space-y-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Vocabulary Manager</p>
                            <p className="text-xs text-zinc-500">View and manage all {wordCount} words in your study list.</p>
                        </div>
                        <button
                            onClick={onOpenAllWords}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all text-xs font-bold bg-zinc-950"
                        >
                            <span>All Words</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </section>

                {/* Progress Migration */}
                <section className="space-y-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Download className="w-5 h-5 text-zinc-400" />
                        <h3 className="text-lg font-semibold">Transfer Progress</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Export & Import</p>
                                <p className="text-xs text-zinc-500">Move your stats to a new domain (e.g., Netlify to GitHub).</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExport}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold
                                        ${copySuccess
                                            ? 'bg-green-500/10 border-green-500/50 text-green-500'
                                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600'
                                        }`}
                                >
                                    {copySuccess ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Export</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleImport}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all text-xs font-bold bg-zinc-950"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Import</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Developer Tools */}
                <section className="space-y-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Bug className="w-5 h-5 text-zinc-400" />
                        <h3 className="text-lg font-semibold">Developer Tools</h3>
                    </div>

                    <div className="space-y-4">
                        {/* Dev Mode Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Debug Mode</p>
                                <p className="text-xs text-zinc-500">Show algorithm details and SRS weights during practice.</p>
                            </div>
                            <button
                                onClick={() => setDevMode(!devMode)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${devMode ? 'bg-amber-500' : 'bg-zinc-800'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${devMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Reset / Sync Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                            <div>
                                <p className="text-sm font-medium">Data Management</p>
                                <p className="text-xs text-zinc-500">Currently {wordCount} words. Reset if data is missing.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('cached-vocab');
                                        window.location.reload();
                                    }}
                                    className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-400/50 transition-all text-xs font-bold bg-zinc-950"
                                >
                                    Reset Cache
                                </button>
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing || syncSuccess}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold
                                        ${syncSuccess
                                            ? 'bg-green-500/10 border-green-500/50 text-green-500'
                                            : isSyncing
                                                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 cursor-wait'
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600'
                                        }`}
                                >
                                    {syncSuccess ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Synced</span>
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="pt-6">
                <button
                    onClick={onBack}
                    className="w-full py-4 rounded-2xl bg-zinc-100 text-zinc-950 font-bold flex items-center justify-center gap-2 hover:bg-white transition-colors"
                >
                    Save & Return
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
