/**
 * Page Component - Renders content from Contentstack
 *
 * This component displays a page with:
 * - Title, description, image
 * - Rich text content (HTML)
 * - Reusable content blocks
 *
 * The content.$? properties contain "editable tags" for live preview.
 * When preview mode is enabled, these add data attributes so Contentstack
 * can highlight editable fields in the UI.
 */

import { useLocation } from "react-router-dom";
import type { Page as PageType } from "../api/contentstack";
import { BlockComponent } from "../components/BlockComponent";

interface PageProps {
  /** Page content from Contentstack (or null if not found) */
  content?: PageType | null;
}

export function Page({ content }: PageProps) {
  // Get current URL path for error message if content is missing
  const { pathname } = useLocation();

  // Show 404 message if no content found
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

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* 
        Title with editable tags for live preview
        content.$?.title contains data attributes like data-cslp="..."
        These are spread onto the element so Contentstack can highlight it
      */}
      <h1 {...content.$?.title} className="text-4xl font-bold mb-4">
        {content.title}
      </h1>

      {/* Description - only render if it exists */}
      {content.description && (
        <p {...content.$?.description} className="text-lg text-gray-600 mb-6">
          {content.description}
        </p>
      )}

      {/* Image - only render if URL exists */}
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

      {/* 
        Rich text content (HTML from Contentstack)
        dangerouslySetInnerHTML is used because Contentstack returns HTML
        This is safe because Contentstack sanitizes the content
      */}
      {content.rich_text && (
        <div
          {...content.$?.rich_text}
          className="prose prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: content.rich_text }}
        />
      )}

      {/* 
        Render content blocks (reusable components)
        Each block is wrapped in a Blocks type, but we render the inner block
        The key uses the block's UID or falls back to the wrapper's UID
      */}
      {content.blocks?.length ? (
        <section className="space-y-8">
          {content.blocks.map((blockWrapper) => (
            <BlockComponent
              key={blockWrapper.block._metadata?.uid || blockWrapper.uid}
              block={blockWrapper.block}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
