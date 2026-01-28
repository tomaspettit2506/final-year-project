import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
      '/friends': 'http://localhost:8000',
      '/friend': 'http://localhost:8000',
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
