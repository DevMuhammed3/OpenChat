// apps/frontend/vite.config.mts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  css: {
    postcss: path.resolve(__dirname, './postcss.config.cjs'), 
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@openchat/lib': path.resolve(__dirname, '../../packages/lib/src'),
      '@openchat/components': path.resolve(__dirname, '../../packages/components/src'),
    }
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '../../')]
    }
  },
})
