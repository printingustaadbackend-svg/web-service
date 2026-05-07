import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Dev: proxy /api/* → Express backend (so relative URLs work in both dev & prod)
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  },

  // Production build optimizations
  build: {
    sourcemap: false,        // disable sourcemaps in production
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split large vendor libs into separate chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
})
