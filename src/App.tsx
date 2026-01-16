/**
 * Root App component - sets up routing and live preview
 *
 * WHAT THIS DOES:
 * - Root component that wraps the entire application
 * - Sets up React Router for client-side navigation
 * - Manages live preview state (auto-updates when content changes in CMS)
 * - Applies global styles
 *
 * ARCHITECTURE:
 * - Server renders this with initialContent from Contentstack
 * - Client hydrates and continues with live preview updates
 * - All routes go through the same Page component (slug-based routing)
 */

import { Routes, Route } from "react-router-dom";
import { Page } from "./pages/Page";
import { useLivePreview } from "./hooks/useLivePreview";
import type { Page as PageType } from "./api/contentstack";
import "./App.css";

/**
 * Props for the App component
 * - initialContent: Content fetched on the server (SSR) or client (navigation)
 */
interface AppProps {
  content?: PageType | null;
}

/**
 * Root application component
 *
 * @param initialContent - Page content from server-side rendering or client fetch
 *
 * HOW IT WORKS:
 * 1. Receives initialContent from server (SSR) or hook (client navigation)
 * 2. useLivePreview hook manages content state and live preview updates
 * 3. Routes all paths to the same Page component (slug-based routing)
 * 4. Page component handles rendering the actual content
 */
export function App({ content: initialContent }: AppProps) {
  // useLivePreview manages content state and enables live preview
  // - Uses initialContent on first render (from SSR)
  // - Fetches new content on route changes
  // - Auto-updates when content changes in Contentstack (if preview mode enabled)
  const page = useLivePreview(initialContent);

  return (
    // Global styles applied to entire app
    <div className="font-sans leading-relaxed text-slate-900">
      <Routes>
        {/* 
          Catch-all route: /* matches any path
          All URLs (/, /about, /products/1) go to the same Page component
          The Page component uses the URL to determine what content to show
        */}
        <Route path="/*" element={<Page content={page} />} />
      </Routes>
    </div>
  );
}
