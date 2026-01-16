/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly CONTENTSTACK_API_KEY: string;
  readonly CONTENTSTACK_DELIVERY_TOKEN: string;
  readonly CONTENTSTACK_PREVIEW_TOKEN: string;
  readonly CONTENTSTACK_ENVIRONMENT: string;
  readonly CONTENTSTACK_REGION: string;
  readonly CONTENTSTACK_PREVIEW: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
