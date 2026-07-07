import { SG16_BRAND } from '../core/branding';
import type { HelpSection } from '../core/types';

export type LegalSection = Exclude<HelpSection, never>;

export const LEGAL_SECTIONS: { id: LegalSection; title: string; body: string[] }[] = [
  {
    id: 'overview',
    title: 'Getting Started',
    body: [
      'Type any question in the Ask Engine box on Home — SG16 AI routes you to the best workspace automatically.',
      'Use the sidebar to open any workspace directly: Coding, Image Studio, Document Lab, Translate, Voice AI, Memory Vault, Student Shield, or AI Chat.',
      'Upload images in Image Studio to create new visuals from a prompt or edit photos.',
      'Memory Vault saves notes on your device and SG16 AI uses them when you ask recall questions.',
      'Voice AI uses your browser microphone for speech input and reads replies aloud.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: [
      `${SG16_BRAND.name} is operated by ${SG16_BRAND.company}. Official website: ${SG16_BRAND.publicUrl}.`,
      'Sign-in uses Google OAuth only. We never ask for your Google password on this site.',
      'We store your Google account identifier and signup date to provide access. Chat history and Memory Vault entries stay in your browser on this device unless you clear them in Settings.',
      'When you send a message, your text and any uploads are processed by SG16 AI to generate a response.',
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
      'For premium plans, enterprise deployment, or platform questions, email us with your requirements.',
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
