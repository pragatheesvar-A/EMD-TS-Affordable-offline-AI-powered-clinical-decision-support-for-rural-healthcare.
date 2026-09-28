import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'EMD-TS — Edge Medical Diagnostics & Telemedicine System',
        short_name: 'EMD-TS',
        description:
          'Offline-first, AI-assisted wearable clinical decision support app for rural & semi-urban healthcare.',
        theme_color: '#185cef',
        background_color: '#f4f7fb',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen'],
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['medical', 'health', 'productivity'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // App-shell: everything is client-rendered & stored in localStorage,
        // so once cached the app is fully usable with zero network access.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'emdts-shell' },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    proxy: {
      // /api/* -> FastAPI backend (D:\EMD-TS-Mobile-Delivery\emd-ts-backend)
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
