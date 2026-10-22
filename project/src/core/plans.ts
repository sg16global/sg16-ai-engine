import type { PlanTier, WorkspaceId } from './types';

/**
 * SG16 passes. Every pass unlocks all 5 shields; they differ only in how long they last.
 * Verified students can take the Student Month pass instead of the normal Month.
 * `tier` maps a pass onto the account plan the server already knows ('pro' / 'student').
 */
export interface PassDefinition {
  id: 'day' | 'week' | 'half-month' | 'month' | 'student-month';
  tier: Exclude<PlanTier, 'free'>;
  name: string;
  price: string;
  days: number;
  description: string;
  badge?: string;
  highlighted?: boolean;
  studentOnly?: boolean;
}

export const ALL_SHIELDS = ['AI Chat', 'Coding Hub', 'Health Shield', 'Market Shield', 'Student Shield'];

export const PASSES: PassDefinition[] = [
  { id: 'day', tier: 'pro', name: 'Day Pass', price: '$2', days: 1, description: 'All 5 shields for 24 hours.' },
  { id: 'week', tier: 'pro', name: 'Week Pass', price: '$5', days: 7, description: 'All 5 shields for 7 days.' },
  { id: 'half-month', tier: 'pro', name: '15-Day Pass', price: '$10', days: 15, description: 'All 5 shields for 15 days.' },
  {
    id: 'month',
    tier: 'pro',
    name: 'Month Pass',
    price: '$15',
    days: 30,
    description: 'All 5 shields for 30 days.',
    badge: 'Best value',
    highlighted: true,
  },
  {
    id: 'student-month',
    tier: 'student',
    name: 'Student Month',
    price: '$8',
    days: 30,
    description: 'All 5 shields for 30 days — for verified students.',
    badge: 'Students',
    studentOnly: true,
  },
];

/** Price per day, e.g. "$0.50 / day". */
export function perDay(pass: PassDefinition) {
  const n = Number(pass.price.replace('$', '')) / pass.days;
  return `$${n.toFixed(2)} / day`;
}

/** Short line for menus: "Day $2 · Week $5 · 15 days $10 · Month $15". */
export const PASS_SUMMARY = 'Day $2 · Week $5 · 15 days $10 · Month $15';

/** After the launch, every shield needs a pass (or the new-account trial). */
export const FREE_WORKSPACES: WorkspaceId[] = [];

export const PREMIUM_WORKSPACES: WorkspaceId[] = ['general', 'coding', 'health', 'market', 'student-shield'];

export function planLabel(plan: PlanTier): string {
  if (plan === 'pro') return 'SG16 Pass';
  if (plan === 'student') return 'Student Month';
  return 'No pass';
}
