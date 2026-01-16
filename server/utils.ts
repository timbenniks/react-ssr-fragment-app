/**
 * Extract pathname from URL (removes query string)
 *
 * WHAT THIS DOES:
 * - Converts "/about?foo=bar" → "/about"
 * - Used to match Contentstack entries by URL field
 *
 * @param url - Full URL with optional query string
 * @returns Clean pathname (always starts with /)
 *
 * EXAMPLE:
 * - "/about?foo=bar" → "/about"
 * - "/products/1?sort=price" → "/products/1"
 * - "/" → "/"
 */
export const getSlugFromUrl = (url: string): string => url.split("?")[0] || "/";

/**
 * Safely serialize content for HTML injection (escapes < to prevent XSS)
 *
 * WHAT THIS DOES:
 * - Converts content object to JSON string
 * - Escapes < characters to prevent XSS attacks
 * - Removes any functions/circular references (via JSON.parse/stringify)
 *
 * WHY ESCAPE < ?
 * - Content is embedded in <script> tag: <script>window.__INITIAL_CONTENT__ = {...}</script>
 * - If content contains "</script>", it would break out of the script tag
 * - Escaping prevents this XSS vulnerability
 *
 * @param content - Content object to serialize
 * @returns Safe JSON string ready for HTML injection
 *
 * EXAMPLE:
 * - { title: "Hello" } → '{"title":"Hello"}'
 * - { html: "</script>" } → '{"html":"\\u003c/script>"}'
 */
export const serializeContent = (content: unknown): string => {
  // Deep clone to remove any functions, circular refs, etc.
  const plain = JSON.parse(JSON.stringify(content));
  // Escape < to prevent XSS (</script> would break out of script tag)
  return JSON.stringify(plain).replace(/</g, "\\u003c");
};
