/**
 * BlockComponent - Reusable content block component
 *
 * Renders a content block with title, copy, and optional image.
 * Supports two layouts: image on left or image on right.
 *
 * If no image is provided, renders a simpler text-only layout.
 */

import type { Block as BlockType } from "../api/contentstack";

interface BlockComponentProps {
  /** Block content from Contentstack */
  block: BlockType;
}

export function BlockComponent({ block }: BlockComponentProps) {
  // If no image, render a simple text-only layout
  if (!block.image?.url) {
    return (
      <article className="mb-8 p-6 bg-gray-50 rounded-lg">
        {block.title && (
          <h2 {...block.$?.title} className="text-2xl font-semibold mb-2">
            {block.title}
          </h2>
        )}
        {block.copy && (
          <p {...block.$?.copy} className="text-gray-600">
            {block.copy}
          </p>
        )}
      </article>
    );
  }

  // Determine layout: image on left or right
  const isImageLeft = block.layout === "image_left";

  // Render image + text layout
  // On mobile: stacked vertically
  // On desktop: side-by-side (image left or right based on layout)
  return (
    <article
      className={`flex flex-col md:flex-row gap-6 mb-8 ${
        isImageLeft ? "" : "md:flex-row-reverse"
      }`}
    >
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
        {block.copy && (
          <p
            {...block.$?.copy}
            className="text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: block.copy }}
          />
        )}
      </div>
    </article>
  );
}
