/**
 * Client entry point - hydrates server-rendered HTML
 */

import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import type { Page } from "./api/contentstack";

declare global {
  interface Window {
    __INITIAL_CONTENT__?: Page | null;
    __HYDRATED__?: boolean;
  }
}

// Clone content before SDK can intercept it (prevents hydration mismatches)
const initialContent: Page | null = window.__INITIAL_CONTENT__
  ? JSON.parse(JSON.stringify(window.__INITIAL_CONTENT__))
  : null;

const container = document.getElementById("fragment-root");

if (container && !window.__HYDRATED__) {
  window.__HYDRATED__ = true;
  hydrateRoot(
    container,
    <BrowserRouter>
      <App content={initialContent} />
    </BrowserRouter>
  );
}

// Enable HMR in development
if (import.meta.hot) {
  import.meta.hot.accept();
}
