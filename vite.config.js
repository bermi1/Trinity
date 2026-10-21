import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
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
    setupFiles: ['./src/test/setup.js']
  }
});
