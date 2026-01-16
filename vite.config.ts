/**
 * Vite configuration
 *
 * WHAT VITE DOES:
 * - Build tool and dev server for modern web apps
 * - Handles TypeScript, JSX, CSS processing
 * - Provides HMR (Hot Module Replacement) in development
 * - Bundles code for production
 *
 * KEY FEATURES:
 * - Fast builds (uses esbuild for dev, Rollup for prod)
 * - Native ESM support (no CommonJS)
 * - Plugin system for React, Tailwind, etc.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    /**
     * React plugin - handles JSX and React Fast Refresh
     * 
     * jsxRuntime: 'automatic'
     * - Uses new JSX transform (no need to import React)
     * - Automatically imports jsx() function
     * - Smaller bundle size
     */
    react({
      jsxRuntime: 'automatic',
    }),
    /**
     * Tailwind CSS plugin - processes Tailwind classes
     * - Scans files for Tailwind classes
     * - Generates CSS on-the-fly (dev) or at build time (prod)
     */
    tailwindcss(),
  ],

  /**
   * Environment variable prefix
   * 
   * WHAT THIS DOES:
   * - Exposes env vars prefixed with VITE_ or CONTENTSTACK_ to client code
   * - Accessible via import.meta.env.CONTENTSTACK_API_KEY
   * - Other env vars (like PORT) are server-only
   * 
   * WHY PREFIX?
   * - Security: prevents accidentally exposing server secrets
   * - Only explicitly prefixed vars are bundled into client code
   */
  envPrefix: ['VITE_', 'CONTENTSTACK_'],

  /**
   * Base URL for assets
   * - '/' means assets are served from root
   * - Change if deploying to subdirectory (e.g., '/app/')
   */
  base: '/',

  build: {
    /**
     * Generate manifest.json
     * 
     * WHAT IT DOES:
     * - Maps source files to built assets
     * - Used by production server to generate asset tags
     * - Includes file hashes for cache-busting
     * 
     * EXAMPLE OUTPUT:
     * {
     *   "src/entry-client.tsx": {
     *     "file": "assets/entry-client-abc123.js",
     *     "css": ["assets/entry-client-def456.css"]
     *   }
     * }
     */
    manifest: true,

    rollupOptions: {
      /**
       * Entry point for client build
       * - This is the file that starts the React app
       * - Vite bundles everything starting from here
       */
      input: 'src/entry-client.tsx',
    },
  },

  /**
   * Dependency optimization
   * 
   * WHAT THIS DOES:
   * - Pre-bundles dependencies for faster dev server startup
   * - include: Force these to be pre-bundled
   * - Speeds up initial page load in development
   */
  optimizeDeps: {
    include: ['react/jsx-runtime', 'react/jsx-dev-runtime'],
  },

  /**
   * SSR (Server-Side Rendering) configuration
   * 
   * WHAT THIS DOES:
   * - Controls how Vite bundles code for SSR
   * - external: Don't bundle these (use Node.js modules directly)
   * - noExternal: Bundle these (for packages that don't work in Node.js)
   * 
   * WHY EXTERNALIZE?
   * - React, React DOM work fine as Node.js modules
   * - No need to bundle them (smaller bundle, faster)
   * - Only bundle code that needs to run in browser
   */
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
