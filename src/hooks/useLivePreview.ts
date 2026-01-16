/**
 * Custom hook to manage content fetching and live preview
 * 
 * This hook handles three scenarios:
 * 1. Initial render: Uses SSR content (no fetch needed)
 * 2. Route changes: Fetches new content when user navigates
 * 3. Live preview: Automatically updates when content changes in Contentstack UI
 * 
 * @param initialContent - Content from server-side rendering (optional)
 * @returns Current page content (updates automatically)
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  fetchPageBySlug,
  initLivePreview,
  onEntryChange,
  isPreviewMode,
  type Page,
} from "../api/contentstack";

export function useLivePreview(initialContent?: Page | null) {
  // Get current URL path (e.g., "/about", "/products/1")
  const location = useLocation();

  // Store the current page content
  // Start with SSR content if available, otherwise null
  const [page, setPage] = useState<Page | null>(initialContent || null);

  // Track if this is the first render
  // We use a ref because we don't want re-renders when it changes
  const isInitialMount = useRef(true);

  /**
   * Function to fetch content from Contentstack based on current URL
   * 
   * useCallback memoizes this function so it only recreates when location.pathname changes
   * This prevents unnecessary re-renders and effect re-runs
   */
  const getContent = useCallback(async () => {
    const slug = location.pathname || "/";
    const data = await fetchPageBySlug(slug);
    setPage(data);
  }, [location.pathname]);

  /**
   * Set up Contentstack Live Preview (only in preview mode)
   * 
   * When CONTENTSTACK_PREVIEW=true:
   * - Initializes the live preview SDK
   * - Registers a callback that refetches content when changes occur in Contentstack UI
   * - This allows editors to see changes in real-time without refreshing
   */
  useEffect(() => {
    if (isPreviewMode) {
      initLivePreview();
      // When content changes in Contentstack, call getContent to refresh
      onEntryChange(getContent);
    }
  }, [getContent]);

  /**
   * Fetch content when the route changes
   * 
   * Why skip initial mount? On first render, we already have content from SSR.
   * We only need to fetch when the user navigates to a different page.
   */
  useEffect(() => {
    if (isInitialMount.current) {
      // First render - skip fetching, we have SSR content
      isInitialMount.current = false;
      return;
    }
    // Route changed - fetch new content
    getContent();
  }, [location.pathname, getContent]);

  return page;
}
