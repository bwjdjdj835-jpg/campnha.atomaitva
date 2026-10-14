import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Em dev, /api vai para o backend local (server/index.js).
    proxy: { '/api': 'http://localhost:8787' },
  },
})
