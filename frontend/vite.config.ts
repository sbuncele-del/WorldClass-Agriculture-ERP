import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Enable source maps for debugging (disable in production if needed)
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - separate heavy libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-charts': ['recharts', '@ant-design/charts'],
          'vendor-utils': ['axios', 'date-fns', 'socket.io-client'],
          // Feature chunks
          'feature-maps': ['leaflet', 'react-leaflet'],
          'feature-ocr': ['tesseract.js'],
        },
      },
    },
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
  },
  // Force single React instance to prevent hooks errors
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'antd', 'axios'],
  },
})
