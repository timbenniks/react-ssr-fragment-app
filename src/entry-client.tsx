/**
 * Client entry point - hydrates server-rendered HTML
 *
 * WHAT THIS DOES:
 * - Takes the HTML that was rendered on the server and "hydrates" it
 * - Hydration = attaching React event listeners and making it interactive
 * - This is the bridge between static SSR HTML and interactive React app
 *
 * HOW IT WORKS:
 * 1. Server renders HTML to string and includes it in the response
 * 2. Server also embeds initial content in window.__INITIAL_CONTENT__
 * 3. This file runs in the browser and hydrates that HTML
 * 4. React takes over and handles all future interactions
 */

import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { isPreviewMode } from "./api/contentstack";
import type { Page } from "./api/contentstack";

// Extend the global Window interface to include our custom properties
// This tells TypeScript that these properties exist on window
declare global {
  interface Window {
    // Content from server-side rendering (embedded in HTML)
    __INITIAL_CONTENT__?: Page | null;
    // Flag to prevent double hydration (safety check)
    __HYDRATED__?: boolean;
  }
}

/**
 * Clone content before SDK can intercept it (prevents hydration mismatches)
 *
 * WHY CLONE?
 * - Contentstack SDK may modify the original object
 * - React hydration requires exact match between server HTML and client state
 * - Deep clone ensures we have a clean copy that won't be mutated
 * - JSON.parse(JSON.stringify()) is a simple deep clone for plain objects
 */
const initialContent: Page | null = window.__INITIAL_CONTENT__
  ? JSON.parse(JSON.stringify(window.__INITIAL_CONTENT__))
  : null;

// Find the root element where React will attach
// This element was created by the server and contains the SSR HTML
const container = document.getElementById("fragment-root");

/**
 * Hydrate only if:
 * - Container exists (server rendered successfully)
 * - Not already hydrated (prevent double hydration errors)
 */
if (container && !window.__HYDRATED__) {
  window.__HYDRATED__ = true;

  // Log preview mode status for debugging
  if (import.meta.env.DEV) {
    console.log(
      `[Contentstack] Preview mode: ${isPreviewMode ? "enabled" : "disabled"}`
    );
  }

  // hydrateRoot is React 19's way to hydrate SSR content
  // It's similar to ReactDOM.hydrateRoot() but with better error handling
  hydrateRoot(
    container,
    // BrowserRouter enables client-side routing (e.g., /about, /contact)
    // Server uses StaticRouter, client uses BrowserRouter - same API, different context
    <BrowserRouter>
      <App content={initialContent} />
    </BrowserRouter>
  );
}

/**
 * Enable Hot Module Replacement (HMR) in development
 * - import.meta.hot is a Vite feature
 * - When you save a file, Vite updates the page without full reload
 * - This makes development much faster
 */
if (import.meta.hot) {
  import.meta.hot.accept();
}
