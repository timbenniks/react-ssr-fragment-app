import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
  ],
  // Expose CONTENTSTACK_ prefixed env vars to client via import.meta.env
  envPrefix: ['VITE_', 'CONTENTSTACK_'],
  base: '/',
  build: {
    manifest: true,
    rollupOptions: {
      input: 'src/entry-client.tsx',
    },
  },
  optimizeDeps: {
    include: ['react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  ssr: {
    // Externalize React and related packages for SSR - they work fine as Node.js modules
    // Only bundle client-specific code
    noExternal: [],
    external: [
      'react',
      'react-dom',
      'react-dom/server',
      'react-router',
      'react-router-dom',
      '@contentstack/delivery-sdk',
    ],
  },
});
