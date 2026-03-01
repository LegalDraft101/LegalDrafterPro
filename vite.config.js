import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'https://legaldrafterpro-1.onrender.com',
        changeOrigin: true,
      },
      '/api': {
        target: 'https://legaldrafterpro-1.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
