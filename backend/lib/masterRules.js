import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RULES_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../sg16-bps/sg16-master-rules.md');

let cached;

export function getMasterRules() {
  if (cached !== undefined) return cached;
  try {
    cached = readFileSync(RULES_PATH, 'utf8').trim();
  } catch {
    cached = '';
  }
  return cached;
}

export function isMasterRulesLoaded() {
  return getMasterRules().length > 0;
}
