import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // un seul fichier JS (l'aperçu claude.ai l'intègre dans la page) : taille assumée
  build: { chunkSizeWarningLimit: 900 },
})
