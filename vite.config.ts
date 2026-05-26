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
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // NextAuth enforces strict CSRF checks. We must trick it into 
            // thinking the request originated from its own domain (port 3000)
            proxyReq.setHeader('origin', 'http://localhost:3000');
            proxyReq.setHeader('referer', 'http://localhost:3000/');
          });
        }
      },
    },
  },
})
