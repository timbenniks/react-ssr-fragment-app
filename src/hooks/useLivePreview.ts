/**
 * Hook to manage page content with live preview support
 *
 * WHAT THIS HOOK DOES:
 * - Manages page content state throughout the app lifecycle (ALWAYS runs)
 * - Uses SSR content on initial render (no extra fetch needed)
 * - Fetches new content when user navigates to different routes (ALWAYS runs)
 * - Auto-updates content when it changes in Contentstack (ONLY if preview mode enabled)
 *
 * IMPORTANT: This hook is ALWAYS called, regardless of CONTENTSTACK_PREVIEW setting
 * - Content state management and route change handling are always needed
 * - Live preview initialization only happens if CONTENTSTACK_PREVIEW=true
 * - When preview mode is off, the hook still manages state and handles navigation
 *
 * WHY A CUSTOM HOOK?
 * - Encapsulates complex state management logic
 * - Reusable across components
 * - Separates concerns (data fetching vs. rendering)
 *
 * HOW IT WORKS:
 * 1. Initial render: Uses content passed from server (SSR)
 * 2. Route change: Fetches new content for the new URL (always)
 * 3. Live preview: Listens for CMS updates and refreshes content (only if enabled)
 */

import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  fetchPageBySlug,
  initLivePreview,
  onEntryChange,
  isPreviewMode,
  type Page,
} from "../api/contentstack";

/**
 * Hook to manage page content with live preview
 *
 * @param initialContent - Content from server-side rendering (first render only)
 * @returns Current page content (updates on route change or live preview)
 *
 * STATE MANAGEMENT:
 * - page: Current page content (starts with initialContent)
 * - initialPath: Tracks the first pathname to skip initial fetch
 * - livePreviewReady: Flag to prevent live preview from firing too early
 */
export function useLivePreview(initialContent?: Page | null) {
  // Get current URL path (e.g., "/about")
  const { pathname } = useLocation();

  // State: current page content
  // Starts with initialContent from SSR, updates on navigation/preview
  const [page, setPage] = useState<Page | null>(initialContent ?? null);

  // Track the initial pathname to avoid fetching on first render
  // (we already have SSR content, no need to fetch again)
  const initialPath = useRef(pathname);

  // Flag to prevent live preview from firing before it's ready
  // Live preview needs a moment to initialize before it can update content
  const livePreviewReady = useRef(false);

  /**
   * Fetch content for the current page
   * 
   * This function is called:
   * - When user navigates to a new route
   * - When content changes in Contentstack (live preview)
   */
  const fetchContent = async () => {
    const data = await fetchPageBySlug(pathname || "/");
    setPage(data);
  };

  /**
   * Initialize live preview (runs once after component mounts)
   * 
   * NOTE: This effect always runs, but returns early if preview mode is disabled
   * - No performance impact when preview mode is off (early return)
   * - Only sets up WebSocket connection and callbacks when preview mode is on
   * 
   * WHY DELAYS?
   * - setTimeout(200ms): Gives React time to finish rendering
   * - setTimeout(100ms): Gives live preview time to initialize
   * - These delays prevent race conditions and ensure everything is ready
   * 
   * CLEANUP:
   * - Returns cleanup function to clear timers if component unmounts
   */
  useEffect(() => {
    // Early return if preview mode is disabled - no setup needed
    // This is a no-op when preview mode is off (no performance cost)
    if (!isPreviewMode) return;

    const timer = setTimeout(() => {
      // Initialize the live preview connection
      initLivePreview();

      // Mark as ready after a short delay
      setTimeout(() => (livePreviewReady.current = true), 100);

      // Register callback: when content changes in CMS, fetch new content
      // Only fetch if live preview is ready (prevents premature updates)
      onEntryChange(() => livePreviewReady.current && fetchContent());
    }, 200);

    // Cleanup: clear timer if component unmounts before timer fires
    return () => clearTimeout(timer);
  }, []); // Empty deps = run once on mount

  /**
   * Fetch content on route change
   * 
   * WHY SKIP INITIAL RENDER?
   * - We already have content from SSR (passed as initialContent)
   * - No need to fetch again on first render
   * - Only fetch when pathname actually changes (user navigates)
   * 
   * HOW IT WORKS:
   * - Compares current pathname to initial pathname
   * - If different, user navigated → fetch new content
   * - Updates initialPath ref to track the new path
   */
  useEffect(() => {
    // Skip if this is the initial render (we have SSR content)
    if (pathname === initialPath.current) return;

    // User navigated to a new route → fetch content for that route
    initialPath.current = pathname;
    fetchContent();
  }, [pathname]); // Run whenever pathname changes

  return page;
}
