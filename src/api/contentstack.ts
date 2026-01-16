/**
 * Contentstack API - SDK setup and data fetching
 *
 * This module configures the Contentstack SDK and provides functions to fetch content.
 * Live preview is automatically enabled when CONTENTSTACK_PREVIEW=true.
 */

import contentstack, { QueryOperation } from "@contentstack/delivery-sdk";
import ContentstackLivePreview, {
  type IStackSdk,
} from "@contentstack/live-preview-utils";
import { getRegionForString, getContentstackEndpoints } from "@timbenniks/contentstack-endpoints";

// Environment configuration (injected by Vite)
const env = import.meta.env;
const region = getRegionForString(env.CONTENTSTACK_REGION || "us");
const endpoints = getContentstackEndpoints(region, true);

/** Whether live preview mode is enabled */
export const isPreviewMode = env.CONTENTSTACK_PREVIEW === "true";

/** Contentstack SDK instance */
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

/** Initialize live preview (call once on client-side) */
export function initLivePreview(): void {
  if (typeof window === "undefined" || !isPreviewMode) return;

  ContentstackLivePreview.init({
    ssr: false,
    enable: true,
    mode: "builder",
    stackSdk: stack.config as IStackSdk,
    stackDetails: {
      apiKey: env.CONTENTSTACK_API_KEY || "",
      environment: env.CONTENTSTACK_ENVIRONMENT || "",
    },
    clientUrlParams: { host: endpoints.application },
    editButton: { enable: true },
  });
}

/** Register callback for content changes (live preview) */
export const onEntryChange = ContentstackLivePreview.onEntryChange;

// ============================================================================
// Data Fetching
// ============================================================================

type EditableEntry = Record<string, unknown> & { uid: string };

/** Add live preview editable tags to an entry */
function addEditableTags<T>(entry: T, contentType: string): T {
  if (entry && isPreviewMode) {
    contentstack.Utils.addEditableTags(entry as EditableEntry, contentType, true);
  }
  return entry;
}

/** Fetch a page by URL slug (e.g., "/about") */
export async function fetchPageBySlug(slug: string): Promise<Page | null> {
  try {
    const result = await stack
      .contentType("page")
      .entry()
      .query()
      .where("url", QueryOperation.EQUALS, slug)
      .limit(1)
      .find<Page>();

    const entry = result.entries?.[0] ?? null;
    return entry ? addEditableTags(entry, "page") : null;
  } catch (error) {
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
