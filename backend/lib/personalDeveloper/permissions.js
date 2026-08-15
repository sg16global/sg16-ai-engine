/** Owner-permitted rooms — internal co-owner mode grants all by default (not public market). */

import { PERMISSION_ROOMS } from './agent.js';
import { isInternalCoOwnerMode } from '../kaliShell/internalMode.js';

const INTERNAL_GRANT = [...PERMISSION_ROOMS, 'all-projects'];

const DEFAULT_SCOPES = ['all-projects'];

function parseEnvScopes() {
  const raw = process.env.SG16_PD_SCOPES?.trim();
  if (!raw) return DEFAULT_SCOPES;
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function getGrantedPermissions() {
  if (isInternalCoOwnerMode()) {
    return [...new Set(INTERNAL_GRANT)];
  }
  const fromEnv = parseEnvScopes();
  return [...new Set(fromEnv.filter((s) => PERMISSION_ROOMS.includes(s) || s === 'all-projects'))];
}

export function hasPermission(room) {
  if (isInternalCoOwnerMode()) return true;
  const granted = getGrantedPermissions();
  if (granted.includes('all-projects')) return true;
  return granted.includes(room);
}

export function permissionsBlock() {
  const internal = isInternalCoOwnerMode();
  const granted = getGrantedPermissions();
  const denied = internal ? [] : PERMISSION_ROOMS.filter((r) => !granted.includes(r) && !granted.includes('all-projects'));
  return {
    mode: internal ? 'internal-co-owner' : 'market',
    granted,
    denied,
    googleOwner: hasPermission('google-owner'),
    note: internal
      ? 'Internal co-owner mode — full rooms for owner + Katsur. Not thrown to outside market.'
      : hasPermission('google-owner')
        ? 'Google owner room granted — owner-assigned tasks only.'
        : 'Set SG16_PD_SCOPES or use internal mode.',
  };
}
