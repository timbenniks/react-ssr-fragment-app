/**
 * Shared types for dev and production servers
 *
 * These types define the contracts between:
 * - Server code (dev.ts, index.ts)
 * - SSR entry point (entry-server.tsx)
 * - Vite build manifest
 */

/**
 * Result of rendering a React component tree to HTML
 *
 * Used by entry-server.tsx's render() function
 */
export interface RenderResult {
  html: string;
}

/**
 * Module exported by entry-server.tsx
 *
 * WHAT THIS REPRESENTS:
 * - The compiled SSR module (entry-server.tsx → entry-server.js)
 * - Contains render() function and data fetching functions
 * - Loaded dynamically by server (dev: via Vite, prod: via import)
 *
 * WHY THIS TYPE?
 * - TypeScript needs to know what the module exports
 * - Ensures render() and fetchPageBySlug() exist
 * - Provides type safety when calling these functions
 */
export interface SSRModule {
  /**
   * Render a React component tree to HTML string
   * @param url - URL path to render (e.g., "/about")
   * @param props - Optional props including pre-fetched content
   */
  render: (url: string, props?: { content?: unknown }) => Promise<RenderResult>;

  /**
   * Fetch page content from Contentstack
   * @param slug - URL path (e.g., "/about")
   * @param contentType - Optional content type override
   */
  fetchPageBySlug: (slug: string, contentType?: string) => Promise<unknown>;
}

/**
 * Single entry in Vite's build manifest
 *
 * WHAT IT CONTAINS:
 * - file: Built asset filename (with hash)
 * - css: CSS files associated with this entry
 * - imports: Other modules imported by this entry
 * - src: Original source file path (optional)
 * - isEntry: Whether this is an entry point (optional)
 *
 * EXAMPLE:
 * {
 *   "file": "assets/entry-client-abc123.js",
 *   "css": ["assets/entry-client-def456.css"],
 *   "imports": ["src/App.tsx"]
 * }
 */
export interface ManifestEntry {
  file: string;
  src?: string;
  isEntry?: boolean;
  css?: string[];
  imports?: string[];
}

/**
 * Vite build manifest - maps source files to built assets
 *
 * STRUCTURE:
 * - Key: Source file path (e.g., "src/entry-client.tsx")
 * - Value: Built asset information
 *
 * USAGE:
 * - Production server reads this to generate asset tags
 * - Used to find CSS files, JS files, and dependencies
 * - Enables cache-busting via hashed filenames
 */
export interface Manifest {
  [key: string]: ManifestEntry;
}
