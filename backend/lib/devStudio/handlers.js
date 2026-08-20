import {
  isDevStudioEnabled,
  studioStatus,
  studioTree,
  studioRead,
  studioWrite,
} from './files.js';
import { runPersonalDeveloper } from '../personalDeveloper/index.js';

export async function handleDevStudioStatus(_req, res) {
  res.json(studioStatus());
}

export async function handleDevStudioTree(_req, res) {
  try {
    res.json(studioTree(3));
  } catch (err) {
    const code = err.code === 'STUDIO_OFF' ? 403 : 400;
    res.status(code).json({ error: err.message, code: err.code || 'STUDIO' });
  }
}

export async function handleDevStudioRead(req, res) {
  try {
    const rel = req.query.path || req.body?.path;
    res.json(studioRead(rel));
  } catch (err) {
    const code = err.code === 'STUDIO_OFF' ? 403 : 400;
    res.status(code).json({ error: err.message, code: err.code || 'STUDIO' });
  }
}

export async function handleDevStudioWrite(req, res) {
  try {
    const { path: rel, content } = req.body ?? {};
    res.json(studioWrite(rel, content));
  } catch (err) {
    const code = err.code === 'STUDIO_OFF' ? 403 : 400;
    res.status(code).json({ error: err.message, code: err.code || 'STUDIO' });
  }
}

/** Junior on the studio road — local PC flow, no Google guest shield. */
export async function handleDevStudioAsk(req, res) {
  if (!isDevStudioEnabled()) {
    return res.status(403).json({
      error: 'Developer studio runs on the PC / localhost, not the public site.',
      code: 'STUDIO_OFF',
    });
  }
  try {
    const { message, history, filePath, fileContent } = req.body ?? {};
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const context = filePath
      ? `\n\nOpen file: ${filePath}\n\`\`\`\n${String(fileContent || '').slice(0, 12000)}\n\`\`\`\n`
      : '';
    const result = await runPersonalDeveloper({
      message: `${message.trim()}${context}`,
      history: Array.isArray(history) ? history : [],
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
