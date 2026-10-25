import type { StudentVerifyResponse } from '../../core/types';
import { chatCompletion } from './client';
import type { AiChatMessage } from './types';

/**
 * Vision — image questions and Student ID verification, answered by whichever
 * provider has a vision model connected in Admin. Ported from the old server
 * (backend/lib/studentVerify.js); nothing is stored anywhere.
 */

/** Ask a vision model about an uploaded image. */
export async function analyzeImage(imageUrl: string, prompt: string): Promise<string> {
  const messages: AiChatMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];
  const result = await chatCompletion({ messages, intent: 'vision', temperature: 0.4, maxTokens: 1200 });
  return result.content;
}

/* ── Student ID verification ── */

const VERIFY_SYSTEM = `You are SG16 AI Student Verification by Saif Tech Global LLC.
Analyze the uploaded photo for student ID verification. Never mention any third-party provider by name.
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

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[0]);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function parseExpiry(expiryStr: unknown): Date | null {
  if (typeof expiryStr !== 'string' || !expiryStr || expiryStr === 'null') return null;
  const d = new Date(expiryStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isExpiryValid(expiry: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry >= today;
}

async function callVision(imageUrl: string): Promise<Record<string, unknown>> {
  const messages: AiChatMessage[] = [
    { role: 'system', content: VERIFY_SYSTEM },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Verify this student ID selfie. Return JSON only.' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];
  const result = await chatCompletion({ messages, intent: 'vision', temperature: 0.1, maxTokens: 600 });
  const parsed = extractJson(result.content);
  if (!parsed) {
    throw new Error('SG16 AI could not read verification data. Please upload a clearer photo.');
  }
  return parsed;
}

function boolOf(value: unknown): boolean {
  return value === true;
}

/** Verify a student ID selfie with the connected vision model. Result is kept on this device only. */
export async function verifyStudentIdPhoto(imageUrl: string): Promise<StudentVerifyResponse> {
  const vision = await callVision(imageUrl);

  const expiryDate = parseExpiry(vision.expiryDate);
  const expiryValid = expiryDate ? isExpiryValid(expiryDate) : false;

  let approved = Boolean(
    boolOf(vision.selfieWithId) && boolOf(vision.idVisible) && boolOf(vision.institutionLooksValid) && expiryValid,
  );

  let reason = typeof vision.reason === 'string' ? vision.reason : '';

  if (!boolOf(vision.selfieWithId) || !boolOf(vision.idVisible)) {
    approved = false;
    reason = 'Upload a clear selfie holding your Student ID next to your face.';
  } else if (!boolOf(vision.institutionLooksValid)) {
    approved = false;
    reason = 'Could not verify a valid school or college Student ID. Use an official institution card.';
  } else if (!expiryDate) {
    approved = false;
    reason = 'Expiry date is not readable. Show the expiry date on your Student ID clearly.';
  } else if (!expiryValid) {
    approved = false;
    reason = `Student ID expired on ${expiryDate.toISOString().slice(0, 10)}. Please use a current valid ID.`;
  } else if (approved) {
    const institution = typeof vision.institutionName === 'string' && vision.institutionName ? vision.institutionName : 'your institution';
    reason = `Verified at ${institution}. Full access unlocked.`;
  }

  return {
    approved,
    reason,
    institutionName: typeof vision.institutionName === 'string' && vision.institutionName ? vision.institutionName : undefined,
    expiryDate: expiryDate ? expiryDate.toISOString().slice(0, 10) : undefined,
    expiryValid,
  };
}
