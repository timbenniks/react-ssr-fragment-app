/**
 * Development Server
 * 
 * This server runs during development and provides:
 * - Hot Module Replacement (HMR) - changes update instantly
 * - On-the-fly TypeScript/JSX compilation
 * - Source maps for debugging
 * - Fast refresh for React components
 * 
 * Unlike production, assets are served directly by Vite (not from dist/).
 */

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer, ViteDevServer } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getSlugFromUrl, serializeContent } from "./utils.js";
import type { SSRModule } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = parseInt(process.env.PORT || "3000", 10);

/**
 * Development asset tags for HMR (Hot Module Replacement)
 * 
 * These scripts enable:
 * - React Fast Refresh (component state preserved on save)
 * - Vite HMR client (receives update notifications)
 * - Direct import of entry-client.tsx (Vite transforms it on the fly)
 */
const DEV_ASSET_TAGS = `
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
   * Create Vite dev server in middleware mode
   * This integrates Vite with Express instead of running as standalone server
   */
  const vite = await createViteServer({
    root: resolve(__dirname, ".."), // Project root
    server: { middlewareMode: true }, // Integrate with Express
    appType: "custom", // Custom app (not SPA or library)
  });

  // Vite middleware handles:
  // - Serving source files with on-the-fly transformation
  // - HMR WebSocket connections
  // - Source maps
  app.use(vite.middlewares);
  app.get("/health", (_req, res) => res.json({ status: "ok", mode: "development" }));

  /**
   * Handle all routes - SSR for any URL path
   * 
   * Flow:
   * 1. Extract slug from URL
   * 2. Load entry-server.tsx module (Vite transforms TypeScript/JSX on the fly)
   * 3. Fetch content from Contentstack
   * 4. Render React to HTML string
   * 5. Inject content and asset tags
   * 6. Send HTML fragment to browser
   */
  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    try {
      // Load and transform entry-server.tsx on the fly (no build needed!)
      const ssrModule = (await vite.ssrLoadModule("/src/entry-server.tsx")) as SSRModule;
      
      // Fetch content from Contentstack based on URL
      const content = await ssrModule.fetchPageBySlug(getSlugFromUrl(url));
      
      // Render React components to HTML string
      const { html } = await ssrModule.render(url, { content });

      // Build HTML fragment with:
      // - SSR HTML
      // - Initial content for hydration
      // - Dev asset tags (HMR scripts)
      const fragment = `
        <div id="fragment-root">${html}</div>
        <script>window.__INITIAL_CONTENT__ = ${serializeContent(content)};</script>
        ${DEV_ASSET_TAGS}
      `;

      res.status(200).set({ "Content-Type": "text/html" }).send(fragment);
    } catch (e) {
      // Vite can improve error stack traces for better debugging
      if (e instanceof Error) {
        vite.ssrFixStacktrace(e);
        console.error(e.stack);
        res.status(500).send(`<pre>${e.stack}</pre>`);
      } else {
        next(e);
      }
    }
  });

  app.listen(PORT, () => {
    console.log(`\n  Dev server running at http://localhost:${PORT}`);
    console.log(`  HMR enabled\n`);
  });
}

createDevServer();
