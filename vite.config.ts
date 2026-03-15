import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/thoracic-lit-review/',
  plugins: [react(), tailwindcss()],
})
