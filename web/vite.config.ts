import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
  ],
  base: './', // Set base path for GitHub Pages
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['nurbs_wasm'],
  },
  server: {
    fs: {
      // Allow serving files from one level up (the project root)
      allow: ['..'],
    },
  },
});
