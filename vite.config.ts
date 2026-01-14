import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    manifest: true,
    rollupOptions: {
      input: 'src/entry-client.tsx',
    },
  },
  ssr: {
    noExternal: ['react', 'react-dom', 'react-router-dom', 'react-router'],
  },
});
