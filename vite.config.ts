import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue2'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'ArticleContentRendererVue2',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith('.css')
            ? 'article-content-renderer-vue2.css'
            : 'assets/[name]-[hash][extname]',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
