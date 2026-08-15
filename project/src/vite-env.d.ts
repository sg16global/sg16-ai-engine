/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_SG16_AI_KEY: string;
  readonly VITE_SG16_ROUTER_URL?: string;
  readonly VITE_SG16_ROUTER_MODEL?: string;
  /** @deprecated use VITE_SG16_AI_KEY */
  readonly VITE_GROQ_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  sg16Junior?: {
    name: string;
    publicName: string;
    road: string;
    door: string;
    platform: string;
  };
}
