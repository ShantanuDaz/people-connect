import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: './', // Use relative paths so Electron can load files from file:// in production
  server: {
    watch: {
      ignored: ['**/.peer2-data/**']
    }
  }
})
