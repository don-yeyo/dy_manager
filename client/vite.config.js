import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';
import path from 'path';

// Leer versión desde package.json en la raíz del proyecto
const rootPackage = JSON.parse(
  readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8')
);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Don Yeyo Manager',
        short_name: 'DY Manager',
        description: 'Portal Centralizado de Accesos a Sistemas de Don Yeyo S.A.',
        theme_color: '#0d2c5c',
        background_color: '#f4f4f4',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        lang: 'es',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(rootPackage.version)
  },
  server: {
    port: 5173,
    host: true
  }
});
