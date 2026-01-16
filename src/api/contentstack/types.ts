import type { BaseEntry as SDKBaseEntry } from "@contentstack/delivery-sdk";

/** Base content entry with common fields */
export interface BaseEntry extends SDKBaseEntry {
  url?: string;
}

/** Contentstack Live Preview field mapping */
export interface CSLPAttribute {
  "data-cslp"?: string;
  "data-cslp-parent-field"?: string;
}

export type CSLPFieldMapping = CSLPAttribute;

/** Publish details for entries */
export interface PublishDetails {
  environment: string;
  locale: string;
  time: string;
  user: string;
}

/** File/Asset type from Contentstack */
export interface File {
  uid: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  content_type: string;
  file_size: string;
  tags: string[];
  filename: string;
  url: string;
  ACL: unknown[] | object;
  is_dir: boolean;
  parent_uid: string;
  _version: number;
  title: string;
  _metadata?: object;
  description?: string;
  dimension?: { height: number; width: number };
  publish_details: PublishDetails;
  $?: {
    url?: CSLPFieldMapping;
    title?: CSLPFieldMapping;
    filename?: CSLPFieldMapping;
    description?: CSLPFieldMapping;
  };
}

/** Link type */
export interface Link {
  title: string;
  href: string;
}

/** Taxonomy type */
export interface Taxonomy {
  taxonomy_uid: string;
  max_terms?: number;
  mandatory: boolean;
  non_localizable: boolean;
}

/** System fields common to all entries */
export interface SystemFields {
  uid?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  _content_type_uid?: string;
  tags?: string[];
  ACL?: unknown[];
  _version?: number;
  _in_progress?: boolean;
  locale?: string;
  publish_details?: PublishDetails;
  title?: string;
}

/** Block type for reusable content blocks */
export interface Block {
  _version?: number;
  title?: string;
  copy?: string;
  image?: File | null;
  layout?: "image_left" | "image_right" | null;
  _metadata?: { uid: string };
  $?: {
    title?: CSLPFieldMapping;
    copy?: CSLPFieldMapping;
    image?: CSLPFieldMapping;
    layout?: CSLPFieldMapping;
  };
}

/** Blocks wrapper type */
export interface Blocks extends SystemFields {
  block: Block;
}

/** Page content type from Contentstack */
export interface Page extends SystemFields {
  uid: string;
  _version?: number;
  title: string;
  url?: string;
  description?: string;
  image?: File | null;
  rich_text?: string;
  blocks?: Blocks[];
  $?: {
    title?: CSLPFieldMapping;
    url?: CSLPFieldMapping;
    description?: CSLPFieldMapping;
    image?: CSLPFieldMapping;
    rich_text?: CSLPFieldMapping;
    blocks?: CSLPFieldMapping;
    [key: string]: CSLPFieldMapping | undefined;
  };
}

/** Render props passed from server to render function */
export interface RenderProps {
  content?: Page | null;
}
