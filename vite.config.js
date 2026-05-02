import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const BASE = process.env.NETLIFY ? '/' : '/parfum-craft/'

export default defineConfig({
  base: BASE,
  plugins: [react()],
})
