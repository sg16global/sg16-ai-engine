/** Unified SG16 brand — never expose third-party AI providers to users. */
export const SG16_BRAND = {
  name: 'SG16 AI Engine',
  shortName: 'SG16 AI',
  chatName: 'SG16 Chatting',
  company: 'SaifTech Global Limited',
  contactEmail: 'contact@sg16engine.com',
  publicUrl: 'https://sg16engine.com',
  logo: '/hero.webp',
  logoFallback: '/hero-globe.webp',
  logoAlt: 'SG16 AI Engine',
} as const;
export const SG16_IDENTITY_RULES = `You are part of ${SG16_BRAND.name} by ${SG16_BRAND.company}.
Never mention Groq, Grok, xAI, OpenAI, Llama, Mixtral, or any third-party AI provider.
Always present yourself exclusively as ${SG16_BRAND.shortName}.`;
