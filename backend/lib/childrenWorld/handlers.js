import { runChildrenWorldChat, getChildrenWorldStatus } from './chat.js';
import { pingOllama } from './ollama.js';
import { streamChildrenWorldChat } from './stream.js';
import { isChildrenWorldEnabled } from './clientAuth.js';

function childrenPausedPayload() {
  return {
    error: 'SG16 Children World is paused. The engine brain is reserved for existing SG16 users.',
    enabled: false,
  };
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function handleChildrenWorldHealth(_req, res) {
  if (!isChildrenWorldEnabled()) {
    return res.json({ status: 'paused', enabled: false, ...getChildrenWorldStatus() });
  }
  try {
    const ollama = await pingOllama();
    res.json({ status: 'ok', enabled: true, ollama, ...getChildrenWorldStatus() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleChildrenWorldChat(req, res) {
  if (!isChildrenWorldEnabled()) {
    return res.status(503).json(childrenPausedPayload());
  }
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { sessionId, ageTier, nickname, message, history } = body;
    const result = await runChildrenWorldChat({
      sessionId: sessionId || '',
      ageTier,
      nickname: nickname || '',
      message: message ?? body.text,
      history: history || [],
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleChildrenWorldChatStream(req, res) {
  if (!isChildrenWorldEnabled()) {
    return res.status(503).json(childrenPausedPayload());
  }
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { sessionId, ageTier, nickname, message, history } = body;

    const result = await streamChildrenWorldChat({
      sessionId: sessionId || '',
      ageTier,
      nickname: nickname || '',
      message: message ?? body.text,
      history: history || [],
      onToken: (_delta, full) => writeSse(res, 'token', { text: full }),
    });

    writeSse(res, 'done', result);
    res.end();
  } catch (err) {
    writeSse(res, 'error', { error: err.message });
    res.end();
  }
}
