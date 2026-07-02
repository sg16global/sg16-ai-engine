import { getEntitlements, setStudentVerification } from './userLedger.js';

const VISION_MODEL = process.env.SG16_AI_MODEL_VISION || 'meta-llama/llama-4-scout-17b-16e-instruct';

function getApiKey() {
  return (
    process.env.SG16_AI_API_KEY ||
    process.env.SG16_ROUTER_API_KEY ||
    process.env.XAI_API_KEY
  )?.trim();
}

function hasApiKey() {
  const key = getApiKey();
  return key && !key.startsWith('<your_');
}

function getApiUrl() {
  if (process.env.SG16_AI_API_URL) return process.env.SG16_AI_API_URL;
  if (process.env.XAI_API_KEY?.trim()) return 'https://api.x.ai/v1/chat/completions';
  return 'https://api.groq.com/openai/v1/chat/completions';
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function parseExpiry(expiryStr) {
  if (!expiryStr || expiryStr === 'null') return null;
  const d = new Date(expiryStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isExpiryValid(expiryStr) {
  const d = parseExpiry(expiryStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

async function callVision(imageUrl) {
  if (!hasApiKey()) {
    throw new Error('SG16 AI verification service is not configured');
  }

  const system = `You are SG16 AI Student Verification by SaifTech Global Limited.
Analyze the uploaded photo for student ID verification. Never mention Groq, OpenAI, or third-party providers.
Return ONLY valid JSON with these fields:
{
  "selfieWithId": boolean,
  "idVisible": boolean,
  "institutionName": string or null,
  "institutionLooksValid": boolean,
  "expiryDate": "YYYY-MM-DD" or null,
  "studentNameVisible": boolean,
  "approved": boolean,
  "reason": "short user-facing explanation"
}
Rules:
- selfieWithId: person clearly holding ID near face in same photo
- idVisible: school/college/university student ID card readable
- institutionLooksValid: appears to be legitimate educational institution ID
- expiryDate: read printed expiry if visible, ISO format
- approved: true ONLY if selfieWithId AND idVisible AND institutionLooksValid AND expiry is not past today
- If expiry missing but ID otherwise valid, set approved false with reason to show expiry clearly`;

  const res = await fetch(getApiUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Verify this student ID selfie. Return JSON only.',
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(120000),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'SG16 AI verification failed');
  }

  const content = data.choices?.[0]?.message?.content || '';
  const parsed = extractJson(content);
  if (!parsed) {
    throw new Error('SG16 AI could not read verification data. Please upload a clearer photo.');
  }
  return parsed;
}

export async function verifyStudentPhoto(imageUrl) {
  const vision = await callVision(imageUrl);

  const expiryDate = vision.expiryDate || null;
  const expiryValid = expiryDate ? isExpiryValid(expiryDate) : false;

  let approved = Boolean(
    vision.selfieWithId &&
      vision.idVisible &&
      vision.institutionLooksValid &&
      expiryValid,
  );

  let reason = vision.reason || '';

  if (!vision.selfieWithId || !vision.idVisible) {
    approved = false;
    reason = 'Upload a clear selfie holding your Student ID next to your face.';
  } else if (!vision.institutionLooksValid) {
    approved = false;
    reason = 'Could not verify a valid school or college Student ID. Use an official institution card.';
  } else if (!expiryDate) {
    approved = false;
    reason = 'Expiry date is not readable. Show the expiry date on your Student ID clearly.';
  } else if (!expiryValid) {
    approved = false;
    reason = `Student ID expired on ${expiryDate}. Please use a current valid ID.`;
  } else if (approved) {
    reason = `Verified at ${vision.institutionName || 'your institution'}. Full access unlocked.`;
  }

  return {
    approved,
    reason,
    institutionName: vision.institutionName || undefined,
    expiryDate: expiryDate || undefined,
    expiryValid,
  };
}

export async function handleStudentVerifyRequest(req, res) {
  try {
    const googleSub = req.auth?.sub;
    if (!googleSub) {
      return res.status(401).json({ error: 'Sign in to verify your Student ID.', code: 'AUTH_REQUIRED' });
    }

    const entitlements = getEntitlements(googleSub);
    if (entitlements.planTier !== 'student') {
      return res.status(403).json({
        error: 'Subscribe to Student Shield ($4/mo) before verifying your Student ID.',
        code: 'STUDENT_PLAN_REQUIRED',
      });
    }

    const { imageUrl } = req.body ?? {};
    if (!imageUrl?.trim()) {
      return res.status(400).json({ error: 'Please upload a selfie with your Student ID.' });
    }

    setStudentVerification(googleSub, { status: 'pending', submittedAt: Date.now() });

    const result = await verifyStudentPhoto(imageUrl);
    const verification = {
      status: result.approved ? 'approved' : 'rejected',
      submittedAt: Date.now(),
      reviewedAt: Date.now(),
      reason: result.reason,
      institutionName: result.institutionName,
      expiryDate: result.expiryDate,
    };
    setStudentVerification(googleSub, verification);

    res.json({
      ...result,
      subscription: getEntitlements(googleSub).subscription,
    });
  } catch (err) {
    console.error('SG16 Student Verify:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'SG16 AI verification is temporarily unavailable.',
    });
  }
}
