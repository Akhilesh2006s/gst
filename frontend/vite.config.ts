import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // For development, proxy to localhost backend (same-origin = cookies work!)
        // For production, this won't be used (Vercel serves static files)
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false, // false for localhost HTTP
        // Preserve cookies
        cookieDomainRewrite: '',
        // Log proxy requests for debugging
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[Vite Proxy] ${req.method} ${req.url} -> ${proxyReq.path}`);
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})

