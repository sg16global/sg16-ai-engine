/** Owner presence, push insight, and away-mode state (in-memory; persists for process lifetime). */

import { isOwnerAllowed } from './internalMode.js';

let ownerInsight = '';
let awayInstructions = '';
let awayUntil = 0;
let lastOwnerPushAt = 0;
let lastOwnerSub = null;
let awayStartedAt = null;

export function getOwnerState() {
  const now = Date.now();
  const away = awayUntil > now;
  return {
    hasInsight: ownerInsight.length > 0,
    insightPreview: ownerInsight.slice(0, 120),
    awayInstructions: awayInstructions ? awayInstructions.slice(0, 200) : '',
    away,
    awayUntil: away ? new Date(awayUntil).toISOString() : null,
    awayStartedAt: away && awayStartedAt ? new Date(awayStartedAt).toISOString() : null,
    lastPushAt: lastOwnerPushAt ? new Date(lastOwnerPushAt).toISOString() : null,
    ownerSub: lastOwnerSub,
    seniorActive: !away,
    personalDeveloperActive: away,
  };
}

export function getAwayInstructions() {
  return awayInstructions;
}

export function getAwayStartedAt() {
  return awayStartedAt;
}

export function ownerPush({ insight, awayDays, awayNote, sub }) {
  if (typeof insight === 'string' && insight.trim()) {
    ownerInsight = insight.trim();
    lastOwnerPushAt = Date.now();
  }
  if (typeof awayNote === 'string') {
    awayInstructions = awayNote.trim();
  }
  if (sub) lastOwnerSub = sub;
  if (typeof awayDays === 'number' && awayDays > 0) {
    awayUntil = Date.now() + awayDays * 24 * 60 * 60 * 1000;
    awayStartedAt = Date.now();
  } else if (awayDays === 0) {
    awayUntil = 0;
    awayStartedAt = null;
  }
  return getOwnerState();
}

export function wakeOwner() {
  awayUntil = 0;
  awayStartedAt = null;
  return getOwnerState();
}

export function getOwnerInsightBlock() {
  if (!ownerInsight) return '';
  return `\n\n--- Owner push (highest priority) ---\n${ownerInsight}\n--- End owner push ---`;
}

export function isOwnerAway() {
  return Date.now() < awayUntil;
}

export function isOwnerEmail(email) {
  return isOwnerAllowed(email);
}
