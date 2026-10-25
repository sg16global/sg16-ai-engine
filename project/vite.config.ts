import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  // The app is self-contained: no backend to proxy. Live data comes from
  // browser-direct APIs and the edge functions in functions/api/edge (served
  // by Cloudflare Pages in production). For local edge testing:
  //   npm run build && npx wrangler pages dev dist

  return {
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
          'landing/*.webp',
          '*.webp',
          'icons/*.svg',
          'icons/*.png',
          'brand/*.png',
          'brand/*.webp',
          'favicon.svg',
          'screenshot-desktop.png',
          'screenshot-mobile.png',
        ],
        manifest: {
          name: 'SG16 AI Engine',
          short_name: 'SG16 Engine',
          description: 'SG16 AI Engine — five shields in one secure app. AI Chat, Coding, Health, Student, and Market.',
          theme_color: '#050509',
          background_color: '#050509',
          display: 'standalone',
          display_override: ['standalone', 'fullscreen', 'minimal-ui'],
          orientation: 'any',
          scope: '/',
          start_url: '/',
          id: 'https://sg16engine.com/',
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
            { name: 'Shield Home', url: '/app', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'AI Chat', url: '/app?workspace=general', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Coding Hub', url: '/app?workspace=coding', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          ],
        },
        workbox: {
          // Large hero / shield source PNGs exceed the 2 MiB default and would fail the build.
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,webmanifest}'],
          globIgnores: [
            '**/shield-home/earth-dna.png',
            '**/assets/sg16-earth-dna-bg.png',
            '**/assets/shield-home-concept.png',
            '**/shield-home-concept.png',
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/sitemap\.xml$/, /^\/robots\.txt$/],
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
              urlPattern: /\/api\/edge\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'sg16-edge-cache',
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 50, maxAgeSeconds: 60 },
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
      // Cloudflare Pages serves this directory; edge functions live in functions/.
      outDir: 'dist',
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
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Referrer-Policy': 'no-referrer-when-downgrade',
      },
    },
  };
});
