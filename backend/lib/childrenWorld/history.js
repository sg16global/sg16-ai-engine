const MAX_HISTORY_MESSAGES = 12;

export function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  const out = [];
  for (const item of history) {
    if (!item || typeof item !== 'object') continue;
    const role =
      item.role === 'assistant' ? 'assistant' : item.role === 'user' ? 'user' : null;
    if (!role) continue;
    const content = String(item.content || '').trim().slice(0, 2000);
    if (!content) continue;
    out.push({ role, content });
  }

  return out.slice(-MAX_HISTORY_MESSAGES);
}

export function buildModelMessages({ systemPrompt, history, userPayload }) {
  return [
    { role: 'system', content: systemPrompt },
    ...normalizeHistory(history),
    { role: 'user', content: userPayload },
  ];
}
