import { runChildrenWorldChat, getChildrenWorldStatus } from './chat.js';

export async function handleChildrenWorldHealth(_req, res) {
  try {
    res.json({ status: 'ok', ...getChildrenWorldStatus() });
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
