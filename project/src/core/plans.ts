import { SG16_BRAND } from './branding';
import type { PlanTier, WorkspaceId } from './types';

export interface PlanDefinition {
  id: PlanTier;
  name: string;
  price: string;
  priceNote: string;
  description: string;
  features: string[];
  limitations?: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free Plan',
    price: '$0',
    priceNote: '/month',
    description: `${SG16_BRAND.chatName} + Health basics worldwide.`,
    features: [
      `${SG16_BRAND.chatName} — free`,
      'Health Guide — questions & report explain',
      'Coding project score (check)',
      '24h helping hand for basic support',
    ],
    limitations: [
      'Coding repair / rewrite needs Premium',
      'Student Shield full access needs student plan or Pro',
    ],
    cta: 'Current plan',
  },
  {
    id: 'student',
    name: 'Student Shield',
    price: '$4',
    priceNote: '/month',
    description: 'Education-safe tutor + full 4 services for verified students.',
    features: [
      'Student Shield educational guard',
      'Chat + Health + Coding score',
      'Coding repair / rewrite',
      'Verified student ID required',
    ],
    limitations: ['Requires selfie + valid Student ID verification'],
    cta: 'Subscribe — $4/mo',
    badge: 'Students',
  },
  {
    id: 'pro',
    name: 'Pro Premium',
    price: '$10',
    priceNote: '/month',
    description: 'Full SG16 power — score, repair, Student Shield, priority help.',
    features: [
      'All 4 worldwide services',
      'Coding project score + Premium repair',
      'Student Shield access',
      'Priority support escalation',
    ],
    cta: 'Subscribe — $10/mo',
    highlighted: true,
    badge: 'Most popular',
  },
];

/** Always free forever after sign-in. */
export const FREE_WORKSPACES: WorkspaceId[] = ['general', 'health', 'market', 'developer'];

export const PREMIUM_WORKSPACES: WorkspaceId[] = [
  'coding',
  'student-shield',
];

export function planLabel(plan: PlanTier): string {
  if (plan === 'pro') return 'Pro Premium';
  if (plan === 'student') return 'Student Shield';
  return 'Free Plan';
}
