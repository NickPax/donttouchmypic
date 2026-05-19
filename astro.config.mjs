import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://donttouchmypic.com',
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // Pre-bundle the client-side image libs used by inline <script> blocks.
      // Empty entries stops esbuild from trying to scan .astro files itself.
      entries: [],
      include: ['heic2any', 'jszip', 'pdf-lib'],
    },
    worker: {
      format: 'es',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'heic2any': ['heic2any'],
            'pdf-lib': ['pdf-lib'],
          },
        },
      },
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
