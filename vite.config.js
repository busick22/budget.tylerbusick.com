import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Split the bundle so the browser can cache big, rarely-changing pieces
// (React, Firebase) separately from app code that changes every deploy.
function manualChunks(id) {
  if (!id.includes('node_modules')) return

  if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
    return 'react-vendor'
  }
  if (id.includes('node_modules/react-router')) {
    return 'router'
  }
  if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
    if (id.includes('/firestore')) return 'firebase-firestore'
    if (id.includes('/auth')) return 'firebase-auth'
    return 'firebase-core'
  }
  if (id.includes('node_modules/lucide-react/')) {
    return 'icons'
  }
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Budget',
        short_name: 'Budget',
        description: 'Your money in one place — spending, bills, goals, and debt.',
        theme_color: '#0b120e',
        background_color: '#0b120e',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Never serve a cached shell for Google's OAuth helper frames.
        navigateFallbackDenylist: [/^\/__/],
      },
    }),
  ],
  server: {
    // 5174 so Budget and Accomplish (5173) can run side by side.
    port: 5174,
    host: true,
  },
  build: {
    rollupOptions: {
      output: { manualChunks },
    },
  },
})
