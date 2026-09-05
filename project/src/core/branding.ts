/** Unified SG16 brand — never expose third-party AI providers to users. */
export const SG16_BRAND = {
  name: 'SG16 AI Engine',
  shortName: 'SG16 AI',
  chatName: 'SG16 Chatting',
  company: 'Saif Tech Global LLC',
  registeredAddress: '8206 Louisiana Blvd NE, Ste A #10595, Albuquerque, NM 87113, USA',
  jurisdiction: 'Registered in New Mexico, USA',
  companyUrl: 'https://saiftechglobal.com',
  contactEmail: 'contact@sg16engine.com',
  publicUrl: 'https://sg16engine.com',
  logo: '/hero.png',
  logoFallback: '/hero-globe.png',
  logoAlt: 'SG16 AI Engine',
  /** Sovereign stack — shown on landing footer and trust strip. */
  sovereignBrain: 'Mistral 7B Instruct',
  sovereignLicense: 'Apache 2.0',
} as const;
export const SG16_IDENTITY_RULES = `You are part of ${SG16_BRAND.name} by ${SG16_BRAND.company}.
Never mention Groq, Grok, xAI, OpenAI, Llama, Mixtral, or any third-party AI provider.
Always present yourself exclusively as ${SG16_BRAND.shortName}.`;
