import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Bug, Check, ChevronRight, Settings2, Download, Upload,
    Copy, Volume2, AlertTriangle, FileText, Database, Shield, ShieldCheck, Search
} from 'lucide-react';
import { fetchAndCacheVocab } from '../services/vocabService';
import { scanForOrphanData, requestPersistence, isStoragePersisted } from '../utils/storageUtils';
import StatsCard from './StatsCard';

export default function SettingsScreen({
    srsOffset,
    setSrsOffset,
    devMode,
    setDevMode,
    autoPlayAudio,
    setAutoPlayAudio,
    wordCount,
    onBack,
    onOpenAllWords,
    onOpenMediaLibrary,
    dailyStats,
    version
}) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [useDummyData, setUseDummyData] = useState(false);
    const [persistenceStatus, setPersistenceStatus] = useState('unknown'); // unknown, granted, denied
    const [scanFindings, setScanFindings] = useState([]);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        const checkPersistence = async () => {
            const isPersisted = await isStoragePersisted();
            setPersistenceStatus(isPersisted ? 'granted' : 'denied');
        };
        checkPersistence();
    }, []);

    const handleRequestPersistence = async () => {
        const granted = await requestPersistence();
        setPersistenceStatus(granted ? 'granted' : 'denied');
        if (granted) {
            alert('✅ Persistent storage granted! Your progress is now safer from automatic clearing.');
        } else {
            alert('❌ Persistence denied. This is common in some browsers or if you haven\'t interacted much with the app yet.');
        }
    };

    const handleScan = () => {
        setIsScanning(true);
        // Add a small delay for dramatic effect/realism
        setTimeout(() => {
            const findings = scanForOrphanData();
            setScanFindings(findings);
            setIsScanning(false);
            if (findings.length === 0) {
                alert('No orphaned data found in storage.');
            }
        }, 1000);
    };

    const handleRestoreFinding = (finding) => {
        if (!confirm(`Do you want to restore data from "${finding.key}" (${finding.description})?\n\nThis will OVERWRITE your current progress and reload the app.`)) return;

        try {
            const keyMap = {
                'SRS Progress Data': 'vocab-srs-data',
                'Global Quiz Stats': 'vocab-global-stats',
                'Vocabulary Cache': 'cached-vocab'
            };

            // Identify which actual storage key this corresponds to
            let targetKey = finding.key;
            for (const [desc, actualKey] of Object.entries(keyMap)) {
                if (finding.description.includes(desc)) {
                    targetKey = actualKey;
                    break;
                }
            }

            localStorage.setItem(targetKey, JSON.stringify(finding.data));
            alert('✅ Data restored! Reloading...');
            window.location.reload();
        } catch (err) {
            console.error('Restore failed', err);
            alert('Failed to restore data.');
        }
    };

    const handleDownloadBackup = () => {
        try {
            const data = {
                'vocab-srs-data': JSON.parse(localStorage.getItem('vocab-srs-data') || '{}'),
                'vocab-global-stats': JSON.parse(localStorage.getItem('vocab-global-stats') || '{"total":0,"correct":0,"incorrect":0}'),
                'vocab-app-settings': JSON.parse(localStorage.getItem('vocab-app-settings') || '{}'),
                'cached-vocab': JSON.parse(localStorage.getItem('cached-vocab') || '[]'),
                'vocab-daily-stats': JSON.parse(localStorage.getItem('vocab-daily-stats') || '[]'),
                'backup-date': new Date().toISOString(),
                'version': version
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vocab-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Backup failed', err);
            alert('Failed to create backup file.');
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const hasData = data['vocab-srs-data'] || data['vocab-global-stats'] || data['cached-vocab'];

                if (!hasData) throw new Error('Invalid backup file format.');

                if (!confirm('Import this backup? Current progress will be overwritten and the app will reload.')) return;

                const validKeys = ['vocab-srs-data', 'vocab-global-stats', 'vocab-app-settings', 'cached-vocab', 'vocab-daily-stats'];
                Object.entries(data).forEach(([key, value]) => {
                    if (validKeys.includes(key) && value !== null && value !== undefined) {
                        localStorage.setItem(key, JSON.stringify(value));
                    }
                });

                alert('✅ Backup imported successfully!');
                window.location.reload();
            } catch (err) {
                console.error('Import failed', err);
                alert('Failed to import backup file: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

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

    const handleHardRefresh = async () => {
        if (!confirm('This will force the app to reload and update. Your progress is safe. Continue?')) return;

        try {
            // Unregister all service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }

            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (let name of cacheNames) {
                    await caches.delete(name);
                }
            }

            // Reload bypassing cache
            window.location.reload(true);
        } catch (err) {
            console.error('Hard refresh failed', err);
            window.location.reload();
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <div className="space-y-6">
                {/* Stats Card */}
                <StatsCard dailyStats={dailyStats} useDummyData={useDummyData} />

                {/* Vocabulary Manager */}
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

                {/* Media Library */}
                <section className="space-y-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Media Library</p>
                            <p className="text-xs text-zinc-500">Add and view images for your learning.</p>
                        </div>
                        <button
                            onClick={onOpenMediaLibrary}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all text-xs font-bold bg-zinc-950"
                        >
                            <span>Open</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </section>


                {/* Recovery & Resilience */}
                <section className="space-y-6 bg-zinc-900/50 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Shield className="w-20 h-20 text-rose-500" />
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-rose-500" />
                        <h3 className="text-lg font-semibold">Recovery & Resilience</h3>
                    </div>

                    <div className="space-y-4">
                        {/* Domain Warning */}
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-rose-400">
                                <AlertTriangle className="w-4 h-4" />
                                <p className="text-xs font-bold uppercase tracking-wider">Shared Domain Warning</p>
                            </div>
                            <p className="text-xs text-rose-200/70 leading-relaxed">
                                You are using this app on <code className="bg-rose-500/20 px-1 rounded">{window.location.hostname}</code>.
                                On GitHub Pages, clearing cache for <b>any</b> app on this domain may erase your progress in <b>all</b> of them.
                                Please download backups regularly!
                            </p>
                        </div>

                        {/* Persistent Storage */}
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-medium flex items-center gap-2">
                                    Persistent Storage
                                    {persistenceStatus === 'granted' ? (
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Shield className="w-4 h-4 text-zinc-500" />
                                    )}
                                </p>
                                <p className="text-xs text-zinc-500">Keep data even when storage is low.</p>
                            </div>
                            <button
                                onClick={handleRequestPersistence}
                                disabled={persistenceStatus === 'granted'}
                                className={`px-4 py-2 rounded-xl border transition-all text-xs font-bold ${persistenceStatus === 'granted'
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600'
                                    }`}
                            >
                                {persistenceStatus === 'granted' ? 'Protected' : 'Enable'}
                            </button>
                        </div>

                        {/* Emergency Scan */}
                        <div className="pt-4 border-t border-zinc-800/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Emergency Data Scan</p>
                                    <p className="text-xs text-zinc-500">Search for detached or lost progress keys.</p>
                                </div>
                                <button
                                    onClick={handleScan}
                                    disabled={isScanning}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all text-xs font-bold bg-zinc-950"
                                >
                                    <Search className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                                    <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
                                </button>
                            </div>

                            {scanFindings.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Findings:</p>
                                    {scanFindings.map((finding, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-mono text-zinc-300">{finding.key}</p>
                                                    {finding.description.includes('Legacy') && (
                                                        <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1 rounded font-bold uppercase">Old Version</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-zinc-500">{finding.description}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRestoreFinding(finding)}
                                                className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold hover:bg-rose-500/20 transition-all"
                                            >
                                                Restore
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* File Backup */}
                        <div className="pt-4 border-t border-zinc-800/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Secure File Backup</p>
                                    <p className="text-xs text-zinc-500">Export your progress as a .json file.</p>
                                </div>
                                <div className="flex gap-2">
                                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all text-xs font-bold bg-zinc-950 cursor-pointer">
                                        <Database className="w-3.5 h-3.5" />
                                        <span>Load File</span>
                                        <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                    <button
                                        onClick={handleDownloadBackup}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all text-xs font-bold bg-zinc-950"
                                    >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Save File</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Audio */}
                <section className="space-y-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Volume2 className="w-5 h-5 text-zinc-400" />
                        <h3 className="text-lg font-semibold">Audio</h3>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Auto-play Answer</p>
                            <p className="text-xs text-zinc-500">Automatically play the word's pronunciation on the result screen.</p>
                        </div>
                        <button
                            onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${autoPlayAudio ? 'bg-blue-500' : 'bg-zinc-800'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoPlayAudio ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </section>

                {/* Developer Tools */}
                <section className="space-y-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Bug className="w-5 h-5 text-zinc-400" />
                        <h3 className="text-lg font-semibold">Developer Tools</h3>
                    </div>

                    <div className="space-y-6">
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

                        {/* Dummy Data Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Demonstration Mode</p>
                                <p className="text-xs text-zinc-500">Inject fake historical data into the graph for testing.</p>
                            </div>
                            <button
                                onClick={() => setUseDummyData(!useDummyData)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${useDummyData ? 'bg-purple-500' : 'bg-zinc-800'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${useDummyData ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* SRS Configuration (Merged) */}
                        <div className="pt-6 border-t border-zinc-800">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings2 className="w-4 h-4 text-zinc-500" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">SRS Algorithm</h4>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">SRS Offset Value</p>
                                    <p className="text-xs text-zinc-500">Lower values focus on mistakes. Higher values add variety.</p>
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

                        {/* Progress Migration (Text-based) */}
                        <div className="pt-6 border-t border-zinc-800">
                            <div className="flex items-center gap-2 mb-4">
                                <Copy className="w-4 h-4 text-zinc-500" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Text-based Transfer</h4>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Copy/Paste Sync</p>
                                    <p className="text-xs text-zinc-500">Sync via a string (useful for mobile).</p>
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
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all text-xs font-bold bg-zinc-950"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Paste</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Reset / Sync Buttons */}
                        <div className="pt-6 border-t border-zinc-800">
                            <div className="flex items-center gap-2 mb-4">
                                <RefreshCw className="w-4 h-4 text-zinc-500" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Data Management</h4>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Sync & Reset</p>
                                    <p className="text-xs text-zinc-500">Currently {wordCount} words.</p>
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

                        {/* Force Update / Version */}
                        <div className="pt-6 border-t border-zinc-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Update App</p>
                                    <p className="text-[10px] text-zinc-500 font-mono">Installed Version: {version || '1.0.0'}</p>
                                </div>
                                <button
                                    onClick={handleHardRefresh}
                                    className="px-4 py-2 rounded-xl border border-amber-500/20 text-amber-500 hover:bg-amber-500/10 transition-all text-xs font-bold bg-zinc-950"
                                >
                                    Force Update
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
