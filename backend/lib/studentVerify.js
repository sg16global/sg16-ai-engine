import { getEntitlements, setStudentVerification } from './userLedger.js';
import { isLaunchFree } from './launchMode.js';
import { callWithVisionFallback } from './sg16Provider.js';
import { callGeminiVision, hasGeminiKey } from './geminiProvider.js';

const VERIFY_SYSTEM = `You are SG16 AI Student Verification by SaifTech Global Limited.
Analyze the uploaded photo for student ID verification. Never mention Groq, OpenAI, Gemini, or third-party providers.
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
  const messages = [
    { role: 'system', content: VERIFY_SYSTEM },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Verify this student ID selfie. Return JSON only.' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];

  let content = '';

  try {
    const result = await callWithVisionFallback({ messages, temperature: 0.1 });
    content = result.content;
  } catch (groqErr) {
    if (hasGeminiKey()) {
      content = await callGeminiVision({
        system: VERIFY_SYSTEM,
        userText: 'Verify this student ID selfie. Return JSON only.',
        imageUrl,
      });
    } else {
      throw groqErr;
    }
  }

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

    const entitlements = await getEntitlements(googleSub);
    if (!isLaunchFree() && entitlements.planTier !== 'student') {
      return res.status(403).json({
        error: 'Subscribe to Student Shield ($4/mo) before verifying your Student ID.',
        code: 'STUDENT_PLAN_REQUIRED',
      });
    }

    const { imageUrl } = req.body ?? {};
    if (!imageUrl?.trim()) {
      return res.status(400).json({ error: 'Please upload a selfie with your Student ID.' });
    }

    await setStudentVerification(googleSub, { status: 'pending', submittedAt: Date.now() });

    const result = await verifyStudentPhoto(imageUrl);
    const verification = {
      status: result.approved ? 'approved' : 'rejected',
      submittedAt: Date.now(),
      reviewedAt: Date.now(),
      reason: result.reason,
      institutionName: result.institutionName,
      expiryDate: result.expiryDate,
    };
    await setStudentVerification(googleSub, verification);

    res.json({
      ...result,
      subscription: (await getEntitlements(googleSub)).subscription,
    });
  } catch (err) {
    console.error('SG16 Student Verify:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'SG16 AI verification is temporarily unavailable.',
    });
  }
}
