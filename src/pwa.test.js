import { describe, it, expect, vi } from 'vitest';
import { setupServiceWorker } from './pwa';
import { registerSW } from 'virtual:pwa-register';

// Mock the virtual module
vi.mock('virtual:pwa-register', () => ({
    registerSW: vi.fn(),
}));

describe('PWA Service Worker Setup', () => {
    it('should call registerSW with configuration options', () => {
        setupServiceWorker();

        expect(registerSW).toHaveBeenCalled();
        const callArgs = registerSW.mock.calls[0][0];

        // Verify the basic configuration structure
        expect(typeof callArgs.onNeedRefresh).toBe('function');
        expect(typeof callArgs.onOfflineReady).toBe('function');
    });
});
