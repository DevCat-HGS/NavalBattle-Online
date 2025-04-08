import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: '/',
    server: {
      cors: true,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://game-battleship-production.up.railway.app',
          changeOrigin: true,
          secure: false,
          ws: true
        },
        '/socket.io': {
          target: env.VITE_WS_URL || 'wss://game-battleship-production.up.railway.app',
          changeOrigin: true,
          ws: true,
          secure: false
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  }
})