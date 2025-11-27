import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { nunjucksPlugin } from './vite-plugin-nunjucks.js';

export default defineConfig({
  plugins: [
    nunjucksPlugin(),
    tailwindcss(),
  ],
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'resources/views/index.html'),
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'resources'),
    },
  },
});

