/**
 * Utility to request persistent storage from the browser.
 * This helps prevent the browser from automatically clearing the app's data
 * when the device is low on storage.
 */
export const requestPersistence = async () => {
    if (navigator.storage && navigator.storage.persist) {
        try {
            const isPersisted = await navigator.storage.persist();
            console.log(`Persistent storage ${isPersisted ? 'granted' : 'denied'}`);
            return isPersisted;
        } catch (err) {
            console.error('Failed to request persistence:', err);
            return false;
        }
    }
    return false;
};

/**
 * Checks if the storage is already persisted.
 */
export const isStoragePersisted = async () => {
    if (navigator.storage && navigator.storage.persisted) {
        return await navigator.storage.persisted();
    }
    return false;
};

/**
 * Checks if the MediaLibraryDB (IndexedDB) exists.
 */
export const checkIndexedDBExists = () => {
    return new Promise((resolve) => {
        if (!window.indexedDB) return resolve(false);
        const request = indexedDB.databases ? indexedDB.databases() : Promise.resolve([]);
        request.then(databases => {
            const exists = databases.some(db => db.name === 'MediaLibraryDB');
            resolve(exists);
        }).catch(() => {
            // Fallback: try to open without creating
            const req = indexedDB.open('MediaLibraryDB');
            req.onsuccess = (e) => {
                const db = e.target.result;
                const hasStore = db.objectStoreNames.contains('images');
                db.close();
                resolve(hasStore);
            };
            req.onerror = () => resolve(false);
        });
    });
};

/**
 * Scans localStorage for any data that looks like it might be lost progress.
 * This checks for common patterns used in previous versions or similar apps
 * on the same domain.
 */
export const scanForOrphanData = () => {
    const findings = [];
    const keys = Object.keys(localStorage);

    for (const key of keys) {
        try {
            const value = localStorage.getItem(key);
            if (!value) continue;

            // Try to parse as JSON
            let parsed;
            try {
                parsed = JSON.parse(value);
            } catch (e) {
                // Not JSON, skip or check for simple patterns if needed
                continue;
            }

            let matches = false;
            let description = '';

            // Check for SRS stats pattern
            if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                const sampleValues = Object.values(parsed);
                if (sampleValues.length > 0 && typeof sampleValues[0] === 'object') {
                    if ('successCount' in sampleValues[0] || 'failCount' in sampleValues[0]) {
                        matches = true;
                        description = 'SRS Progress Data';
                    }
                }
            }

            // Check for possible legacy naming
            if (key.includes('german-vocab') || key.includes('srs') || (key.includes('stats') && !key.startsWith('vocab-'))) {
                if (typeof parsed === 'object') {
                    matches = true;
                    description = description || 'Potential Legacy Data';
                }
            }

            // Check for Global Stats pattern
            if (parsed && typeof parsed === 'object' && 'total' in parsed && 'correct' in parsed && 'incorrect' in parsed) {
                matches = true;
                description = 'Global Quiz Stats';
            }

            // Check for Vocab Cache pattern
            if (Array.isArray(parsed) && parsed.length > 0) {
                if ('word' in parsed[0] && 'english' in parsed[0]) {
                    matches = true;
                    description = `Vocabulary Cache (${parsed.length} items)`;
                }
            }

            if (matches) {
                findings.push({
                    key,
                    description,
                    data: parsed
                });
            }
        } catch (err) {
            console.error(`Error scanning key ${key}:`, err);
        }
    }

    return findings;
};
