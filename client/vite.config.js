import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://game-battleship-production.up.railway.app',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://game-battleship-production.up.railway.app',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})