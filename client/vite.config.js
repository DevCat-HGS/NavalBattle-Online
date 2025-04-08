import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const apiUrl = env.VITE_API_URL || 'https://game-battleship-production.up.railway.app';
  const wsUrl = env.VITE_WS_URL || 'wss://game-battleship-production.up.railway.app';
  
  return {
    plugins: [react()],
    base: '/',
    define: {
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
      'process.env.VITE_WS_URL': JSON.stringify(wsUrl)
    },
    server: {
      cors: true,
      host: true,
      proxy: isDev ? {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true
        },
        '/socket.io': {
          target: wsUrl,
          changeOrigin: true,
          ws: true,
          secure: false
        },
      } : undefined,
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