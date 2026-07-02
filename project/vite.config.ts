import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.json',
      includeAssets: [
        'logo.svg',
        'hero.png',
        'hero-globe.png',
        'hero-globe.svg',
        'landing/*.png',
        'icons/*.svg',
        'icons/*.png',
        'favicon.svg',
        'screenshot-desktop.png',
        'screenshot-mobile.png',
      ],
      manifest: {
        name: 'SG16 AI Engine',
        short_name: 'SG16',
        description: 'Most Powerful AI Platform by SaifTech Global Limited — coding, chat, images, documents & more.',
        theme_color: '#10b981',
        background_color: '#050507',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen', 'minimal-ui'],
        orientation: 'any',
        scope: '/',
        start_url: '/',
        id: '/',
        lang: 'en',
        dir: 'ltr',
        categories: ['productivity', 'utilities', 'education'],
        prefer_related_applications: false,
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
        screenshots: [
          {
            src: '/screenshot-desktop.png',
            sizes: '1024x682',
            type: 'image/png',
            form_factor: 'wide',
            label: 'SG16 AI Engine - desktop dashboard with all workspaces',
          },
          {
            src: '/screenshot-mobile.png',
            sizes: '474x1024',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'SG16 AI Engine - mobile home screen and navigation',
          },
        ],
        shortcuts: [
          { name: 'SG16 Chatting', url: '/?workspace=general', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Image Studio', url: '/?workspace=image', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/health$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sg16-api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // Service worker in dev intercepts OAuth popups and causes blank pages.
        enabled: false,
        type: 'module',
      },
    }),
  ],
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    headers: {
      // Google GIS popup mode — prevents blank OAuth window.
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      // Required for GIS on HTTP localhost — without this Google returns Error 400: origin_mismatch.
      'Referrer-Policy': 'no-referrer-when-downgrade',
    },
    proxy: {
      '/api': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Referrer-Policy': 'no-referrer-when-downgrade',
    },
  },
});
