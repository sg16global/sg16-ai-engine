import { setEngineStatus } from '../apiStatus';
import { wireChat } from './wire';
import { AiError, type ChatCompletionRequest, type ChatCompletionResult } from './types';

/**
 * The one place every AI call goes through.
 *
 * Pilot, Shields, chat and vision all call `chatCompletion`, which asks SG16's
 * own backend (/api/ai/chat). Model choice and fallbacks happen there, so the
 * browser never knows which AI endpoint answers. Every call reports real
 * connectivity to the engine status bar.
 */

const DEFAULT_TIMEOUT_MS = 90_000;

export async function chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResult> {
  const started = Date.now();
  try {
    const content = await wireChat({
      messages: request.messages,
      intent: request.intent ?? 'chat',
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      timeoutMs: request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      signal: request.signal,
    });
    setEngineStatus('online');
    return { content, latencyMs: Date.now() - started };
  } catch (err) {
    const aiErr = err instanceof AiError ? err : new AiError(err instanceof Error ? err.message : 'AI request failed');
    setEngineStatus(aiErr.offline && !aiErr.status ? 'offline' : 'online');
    throw aiErr;
  }
}
