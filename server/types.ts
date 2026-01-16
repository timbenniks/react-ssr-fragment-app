/** Shared types for dev and production servers */

export interface RenderResult {
  html: string;
}

export interface SSRModule {
  render: (url: string, props?: { content?: unknown }) => Promise<RenderResult>;
  fetchPageBySlug: (slug: string, contentType?: string) => Promise<unknown>;
}

export interface ManifestEntry {
  file: string;
  src?: string;
  isEntry?: boolean;
  css?: string[];
  imports?: string[];
}

export interface Manifest {
  [key: string]: ManifestEntry;
}
