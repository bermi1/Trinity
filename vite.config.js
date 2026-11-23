import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Two pages: the office system, and the public event registration page (with its own link-preview tags).
      input: { main: resolve(__dirname, 'index.html'), register: resolve(__dirname, 'register.html') },
      output: {
        // Libraries change rarely, so they get their own long-cached files.
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (id.includes('node_modules/@supabase/')) return 'supabase';
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    // e2e/ holds the Playwright browser tests (npm run test:e2e).
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'dist-e2e/**'],
    setupFiles: ['./src/test/setup.js']
  }
});
