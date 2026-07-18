import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      verbose: true,
      disable: false,
      threshold: 1024,
      algorithm: 'brotli',
      ext: '.br',
    }),
  ],
  build: {
    rollupOptions: {
      plugins: [dynamicImportVars()],
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          'media-players': [
            'aplayer',
            'artplayer',
            'hls.js',
          ],
          'state': [
            'zustand',
            'react-query',
          ],
          'animations': [
            'framer-motion',
          ],
          'supabase': [
            '@supabase/supabase-js',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
