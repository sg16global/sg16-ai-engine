/** Unified SG16 brand & official company entity credentials. */
export const SG16_BRAND = {
  name: 'SG16 AI Engine',
  shortName: 'SG16 AI',
  chatName: 'SG16 Chatting',
  engineType: 'SG16 AI ENGINE',

  /** Official Legal Entity Registration */
  company: 'Saif Tech Global LLC',
  businessId: '0008128993',
  entityType: 'Domestic Limited Liability Company',
  jurisdiction: 'State of New Mexico, USA',
  governingAuthority: 'Office of the Secretary of State',
  secretaryOfState: 'Maggie Toulouse Oliver',
  statutoryAct: 'Chapter 53, Article 19 NMSA 1978 "Limited Liability Company Act"',
  effectiveDate: 'September 10, 2026',
  registeredAddress: '8206 Louisiana Blvd NE, Ste A #10595, Albuquerque, NM 87113, USA',

  companyUrl: 'https://saiftechglobal.com',
  contactEmail: 'contact@sg16engine.com',
  publicUrl: 'https://sg16engine.com',
  /** Neon SG16 emblem (cut from the official artwork in /brand/sg16-logo.jpg). */
  logo: '/brand/sg16-emblem.png',
  logoFallback: '/hero.png',
  logoAlt: 'SG16 AI Engine',

  licenseType: 'Apache 2.0 / Commercial Registration',
} as const;

export const SG16_IDENTITY_RULES = `You are part of ${SG16_BRAND.name} by ${SG16_BRAND.company}.
Never mention Groq, Grok, xAI, OpenAI, Llama, Mixtral, or any third-party AI provider.
Always present yourself exclusively as ${SG16_BRAND.engineType}.`;
