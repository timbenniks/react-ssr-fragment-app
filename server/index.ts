import 'dotenv/config';
import express, { Request, Response } from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ManifestEntry {
  file: string;
  src?: string;
  isEntry?: boolean;
  css?: string[];
  imports?: string[];
}

interface Manifest {
  [key: string]: ManifestEntry;
}

interface RenderResult {
  html: string;
}

interface SSRModule {
  render: (url: string, props?: unknown) => RenderResult;
}

const PORT = parseInt(process.env.PORT || '3000', 10);
const ASSET_BASE_URL = process.env.ASSET_BASE_URL?.replace(/\/$/, '') || '';

const distPath = resolve(__dirname, '../client');
const manifestPath = resolve(distPath, '.vite/manifest.json');

let manifest: Manifest;

try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest;
} catch (error) {
  console.error('Failed to load manifest.json. Run `npm run build` first.');
  process.exit(1);
}

function buildAssetUrl(assetPath: string): string {
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return ASSET_BASE_URL ? `${ASSET_BASE_URL}${cleanPath}` : cleanPath;
}

function generateAssetTags(entryKey: string): string {
  const entry = manifest[entryKey];
  if (!entry) {
    throw new Error(`Entry "${entryKey}" not found in manifest`);
  }

  const tags: string[] = [];
  const processedImports = new Set<string>();

  // 1. CSS link tags
  if (entry.css) {
    for (const cssFile of entry.css) {
      const href = buildAssetUrl(`/assets/${cssFile.split('/').pop()}`);
      tags.push(`<link rel="stylesheet" href="${href}" crossorigin>`);
    }
  }

  // 2. Modulepreload tags for imports
  if (entry.imports) {
    for (const importKey of entry.imports) {
      if (processedImports.has(importKey)) continue;
      processedImports.add(importKey);

      const importEntry = manifest[importKey];
      if (importEntry?.file) {
        const href = buildAssetUrl(`/assets/${importEntry.file.split('/').pop()}`);
        tags.push(`<link rel="modulepreload" href="${href}" crossorigin>`);
      }
    }
  }

  // 3. Module script tag for the client entry
  const scriptSrc = buildAssetUrl(`/assets/${entry.file.split('/').pop()}`);
  tags.push(`<script type="module" src="${scriptSrc}" crossorigin></script>`);

  return tags.join('\n');
}

const app = express();

// Serve static assets with long-lived cache headers
app.use(
  '/assets',
  express.static(resolve(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Fragment endpoint - serves SSR fragment at root and all sub-paths
app.get(['/', '/*'], async (req: Request, res: Response) => {
  try {
    const ssrModulePath = resolve(__dirname, '../server/entry-server.js');
    const ssrModuleUrl = pathToFileURL(ssrModulePath).href;
    const { render } = await import(ssrModuleUrl) as SSRModule;

    // Use originalUrl to preserve query params for routing
    const { html } = render(req.originalUrl);
    const assetTags = generateAssetTags('src/entry-client.tsx');

    const fragment = `<div id="fragment-root">${html}</div>\n${assetTags}`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(fragment);
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`SSR Fragment Server running at http://localhost:${PORT}`);
  console.log(`ASSET_BASE_URL: ${ASSET_BASE_URL || '(not set, using relative paths)'}`);
});
