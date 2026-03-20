import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

console.log('✨ VITE CONFIG LOADED');

// https://vitejs.dev/config/
export default defineConfig({
    base: process.env.GITHUB_ACTIONS ? '/german-vocab-master/' : './',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png', 'apple-touch-icon.png'],
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
            },
            manifest: {
                name: 'Vocaccia - German Vocab',
                short_name: 'Vocaccia',
                description: 'Master German vocabulary with SRS and interactive quizzes.',
                theme_color: '#09090b',
                background_color: '#09090b',
                display: 'standalone',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        }),
        {
            name: 'sync-endpoint',
            configureServer(server) {
                console.log('🚀 Vite Plugin: Sync Middleware Registered');
                server.middlewares.use(async (req, res, next) => {
                    if (req.url === '/api/sync') {
                        try {
                            const { exec } = await import('child_process');
                            console.log('🔄 API CALL: Sync requested');

                            exec('node scripts/fetch-vocab.js', (error, stdout, stderr) => {
                                if (error) {
                                    console.error(`❌ Sync execution error: ${error}`);
                                    res.statusCode = 500;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.end(JSON.stringify({ error: error.message, details: stderr }));
                                    return;
                                }
                                console.log(`✅ Sync complete: ${stdout}`);
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ success: true, message: 'Sync complete', output: stdout }));
                            });
                        } catch (err) {
                            console.error('Server error:', err);
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: 'Internal Server Error' }));
                        }
                        return;
                    }
                    next();
                });
            }
        }
    ],
})
