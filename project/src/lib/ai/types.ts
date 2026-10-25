/**
 * Provider-agnostic AI layer types.
 *
 * The app talks to external AI APIs (OpenAI, Qwen, DeepSeek, Anthropic, Gemini,
 * Groq, Mistral, xAI, OpenRouter, Ollama, or any OpenAI-compatible endpoint)
 * directly from the browser. There is no SG16 server in between — the Admin
 * panel (`/admin`) configures the providers below and every core feature
 * (chat, Pilot, Shields, student verification, image, voice) goes through
 * `client.ts`, so switching models never breaks an internal feature.
 */

/** Wire protocol of a provider endpoint. */
export type AiAdapterKind = 'openai' | 'anthropic' | 'gemini';

/** Model slots a provider fills. Empty string = not supported by this provider. */
export interface AiProviderModels {
  /** General chat model. */
  chat: string;
  /** Coding model (falls back to `chat` when empty). */
  coding: string;
  /** Vision model for image questions / student ID checks (empty = none). */
  vision: string;
  /** Audio transcription model, e.g. whisper-1 (empty = none). */
  audio: string;
  /** Image generation model, e.g. gpt-image-1 (empty = none). */
  image: string;
  /** Extra chat models tried in order when the primary is busy or fails. */
  fallbacks: string[];
}

export interface AiProviderConfig {
  /** Unique instance id (uuid). */
  id: string;
  /** Preset this instance was created from (see presets.ts). */
  presetId: string;
  /** Display name (preset name or custom). */
  name: string;
  adapter: AiAdapterKind;
  /** Base URL, no trailing slash, e.g. https://api.openai.com/v1 */
  baseUrl: string;
  /** API key — stored on this device only, sent straight to the provider. */
  apiKey: string;
  models: AiProviderModels;
  /** Disabled providers are skipped by the fallback chain. */
  enabled: boolean;
  /** Lower = tried first. The active (primary) provider has the lowest priority. */
  priority: number;
  /** Whether a key is required (Ollama/local endpoints: false). */
  requiresKey: boolean;
  /** Extra headers sent with every request (e.g. OpenRouter referer/title). */
  headers?: Record<string, string>;
}

export interface AiGenerationOptions {
  /** null = use the per-workspace default temperature. */
  temperature: number | null;
  /** null = use the per-workspace default max tokens. */
  maxTokens: number | null;
  /** Live web intelligence for time-sensitive questions (default on). */
  liveSearch: boolean;
}

export interface AiConfig {
  providers: AiProviderConfig[];
  /** Provider with the lowest priority — the one used first. */
  activeProviderId: string | null;
  options: AiGenerationOptions;
  updatedAt: number;
}

export type AiChatMessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: AiChatMessageContent;
}

/** What the model is being asked for — decides which model slot is used. */
export type AiIntent = 'chat' | 'code' | 'vision' | 'reasoning';

export interface ChatCompletionRequest {
  messages: AiChatMessage[];
  intent?: AiIntent;
  /** Explicit model override (Admin "test connection"). Applies to every provider. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Restrict the call to one provider (Admin "test connection"). */
  providerId?: string;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  providerId: string;
  providerName: string;
  latencyMs: number;
}

/** Error thrown by the AI layer. `noProvider` = nothing configured in Admin. */
export class AiError extends Error {
  readonly status: number;
  readonly providerId?: string;
  readonly code?: string;
  /** 429 / 503 / quota-style answers — the fallback chain treats these as "try next". */
  readonly rateLimited: boolean;
  /** Network-level failure (DNS, CORS, offline, timeout). */
  readonly offline: boolean;
  /** No enabled provider is configured at all. */
  readonly noProvider: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      providerId?: string;
      code?: string;
      rateLimited?: boolean;
      offline?: boolean;
      noProvider?: boolean;
    } = {},
  ) {
    super(message);
    this.name = 'AiError';
    this.status = options.status ?? 0;
    this.providerId = options.providerId;
    this.code = options.code;
    this.rateLimited = options.rateLimited ?? false;
    this.offline = options.offline ?? false;
    this.noProvider = options.noProvider ?? false;
  }
}
