import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative asset URLs keep the UI preview portable across GitHub Pages project URLs.
export default defineConfig({
  base: './',
  plugins: [react()],
})
