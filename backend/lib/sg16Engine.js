import { createOrEditImage, getImageAction } from './imageEngine.js';
import { serverCanAccessWorkspace, serverAccessDeniedMessage } from './access.js';
import { needsWebSearch, searchAndAnswer } from './webSearch.js';
import { callWithModelFallback, getTextModelChain, isRateLimitError } from './sg16Provider.js';

const SG16_IDENTITY = `You are SG16 AI Engine by SaifTech Global Limited.
Never mention Groq, Grok, xAI, OpenAI, Llama, or any third-party AI provider.
Always present yourself exclusively as SG16 AI.`;

const BASE_SYSTEM = `${SG16_IDENTITY}
Provide accurate, helpful answers. If unsure, say so. Never guess or hallucinate.
For current events, news, weather, prices, or anything time-sensitive, SG16 AI uses live web intelligence when available.`;

const WORKSPACE_PROMPTS = {
  general: BASE_SYSTEM,
  coding: `${SG16_IDENTITY}
You are SG16 Coding Workspace. Expert software engineer. Write clean, production-ready code with brief explanations. Use markdown code blocks with language tags.`,
  image: `${SG16_IDENTITY}
You are SG16 Image Workspace. SG16 AI can create images from prompts and analyze uploaded photos.
When users ask to create or describe visuals, respond briefly and professionally as SG16 AI.`,
  'student-shield': `${SG16_IDENTITY}
You are SG16 Student Shield. Safe, educational tutor for students. Explain concepts clearly at an age-appropriate level. Only discuss educational topics.`,
  translate: `${SG16_IDENTITY}
You are SG16 Translate Workspace. Provide accurate translations with cultural context. Always show original text and translated text clearly.`,
  document: `${SG16_IDENTITY}
You are SG16 Document Workspace. Summarize, analyze, and extract insights from documents. Use structured formatting with headings and bullet points.`,
  voice: `${SG16_IDENTITY}
You are SG16 Voice Workspace. Write responses optimized for spoken delivery — short sentences, natural tone, easy to read aloud.`,
  memory: `${SG16_IDENTITY}
You are SG16 Memory Vault. Help users organize, recall, and connect saved knowledge. Reference saved entries when relevant.`,
};

const MODELS = {
  text: process.env.SG16_AI_MODEL_TEXT || 'llama-3.3-70b-versatile',
  vision: process.env.SG16_AI_MODEL_VISION || 'meta-llama/llama-4-scout-17b-16e-instruct',
  reasoning: process.env.SG16_AI_MODEL_REASONING || 'llama-3.3-70b-versatile',
};

function getVisionModelChain() {
  return [MODELS.vision, 'llama-3.2-11b-vision-preview'].filter(Boolean);
}

function getApiKey() {
  return (
    process.env.XAI_API_KEY ||
    process.env.SG16_AI_API_KEY ||
    process.env.SG16_ROUTER_API_KEY ||
    process.env.SG16_AI_API_KEY_BACKUP
  )?.trim();
}

function getApiUrl() {
  if (process.env.SG16_AI_API_URL) return process.env.SG16_AI_API_URL;
  if (process.env.XAI_API_KEY?.trim()) {
    return 'https://api.x.ai/v1/chat/completions';
  }
  return 'https://api.groq.com/openai/v1/chat/completions';
}

function hasApiKey() {
  const key = getApiKey();
  return key && !key.startsWith('<your_');
}

function isSafe(text) {
  const unsafe = [
    'ignore previous', 'system:', 'jailbreak', 'injection',
    'malware', 'phishing', 'steal credentials', 'bypass safety',
  ];
  return !unsafe.some((word) => text.toLowerCase().includes(word));
}

function isEducationalRequest(message) {
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

function detectIntent(message, workspaceId, hasImage) {
  if (hasImage) return 'vision';
  if (workspaceId === 'coding') return 'code';
  if (workspaceId === 'translate') return 'translate';
  if (workspaceId === 'student-shield') return 'student';
  if (workspaceId === 'image') return 'image';
  if (workspaceId === 'document') return 'document';
  if (/explain|why|how does|compare|analyze|step by step|deep/.test(message)) return 'reasoning';
  return 'text';
}

async function callSg16AI({ messages, model }) {
  if (!hasApiKey()) {
    throw new Error('SG16 AI is not configured');
  }

  const chain =
    model === MODELS.vision
      ? getVisionModelChain()
      : model === MODELS.reasoning
        ? [MODELS.reasoning, ...getTextModelChain()]
        : [model, ...getTextModelChain().filter((m) => m !== model)];

  const { content } = await callWithModelFallback({
    messages,
    models: chain,
    temperature: 0.7,
  });
  return content;
}

function buildMessages({ workspaceId, message, imageUrl, history = [], targetLanguage, memoryContext }) {
  let system = WORKSPACE_PROMPTS[workspaceId] || BASE_SYSTEM;
  if (targetLanguage) {
    system += `\nTranslate all content to ${targetLanguage}. Format: Original → Translation.`;
  }
  if (memoryContext) {
    system += `\n\nSaved memory entries:\n${memoryContext}`;
  }

  const messages = [{ role: 'system', content: system }];
  for (const msg of history.slice(-10)) {
    messages.push({ role: msg.role, content: msg.content });
  }

  if (imageUrl) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: message },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    });
  } else {
    messages.push({ role: 'user', content: message });
  }

  return messages;
}

function pickModel(intent) {
  if (intent === 'vision') return MODELS.vision;
  if (intent === 'reasoning' || intent === 'code') return MODELS.reasoning;
  return MODELS.text;
}

export async function handleUserMessage({
  message,
  workspaceId = 'general',
  imageUrl,
  history,
  targetLanguage,
  memoryContext,
}) {
  if (workspaceId === 'student-shield' && !isEducationalRequest(message)) {
    return {
      reply:
        "I'm SG16 Student Shield — I only help with educational topics like homework, science, math, programming for learning, and career guidance.\n\nFor general questions, please open **SG16 Chatting** from the sidebar.",
      redirected: true,
    };
  }

  if (workspaceId === 'image') {
    const action = getImageAction(message, !!imageUrl);
    if (action === 'generate' || action === 'edit') {
      const imageResult = await createOrEditImage({ message, imageUrl });
      if (imageResult) return imageResult;
    }
  }

  if (!imageUrl && needsWebSearch(message, workspaceId)) {
    try {
      return await searchAndAnswer({ message, history, workspaceId });
    } catch (err) {
      console.warn('SG16 live search error:', err.message);
    }
  }

  const intent = detectIntent(message, workspaceId, !!imageUrl);
  const model = pickModel(intent);
  const messages = buildMessages({
    workspaceId,
    message,
    imageUrl,
    history,
    targetLanguage,
    memoryContext,
  });
  const reply = await callSg16AI({ messages, model });
  return { reply };
}

export async function handleChatRequest(req, res) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    message,
    workspaceId,
    imageUrl,
    history,
    targetLanguage,
    memoryContext,
    planTier,
    studentVerified,
  } = req.body ?? {};

  const ws = workspaceId || 'general';

  try {
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (!isSafe(message)) {
      return res.status(403).json({ error: 'Blocked by SG16 Safety Shield' });
    }
    if (
      !serverCanAccessWorkspace(ws, {
        signupDate: req.auth?.signupDate,
        planTier: planTier || 'free',
        studentVerified: Boolean(studentVerified),
      })
    ) {
      return res.status(403).json({ error: serverAccessDeniedMessage(ws, req.auth?.signupDate) });
    }

    const result = await handleUserMessage({
      message: message.trim(),
      workspaceId: ws,
      imageUrl,
      history,
      targetLanguage,
      memoryContext,
    });
    res.json(result);
  } catch (err) {
    console.error('SG16 AI Engine:', err);
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('not configured')) {
      return res.status(503).json({
        error: 'SG16 AI is not available right now. Please try again shortly.',
      });
    }
    if (isRateLimitError(msg)) {
      return res.status(503).json({
        error: 'SG16 AI is busy right now. Live web answers will resume automatically — please try again in a minute.',
      });
    }
    if (msg.startsWith('SG16') || msg.startsWith('Please') || msg.startsWith('Blocked')) {
      return res.status(503).json({ error: msg });
    }
    res.status(500).json({ error: 'SG16 AI is temporarily unavailable. Please try again.' });
  }
}
