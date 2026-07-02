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
    description: `Basic ${SG16_BRAND.chatName} for everyday questions and information.`,
    features: [`${SG16_BRAND.chatName} & Translate — free forever`, 'Home Ask Engine', '3-day full trial on sign-up'],
    limitations: [
      'After trial: Coding Hub locked',
      'After trial: Image Studio locked',
      'After trial: Document Lab locked',
      'Voice AI, Memory Vault, Student Shield require upgrade',
    ],
    cta: 'Current plan',
  },
  {
    id: 'student',
    name: 'Student Shield',
    price: '$4',
    priceNote: '/month',
    description: 'Full platform access for verified students after AI Student ID check.',
    features: [
      'All 8 SG16 AI workspaces',
      'Image Studio create & edit',
      'Coding Hub & Document Lab',
      'Voice AI, Translate, Memory Vault',
      'Student Shield educational guard',
    ],
    limitations: ['Requires selfie + valid Student ID verification', 'ID expiry must be current'],
    cta: 'Subscribe — $4/mo',
    badge: 'Students',
  },
  {
    id: 'pro',
    name: 'Pro Premium',
    price: '$10',
    priceNote: '/month',
    description: 'Instant full access to every premium SG16 AI feature for the general public.',
    features: [
      'All 8 SG16 AI workspaces — no waiting',
      'Image Studio create & edit',
      'Coding Hub & Document Lab',
      'Voice AI, Translate, Memory Vault',
      'Priority access to new features',
    ],
    cta: 'Subscribe — $10/mo',
    highlighted: true,
    badge: 'Most popular',
  },
];

/** Always free forever after sign-in. */
export const FREE_WORKSPACES: WorkspaceId[] = ['general', 'translate'];

export const PREMIUM_WORKSPACES: WorkspaceId[] = [
  'coding',
  'image',
  'document',
  'student-shield',
  'voice',
  'memory',
];

export function planLabel(plan: PlanTier): string {
  if (plan === 'pro') return 'Pro Premium';
  if (plan === 'student') return 'Student Shield';
  return 'Free Plan';
}
