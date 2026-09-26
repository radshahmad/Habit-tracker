import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// GitHub Pages friendly base path. Override with BASE_PATH env at build time,
// e.g. BASE_PATH=/habit-tracker/ npm run build
var base = process.env.BASE_PATH || '/';
export default defineConfig({
    base: base,
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
            manifest: {
                name: 'Habit Tracker — Self-Improvement Dashboard',
                short_name: 'Habits',
                description: 'A private, local-first habit tracker and self-improvement dashboard.',
                theme_color: '#2F6F62',
                background_color: '#F5F6F4',
                display: 'standalone',
                start_url: base,
                scope: base,
                icons: [
                    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
                navigateFallback: 'index.html'
            }
        })
    ],
    resolve: {
        alias: { '@': '/src' }
    },
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    charts: ['recharts'],
                },
            },
        },
    }
});
