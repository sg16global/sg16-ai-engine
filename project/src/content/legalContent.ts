import { SG16_BRAND } from '../core/branding';
import type { HelpSection } from '../core/types';

export type LegalSection = Exclude<HelpSection, never>;

export const LEGAL_SECTIONS: { id: LegalSection; title: string; body: string[] }[] = [
  {
    id: 'overview',
    title: 'Getting Started',
    body: [
      'Open Shield Home and choose one of five shields: AI Chat, Coding Hub, Health, Student, or Market.',
      'Each shield is a separate workspace — coding, health, and student conversations are not mixed together.',
      'AI Chat Shield is free after Google sign-in. Other shields require All Access when billing is active.',
      'Sign in with Google only — we never ask for your password on this site.',
      'Use History and Settings from the sidebar inside any shield. Help Center covers privacy, terms, and contact.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: [
      `${SG16_BRAND.name} is operated by ${SG16_BRAND.company}. Official website: ${SG16_BRAND.publicUrl}.`,
      'Sign-in uses Google OAuth only. We never ask for your Google password on this site.',
      'SG16 Secure Processing Room: when you send a message, it goes to sg16engine.com first. SG16 processes your request, applies safety checks, and delivers the answer back to you. You never connect to outside AI apps directly from your browser.',
      'We store your Google account identifier, signup date, subscription status, and coding fair-use counters on our servers to run your account. Chat history stays in your browser on this device unless you clear it in Settings.',
      'We do not store your chat message content in our database. Messages are processed in real time to generate a response, then discarded from our servers.',
      'We do not sell your personal data. You can delete local data anytime from Settings.',
      `Privacy questions: ${SG16_BRAND.contactEmail}`,
    ],
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    body: [
      `By using ${SG16_BRAND.name} you agree to use the platform responsibly and lawfully.`,
      `${SG16_BRAND.name} is a legitimate AI productivity platform by ${SG16_BRAND.company}. It is not a hacking tool and must not be used for illegal activity.`,
      'Do not use SG16 AI to generate harmful, illegal, or abusive content.',
      'Student Shield is designed for educational use — non-educational topics may be redirected to AI Chat.',
      'Health Shield provides general wellness guidance — it is not a doctor and does not diagnose or prescribe.',
      'AI responses may contain errors. Verify important information before acting on it.',
      `${SG16_BRAND.company} may update these terms as the platform evolves. Contact: ${SG16_BRAND.contactEmail}`,
    ],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: [
      `Company: ${SG16_BRAND.company}`,
      `Product: ${SG16_BRAND.name}`,
      `Website: ${SG16_BRAND.publicUrl}`,
      `Email: ${SG16_BRAND.contactEmail}`,
      'For All Access subscription, billing, or platform questions, email us with your account email.',
      'We typically respond within 1–2 business days.',
    ],
  },
];

export function legalSectionByPath(pathname: string): LegalSection | null {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/privacy') return 'privacy';
  if (normalized === '/terms') return 'terms';
  if (normalized === '/contact') return 'contact';
  if (normalized === '/help') return 'overview';
  return null;
}

export function isPublicLegalPath(pathname: string): boolean {
  return legalSectionByPath(pathname) != null;
}
