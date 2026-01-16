/**
 * Block component - renders a content block with optional image
 *
 * Uses <div> for HTML content to avoid invalid <p><p></p></p> nesting
 * which causes hydration mismatches.
 */

import type { Block } from "../api/contentstack";

interface BlockComponentProps {
  block: Block;
}

export function BlockComponent({ block }: BlockComponentProps) {
  const copyHtml = block.copy || "";

  // Text-only layout (no image)
  if (!block.image?.url) {
    return (
      <article className="mb-8 p-6 bg-gray-50 rounded-lg">
        {block.title && (
          <h2 {...block.$?.title} className="text-2xl font-semibold mb-2">
            {block.title}
          </h2>
        )}
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
  const isImageLeft = block.layout === "image_left";

  return (
    <article className={`flex flex-col md:flex-row gap-6 mb-8 ${isImageLeft ? "" : "md:flex-row-reverse"}`}>
      <figure className="w-full md:w-1/2 m-0">
        <img
          {...block.$?.image}
          src={block.image.url}
          alt={block.title || "Block image"}
          className="w-full h-auto rounded-lg object-cover"
        />
      </figure>
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
