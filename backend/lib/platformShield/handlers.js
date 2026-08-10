import { getPlatformToolStatus } from './index.js';

export async function handlePlatformShieldHealth(_req, res) {
  try {
    const status = await getPlatformToolStatus();
    res.json({ status: status.ready ? 'ok' : 'partial', ...status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
