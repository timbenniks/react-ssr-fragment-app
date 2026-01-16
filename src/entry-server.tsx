/**
 * Server-side entry point - runs on Node.js to generate HTML
 *
 * This file is called by the Express server to render React components
 * into HTML strings. The HTML is then sent to the browser.
 */

import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { App } from "./App";
import { fetchPageBySlug, type RenderProps } from "./api/contentstack";

/**
 * Render the React app to an HTML string
 *
 * @param url - The URL path (e.g., "/about", "/products/1")
 * @param props - Optional props including pre-fetched content
 * @returns HTML string ready to be sent to the browser
 *
 * Why StaticRouter? On the server, we know the URL upfront (from the request).
 * StaticRouter uses the provided URL instead of reading from browser history.
 */
export async function render(url: string, props?: RenderProps) {
  // renderToString converts React components into plain HTML
  // This HTML is sent to the browser, which then "hydrates" it with React
  const html = renderToString(
    <StaticRouter location={url}>
      <App content={props?.content} />
    </StaticRouter>
  );
  return { html };
}

// Re-export for use in server/index.ts and server/dev.ts
export { fetchPageBySlug };
