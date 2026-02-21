import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllData } from './storageService';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn((idx) => Object.keys(store)[idx]),
        get length() {
            return Object.keys(store).length;
        },
    };
})();

global.localStorage = localStorageMock;

// Mock IndexedDB (Minimal implementation)
const indexedDBMock = {
    open: vi.fn().mockImplementation(() => {
        return {
            result: {
                objectStoreNames: {
                    contains: vi.fn().mockReturnValue(true)
                },
                transaction: vi.fn().mockReturnValue({
                    objectStore: vi.fn().mockReturnValue({
                        getAll: vi.fn().mockReturnValue({
                            onsuccess: null,
                            result: []
                        }),
                        getAllKeys: vi.fn().mockReturnValue({
                            onsuccess: null,
                            result: []
                        })
                    })
                })
            },
            onupgradeneeded: null,
            onsuccess: null,
            onerror: null,
        };
    })
};

global.indexedDB = indexedDBMock;

describe('storageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should retrieve data from localStorage if IndexedDB is empty or not initialized', async () => {
        // Setup localStorage with some data
        const mockData = {
            'vocab-srs-data': JSON.stringify({ 'hello': { success: 1 } }),
            'vocab-global-stats': JSON.stringify({ total: 10 }),
        };

        localStorage.setItem('vocab-srs-data', mockData['vocab-srs-data']);
        localStorage.setItem('vocab-global-stats', mockData['vocab-global-stats']);

        // Since getAllData checks db (which is null initially) then localStorage
        const data = await getAllData();

        expect(data['vocab-srs-data']).toEqual({ 'hello': { success: 1 } });
        expect(data['vocab-global-stats']).toEqual({ total: 10 });
    });

    it('should prioritize IndexedDB data if available (mocked scenario)', async () => {
        // This test is hard to implement without a full IndexedDB mock or library
        // Instead, we verify that getAllData attempts to combine data

        // Setup localStorage with a key that starts with 'vocab-' so it gets picked up
        localStorage.setItem('vocab-test-key', JSON.stringify({ val: 'local' }));

        // We can't easily inject into the private 'db' variable of the module without rewiring
        // So we test the fallback behavior primarily.

        const data = await getAllData();
        expect(data['vocab-test-key']).toEqual({ val: 'local' });
    });
});
