/** Extract pathname from URL (removes query string) */
export const getSlugFromUrl = (url: string): string => url.split("?")[0] || "/";

/** Safely serialize content for HTML injection (escapes < to prevent XSS) */
export const serializeContent = (content: unknown): string => {
  const plain = JSON.parse(JSON.stringify(content));
  return JSON.stringify(plain).replace(/</g, "\\u003c");
};
