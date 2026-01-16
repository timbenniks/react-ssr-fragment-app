/**
 * Server entry point - renders React to HTML string
 *
 * WHAT THIS DOES:
 * - Runs on the server (Node.js) to generate HTML before sending to browser
 * - Converts React components into a plain HTML string
 * - This HTML is sent to the browser, then hydrated by entry-client.tsx
 *
 * WHY SSR (Server-Side Rendering)?
 * - Faster initial page load (HTML ready immediately)
 * - Better SEO (search engines see content)
 * - Works without JavaScript (graceful degradation)
 */

import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { App } from "./App";
import { fetchPageBySlug, type RenderProps } from "./api/contentstack";

/**
 * Renders a React component tree to an HTML string
 *
 * @param url - The URL path being rendered (e.g., "/about")
 * @param props - Optional props including pre-fetched content
 * @returns HTML string ready to be sent to the browser
 *
 * HOW IT WORKS:
 * 1. Server receives request for a URL (e.g., GET /about)
 * 2. Content is fetched from Contentstack (already done before calling this)
 * 3. This function renders the React tree to HTML string
 * 4. HTML is sent to browser with initial content embedded
 * 5. Browser hydrates the HTML (see entry-client.tsx)
 */
export async function render(url: string, props?: RenderProps) {
  // renderToString converts React components to HTML string
  // This is synchronous - React renders the entire tree at once
  const html = renderToString(
    // StaticRouter is for SSR - it doesn't navigate, just provides routing context
    // The "location" prop tells React Router what route to render
    // Client-side uses BrowserRouter which handles actual navigation
    <StaticRouter location={url}>
      <App content={props?.content} />
    </StaticRouter>
  );
  return { html };
}

// Export fetchPageBySlug so the server can call it before rendering
// This allows us to fetch content on the server and pass it to the component
export { fetchPageBySlug };
