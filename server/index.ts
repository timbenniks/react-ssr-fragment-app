/**
 * Production Server
 * 
 * This server runs in production and:
 * - Serves pre-built assets from dist/client/
 * - Uses Vite's manifest.json to resolve asset paths
 * - Renders React components server-side
 * - Returns HTML fragments for injection into other pages
 * 
 * Run `npm run build` before starting this server.
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getSlugFromUrl, serializeContent } from './utils.js';
import type { Manifest, SSRModule } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = parseInt(process.env.PORT || '3000', 10);

/**
 * Base URL for assets (optional)
 * 
 * If set, asset URLs will be absolute (e.g., https://cdn.example.com/assets/...)
 * If not set, assets use relative paths (e.g., /assets/...)
 * 
 * Use absolute URLs when serving fragments from a CDN or different domain.
 */
const ASSET_BASE_URL = process.env.ASSET_BASE_URL?.replace(/\/$/, '') || '';

const distPath = resolve(__dirname, '../client');
const manifestPath = resolve(distPath, '.vite/manifest.json');

/**
 * Vite's build manifest maps source file paths to hashed output files
 * 
 * Example:
 *   "src/entry-client.tsx" → {
 *     file: "assets/entry-client-abc123.js",
 *     css: ["assets/entry-client-def456.css"]
 *   }
 * 
 * This allows us to generate correct <script> and <link> tags.
 */
let manifest: Manifest;

try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
} catch (error) {
  console.error('Failed to load manifest.json. Run `npm run build` first.');
  process.exit(1);
}

/**
 * Build absolute or relative asset URL
 * 
 * @param assetPath - Path to asset (e.g., "/assets/file.js" or "assets/file.js")
 * @returns Full URL if ASSET_BASE_URL is set, otherwise relative path
 */
function buildAssetUrl(assetPath: string): string {
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return ASSET_BASE_URL ? `${ASSET_BASE_URL}${cleanPath}` : cleanPath;
}

/**
 * Extract filename from path
 * 
 * @param path - Full path (e.g., "/assets/entry-client-abc123.js")
 * @returns Filename (e.g., "entry-client-abc123.js")
 */
function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

/**
 * Generate HTML tags for CSS and JavaScript assets
 * 
 * Uses Vite's manifest to find the correct hashed filenames.
 * Generates:
 * - <link rel="stylesheet"> tags for CSS
 * - <link rel="modulepreload"> tags for JavaScript imports (faster loading)
 * - <script type="module"> tag for the main entry point
 * 
 * @param entryKey - Key in manifest (e.g., "src/entry-client.tsx")
 * @returns HTML string with all asset tags
 */
function generateAssetTags(entryKey: string): string {
  const entry = manifest[entryKey];
  if (!entry) {
    throw new Error(`Entry "${entryKey}" not found in manifest`);
  }

  const tags: string[] = [];
  const processedImports = new Set<string>();

  // Add CSS link tags
  entry.css?.forEach((cssFile) => {
    const href = buildAssetUrl(`/assets/${getFileName(cssFile)}`);
    tags.push(`<link rel="stylesheet" href="${href}" crossorigin>`);
  });

  // Add modulepreload tags for JavaScript imports (loads them early)
  entry.imports?.forEach((importKey) => {
    if (processedImports.has(importKey)) return; // Avoid duplicates
    processedImports.add(importKey);
    const importEntry = manifest[importKey];
    if (importEntry?.file) {
      const href = buildAssetUrl(`/assets/${getFileName(importEntry.file)}`);
      tags.push(`<link rel="modulepreload" href="${href}" crossorigin>`);
    }
  });

  // Add main JavaScript entry point
  const scriptSrc = buildAssetUrl(`/assets/${getFileName(entry.file)}`);
  tags.push(`<script type="module" src="${scriptSrc}" crossorigin></script>`);

  return tags.join('\n');
}

const app = express();

/**
 * Serve static assets (JS, CSS) with long cache headers
 * 
 * Assets are hashed (e.g., entry-client-abc123.js), so they can be cached forever.
 * When code changes, the hash changes, so browsers fetch the new version.
 */
app.use('/assets', express.static(resolve(distPath, 'assets'), { maxAge: '1y', immutable: true }));

// Health check endpoint
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/**
 * Main SSR route - handles all paths (/, /about, /products/1, etc.)
 * 
 * Flow:
 * 1. Load pre-built SSR module (entry-server.js from dist/server/)
 * 2. Extract slug from URL
 * 3. Fetch content from Contentstack
 * 4. Render React to HTML
 * 5. Generate asset tags from manifest
 * 6. Return HTML fragment with SSR content, hydration script, and asset tags
 */
app.get(['/', '/*'], async (req: Request, res: Response) => {
  try {
    // Load the pre-built SSR module (already compiled by Vite)
    const ssrModulePath = resolve(__dirname, '../server/entry-server.js');
    const { render, fetchPageBySlug } = await import(pathToFileURL(ssrModulePath).href) as SSRModule;

    // Fetch content from Contentstack based on URL
    const slug = getSlugFromUrl(req.originalUrl);
    const content = await fetchPageBySlug(slug);
    
    // Render React components to HTML string
    const { html } = await render(req.originalUrl, { content });
    
    // Generate <link> and <script> tags for CSS and JS assets
    const assetTags = generateAssetTags('src/entry-client.tsx');
    
    // Serialize content for client-side hydration
    // The client reads this and uses it as initial state
    const hydrationScript = `<script>window.__INITIAL_CONTENT__ = ${serializeContent(content)};</script>`;

    // Send HTML fragment (not a full HTML document)
    // This can be injected into any page (e.g., .NET MVC view)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<div id="fragment-root">${html}</div>\n${hydrationScript}\n${assetTags}`);
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`SSR Fragment Server running at http://localhost:${PORT}`);
  console.log(`ASSET_BASE_URL: ${ASSET_BASE_URL || '(not set, using relative paths)'}`);
});
