import { scanCodeSnippet, scanFullProject, getShieldToolStatus } from './index.js';
import { hasPaidAccess } from '../access.js';
import { isLaunchFree } from '../launchMode.js';
import { getEntitlements } from '../userLedger.js';

async function userIsPremium(req) {
  if (isLaunchFree()) return true;
  if (!req.auth?.sub) return false;
  const ent = await getEntitlements(req.auth.sub);
  return hasPaidAccess(ent.planTier, ent.studentVerified);
}

export async function handleCodingShieldHealth(_req, res) {
  try {
    const status = await getShieldToolStatus();
    res.json({
      status: 'ok',
      service: 'SG16 Coding Shield',
      version: '1.0',
      ...status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleCodingShieldScan(req, res) {
  try {
    const { code, language, mode = 'fast' } = req.body || {};
    const premium = await userIsPremium(req);

    if (mode === 'deep' && !premium) {
      return res.status(402).json({
        error: 'Deep scan requires Premium',
        upgrade: true,
      });
    }

    const report = await scanCodeSnippet({
      code,
      language: language || 'javascript',
      mode: premium && mode === 'deep' ? 'deep' : 'fast',
    });

    res.json({
      ok: true,
      shield: 'SG16 Coding Shield',
      subdomain: 'https://shield.sg16engine.com',
      ...report,
    });
  } catch (err) {
    const status = err.message?.includes('required') ? 400 : 500;
    res.status(status).json({ error: err.message || 'Scan failed' });
  }
}

export async function handleCodingShieldProjectScan(req, res) {
  try {
    if (!(await userIsPremium(req))) {
      return res.status(402).json({ error: 'Full project scan requires Premium', upgrade: true });
    }
    const report = await scanFullProject();
    res.json({ ok: true, shield: 'SG16 Coding Shield', ...report });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Project scan failed' });
  }
}
