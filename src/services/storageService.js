/**
 * storageService.js - Robust IndexedDB + localStorage persistence layer
 * 
 * Provides:
 * 1. Isolated on-device storage (prevents cross-app wiping on same origin)
 * 2. Dual-write to localStorage (optional fallback)
 * 3. Auto-recovery logic
 * 4. Persistent storage request
 */

const DB_NAME = 'vocaccia-db';
const STORE_NAME = 'app-data';
const DB_VERSION = 1;

let db = null;

/**
 * Initialize IndexedDB and request persistence
 */
export const initStorage = async () => {
    try {
        // 1. Request persistence from browser
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persist();
            console.log(`💾 Persistent storage ${isPersisted ? 'granted' : 'denied'}`);
        }

        // 2. Open DB
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('✅ IndexedDB initialized');
                resolve(true);
            };

            request.onerror = (event) => {
                console.error('❌ IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (err) {
        console.error('Failed to init storage', err);
        return false;
    }
};

/**
 * Get data from storage (IndexedDB primary, localStorage fallback)
 */
export const getItem = async (key, defaultValue = null) => {
    let idbValue = undefined;

    // Try IndexedDB first
    if (db) {
        try {
            idbValue = await new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (idbErr) {
            console.warn(`⚠️ IndexedDB read failed for ${key}, falling back to localStorage.`, idbErr);
        }
    }

    try {
        const localValue = localStorage.getItem(key);
        let parsedLocal = null;
        let hasLocalData = false;

        if (localValue !== null) {
            try {
                parsedLocal = JSON.parse(localValue);
                hasLocalData = true;
            } catch (e) {
                console.warn(`Failed to parse localStorage for ${key}`, e);
            }
        }

        // Check if IDB successfully returned data
        if (idbValue !== undefined && idbValue !== null) {
            const parsedIdb = typeof idbValue === 'string' ? JSON.parse(idbValue) : idbValue;

            // 🛡️ CRITICAL SAFTEY CHECK:
            // If IDB returned an empty object/array, but localStorage has real data,
            // IDB is likely out of sync or wiped. Prefer localStorage!
            if (hasLocalData) {
                const idbLength = typeof parsedIdb === 'object' && parsedIdb !== null ? Object.keys(parsedIdb).length : 1;
                const localLength = typeof parsedLocal === 'object' && parsedLocal !== null ? Object.keys(parsedLocal).length : 1;

                // Only override if IDB is completely empty but LS has substantial data
                if (idbLength === 0 && localLength > 0) {
                    console.warn(`🔄 Auto-healing: IDB empty but LS has data for ${key}. Restoring from LS.`);
                    if (db) setItem(key, parsedLocal); // Auto-heal IDB
                    return parsedLocal;
                }
            }
            return parsedIdb;
        }

        // If IDB failed or returned undefined, fallback to LS
        if (hasLocalData) {
            console.log(`📥 Loaded ${key} from localStorage fallback.`);
            if (db) setItem(key, parsedLocal);
            return parsedLocal;
        }
    } catch (err) {
        console.error(`❌ Error parsing item ${key} from storage`, err);
    }

    console.log(`⚠️ No data found for ${key}, using defaultValue.`);
    return defaultValue;
};

/**
 * Save data to storage (Dual-write)
 */
export const setItem = async (key, value) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    // 1. Write to localStorage (Legacy fallback)
    try {
        localStorage.setItem(key, stringValue);
    } catch (err) {
        console.error('localStorage write failed', err);
    }

    // 2. Write to IndexedDB (Modern primary)
    if (db) {
        try {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(value, key);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('IndexedDB write failed', err);
        }
    }
};

/**
 * Remove data from storage
 */
export const removeItem = async (key) => {
    localStorage.removeItem(key);
    if (db) {
        return new Promise((resolve) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);
            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    }
};

/**
 * Get all data for export, combining IndexedDB and localStorage
 */
export const getAllData = async () => {
    const data = {};
    const criticalKeys = [
        'vocab-srs-data',
        'vocab-global-stats',
        'vocab-app-settings',
        'vocab-daily-stats',
        'cached-vocab'
    ];

    // 1. Fetch from IndexedDB if available
    if (db) {
        try {
            const dbData = await new Promise((resolve) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();
                const keysRequest = store.getAllKeys();

                request.onsuccess = () => {
                    keysRequest.onsuccess = () => {
                        const result = {};
                        keysRequest.result.forEach((key, i) => {
                            result[key] = request.result[i];
                        });
                        resolve(result);
                    };
                };
                request.onerror = () => resolve({});
            });
            Object.assign(data, dbData);
        } catch (e) {
            console.error('Error fetching from IndexedDB for export', e);
        }
    }

    // 2. Fetch from localStorage (fallback/merge)
    // We prioritize IndexedDB, but if a key is missing there, we check localStorage
    for (const key of criticalKeys) {
        if (!data[key]) {
            const localVal = localStorage.getItem(key);
            if (localVal) {
                try {
                    data[key] = JSON.parse(localVal);
                } catch (e) {
                    data[key] = localVal;
                }
            }
        }
    }

    // 3. Also grab any other localStorage keys that might be relevant (optional, but good for completeness)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!data[key] && key.startsWith('vocab-')) {
             try {
                data[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                data[key] = localStorage.getItem(key);
            }
        }
    }

    return data;
};

/**
 * Bulk import data
 */
export const importAllData = async (data) => {
    const promises = Object.entries(data).map(([key, value]) => setItem(key, value));
    await Promise.all(promises);
};

/**
 * Generates a JSON backup file and triggers the native share sheet or download.
 */
export const shareBackup = async () => {
    try {
        const data = await getAllData();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });

        const date = new Date().toISOString().split('T')[0];
        const filename = `vocaccia_backup_${date}.json`;
        const file = new File([blob], filename, { type: 'application/json' });

        // 1. Try Native Share API
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Vocaccia Backup',
                    text: `Backup of Vocaccia learning progress from ${date}.`
                });
                return true; // Shared successfully
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed', err);
                }
                // Fallback to download if share fails (but not if user cancelled)
                if (err.name !== 'AbortError') {
                    downloadFile(blob, filename);
                    return true;
                }
                return false; // User cancelled
            }
        } else {
            // 2. Fallback: Direct Download
            downloadFile(blob, filename);
            return true;
        }
    } catch (err) {
        console.error('Backup generation failed', err);
        throw err;
    }
};

/**
 * Helper to trigger file download
 */
const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
