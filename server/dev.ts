/**
 * Development server with HMR and live reload
 */

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getSlugFromUrl, serializeContent } from "./utils.js";
import type { SSRModule } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3000", 10);

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

  const vite = await createViteServer({
    root: resolve(__dirname, ".."),
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.get("/health", (_req, res) => res.json({ status: "ok", mode: "development" }));

  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ssrModule = (await vite.ssrLoadModule("/src/entry-server.tsx")) as SSRModule;
      const content = await ssrModule.fetchPageBySlug(getSlugFromUrl(req.originalUrl));
      const { html } = await ssrModule.render(req.originalUrl, { content });

      const fragment = `
        <div id="fragment-root">${html}</div>
        <script>window.__INITIAL_CONTENT__ = ${serializeContent(content)};</script>
        ${DEV_SCRIPTS}
      `;

      res.status(200).set({ "Content-Type": "text/html" }).send(fragment);
    } catch (e) {
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
    console.log(`\n  Dev server: http://localhost:${PORT}`);
    console.log(`  HMR enabled\n`);
  });
}

createDevServer();
