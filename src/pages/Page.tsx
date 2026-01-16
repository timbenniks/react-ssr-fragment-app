/**
 * Page component - renders Contentstack page content
 *
 * WHAT THIS COMPONENT DOES:
 * - Renders the main page content from Contentstack
 * - Handles "not found" state when content doesn't exist
 * - Renders title, description, hero image, rich text, and blocks
 * - Supports live preview editing (via editable attributes)
 *
 * ARCHITECTURE:
 * - Receives content prop from useLivePreview hook
 * - Content comes from SSR (first render) or client fetch (navigation)
 * - All page URLs route here (slug-based routing)
 */

import { useLocation } from "react-router-dom";
import type { Page as PageType } from "../api/contentstack";
import { BlockComponent } from "../components/BlockComponent";

interface PageProps {
  content?: PageType | null;
}

export function Page({ content }: PageProps) {
  // Get current URL path for "not found" message
  const { pathname } = useLocation();

  /**
   * Handle "not found" state
   *
   * WHEN THIS HAPPENS:
   * - User navigates to a URL that doesn't exist in Contentstack
   * - Content fetch returns null
   * - Show friendly error message instead of blank page
   */
  if (!content) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <section
          className="bg-amber-50 border border-amber-200 rounded-lg p-6"
          role="alert"
        >
          <h1 className="text-2xl font-bold text-amber-800 mb-2">
            Page Not Found
          </h1>
          <p className="text-amber-700">
            No content found for:{" "}
            <code className="bg-amber-100 px-2 py-1 rounded font-mono text-sm">
              {pathname}
            </code>
          </p>
        </section>
      </main>
    );
  }

  /**
   * Render page content
   *
   * STRUCTURE:
   * - Title (required)
   * - Description (optional)
   * - Hero image (optional)
   * - Rich text content (optional HTML)
   * - Content blocks (modular blocks, optional)
   */
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Page title - always present */}
      {/* Spread editable attributes for live preview */}
      <h1 {...content.$?.title} className="text-4xl font-bold mb-4">
        {content.title}
      </h1>

      {/* Description - optional field */}
      {content.description && (
        <p {...content.$?.description} className="text-lg text-gray-600 mb-6">
          {content.description}
        </p>
      )}

      {/* Hero image - optional */}
      {content.image?.url && (
        <figure className="mb-8 m-0">
          <img
            {...content.$?.image}
            src={content.image.url}
            alt={content.image.title || content.title}
            className="w-full h-auto rounded-lg"
          />
        </figure>
      )}

      {/* Rich text - HTML content from Contentstack */}
      {/* Uses dangerouslySetInnerHTML because content is HTML */}
      {content.rich_text && (
        <div
          {...content.$?.rich_text}
          className="prose prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: content.rich_text }}
        />
      )}

      {/* Content blocks - modular blocks (repeatable sections) */}
      {/* Each block is wrapped in a BlockWrapper, extract the block */}
      {content.blocks?.length ? (
        <section className="space-y-8">
          {content.blocks.map((wrapper) => (
            <BlockComponent
              key={wrapper.block._metadata?.uid || wrapper.uid}
              block={wrapper.block}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
