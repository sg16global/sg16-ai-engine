/** Activity journal — Personal Developer logs for Katsur wake-up report. */

const MAX_ENTRIES = 200;
/** @type {Array<object>} */
const entries = [];

export function logJournal({ action, summary, agentId = 'sg16-personal-developer', meta = {} }) {
  const entry = {
    id: `j-${Date.now()}-${entries.length}`,
    at: new Date().toISOString(),
    action,
    summary: String(summary).slice(0, 2000),
    agentId,
    meta,
  };
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  return entry;
}

export function getJournalSince(isoDate) {
  if (!isoDate) return [...entries];
  const since = new Date(isoDate).getTime();
  return entries.filter((e) => new Date(e.at).getTime() >= since);
}

export function getJournalSummary(limit = 20) {
  return entries.slice(0, limit);
}

export function clearJournalBefore(isoDate) {
  if (!isoDate) {
    entries.length = 0;
    return 0;
  }
  const since = new Date(isoDate).getTime();
  const before = entries.length;
  const kept = entries.filter((e) => new Date(e.at).getTime() >= since);
  entries.length = 0;
  entries.push(...kept);
  return before - kept;
}
