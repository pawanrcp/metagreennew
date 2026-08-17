import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'pdfkit': 'pdfkit/js/pdfkit.standalone.js',
    },
  },

  server: {
    host: '0.0.0.0',
    port: 3000,

    allowedHosts: [
      'metagreen.in',
      'www.metagreen.in'
    ],

    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },

  preview: {
    host: '0.0.0.0',
    port: 3000,

    allowedHosts: [
      'metagreen.in',
      'www.metagreen.in'
    ],
  },
});