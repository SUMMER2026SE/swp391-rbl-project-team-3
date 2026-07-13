import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // H4: aggressively compress the heavy portal PNGs/JPEGs at build time.
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { lossless: true },
      svg: {
        multipass: true,
        plugins: [
          { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/payos-api': {
        target: 'https://api-merchant.payos.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/payos-api/, '')
      }
    }
  }
})
