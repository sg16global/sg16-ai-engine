import {
  getPersonalDeveloperStatus,
  runPersonalDeveloper,
  delegateFromKatsur,
  getKatsurWakeReport,
  setOwnerAwayMode,
  scoutForKatsur,
} from './index.js';
import { isOwnerEmail } from '../kaliShell/ownerState.js';
import { getUserRecord } from '../userLedger.js';

async function resolveOwnerEmail(auth) {
  if (auth?.email) return auth.email;
  if (!auth?.sub) return null;
  const record = await getUserRecord(auth.sub);
  return record?.email ?? null;
}

async function requireOwner(auth, res) {
  const email = await resolveOwnerEmail(auth);
  if (!isOwnerEmail(email)) {
    res.status(403).json({ error: 'Owner account required.', code: 'OWNER_ONLY' });
    return false;
  }
  return true;
}

export async function handlePersonalDeveloperHealth(_req, res) {
  try {
    const status = await getPersonalDeveloperStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handlePersonalDeveloperRun(req, res) {
  try {
    const { message, history } = req.body ?? {};
    const result = await runPersonalDeveloper({
      message,
      history: Array.isArray(history) ? history : [],
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handlePersonalDeveloperDelegate(req, res) {
  try {
    const { message, history } = req.body ?? {};
    const result = await delegateFromKatsur({
      message,
      history: Array.isArray(history) ? history : [],
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handlePersonalDeveloperAway(req, res) {
  try {
    if (!(await requireOwner(req.auth, res))) return;
    const { awayDays, awayNote, insight } = req.body ?? {};
    if (!awayDays || awayDays < 1) {
      return res.status(400).json({ error: 'awayDays must be at least 1.' });
    }
    const owner = await setOwnerAwayMode({
      awayDays,
      awayNote,
      insight,
      auth: req.auth,
    });
    res.json({
      ok: true,
      message: 'Owner away set — Katsur sleeps. SG16 Personal Developer runs.',
      owner,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handlePersonalDeveloperWake(req, res) {
  try {
    if (!(await requireOwner(req.auth, res))) return;
    const report = await getKatsurWakeReport({ clearAway: true });
    res.json({
      ok: true,
      message: 'Owner returned — Katsur wake report ready.',
      report,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handlePersonalDeveloperScout(_req, res) {
  try {
    const scout = await scoutForKatsur();
    res.json(scout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handlePersonalDeveloperReport(req, res) {
  try {
    const report = await getKatsurWakeReport({ clearAway: false });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
