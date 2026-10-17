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
      'Press Enter to start — no account, no Google sign-in, no password. Other shields require All Access when billing is active.',
      'Your chat history is saved on your own device, not on SG16 servers.',
      'Use History and Settings from the sidebar inside any shield. Help Center covers privacy, terms, and contact.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: [
      `${SG16_BRAND.name} is operated by ${SG16_BRAND.company}. Official website: ${SG16_BRAND.companyUrl}.`,
      'No accounts: SG16 does not use Google sign-in or ask for your name, email, or password. Your browser gets a random device ID that is not linked to you.',
      'SG16 Secure Processing Room: when you send a message, it goes to sg16engine.com first. SG16 processes your request, applies safety checks, and delivers the answer back to you. You never connect to outside AI apps directly from your browser.',
      'Chat history is stored only in your browser on this device; SG16 servers refuse to store it. If you use Student verification, its result (status and institution name) is kept against your random device ID. You can clear local data anytime in Settings.',
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
    id: 'license',
    title: 'License & Entity Verification',
    body: [
      `${SG16_BRAND.name} is owned, engineered, and operated by ${SG16_BRAND.company}, an official Domestic Limited Liability Company registered with the State of New Mexico Office of the Secretary of State.`,
      `Official Business ID / Filing Number: ${SG16_BRAND.businessId}. Governed by ${SG16_BRAND.statutoryAct}. Effective date: ${SG16_BRAND.effectiveDate}. Attested by Secretary of State ${SG16_BRAND.secretaryOfState}.`,
      `${SG16_BRAND.engineType} operates on dedicated, secure high-performance infrastructure. User requests and AI interactions are processed directly through SG16 AI Engine without renting or routing private prompts through public third-party wrappers.`,
      `Commercial and intellectual property rights, trademarks, and source code are © ${SG16_BRAND.company}.`,
      'Cloudflare enterprise edge protection (DNS, CDN, WAF) safeguards sg16engine.com against unauthorized access, DDoS vectors, and traffic tampering.',
      'Zero-Data Trace Policy: Chat message content is processed in real time to produce verified intelligence and is not retained or stored in database logs. User history stays under client-side control on your local device.',
      'Coding Shield leverages defense-in-depth static security analysis (Semgrep, Gitleaks, ESLint, Sonar rules, AST grammar validation, and dependency auditing) exclusively for defensive verification.',
      `Official registered office: ${SG16_BRAND.registeredAddress}. Inquiries: ${SG16_BRAND.contactEmail}`,
    ],
  },
  {
    id: 'contact',
    title: 'Contact & Corporate Information',
    body: [
      `Entity Name: ${SG16_BRAND.company}`,
      `State Business ID: ${SG16_BRAND.businessId}`,
      `Entity Classification: ${SG16_BRAND.entityType}`,
      `Jurisdiction: ${SG16_BRAND.jurisdiction}`,
      `Governing Body: ${SG16_BRAND.governingAuthority} (${SG16_BRAND.secretaryOfState})`,
      `Statute: ${SG16_BRAND.statutoryAct}`,
      `Effective Registration Date: ${SG16_BRAND.effectiveDate}`,
      `Registered Address: ${SG16_BRAND.registeredAddress}`,
      `Product Platform: ${SG16_BRAND.engineType}`,
      `Corporate Website: ${SG16_BRAND.companyUrl}`,
      `Engine Portal: ${SG16_BRAND.publicUrl}`,
      `Direct Email: ${SG16_BRAND.contactEmail}`,
      'For subscription, billing, or corporate inquiries, email us with your account details.',
      'We typically respond within 1–2 business days.',
    ],
  },
];

export function legalSectionByPath(pathname: string): LegalSection | null {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/privacy') return 'privacy';
  if (normalized === '/terms') return 'terms';
  if (normalized === '/contact') return 'contact';
  if (normalized === '/license') return 'license';
  if (normalized === '/help') return 'overview';
  return null;
}

export function isPublicLegalPath(pathname: string): boolean {
  return legalSectionByPath(pathname) != null;
}
