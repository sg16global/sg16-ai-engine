import { callMistralBrainChat, isMistralBrainConfigured } from './mistralBrainClient.js';

function parseCopy(answer) {
  if (!answer) return null;
  let text = String(answer).trim();
  const finalIdx = text.toUpperCase().indexOf('FINAL:');
  if (finalIdx >= 0) text = text.slice(finalIdx + 6).trim();

  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const parsed = JSON.parse(text.slice(start, end + 1));
      if (parsed.headline && parsed.subtitle) return parsed;
    }
  } catch {
    /* fall through */
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    return {
      headline: lines[0].replace(/^headline:\s*/i, '').slice(0, 40),
      subtitle: lines[1].replace(/^subtitle:\s*/i, '').slice(0, 60),
    };
  }
  return null;
}

function adsKeyOk(req) {
  const expected = (process.env.MISTRAL_BRAIN_KEY || process.env.SG16_ADS_INTERNAL_KEY || '').trim();
  const provided = String(req.headers['x-sg16-ads-key'] || '').trim();
  return expected && provided === expected;
}

export async function handleAdsAdCopy(req, res) {
  if (!adsKeyOk(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!isMistralBrainConfigured()) {
    return res.status(503).json({ error: 'Brain not configured' });
  }

  const title = String(req.body?.title || 'Your Brand').slice(0, 120);
  const url = String(req.body?.url || '').slice(0, 500);

  try {
    const answer = await callMistralBrainChat({
      messages: [
        {
          role: 'system',
          content:
            'You write short banner ad copy for SG16 Ads Network. Reply with JSON only, no markdown.',
        },
        {
          role: 'user',
          content: `Brand hint: "${title}". Website: ${url || 'none'}. JSON: {"headline":"max 4 words","subtitle":"max 8 words"}`,
        },
      ],
      userId: 'sg16-ads-network',
      timeoutMs: Number(process.env.SG16_ADS_COPY_TIMEOUT_MS || 90000),
    });

    const copy = parseCopy(answer);
    if (!copy) {
      return res.status(502).json({ error: 'Could not parse ad copy', raw: answer.slice(0, 200) });
    }

    return res.json({ ...copy, brain: 'mistralbrain-cloud' });
  } catch (err) {
    return res.status(502).json({
      error: err instanceof Error ? err.message : 'Brain request failed',
    });
  }
}
