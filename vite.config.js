import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const root = import.meta.dirname

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        guidelines: resolve(root, 'public/brand-guidelines.html'),
      },
    },
  },
})
