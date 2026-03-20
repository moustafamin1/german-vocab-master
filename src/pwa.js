import { registerSW } from 'virtual:pwa-register';

export function setupServiceWorker() {
    return registerSW({
        onNeedRefresh() {},
        onOfflineReady() {},
    });
}
