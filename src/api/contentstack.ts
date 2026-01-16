/**
 * Contentstack API - SDK setup and data fetching
 *
 * WHAT THIS DOES:
 * - Configures the Contentstack SDK to connect to your CMS
 * - Provides functions to fetch content (pages, entries, etc.)
 * - Sets up live preview (real-time content updates when editing in CMS)
 * - Handles region-specific endpoints (EU, US, etc.)
 *
 * LIVE PREVIEW:
 * - When enabled, content updates automatically refresh the page
 * - No page reload needed - React updates components in place
 * - Only works in development/preview environments
 */

import contentstack, { QueryOperation } from "@contentstack/delivery-sdk";
import ContentstackLivePreview, {
  type IStackSdk,
} from "@contentstack/live-preview-utils";
import { getRegionForString, getContentstackEndpoints } from "@timbenniks/contentstack-endpoints";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Environment variables are injected by Vite at build time
 * - import.meta.env is Vite's way to access env vars
 * - Variables prefixed with CONTENTSTACK_ are exposed to client (see vite.config.ts)
 * - Server can access all env vars via process.env
 */
const env = import.meta.env;

/**
 * Determine which Contentstack region to use
 * - Regions: EU, US, AU, etc.
 * - Free accounts are typically EU
 * - getRegionForString handles aliases (e.g., "eu" = "EU")
 */
const region = getRegionForString(env.CONTENTSTACK_REGION || "us");

/**
 * Get the correct API endpoints for this region
 * - Different regions have different API URLs
 * - Second param (true) enables CDN endpoints for better performance
 */
const endpoints = getContentstackEndpoints(region, true);

/**
 * Whether live preview mode is enabled
 * - Set CONTENTSTACK_PREVIEW=true in .env to enable
 * - Only works with preview tokens (not delivery tokens)
 */
export const isPreviewMode = env.CONTENTSTACK_PREVIEW === "true";

/**
 * Contentstack SDK instance
 * 
 * This is the main object used to fetch content from Contentstack.
 * Configured once here, used everywhere via imports.
 * 
 * CONFIGURATION:
 * - apiKey: Your stack's API key (found in Settings > Tokens)
 * - deliveryToken: Token for fetching published content
 * - environment: Which environment to fetch from (production, preview, etc.)
 * - host: API endpoint URL (varies by region)
 * - live_preview: Configuration for live preview feature
 */
export const stack = contentstack.stack({
  apiKey: env.CONTENTSTACK_API_KEY || "",
  deliveryToken: env.CONTENTSTACK_DELIVERY_TOKEN || "",
  environment: env.CONTENTSTACK_ENVIRONMENT || "production",
  host: endpoints.contentDelivery,
  live_preview: {
    enable: isPreviewMode,
    preview_token: env.CONTENTSTACK_PREVIEW_TOKEN || "",
    host: endpoints.preview,
  },
});

/**
 * Initialize live preview (call once on client-side)
 *
 * WHAT THIS DOES:
 * - Sets up a connection to Contentstack's live preview service
 * - Listens for content changes when editing in the CMS
 * - Automatically updates the page when content is saved
 *
 * WHEN IT RUNS:
 * - Only runs in the browser (typeof window check)
 * - Only runs if preview mode is enabled
 * - Called from useLivePreview hook after component mounts
 *
 * HOW IT WORKS:
 * - Establishes a WebSocket connection to Contentstack
 * - When you save content in CMS, Contentstack sends an update
 * - The onEntryChange callback fires and updates React state
 * - Page re-renders with new content (no page reload!)
 */
export function initLivePreview(): void {
  // Only run in browser, not during SSR
  if (typeof window === "undefined" || !isPreviewMode) return;

  ContentstackLivePreview.init({
    ssr: false, // We handle SSR separately, this is client-only
    enable: true,
    mode: "builder", // Shows edit buttons in CMS
    stackSdk: stack.config as IStackSdk, // Pass our SDK config
    stackDetails: {
      apiKey: env.CONTENTSTACK_API_KEY || "",
      environment: env.CONTENTSTACK_ENVIRONMENT || "",
    },
    clientUrlParams: { host: endpoints.application }, // CMS application URL
    editButton: { enable: true }, // Show edit buttons in preview
  });
}

/**
 * Register callback for content changes (live preview)
 * 
 * USAGE:
 * - Call this with a function that fetches/updates content
 * - That function will be called whenever content changes in CMS
 * - Example: onEntryChange(() => fetchPageBySlug('/about'))
 */
export const onEntryChange = ContentstackLivePreview.onEntryChange;

// ============================================================================
// Data Fetching
// ============================================================================

/**
 * Type for entries that can have editable tags added
 * - Editable tags are data attributes that enable live preview editing
 */
type EditableEntry = Record<string, unknown> & { uid: string };

/**
 * Add live preview editable tags to an entry
 *
 * WHAT THIS DOES:
 * - Adds data-cslp attributes to entry fields
 * - These attributes tell Contentstack which fields are editable
 * - Only adds tags in preview mode (not in production)
 *
 * @param entry - The content entry from Contentstack
 * @param contentType - The content type name (e.g., "page", "product")
 * @returns The entry with editable tags added
 */
function addEditableTags<T>(entry: T, contentType: string): T {
  if (entry && isPreviewMode) {
    // Add editable tags for live preview
    // These tags enable the "edit" buttons in Contentstack UI
    contentstack.Utils.addEditableTags(entry as EditableEntry, contentType, true);
  }
  return entry;
}

/**
 * Fetch a page by URL slug (e.g., "/about")
 *
 * WHAT THIS DOES:
 * - Queries Contentstack for a page with matching URL
 * - Returns the page content or null if not found
 * - Adds live preview tags if preview mode is enabled
 *
 * @param slug - The URL path (e.g., "/about", "/products/1")
 * @returns The page entry or null if not found
 *
 * HOW IT WORKS:
 * 1. Query the "page" content type
 * 2. Filter by url field matching the slug
 * 3. Limit to 1 result (should only be one match)
 * 4. Add editable tags for live preview
 * 5. Return the entry or null
 *
 * EXAMPLE:
 * - fetchPageBySlug("/about") → finds page where url = "/about"
 * - fetchPageBySlug("/") → finds page where url = "/"
 */
export async function fetchPageBySlug(slug: string): Promise<Page | null> {
  try {
    // Build a query using Contentstack's fluent API
    const result = await stack
      .contentType("page") // Query the "page" content type
      .entry() // Get entries (not the content type itself)
      .query() // Start building a query
      .where("url", QueryOperation.EQUALS, slug) // Filter: url field equals slug
      .limit(1) // Only need one result
      .find<Page>(); // Execute query and return typed results

    // Extract the first entry (or null if none found)
    const entry = result.entries?.[0] ?? null;

    // Add editable tags for live preview, then return
    return entry ? addEditableTags(entry, "page") : null;
  } catch (error) {
    // Log error but don't crash - return null so app can show "not found"
    console.error(`Error fetching page "${slug}":`, error);
    return null;
  }
}

// ============================================================================
// Types
// ============================================================================

/** Live preview data attributes */
export interface CSLPAttribute {
  "data-cslp"?: string;
}

/** Image/file asset from Contentstack */
export interface ContentstackFile {
  uid: string;
  url: string;
  title: string;
  filename: string;
  content_type: string;
  $?: Record<string, CSLPAttribute>;
}

/** Content block (modular block) */
export interface Block {
  title?: string;
  copy?: string;
  image?: ContentstackFile | null;
  layout?: "image_left" | "image_right" | null;
  _metadata?: { uid: string };
  $?: Record<string, CSLPAttribute>;
}

/** Block wrapper (how Contentstack returns modular blocks) */
export interface BlockWrapper {
  uid?: string;
  block: Block;
}

/** Page content type */
export interface Page {
  uid: string;
  title: string;
  url?: string;
  description?: string;
  image?: ContentstackFile | null;
  rich_text?: string;
  blocks?: BlockWrapper[];
  $?: Record<string, CSLPAttribute>;
}

/** Props passed to render function */
export interface RenderProps {
  content?: Page | null;
}
