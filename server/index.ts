/**
 * Production server - serves pre-built assets
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
const ASSET_BASE_URL = process.env.ASSET_BASE_URL?.replace(/\/$/, "") || "";

const distPath = resolve(__dirname, "../client");
const manifestPath = resolve(distPath, ".vite/manifest.json");

let manifest: Manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as Manifest;
} catch {
  console.error("Missing manifest.json - run `npm run build` first");
  process.exit(1);
}

function buildAssetUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return ASSET_BASE_URL ? `${ASSET_BASE_URL}${cleanPath}` : cleanPath;
}

function generateAssetTags(entryKey: string): string {
  const entry = manifest[entryKey];
  if (!entry) throw new Error(`Entry "${entryKey}" not found in manifest`);

  const tags: string[] = [];
  const processed = new Set<string>();

  // CSS
  entry.css?.forEach((css) => {
    const href = buildAssetUrl(`/assets/${css.split("/").pop()}`);
    tags.push(`<link rel="stylesheet" href="${href}" crossorigin>`);
  });

  // JS imports (modulepreload)
  entry.imports?.forEach((key) => {
    if (processed.has(key)) return;
    processed.add(key);
    const imp = manifest[key];
    if (imp?.file) {
      const href = buildAssetUrl(`/assets/${imp.file.split("/").pop()}`);
      tags.push(`<link rel="modulepreload" href="${href}" crossorigin>`);
    }
  });

  // Main entry
  const src = buildAssetUrl(`/assets/${entry.file.split("/").pop()}`);
  tags.push(`<script type="module" src="${src}" crossorigin></script>`);

  return tags.join("\n");
}

const app = express();

app.use("/assets", express.static(resolve(distPath, "assets"), { maxAge: "1y", immutable: true }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get(["/*"], async (req: Request, res: Response) => {
  try {
    const ssrModulePath = resolve(__dirname, "../server/entry-server.js");
    const { render, fetchPageBySlug } = (await import(pathToFileURL(ssrModulePath).href)) as SSRModule;

    const content = await fetchPageBySlug(getSlugFromUrl(req.originalUrl));
    const { html } = await render(req.originalUrl, { content });
    const assetTags = generateAssetTags("src/entry-client.tsx");
    const hydrationScript = `<script>window.__INITIAL_CONTENT__ = ${serializeContent(content)};</script>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<div id="fragment-root">${html}</div>\n${hydrationScript}\n${assetTags}`);
  } catch (error) {
    console.error("SSR Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
