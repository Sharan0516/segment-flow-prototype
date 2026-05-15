import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  // GitHub Pages serves under /<repo-name>/. Override with VITE_BASE if deploying elsewhere.
  base: process.env.VITE_BASE ?? '/segment-flow-prototype/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5180,
    strictPort: false,
  },
});
