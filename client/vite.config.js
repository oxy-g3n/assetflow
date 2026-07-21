import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    allowedHosts: ['22f9-2405-201-2011-c8a2-1585-9d5-bc17-d8e7.ngrok-free.app'],
  },
});
