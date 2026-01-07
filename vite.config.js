import { defineConfig } from 'vite'
import blogPlugin from './vite-plugin-blog.js'

export default defineConfig({
  plugins: [blogPlugin()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true
  }
})
