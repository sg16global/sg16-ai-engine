import { runChildrenWorldChat, getChildrenWorldStatus } from './chat.js';
import { pingOllama } from './ollama.js';
import { streamChildrenWorldChat } from './stream.js';

function writeSse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function handleChildrenWorldHealth(_req, res) {
  try {
    const ollama = await pingOllama();
    res.json({ status: 'ok', ollama, ...getChildrenWorldStatus() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleChildrenWorldChat(req, res) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { sessionId, ageTier, nickname, message } = body;
    const result = await runChildrenWorldChat({
      sessionId: sessionId || '',
      ageTier,
      nickname: nickname || '',
      message: message ?? body.text,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleChildrenWorldChatStream(req, res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { sessionId, ageTier, nickname, message } = body;

    const result = await streamChildrenWorldChat({
      sessionId: sessionId || '',
      ageTier,
      nickname: nickname || '',
      message: message ?? body.text,
      onToken: (_delta, full) => writeSse(res, 'token', { text: full }),
    });

    writeSse(res, 'done', result);
    res.end();
  } catch (err) {
    writeSse(res, 'error', { error: err.message });
    res.end();
  }
}
