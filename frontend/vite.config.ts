import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2015', 'chrome64', 'firefox60', 'safari11', 'edge79'],
    cssTarget: ['chrome64', 'firefox60', 'safari11', 'edge79'],
    minify: 'esbuild',
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/auth/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
