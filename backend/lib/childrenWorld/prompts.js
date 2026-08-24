import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '../../../sg16-children-world/backend/prompts');

const TIER_FILES = {
  '6-11': 'tier_6_11.txt',
  '12-17': 'tier_12_17.txt',
  '18+': 'tier_18_plus.txt',
};

function readPrompt(name) {
  const filePath = path.join(PROMPTS_DIR, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Children World prompt missing: ${name}`);
  }
  return fs.readFileSync(filePath, 'utf8').trim();
}

export function globalPrompt() {
  return readPrompt('global.txt');
}

export function tierPrompt(ageTier) {
  const file = TIER_FILES[ageTier];
  if (!file) throw new Error(`Unknown age tier: ${ageTier}`);
  return readPrompt(file);
}

export function fullSystemPrompt(ageTier) {
  return `${globalPrompt()}\n\n${tierPrompt(ageTier)}`;
}

export const VALID_AGE_TIERS = Object.keys(TIER_FILES);
