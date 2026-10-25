/**
 * Universal AI gateway types.
 *
 * The app talks to any AI API directly from the browser. There is no SG16
 * server in between and no list of known providers — a connection is just a
 * raw base URL, an optional API key, and the model strings to use. Any
 * endpoint that speaks the standard chat-completions protocol works, with
 * no code change and no preset.
 */

/** Model slots a connection fills. Empty string = not used. */
export interface AiProviderModels {
  /** General chat model. */
  chat: string;
  /** Coding model (falls back to `chat` when empty). */
  coding: string;
  /** Vision model for image questions / student ID checks (empty = none). */
  vision: string;
  /** Audio transcription model (empty = none). */
  audio: string;
  /** Image generation model (empty = none). */
  image: string;
  /** Extra chat models tried in order when the primary is busy or fails. */
  fallbacks: string[];
}

export interface AiProviderConfig {
  /** Unique instance id (uuid). */
  id: string;
  /** Display name — any label the user picks (e.g. "Work endpoint"). */
  name: string;
  /** Base URL, no trailing slash, e.g. https://api.example.com/v1 */
  baseUrl: string;
  /** API key — stored on this device only, sent straight to the endpoint. */
  apiKey: string;
  models: AiProviderModels;
  /** Disabled connections are skipped by the fallback chain. */
  enabled: boolean;
  /** Lower = tried first. The active (primary) connection has the lowest priority. */
  priority: number;
  /** Whether the endpoint requires a key (local/keyless endpoints: false). */
  requiresKey: boolean;
  /** Extra headers sent with every request. */
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
  /** Connection with the lowest priority — the one used first. */
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
  /** Explicit model override (Admin "test connection"). Applies to every connection. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Restrict the call to one connection (Admin "test connection"). */
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
  /** No enabled connection is configured at all. */
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
