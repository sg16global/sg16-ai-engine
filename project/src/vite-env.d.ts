/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Build-time default endpoint label. Empty = configure at runtime in Admin (/admin). */
  readonly VITE_SG16_AI_NAME?: string;
  /** Build-time default endpoint base URL, e.g. https://api.example.com/v1 */
  readonly VITE_SG16_AI_BASE_URL?: string;
  /** Build-time default API key. Prefer runtime setup in Admin — it stays on the device. */
  readonly VITE_SG16_AI_API_KEY?: string;
  /** Default chat model. */
  readonly VITE_SG16_AI_MODEL?: string;
  /** Default coding model. */
  readonly VITE_SG16_AI_CODING_MODEL?: string;
  /** Default vision model. */
  readonly VITE_SG16_AI_VISION_MODEL?: string;
  /** Set to 0 to disable live web search (default: enabled). */
  readonly VITE_SG16_LIVE_SEARCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
