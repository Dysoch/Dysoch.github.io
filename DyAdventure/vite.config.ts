import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/DyAdventure/',  // ⚡ important for project page
  worker: {
    format: 'es',
  },
})
