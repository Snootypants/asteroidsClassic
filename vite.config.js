import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use relative paths so GitHub Pages serves assets correctly under /<repo>/
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom'
  }
})
