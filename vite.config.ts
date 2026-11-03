import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  optimizeDeps: {
    entries: ['index.html'],
    include: ['@react-pdf/renderer', 'buffer', 'jszip'],
  },
  server: { host: '0.0.0.0' },
});
