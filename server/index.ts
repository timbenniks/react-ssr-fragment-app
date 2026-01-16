/**
 * Production server - serves pre-built assets
 *
 * WHAT THIS DOES:
 * - Serves the production build of the application
 * - Uses pre-built assets from dist/ folder (faster than dev)
 * - Generates asset tags from Vite manifest (for cache-busting)
 * - Handles SSR rendering using compiled server bundle
 *
 * KEY DIFFERENCES FROM DEV:
 * - Uses pre-built assets (no on-the-fly compilation)
 * - Reads manifest.json to generate asset tags
 * - No HMR scripts (not needed in production)
 * - Faster startup and response times
 *
 * REQUIREMENTS:
 * - Must run `npm run build` before starting
 * - Requires dist/client/ and dist/server/ folders
 */

import "dotenv/config";
import express, { Request, Response } from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { getSlugFromUrl, serializeContent } from "./utils.js";
import type { Manifest, SSRModule } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3000", 10);

/**
 * Base URL for assets (optional)
 * - If set, generates absolute URLs (e.g., https://cdn.example.com/assets/...)
 * - If not set, uses relative URLs (e.g., /assets/...)
 * - Useful for CDN deployment
 */
const ASSET_BASE_URL = process.env.ASSET_BASE_URL?.replace(/\/$/, "") || "";

// Paths to build artifacts
const distPath = resolve(__dirname, "../client");
const manifestPath = resolve(distPath, ".vite/manifest.json");

/**
 * Vite manifest - maps source files to built assets
 *
 * WHAT IT CONTAINS:
 * - Source file path → built asset info
 * - Includes CSS files, JS files, and their dependencies
 * - Used to generate <link> and <script> tags
 *
 * EXAMPLE:
 * {
 *   "src/entry-client.tsx": {
 *     "file": "assets/entry-client-abc123.js",
 *     "css": ["assets/entry-client-def456.css"],
 *     "imports": ["src/App.tsx"]
 *   }
 * }
 */
let manifest: Manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as Manifest;
} catch {
  console.error("Missing manifest.json - run `npm run build` first");
  process.exit(1);
}

/**
 * Build absolute or relative asset URL
 *
 * @param path - Asset path (e.g., "/assets/file.js" or "assets/file.js")
 * @returns Full URL if ASSET_BASE_URL set, otherwise relative path
 */
function buildAssetUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return ASSET_BASE_URL ? `${ASSET_BASE_URL}${cleanPath}` : cleanPath;
}

/**
 * Generate HTML tags for CSS and JS assets
 *
 * WHAT THIS DOES:
 * - Reads manifest to find all assets for an entry
 * - Generates <link> tags for CSS files
 * - Generates <link rel="modulepreload"> for JS dependencies (faster loading)
 * - Generates <script> tag for main entry file
 *
 * @param entryKey - Key in manifest (e.g., "src/entry-client.tsx")
 * @returns HTML string with all asset tags
 *
 * WHY MODULEPRELOAD?
 * - Tells browser to preload JS modules before they're needed
 * - Improves performance by loading dependencies early
 * - Browser can download them in parallel
 */
function generateAssetTags(entryKey: string): string {
  const entry = manifest[entryKey];
  if (!entry) throw new Error(`Entry "${entryKey}" not found in manifest`);

  const tags: string[] = [];
  const processed = new Set<string>();

  // CSS files - load stylesheets first
  entry.css?.forEach((css) => {
    // Extract filename from full path (e.g., "dist/client/assets/file.css" → "file.css")
    const href = buildAssetUrl(`/assets/${css.split("/").pop()}`);
    tags.push(`<link rel="stylesheet" href="${href}" crossorigin>`);
  });

  // JS imports (modulepreload) - preload dependencies
  // These are modules imported by the main entry file
  entry.imports?.forEach((key) => {
    // Skip if already processed (avoid duplicates)
    if (processed.has(key)) return;
    processed.add(key);

    const imp = manifest[key];
    if (imp?.file) {
      const href = buildAssetUrl(`/assets/${imp.file.split("/").pop()}`);
      tags.push(`<link rel="modulepreload" href="${href}" crossorigin>`);
    }
  });

  // Main entry JS file - loads the React app
  const src = buildAssetUrl(`/assets/${entry.file.split("/").pop()}`);
  tags.push(`<script type="module" src="${src}" crossorigin></script>`);

  return tags.join("\n");
}

const app = express();

/**
 * Serve static assets with aggressive caching and CORS headers
 *
 * CONFIGURATION:
 * - maxAge: "1y" = cache for 1 year
 * - immutable: true = files never change (they have hashes in names)
 *
 * WHY AGGRESSIVE CACHING?
 * - Asset filenames include content hashes (e.g., file-abc123.js)
 * - If content changes, filename changes → safe to cache forever
 * - Improves performance (browser caches assets)
 *
 * WHY CORS HEADERS?
 * - Assets are loaded with absolute URLs (via ASSET_BASE_URL)
 * - Parent app may be on a different origin (e.g., Azure URL forwarding)
 * - Browser blocks cross-origin requests without CORS headers
 * - crossorigin attribute on <link>/<script> tags triggers CORS checks
 * - Setting Access-Control-Allow-Origin allows cross-origin asset loading
 *
 * NOTE: Currently set to "*" (allow all origins) for simplicity.
 * Can be tightened later by replacing "*" with a specific origin or
 * making it configurable via CORS_ALLOWED_ORIGIN env var.
 */
app.use("/assets", (_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, express.static(resolve(distPath, "assets"), { maxAge: "1y", immutable: true }));

// Health check endpoint - includes preview mode status
app.get("/health", (_req, res) => {
  const isPreviewMode = process.env.CONTENTSTACK_PREVIEW === "true";
  res.json({
    status: "ok",
    previewMode: isPreviewMode
  });
});

/**
 * Catch-all route - handles all page requests
 *
 * FLOW:
 * 1. Load pre-built SSR module (already compiled to JS)
 * 2. Fetch content from Contentstack
 * 3. Render React to HTML
 * 4. Generate asset tags from manifest
 * 5. Send HTML fragment with assets
 */
app.get(["/*"], async (req: Request, res: Response) => {
  try {
    // Load pre-built SSR module (compiled by Vite during build)
    // pathToFileURL converts file path to file:// URL (required for ESM import)
    const ssrModulePath = resolve(__dirname, "../server/entry-server.js");
    const { render, fetchPageBySlug } = (await import(pathToFileURL(ssrModulePath).href)) as SSRModule;

    // Fetch content from Contentstack
    const content = await fetchPageBySlug(getSlugFromUrl(req.originalUrl));

    // Render React component tree to HTML string
    const { html } = await render(req.originalUrl, { content });

    // Generate asset tags from manifest (CSS, modulepreload, main JS)
    const assetTags = generateAssetTags("src/entry-client.tsx");

    // Embed initial content for client-side hydration
    const hydrationScript = `<script>window.__INITIAL_CONTENT__ = ${serializeContent(content)};</script>`;

    // Send HTML fragment:
    // - Root div with SSR HTML
    // - Script with initial content (for hydration)
    // - Asset tags (CSS, JS)
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<div id="fragment-root">${html}</div>\n${hydrationScript}\n${assetTags}`);
  } catch (error) {
    console.error("SSR Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  const isPreviewMode = process.env.CONTENTSTACK_PREVIEW === "true";
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Preview mode: ${isPreviewMode ? "enabled" : "disabled"}`);
});
