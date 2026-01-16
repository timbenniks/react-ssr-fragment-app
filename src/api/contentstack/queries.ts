/**
 * Contentstack Query Functions
 * 
 * These functions fetch content from Contentstack CMS.
 * They automatically add "editable tags" for live preview when enabled.
 */

import contentstack, { QueryOperation } from "@contentstack/delivery-sdk";
import { stack, isPreviewMode } from "./client";
import type { Page } from "./types";

type EditableEntry = Record<string, unknown> & { uid: string };

/**
 * Add editable tags to content entries for live preview
 * 
 * When preview mode is enabled, this adds data attributes to content
 * so Contentstack can highlight editable fields in the UI.
 * 
 * @param entry - The content entry to tag
 * @param contentType - The content type name (e.g., "page", "product")
 * @returns The entry with editable tags added
 */
function addEditableTags<T>(entry: T, contentType: string): T {
  if (entry && isPreviewMode) {
    contentstack.Utils.addEditableTags(entry as EditableEntry, contentType, true);
  }
  return entry;
}

/**
 * Fetch a page by URL slug
 * 
 * This is the main query used for routing. The URL path (e.g., "/about")
 * is matched against the "url" field in Contentstack.
 * 
 * @param slug - URL path (e.g., "/", "/about", "/products/1")
 * @param contentType - Content type to query (default: "page")
 * @returns Page content or null if not found
 * 
 * Example: fetchPageBySlug("/about") finds the page where url = "/about"
 */
export async function fetchPageBySlug(
  slug: string,
  contentType = "page"
): Promise<Page | null> {
  try {
    // Build a query: find entries where url field equals the slug
    const result = await stack
      .contentType(contentType) // Which content type to search (e.g., "page")
      .entry() // Get entries
      .query() // Start building a query
      .where("url", QueryOperation.EQUALS, slug) // Filter: url = slug
      .limit(1) // Only need one result
      .find<Page>(); // Execute query and return typed results

    const entry = result.entries?.[0] ?? null;
    // Add editable tags if preview mode is on
    return entry ? addEditableTags(entry, contentType) : null;
  } catch (error) {
    console.error(`Error fetching page "${slug}":`, error);
    return null;
  }
}

/**
 * Fetch a specific entry by its UID (unique identifier)
 * 
 * Use this when you know the exact entry UID from Contentstack.
 * 
 * @param contentType - Content type name (e.g., "page", "product")
 * @param uid - The unique identifier of the entry
 * @returns Entry content or null if not found
 */
export async function fetchEntryByUid<T = Page>(
  contentType: string,
  uid: string
): Promise<T | null> {
  try {
    const entry = await stack.contentType(contentType).entry(uid).fetch<T>();
    return entry ? addEditableTags(entry, contentType) : null;
  } catch (error) {
    console.error(`Error fetching entry ${uid}:`, error);
    return null;
  }
}

/**
 * Fetch multiple entries from a content type
 * 
 * Use this to get a list of entries (e.g., all products, all blog posts).
 * 
 * @param contentType - Content type to fetch (e.g., "product", "blog_post")
 * @param options - Query options
 * @param options.limit - Maximum number of entries to return
 * @param options.skip - Number of entries to skip (for pagination)
 * @returns Array of entries
 * 
 * Example: fetchEntries("product", { limit: 10, skip: 0 })
 */
export async function fetchEntries<T = Page>(
  contentType: string,
  options?: { limit?: number; skip?: number }
): Promise<T[]> {
  try {
    let query = stack.contentType(contentType).entry().query();

    // Apply pagination if provided
    if (options?.limit) query = query.limit(options.limit);
    if (options?.skip) query = query.skip(options.skip);

    const result = await query.find<T>();
    // Add editable tags to each entry
    return (result.entries || []).map((entry) => addEditableTags(entry, contentType));
  } catch (error) {
    console.error(`Error fetching entries from ${contentType}:`, error);
    return [];
  }
}
