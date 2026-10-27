import type { ChatRequest, ChatResponse } from '../../core/types';
import { chatCompletion } from './client';
import { createOrEditImage, getImageAction } from './images';
import { buildSystemPrompt } from './prompts';
import { needsWebSearch, searchAndAnswer } from './webSearch';
import { AiError, type AiChatMessage, type AiIntent } from './types';

/**
 * The chat engine — the browser port of the old server engine
 * (backend/lib/sg16Engine.js), with the brain/provider references removed.
 *
 * Every reply goes through `client.ts`, so Pilot, Shields and every workspace
 * answer through SG16's own backend — switching the owner's models never
 * changes what a feature can do.
 */

/* ── Safety + Student Shield guard (ported from the server engine) ── */

function isSafe(text: string): boolean {
  const unsafe = [
    'ignore previous', 'system:', 'jailbreak', 'injection',
    'malware', 'phishing', 'steal credentials', 'bypass safety',
  ];
  const lower = text.toLowerCase();
  return !unsafe.some((word) => lower.includes(word));
}

function isEducationalRequest(message: string): boolean {
  const lower = message.toLowerCase();
  const blocked = [
    'porn', 'gambling', 'netflix', 'movie review', 'game cheat',
    'hack account', 'weapon', 'drug', 'dating app', 'betting',
  ];
  if (blocked.some((w) => lower.includes(w))) return false;

  const educational = [
    'homework', 'study', 'exam', 'test', 'math', 'science', 'physics',
    'chemistry', 'biology', 'history', 'essay', 'learn', 'explain',
    'school', 'university', 'programming', 'code', 'career', 'theorem',
    'equation', 'grammar', 'literature', 'geography', 'economics',
    'calculus', 'algebra', 'research', 'assignment', 'course', 'lesson',
  ];
  if (educational.some((w) => lower.includes(w))) return true;
  if (/^(what|why|how|explain|help me|teach me|define)/i.test(message.trim())) return true;
  return false;
}

/* ── Generation profiles (ported from backend/lib/modelRouting.js) ── */

interface GenerationProfile {
  temperature: number;
  maxTokens: number;
  historyLimit: number;
  timeoutMs: number;
}

function generationProfile(workspaceId: string, intent: AiIntent): GenerationProfile {
  const isCoding = workspaceId === 'coding' || intent === 'code';
  const isGeneralChat = workspaceId === 'general' || workspaceId === 'voice';
  const isTranslate = workspaceId === 'translate';

  if (isCoding) {
    return { temperature: 0.25, maxTokens: 3072, historyLimit: 8, timeoutMs: 75_000 };
  }
  if (isGeneralChat || isTranslate) {
    return { temperature: 0.55, maxTokens: 1536, historyLimit: 6, timeoutMs: 45_000 };
  }
  if (intent === 'reasoning') {
    return { temperature: 0.45, maxTokens: 2048, historyLimit: 8, timeoutMs: 60_000 };
  }
  return { temperature: 0.6, maxTokens: 2048, historyLimit: 8, timeoutMs: 60_000 };
}

function detectIntent(message: string, workspaceId: string, hasImage: boolean): AiIntent {
  if (hasImage) return 'vision';
  if (workspaceId === 'coding') return 'code';
  if (/explain|why|how does|compare|analyze|step by step|deep/.test(message)) return 'reasoning';
  return 'chat';
}

/* ── User-facing errors ── */

function toUserError(err: unknown): Error {
  if (err instanceof AiError) {
    if (err.rateLimited) {
      return new Error('SG16 AI is busy right now. Please try again in a minute.');
    }
    if (err.offline) {
      return new Error('Could not reach SG16 AI. Check your connection and try again.');
    }
    return new Error(err.message);
  }
  return err instanceof Error ? err : new Error('SG16 AI is temporarily unavailable. Please try again.');
}

/* ── The one chat entry point ── */

/**
 * Answer one chat message. Same contract as the old `POST /api/v1/chat`:
 * student guard, image workspace, live web intelligence, then the model.
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const message = request.message.trim();
  if (!message) throw new Error('Message is required');
  if (!isSafe(message)) throw new Error('Blocked by SG16 Safety Shield');

  const workspaceId = request.workspaceId || 'general';

  if (workspaceId === 'student-shield' && !isEducationalRequest(message)) {
    return {
      reply:
        "I'm SG16 Student Shield — I only help with educational topics like homework, science, math, programming for learning, and career guidance.\n\nFor general questions, please open **SG16 Chatting** from the sidebar.",
      redirected: true,
    };
  }

  if (workspaceId === 'image') {
    const action = getImageAction(message, Boolean(request.imageUrl));
    if (action === 'generate' || action === 'edit') {
      const imageResult = await createOrEditImage({ message, imageUrl: request.imageUrl });
      if (imageResult) return imageResult;
    }
  }

  if (!request.imageUrl && needsWebSearch(message, workspaceId)) {
    try {
      const live = await searchAndAnswer(message, request.history ?? []);
      return { reply: live.reply, liveSearch: true };
    } catch {
      /* live web failed — the model still answers below */
    }
  }

  const intent = detectIntent(message, workspaceId, Boolean(request.imageUrl));
  const profile = generationProfile(workspaceId, intent);

  const messages: AiChatMessage[] = [
    {
      role: 'system',
      content: buildSystemPrompt(workspaceId, {
        targetLanguage: request.targetLanguage,
        memoryContext: request.memoryContext,
      }),
    },
  ];
  for (const msg of (request.history ?? []).slice(-profile.historyLimit)) {
    messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
  }
  if (request.imageUrl) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: message },
        { type: 'image_url', image_url: { url: request.imageUrl } },
      ],
    });
  } else {
    messages.push({ role: 'user', content: message });
  }

  try {
    const result = await chatCompletion({
      messages,
      intent,
      temperature: profile.temperature,
      maxTokens: profile.maxTokens,
      timeoutMs: profile.timeoutMs,
    });
    return { reply: result.content };
  } catch (err) {
    throw toUserError(err);
  }
}
