/**
 * Contentstack SDK Configuration
 * 
 * This file sets up the connection to Contentstack CMS and configures live preview.
 * Environment variables are injected by Vite at build time (see vite.config.ts).
 */

import contentstack from "@contentstack/delivery-sdk";
import ContentstackLivePreview, { type IStackSdk } from "@contentstack/live-preview-utils";
import { getRegionForString, getContentstackEndpoints } from "@timbenniks/contentstack-endpoints";

// Vite replaces import.meta.env at build time with actual values
// Variables prefixed with CONTENTSTACK_ are exposed to the client (see vite.config.ts)
const env = import.meta.env;

// Determine which Contentstack region to use (us, eu, au, etc.)
// This affects which API endpoints we connect to
const region = getRegionForString(env.CONTENTSTACK_REGION || "us");
const endpoints = getContentstackEndpoints(region, true);

/**
 * Whether live preview mode is enabled
 * When true, content updates in Contentstack UI automatically refresh the page
 */
export const isPreviewMode = env.CONTENTSTACK_PREVIEW === "true";

/**
 * Contentstack SDK instance - used to fetch content
 * 
 * This is configured once and reused throughout the app.
 * The stack knows how to connect to Contentstack and fetch your content.
 */
export const stack = contentstack.stack({
  apiKey: env.CONTENTSTACK_API_KEY || "",
  deliveryToken: env.CONTENTSTACK_DELIVERY_TOKEN || "",
  environment: env.CONTENTSTACK_ENVIRONMENT || "production",
  host: endpoints.contentDelivery, // API endpoint for fetching published content
  live_preview: {
    enable: isPreviewMode,
    preview_token: env.CONTENTSTACK_PREVIEW_TOKEN || "",
    host: endpoints.preview, // API endpoint for preview/unpublished content
  },
});

/**
 * Initialize Contentstack Live Preview (client-side only)
 * 
 * This sets up the live preview SDK so that when editors make changes
 * in the Contentstack UI, the page automatically updates.
 * 
 * Only runs in the browser (not during SSR) and only if preview mode is enabled.
 */
export function initLivePreview(): void {
  // Don't run on server (SSR) - window doesn't exist there
  if (typeof window === "undefined" || !isPreviewMode) return;

  ContentstackLivePreview.init({
    ssr: false, // We're running client-side
    enable: true,
    mode: "builder", // Shows edit buttons in Contentstack UI
    stackSdk: stack.config as IStackSdk,
    stackDetails: {
      apiKey: env.CONTENTSTACK_API_KEY || "",
      environment: env.CONTENTSTACK_ENVIRONMENT || "",
    },
    clientUrlParams: { host: endpoints.application },
    editButton: { enable: true }, // Shows "Edit" buttons on content
  });
}

/**
 * Register a callback that fires when content changes in Contentstack
 * Used by useLivePreview hook to automatically refresh content
 */
export const onEntryChange = ContentstackLivePreview.onEntryChange;
