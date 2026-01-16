/**
 * Client-side entry point - runs in the browser after SSR HTML is loaded
 *
 * This file handles "hydration" - attaching React to the server-rendered HTML.
 * The server renders HTML with initial content, and this code makes it interactive.
 */

import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import type { Page } from "./api/contentstack";

/**
 * Extend the Window interface to include our custom properties
 * These are injected by the server in the HTML response
 */
declare global {
  interface Window {
    /** Initial content from server-side rendering */
    __INITIAL_CONTENT__?: Page | null;
    /** Flag to prevent double hydration during HMR (Hot Module Replacement) */
    __HYDRATED__?: boolean;
  }
}

// Find the root element where React will attach
const container = document.getElementById("fragment-root");

/**
 * Hydrate the React app to the server-rendered HTML
 *
 * Why check __HYDRATED__? During development, HMR can reload this module.
 * Without the flag, React would try to hydrate twice, causing errors.
 */
if (container && !window.__HYDRATED__) {
  window.__HYDRATED__ = true;

  // hydrateRoot attaches React event listeners to existing HTML
  // BrowserRouter enables client-side routing (e.g., /about, /products)
  hydrateRoot(
    container,
    <BrowserRouter>
      <App content={window.__INITIAL_CONTENT__} />
    </BrowserRouter>
  );
}

/**
 * Enable Hot Module Replacement (HMR) in development
 * When you save a file, Vite updates the page without full reload
 */
if (import.meta.hot) {
  import.meta.hot.accept();
}
