/**
 * Hook to manage page content with live preview support
 *
 * - Uses SSR content on initial render
 * - Fetches new content on route changes
 * - Auto-updates when content changes in Contentstack (preview mode)
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

export function useLivePreview(initialContent?: Page | null) {
  const { pathname } = useLocation();
  const [page, setPage] = useState<Page | null>(initialContent ?? null);
  const initialPath = useRef(pathname);
  const livePreviewReady = useRef(false);

  // Fetch content for the current page
  const fetchContent = async () => {
    const data = await fetchPageBySlug(pathname || "/");
    setPage(data);
  };

  // Initialize live preview (runs once after mount)
  useEffect(() => {
    if (!isPreviewMode) return;

    const timer = setTimeout(() => {
      initLivePreview();
      setTimeout(() => (livePreviewReady.current = true), 100);
      onEntryChange(() => livePreviewReady.current && fetchContent());
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Fetch content on route change (skip initial render - we have SSR content)
  useEffect(() => {
    if (pathname === initialPath.current) return;
    initialPath.current = pathname;
    fetchContent();
  }, [pathname]);

  return page;
}
