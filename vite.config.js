import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react()],
  base: '/cloud-generator/',
  build: {
    outDir: 'dist'
  }
})
