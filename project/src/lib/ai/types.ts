/**
 * AI types shared by the app. The browser only talks to SG16's own backend
 * (/api/ai/*); the AI endpoint, keys and models live there as owner secrets.
 */

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
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface ChatCompletionResult {
  content: string;
  latencyMs: number;
}

/** Error thrown by the AI layer. `noProvider` = the backend has no AI configured yet. */
export class AiError extends Error {
  readonly status: number;
  readonly code?: string;
  /** The backend answered "busy" — every model it tried was rate-limited. */
  readonly rateLimited: boolean;
  /** Network-level failure (offline, timeout). */
  readonly offline: boolean;
  /** The owner has not set the AI secrets yet. */
  readonly noProvider: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      rateLimited?: boolean;
      offline?: boolean;
      noProvider?: boolean;
    } = {},
  ) {
    super(message);
    this.name = 'AiError';
    this.status = options.status ?? 0;
    this.code = options.code;
    this.rateLimited = options.rateLimited ?? false;
    this.offline = options.offline ?? false;
    this.noProvider = options.noProvider ?? false;
  }
}
