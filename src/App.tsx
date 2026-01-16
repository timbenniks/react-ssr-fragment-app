/**
 * Main App component - the root of our React application
 *
 * This component:
 * 1. Sets up routing (which component to show for each URL)
 * 2. Manages content state with live preview support
 * 3. Wraps everything in a base container with styling
 */

import { Routes, Route } from "react-router-dom";
import { Page } from "./pages";
import { useLivePreview } from "./hooks";
import type { Page as PageType } from "./api/contentstack";
import "./App.css";

interface AppProps {
  /** Initial content from server-side rendering (optional) */
  content?: PageType | null;
}

export function App({ content: initialContent }: AppProps) {
  /**
   * useLivePreview hook manages content fetching and live preview
   * - Uses initialContent on first render (from SSR)
   * - Fetches new content when route changes
   * - Updates automatically when content changes in Contentstack (if preview mode enabled)
   */
  const page = useLivePreview(initialContent);

  return (
    <div className="font-sans leading-relaxed text-slate-900">
      <Routes>
        {/* 
          Catch-all route: matches any path (/*) and renders the Page component
          Examples:
          - "/" → Page component
          - "/about" → Page component  
          - "/products/1" → Page component
          
          To add more routes, add more <Route> components here:
          <Route path="/products" element={<ProductsPage />} />
        */}
        <Route path="/*" element={<Page content={page} />} />
      </Routes>
    </div>
  );
}
