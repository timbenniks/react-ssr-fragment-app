/**
 * Block component - renders a content block with optional image
 *
 * WHAT THIS COMPONENT DOES:
 * - Renders a reusable content block (title, text, optional image)
 * - Supports two layouts: text-only or image + text
 * - Handles live preview editable attributes
 *
 * IMPORTANT: Uses <div> for HTML content
 * - Contentstack returns HTML that may contain <p> tags
 * - If we wrapped it in <p>, we'd get invalid nesting: <p><p>...</p></p>
 * - Invalid HTML causes React hydration mismatches
 * - <div> can contain any HTML, so it's safe
 *
 * LIVE PREVIEW:
 * - block.$?.title, block.$?.copy, block.$?.image contain editable attributes
 * - These are spread onto elements ({...block.$?.title})
 * - Contentstack uses these to show edit buttons in preview mode
 */

import type { Block } from "../api/contentstack";

interface BlockComponentProps {
  block: Block;
}

export function BlockComponent({ block }: BlockComponentProps) {
  // Get HTML content (may be empty)
  const copyHtml = block.copy || "";

  // Text-only layout (no image)
  // Render simpler layout when there's no image
  if (!block.image?.url) {
    return (
      <article className="mb-8 p-6 bg-gray-50 rounded-lg">
        {/* Conditional rendering: only show title if it exists */}
        {block.title && (
          // Spread editable attributes for live preview
          // block.$?.title contains data-cslp attributes
          <h2 {...block.$?.title} className="text-2xl font-semibold mb-2">
            {block.title}
          </h2>
        )}
        {/* Render HTML content using dangerouslySetInnerHTML */}
        {/* Safe here because content comes from Contentstack CMS */}
        {copyHtml && (
          <div
            {...block.$?.copy}
            className="text-gray-600 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: copyHtml }}
          />
        )}
      </article>
    );
  }

  // Image + text layout
  // Determine if image should be on left or right
  const isImageLeft = block.layout === "image_left";

  return (
    <article className={`flex flex-col md:flex-row gap-6 mb-8 ${isImageLeft ? "" : "md:flex-row-reverse"}`}>
      {/* Image section - responsive: full width on mobile, half on desktop */}
      <figure className="w-full md:w-1/2 m-0">
        <img
          {...block.$?.image}
          src={block.image.url}
          alt={block.title || "Block image"}
          className="w-full h-auto rounded-lg object-cover"
        />
      </figure>
      {/* Text section - responsive: full width on mobile, half on desktop */}
      <div className="w-full md:w-1/2 flex flex-col justify-center">
        {block.title && (
          <h2 {...block.$?.title} className="text-2xl font-semibold mb-2">
            {block.title}
          </h2>
        )}
        {copyHtml && (
          <div
            {...block.$?.copy}
            className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: copyHtml }}
          />
        )}
      </div>
    </article>
  );
}
