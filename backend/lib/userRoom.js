import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, isDatabaseReady } from './db/index.js';
import { buildSubscriptionPayload, getUserRecord } from './userLedger.js';
import { isLaunchFree } from './launchMode.js';
import { trialDaysRemaining, trialIsActive } from './access.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOMS_PATH = path.join(__dirname, '../data/user-rooms.json');

const WORKSPACE_IDS = [
  'general',
  'coding',
  'health',
  'student-shield',
  'market',
  'image',
  'translate',
  'document',
  'voice',
  'memory',
];

function emptyHistory() {
  return Object.fromEntries(WORKSPACE_IDS.map((id) => [id, []]));
}

function ensureRoomsFile() {
  const dir = path.dirname(ROOMS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(ROOMS_PATH)) {
    fs.writeFileSync(ROOMS_PATH, JSON.stringify({}, null, 2), 'utf8');
  }
}

function readRoomsJson() {
  ensureRoomsFile();
  try {
    return JSON.parse(fs.readFileSync(ROOMS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeRoomsJson(rooms) {
  ensureRoomsFile();
  fs.writeFileSync(ROOMS_PATH, JSON.stringify(rooms, null, 2), 'utf8');
}

function normalizeHistory(raw) {
  const base = emptyHistory();
  if (!raw || typeof raw !== 'object') return base;
  for (const id of WORKSPACE_IDS) {
    if (Array.isArray(raw[id])) base[id] = raw[id];
  }
  return base;
}

function activitySummary(history) {
  const workspaces = [];
  let totalMessages = 0;
  let lastActivityAt = 0;

  for (const id of WORKSPACE_IDS) {
    const msgs = history[id] ?? [];
    if (!msgs.length) continue;
    const last = msgs[msgs.length - 1];
    const lastTs = last?.timestamp ?? 0;
    totalMessages += msgs.length;
    if (lastTs > lastActivityAt) lastActivityAt = lastTs;
    workspaces.push({
      workspaceId: id,
      messageCount: msgs.length,
      lastMessage: last?.content?.slice(0, 120) ?? '',
      lastActivityAt: lastTs,
    });
  }

  workspaces.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  return { totalMessages, lastActivityAt, workspaces };
}

async function getRoomPg(googleSub) {
  const { rows } = await getPool().query(
    'SELECT chat_history, settings, updated_at FROM user_rooms WHERE google_sub = $1 LIMIT 1',
    [googleSub],
  );
  if (!rows[0]) {
    return { chatHistory: emptyHistory(), settings: {}, updatedAt: null };
  }
  return {
    chatHistory: normalizeHistory(rows[0].chat_history),
    settings: rows[0].settings ?? {},
    updatedAt: rows[0].updated_at,
  };
}

async function saveRoomPg(googleSub, chatHistory, settings = {}) {
  await getPool().query(
    `INSERT INTO user_rooms (google_sub, chat_history, settings, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, NOW())
     ON CONFLICT (google_sub) DO UPDATE SET
       chat_history = EXCLUDED.chat_history,
       settings = EXCLUDED.settings,
       updated_at = NOW()`,
    [googleSub, JSON.stringify(normalizeHistory(chatHistory)), JSON.stringify(settings ?? {})],
  );
}

async function getRoomJson(googleSub) {
  const rooms = readRoomsJson();
  const room = rooms[googleSub];
  if (!room) return { chatHistory: emptyHistory(), settings: {}, updatedAt: null };
  return {
    chatHistory: normalizeHistory(room.chat_history),
    settings: room.settings ?? {},
    updatedAt: room.updated_at ?? null,
  };
}

async function saveRoomJson(googleSub, chatHistory, settings = {}) {
  const rooms = readRoomsJson();
  rooms[googleSub] = {
    chat_history: normalizeHistory(chatHistory),
    settings: settings ?? {},
    updated_at: new Date().toISOString(),
  };
  writeRoomsJson(rooms);
}

export async function getUserRoomData(googleSub) {
  if (isDatabaseReady()) return getRoomPg(googleSub);
  return getRoomJson(googleSub);
}

export async function saveUserRoomHistory(googleSub, chatHistory, settings = {}) {
  if (isDatabaseReady()) return saveRoomPg(googleSub, chatHistory, settings);
  return saveRoomJson(googleSub, chatHistory, settings);
}

export async function buildUserRoomPayload(session) {
  const googleSub = session.sub;
  const [record, room, subscription] = await Promise.all([
    getUserRecord(googleSub),
    getUserRoomData(googleSub),
    buildSubscriptionPayload(googleSub),
  ]);

  const signupDate = session.signupDate;
  const launchFree = isLaunchFree();
  const activity = activitySummary(room.chatHistory);

  return {
    user: {
      id: googleSub,
      signupDate,
      name: session.name || record?.name || 'SG16 User',
      email: record?.email ?? null,
      picture: session.picture ?? null,
      launchFree,
      trialActive: !launchFree && trialIsActive(signupDate),
      trialDaysRemaining: launchFree ? 0 : trialDaysRemaining(signupDate),
      subscription,
    },
    room: {
      activity,
      settings: room.settings,
      updatedAt: room.updatedAt,
      hasHistory: activity.totalMessages > 0,
    },
  };
}

export async function handleGetUserRoom(req, res) {
  try {
    const payload = await buildUserRoomPayload(req.auth);
    res.json(payload);
  } catch (err) {
    console.error('[SG16 user room]', err);
    res.status(500).json({ error: 'Could not load your user room.' });
  }
}

export async function handleGetUserHistory(req, res) {
  try {
    const room = await getUserRoomData(req.auth.sub);
    res.json({ chatHistory: room.chatHistory, updatedAt: room.updatedAt });
  } catch (err) {
    console.error('[SG16 user history get]', err);
    res.status(500).json({ error: 'Could not load your history.' });
  }
}

export async function handlePutUserHistory(req, res) {
  try {
    const { chatHistory, settings } = req.body ?? {};
    if (!chatHistory || typeof chatHistory !== 'object') {
      return res.status(400).json({ error: 'chatHistory is required.' });
    }
    await saveUserRoomHistory(req.auth.sub, chatHistory, settings ?? {});
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[SG16 user history put]', err);
    res.status(500).json({ error: 'Could not save your history.' });
  }
}
