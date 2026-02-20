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
    try {
        // Try IndexedDB first
        if (db) {
            const value = await new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            if (value !== undefined && value !== null) {
                return typeof value === 'string' ? JSON.parse(value) : value;
            }
        }

        // Fallback to localStorage
        const localValue = localStorage.getItem(key);
        if (localValue !== null) {
            const parsed = JSON.parse(localValue);
            // Auto-heal: Restore to IndexedDB if it was missing
            if (db) setItem(key, parsed);
            return parsed;
        }
    } catch (err) {
        console.error(`Error getting item ${key}`, err);
    }
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
 * Get all data for export
 */
export const getAllData = async () => {
    if (!db) return {};
    
    return new Promise((resolve) => {
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
    });
};

/**
 * Bulk import data
 */
export const importAllData = async (data) => {
    const promises = Object.entries(data).map(([key, value]) => setItem(key, value));
    await Promise.all(promises);
};
