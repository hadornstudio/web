import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

// The first-load splash lives in index.html so it paints before any JavaScript runs; it needs the brand
// SVGs inline, so they are injected from the same files the app uses (stripped of their own title/label).
const brandSplash = () => ({
  name: 'brand-splash',
  transformIndexHtml(html) {
    const svg = (file) =>
      readFileSync(new URL(`./src/assets/brand/${file}`, import.meta.url), 'utf8')
        .replace(/<title>[\s\S]*?<\/title>/, '')
        .replace(/\s(role|aria-label)="[^"]*"/g, '');
    return html.replace('<!--splash-mark-->', svg('hadorn-mark.svg')).replace('<!--splash-word-->', svg('hadorn-wordmark.svg'));
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), brandSplash()],
  server: {
    port: 5173,
  },
  build: {
    rolldownOptions: {
      output: {
        // Stable vendor chunks cache across deploys and download in parallel with the app code.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
          if (id.includes('node_modules/gsap') || id.includes('node_modules/@gsap')) return 'gsap';
          if (id.includes('node_modules/@tanstack')) return 'query';
          return undefined;
        },
      },
    },
  },
})
