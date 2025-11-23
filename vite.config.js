import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import viteImagemin from 'vite-plugin-imagemin';
import { nunjucksPlugin } from './vite-plugin-nunjucks.js';

export default defineConfig({
  plugins: [
    nunjucksPlugin(),
    tailwindcss(),
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
            active: false,
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
      mozjpeg: {
        quality: 80,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      webp: {
        quality: 80,
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'resources/images/*',
          dest: 'images',
        },
      ],
    }),
  ],
  root: './',
  publicDir: 'public',
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

