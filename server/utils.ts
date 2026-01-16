/**
 * Server Utility Functions
 * 
 * Shared helper functions used by both dev and production servers
 */

/**
 * Extract the pathname from a URL, removing query parameters
 * 
 * @param url - Full URL (e.g., "/about?foo=bar" or "/products/1?page=2")
 * @returns Pathname without query string (e.g., "/about" or "/products/1")
 * 
 * Example:
 *   getSlugFromUrl("/about?foo=bar") → "/about"
 *   getSlugFromUrl("/products/1") → "/products/1"
 */
export const getSlugFromUrl = (url: string): string => url.split("?")[0] || "/";

/**
 * Safely serialize content to JSON for injection into HTML
 * 
 * Escapes < characters to prevent XSS attacks when injecting JSON into <script> tags.
 * 
 * @param content - Any data to serialize (object, array, etc.)
 * @returns JSON string with < characters escaped as \u003c
 * 
 * Example:
 *   serializeContent({ title: "<script>alert('xss')</script>" })
 *   → '{"title":"\\u003cscript\\u003ealert(\'xss\')\\u003c/script\\u003e"}'
 */
export const serializeContent = (content: unknown): string =>
  JSON.stringify(content).replace(/</g, "\\u003c");
