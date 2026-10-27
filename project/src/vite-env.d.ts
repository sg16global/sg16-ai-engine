/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Set to 0 to disable live web search (default: enabled). */
  readonly VITE_SG16_LIVE_SEARCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
