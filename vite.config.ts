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
    // Nuxt 2 / Webpack 4 does not transpile syntax from node_modules by default.
    // Emit ES2015 so consumers can use the package without extra build config.
    target: 'es2015',
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
