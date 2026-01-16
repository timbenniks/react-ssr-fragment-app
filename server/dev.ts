/**
 * Development server with HMR and live reload
 *
 * WHAT THIS DOES:
 * - Creates an Express server for development
 * - Integrates Vite dev server for HMR (Hot Module Replacement)
 * - Handles SSR rendering on-the-fly (no build needed)
 * - Serves React components directly from source files
 *
 * KEY DIFFERENCES FROM PRODUCTION:
 * - No pre-built assets (everything compiled on-the-fly)
 * - Vite handles TypeScript/JSX transpilation
 * - HMR scripts injected for instant updates
 * - Source maps and error overlays enabled
 *
 * HOW IT WORKS:
 * 1. Request comes in (e.g., GET /about)
 * 2. Vite loads entry-server.tsx module dynamically
 * 3. Fetch content from Contentstack
 * 4. Render React to HTML string
 * 5. Inject HMR scripts and send response
 */

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getSlugFromUrl, serializeContent } from "./utils.js";
import type { SSRModule } from "./types.js";

// Get directory path (ESM equivalent of __dirname)
// fileURLToPath converts file:// URL to path string
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3000", 10);

/**
 * Development scripts injected into every response
 *
 * WHAT THESE DO:
 * - React Refresh: Enables HMR for React components
 * - Vite Client: WebSocket connection for HMR updates
 * - Entry Client: Our React app entry point
 *
 * WHY INJECTED HERE?
 * - Production uses pre-built assets with manifest
 * - Dev needs these scripts for HMR to work
 * - These are Vite-specific dev features
 */
const DEV_SCRIPTS = `
  <script type="module">
    import RefreshRuntime from '/@react-refresh'
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type
    window.__vite_plugin_react_preamble_installed__ = true
  </script>
  <script type="module" src="/@vite/client"></script>
  <script type="module" src="/src/entry-client.tsx"></script>
`;

async function createDevServer() {
  const app = express();

  /**
   * Create Vite dev server
   *
   * CONFIGURATION:
   * - middlewareMode: Vite handles requests, doesn't start its own server
   * - appType: "custom" means we handle routing ourselves
   * - root: Project root directory
   *
   * WHAT VITE DOES:
   * - Transpiles TypeScript/JSX on-the-fly
   * - Serves source files directly
   * - Provides HMR WebSocket connection
   * - Handles CSS imports and processing
   */
  const vite = await createViteServer({
    root: resolve(__dirname, ".."),
    server: { middlewareMode: true },
    appType: "custom",
  });

  // Use Vite's middleware to handle asset requests and HMR
  // This intercepts requests for JS/CSS files and processes them
  app.use(vite.middlewares);
  
  // Health check endpoint - includes preview mode status
  app.get("/health", (_req, res) => {
    const isPreviewMode = process.env.CONTENTSTACK_PREVIEW === "true";
    res.json({ 
      status: "ok", 
      mode: "development",
      previewMode: isPreviewMode 
    });
  });

  /**
   * Catch-all route - handles all page requests
   *
   * FLOW:
   * 1. Extract URL slug (e.g., "/about" from "/about?foo=bar")
   * 2. Dynamically load entry-server.tsx module (Vite compiles it on-the-fly)
   * 3. Fetch content from Contentstack for this slug
   * 4. Render React component to HTML string
   * 5. Embed content in window.__INITIAL_CONTENT__ for hydration
   * 6. Inject HMR scripts and send HTML fragment
   */
  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Load SSR module dynamically (Vite compiles TypeScript on-the-fly)
      // This is why we don't need to build before running dev server
      const ssrModule = (await vite.ssrLoadModule("/src/entry-server.tsx")) as SSRModule;
      
      // Fetch content from Contentstack
      const content = await ssrModule.fetchPageBySlug(getSlugFromUrl(req.originalUrl));
      
      // Render React component tree to HTML string
      const { html } = await ssrModule.render(req.originalUrl, { content });

      // Build the HTML fragment:
      // - Root div with SSR HTML
      // - Script tag with initial content (for hydration)
      // - HMR scripts (dev only)
      const fragment = `
        <div id="fragment-root">${html}</div>
        <script>window.__INITIAL_CONTENT__ = ${serializeContent(content)};</script>
        ${DEV_SCRIPTS}
      `;

      res.status(200).set({ "Content-Type": "text/html" }).send(fragment);
    } catch (e) {
      if (e instanceof Error) {
        // Vite can fix stack traces to point to source files (not compiled)
        vite.ssrFixStacktrace(e);
        console.error(e.stack);
        res.status(500).send(`<pre>${e.stack}</pre>`);
      } else {
        next(e);
      }
    }
  });

  app.listen(PORT, () => {
    const isPreviewMode = process.env.CONTENTSTACK_PREVIEW === "true";
    console.log(`\n  Dev server: http://localhost:${PORT}`);
    console.log(`  HMR enabled`);
    console.log(`  Preview mode: ${isPreviewMode ? "enabled" : "disabled"}\n`);
  });
}

createDevServer();
