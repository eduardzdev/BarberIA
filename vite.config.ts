/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['firebase-messaging-sw.js'],
        devOptions: {
          enabled: true,
          type: 'module',
        },
        manifest: {
          name: 'BarberIA - Gestão de Barbearia',
          short_name: 'BarberIA',
          description: 'Plataforma SaaS para gerenciamento inteligente de barbearias',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          lang: 'pt-BR',
          categories: ['business', 'productivity'],
          icons: [
            // Primary icon with rounded corners (SVG) - most platforms
            {
              src: '/icons/Logo%20BarberIA.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            // Square icon for OS that require it (iOS, some Android launchers)
            {
              src: '/icons/Logo%20BarberIA%20Quadrado.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            // Maskable icon for adaptive icons (Android)
            {
              src: '/icons/Logo%20BarberIA%20Quadrado.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable'
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
              },
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/__tests__/**/*.test.ts'],
    }
  };
});
