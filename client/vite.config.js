import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
