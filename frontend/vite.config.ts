import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        "name": "Guardians of the Chess Grandmaster",
        "short_name": "GOTCG",
        "theme_color": "#000000",
        "background_color": "#ffffff",
        "display": "standalone",
        "orientation": "any",
        "start_url": "/",
        "description": "A chess game for anyone who wants to become a Chess Grandmaster",
        "icons": [
          {
            "src": "icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
          }
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
            },
          },
          {
            urlPattern: ({ request }) =>
              ["style", "script", "image"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "asset-cache",
            },
          },
        ],
      },
    })
  ],
  server: {
    proxy: {
      // Proxy API routes to backend
      '/users': 'http://localhost:8000',
      '/user': 'http://localhost:8000',
      '/user/email/:email': 'http://localhost:8000',
      '/games': 'http://localhost:8000',
      '/game': 'http://localhost:8000',
      '/requests': 'http://localhost:8000',
      '/request': 'http://localhost:8000',
      '/friend': 'http://localhost:8000',
      '/friends': 'http://localhost:8000',
      '/message': 'http://localhost:8000',
      // Health endpoint for quick checks
      '/health': 'http://localhost:8000',
      // Socket.IO websocket proxy
      '/socket.io': {
        target: 'http://localhost:8000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
