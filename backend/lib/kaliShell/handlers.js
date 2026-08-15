import {
  getKaliShellStatus,
  runKaliShell,
  pushOwnerInsight,
  registerChildAgent,
  getAgentsList,
  inspectChildClothes,
  sewChildClothes,
} from './index.js';

export async function handleKaliShellHealth(_req, res) {
  try {
    const status = await getKaliShellStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleKaliShellAgents(req, res) {
  try {
    const developersOnly = req.query.developers === '1' || req.query.developers === 'true';
    const guidesOnly = req.query.guides === '1' || req.query.guides === 'true';
    const agents = getAgentsList({ developersOnly, guidesOnly });
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function handleKaliShellRun(req, res) {
  try {
    const { message, agentId, history } = req.body ?? {};
    const result = await runKaliShell({
      message,
      agentId,
      history: Array.isArray(history) ? history : [],
      auth: req.auth,
    });
    res.json(result);
  } catch (err) {
    if (err.code === 'OWNER_AWAY') {
      return res.status(409).json({ error: err.message, code: err.code });
    }
    res.status(400).json({ error: err.message });
  }
}

export async function handleKaliShellPush(req, res) {
  try {
    const { insight, awayDays, awayNote } = req.body ?? {};
    const state = await pushOwnerInsight({ insight, awayDays, awayNote, auth: req.auth });
    res.json({ ok: true, owner: state });
  } catch (err) {
    if (err.code === 'OWNER_ONLY') {
      return res.status(403).json({ error: err.message, code: err.code });
    }
    res.status(400).json({ error: err.message });
  }
}

export async function handleKaliShellSpawn(req, res) {
  try {
    const agent = await registerChildAgent(req.body ?? {}, req.auth);
    res.status(201).json({ agent });
  } catch (err) {
    if (err.code === 'OWNER_ONLY') {
      return res.status(403).json({ error: err.message, code: err.code });
    }
    res.status(400).json({ error: err.message });
  }
}

export async function handleKaliShellInspect(req, res) {
  try {
    const { work, history } = req.body ?? {};
    const result = await inspectChildClothes({
      work: typeof work === 'string' ? work : '',
      history: Array.isArray(history) ? history : [],
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function handleKaliShellSew(req, res) {
  try {
    const { work, inspectNotes, history } = req.body ?? {};
    const result = await sewChildClothes({
      work: typeof work === 'string' ? work : '',
      inspectNotes: typeof inspectNotes === 'string' ? inspectNotes : '',
      history: Array.isArray(history) ? history : [],
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
