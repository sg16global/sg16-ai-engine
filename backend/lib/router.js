const VALID = [
  'coding', 'health', 'student-shield', 'general',
  'image', 'translate', 'document', 'voice', 'memory',
];

const LEGACY = {
  image: 'general',
  document: 'health',
  translate: 'general',
  voice: 'general',
  memory: 'general',
};

const SG16_IDENTITY = `You are the intelligent router for SG16 AI Engine by SaifTech Global Limited.
Never mention third-party AI providers. Return ONLY valid JSON.`;

function normalize(value) {
  const raw = VALID.includes(value) ? value : 'general';
  return LEGACY[raw] || raw;
}

export function fallbackRoute(query) {
  const lower = query.toLowerCase();

  if (/code|python|debug|program|javascript|typescript|react|api|refactor/.test(lower)) {
    return { targetWorkspace: 'coding', confidence: 0.85, cleanedPrompt: query };
  }
  if (/health|symptom|blood test|doctor|wellness|diet|sleep|fever|medical/.test(lower)) {
    return { targetWorkspace: 'health', confidence: 0.88, cleanedPrompt: query };
  }
  if (/student|homework|math|physics|exam|study|school|essay|learn/.test(lower)) {
    return { targetWorkspace: 'student-shield', confidence: 0.9, cleanedPrompt: query };
  }

  return { targetWorkspace: 'general', confidence: 0.6, cleanedPrompt: query };
}

async function aiRoute(query) {
  const apiKey =
    process.env.SG16_ROUTER_API_KEY ||
    process.env.SG16_AI_API_KEY ||
    process.env.VITE_SG16_AI_KEY;
  const apiUrl =
    process.env.SG16_ROUTER_URL || 'https://api.groq.com/openai/v1/chat/completions';
  const model = process.env.SG16_ROUTER_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey?.trim()) return null;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `${SG16_IDENTITY}
Analyze the query and return ONLY JSON:
{"targetWorkspace":"coding"|"health"|"student-shield"|"general","confidence":0.0-1.0,"cleanedPrompt":"string"}
Rules: Only these 4 services. student-shield for education/homework/study. health for wellness/report explain (not diagnosis). coding for software. Else general.`,
        },
        { role: 'user', content: query },
      ],
      temperature: 0.3,
      max_tokens: 150,
    }),
    signal: AbortSignal.timeout(Number(process.env.SG16_ROUTER_TIMEOUT_MS || 15000)),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Router failed');

  const text = data.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

  return {
    targetWorkspace: normalize(parsed.targetWorkspace),
    confidence: Number(parsed.confidence) || 0.7,
    cleanedPrompt: parsed.cleanedPrompt || query,
  };
}

export async function handleRouteRequest(req, res) {
  try {
    const query = String(req.body?.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'query required' });
    }

    try {
      const routed = await aiRoute(query);
      if (routed) return res.json(routed);
    } catch {
      /* fallback */
    }

    return res.json(fallbackRoute(query));
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
