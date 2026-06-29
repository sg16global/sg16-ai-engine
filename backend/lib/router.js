const VALID = [
  'coding', 'image', 'student-shield', 'translate', 'document', 'voice', 'memory', 'general',
];

const SG16_IDENTITY = `You are the intelligent router for SG16 AI Engine by SaifTech Global Limited.
Never mention third-party AI providers. Return ONLY valid JSON.`;

function normalize(value) {
  return VALID.includes(value) ? value : 'general';
}

export function fallbackRoute(query) {
  const lower = query.toLowerCase();

  if (/code|python|debug|program|javascript|typescript|react|api/.test(lower)) {
    return { targetWorkspace: 'coding', confidence: 0.85, cleanedPrompt: query };
  }
  if (/image|photo|picture|draw|visual|edit image|generate picture/.test(lower)) {
    return { targetWorkspace: 'image', confidence: 0.88, cleanedPrompt: query };
  }
  if (/student|homework|math|physics|exam|study|school|essay|learn/.test(lower)) {
    return { targetWorkspace: 'student-shield', confidence: 0.9, cleanedPrompt: query };
  }
  if (/translate|language|malay|spanish|french|arabic|chinese|japanese|korean/.test(lower)) {
    return { targetWorkspace: 'translate', confidence: 0.85, cleanedPrompt: query };
  }
  if (/document|pdf|summarize|summary|analyze doc|report/.test(lower)) {
    return { targetWorkspace: 'document', confidence: 0.87, cleanedPrompt: query };
  }
  if (/voice|speak|speech|audio|microphone/.test(lower)) {
    return { targetWorkspace: 'voice', confidence: 0.8, cleanedPrompt: query };
  }
  if (/memory|remember|recall|save|vault|note/.test(lower)) {
    return { targetWorkspace: 'memory', confidence: 0.75, cleanedPrompt: query };
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
{"targetWorkspace":"coding"|"image"|"student-shield"|"translate"|"document"|"voice"|"memory"|"general","confidence":0.0-1.0,"cleanedPrompt":"string"}
Rules: student-shield only for education/homework/study. Never route entertainment to student-shield.`,
        },
        { role: 'user', content: query },
      ],
      temperature: 0.3,
      max_tokens: 150,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Router failed');

  const text = data.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

  return {
    targetWorkspace: normalize(parsed.targetWorkspace || 'general'),
    confidence: parsed.confidence ?? 0.7,
    cleanedPrompt: parsed.cleanedPrompt || query,
  };
}

export async function detectIntent(query) {
  try {
    const result = await aiRoute(query);
    if (result) return result;
  } catch (err) {
    console.error('SG16 router:', err.message);
  }
  return fallbackRoute(query);
}

export async function handleRouteRequest(req, res) {
  const { query } = req.body ?? {};
  if (!query?.trim()) {
    return res.status(400).json({ error: 'Query is required' });
  }
  try {
    const result = await detectIntent(query.trim());
    res.json(result);
  } catch (err) {
    console.error('SG16 route error:', err);
    res.json(fallbackRoute(query.trim()));
  }
}
