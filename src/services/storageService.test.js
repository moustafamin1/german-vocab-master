import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as storage from './storageService';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('storageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Since we can't easily run full IndexedDB in node without fake-indexeddb,
        // we'll verify the logic around localStorage fallbacks which is the critical auto-recovery part.
    });

    it('setItem writes to localStorage', async () => {
        await storage.setItem('test-key', { foo: 'bar' });
        expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify({ foo: 'bar' }));
    });

    it('getItem falls back to localStorage if IndexedDB is not initialized', async () => {
        localStorage.setItem('old-key', JSON.stringify({ old: 'data' }));
        const result = await storage.getItem('old-key');
        expect(result).toEqual({ old: 'data' });
        expect(localStorage.getItem).toHaveBeenCalledWith('old-key');
    });

    it('removeItem clears localStorage', async () => {
        await storage.removeItem('test-key');
        expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
});
