import type { WorkspaceId, WorkspaceType } from './types';

/** Brand accent (neon pink) — mirrors --sg16-primary for inline styles. */
export const SG16_ACCENT = '#FF168D';

export type PilotId =
  | 'study'
  | 'code'
  | 'health'
  | 'assistant'
  | 'market';

export interface PilotModuleConfig {
  pilotId: PilotId;
  workspaceId: WorkspaceId;
  name: string;
  shortName: string;
  tagline: string;
  /** In-app actions only (no fake open VS Code / book hospital). */
  quickActions: { label: string; prompt: string }[];
  enterHint: string;
}

/** Forever V1 modules — no sixth on main engine. */
export const PILOT_MODULES: PilotModuleConfig[] = [
  {
    pilotId: 'study',
    workspaceId: 'student-shield',
    name: 'Study Pilot',
    shortName: 'Student Shield',
    tagline: 'Student Protection System',
    enterHint: 'I can help with homework, study plans, notes, or quiz prep.',
    quickActions: [
      { label: 'Check homework help', prompt: 'Help me check and complete my homework step by step.' },
      { label: 'Today study plan', prompt: 'Create a clear study timetable for today.' },
      { label: 'Explain a topic', prompt: 'Explain this topic simply for a student:' },
      { label: 'Make a quiz', prompt: 'Generate a short practice quiz with answers.' },
    ],
  },
  {
    pilotId: 'code',
    workspaceId: 'coding',
    name: 'Code Pilot',
    shortName: 'Coding Hub',
    tagline: 'Programming Workspace',
    enterHint: 'Would you like me to generate code, review a project, or debug an error?',
    quickActions: [
      { label: 'Generate Python code', prompt: 'Generate clean Python code for this task:' },
      { label: 'Debug this error', prompt: 'Debug this error and explain the fix:' },
      { label: 'Review my project', prompt: 'Review this project for bugs, structure, and security.' },
      { label: 'Write documentation', prompt: 'Write clear documentation for this code:' },
    ],
  },
  {
    pilotId: 'health',
    workspaceId: 'health',
    name: 'Health Pilot',
    shortName: 'Health Shield',
    tagline: 'Healthcare Assistant',
    enterHint: 'I can explain reports, wellness habits, or prep questions for a clinician.',
    quickActions: [
      { label: 'Explain a report', prompt: 'Explain this health report summary in simple words (not a diagnosis):' },
      { label: 'Wellness plan', prompt: 'Create a simple wellness plan for sleep, water, and movement.' },
      { label: 'Appointment prep', prompt: 'Help me prepare questions for a doctor appointment.' },
      { label: 'Reminder ideas', prompt: 'Suggest healthy daily reminders I can follow.' },
    ],
  },
  {
    pilotId: 'assistant',
    workspaceId: 'general',
    name: 'Assistant Pilot',
    shortName: 'AI Chat',
    tagline: 'Powered by SG16 AI',
    enterHint: 'Ask anything — news, writing, research, or daily questions.',
    quickActions: [
      { label: 'Draft a reply', prompt: 'Draft a clear professional reply for this message:' },
      { label: 'Summarize text', prompt: 'Summarize this clearly in bullet points:' },
      { label: 'Research topic', prompt: 'Research and explain this topic simply:' },
      { label: 'Daily briefing', prompt: 'Give me a short useful daily briefing.' },
    ],
  },
  {
    pilotId: 'market',
    workspaceId: 'market',
    name: 'Market Pilot',
    shortName: 'Market Shield',
    tagline: 'Market Intelligence',
    enterHint: 'Live prices, price alerts and headlines are on the Market page. Ask me to explain anything. I never buy or sell for you.',
    quickActions: [
      { label: "Today's market", prompt: 'Summarize today’s global market mood in plain language (not financial advice).' },
      { label: 'Crypto summary', prompt: 'Give a clear crypto market summary for beginners (not financial advice).' },
      { label: 'Latest AI news', prompt: 'Summarize the latest major AI industry news.' },
      { label: 'Explain a term', prompt: 'Explain this market term simply for a beginner:' },
    ],
  },
];

export function pilotForWorkspace(workspace: string): PilotModuleConfig | undefined {
  return PILOT_MODULES.find((m) => m.workspaceId === workspace);
}

export function isShieldWorkspace(ws: WorkspaceType): boolean {
  return PILOT_MODULES.some((m) => m.workspaceId === ws);
}
