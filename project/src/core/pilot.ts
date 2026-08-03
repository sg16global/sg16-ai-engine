import type { WorkspaceId, WorkspaceType } from './types';

/** Brand accent for shields / home identity — matches Shield Home pure red. */
export const SG16_SHIELD_RED = '#ff173d';

export type PilotId =
  | 'study'
  | 'code'
  | 'health'
  | 'assistant'
  | 'market';

export type PilotStepStatus = 'done' | 'active' | 'pending';

export interface PilotStep {
  id: string;
  label: string;
  status: PilotStepStatus;
}

export type PilotJobStatus = 'idle' | 'running' | 'paused' | 'done' | 'stopped';

export interface PilotJob {
  id: string;
  pilotId: PilotId;
  workspaceId: WorkspaceId;
  title: string;
  status: PilotJobStatus;
  steps: PilotStep[];
  startedAt?: number;
  estimatedMinutes?: number;
  resultPrompt?: string;
}

export interface PilotSuggestion {
  id: string;
  text: string;
  kind: 'info' | 'action';
  /** If action — open this workspace and optionally seed a prompt */
  workspaceId?: WorkspaceId;
  prompt?: string;
}

export interface PilotModuleConfig {
  pilotId: PilotId;
  workspaceId: WorkspaceId;
  name: string;
  shortName: string;
  tagline: string;
  /** In-app actions only (no fake open VS Code / book hospital). */
  quickActions: { label: string; prompt: string }[];
  enterHint: string;
  defaultSteps: string[];
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
    defaultSteps: ['Understand goal', 'Research', 'Draft output', 'Quality check', 'Ready'],
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
    defaultSteps: ['Read request', 'Analyze', 'Build / fix', 'Verify', 'Deliver'],
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
    defaultSteps: ['Collect info', 'Organize', 'Explain clearly', 'Safety notes', 'Ready'],
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
    defaultSteps: ['Understand', 'Gather', 'Draft', 'Polish', 'Done'],
  },
  {
    pilotId: 'market',
    workspaceId: 'market',
    name: 'Market Pilot',
    shortName: 'Market Shield',
    tagline: 'Market Intelligence',
    enterHint: "I can monitor and summarize markets. I never buy or sell for you.",
    quickActions: [
      { label: "Today's market", prompt: 'Summarize today’s global market mood in plain language (not financial advice).' },
      { label: 'Crypto summary', prompt: 'Give a clear crypto market summary for beginners (not financial advice).' },
      { label: 'Latest AI news', prompt: 'Summarize the latest major AI industry news.' },
      { label: 'Watchlist monitor', prompt: 'Help me set a watchlist monitor plan for these symbols (notify only, no trading):' },
    ],
    defaultSteps: ['Set watch rules', 'Scan prices / news', 'Filter signals', 'Draft summary', 'Notify'],
  },
];

export function pilotForWorkspace(workspace: string): PilotModuleConfig | undefined {
  return PILOT_MODULES.find((m) => m.workspaceId === workspace);
}

export function isShieldWorkspace(ws: WorkspaceType): boolean {
  return PILOT_MODULES.some((m) => m.workspaceId === ws);
}

/** Smart suggestions — local / contextual (V1). */
export function buildSmartSuggestions(workspace: WorkspaceType): PilotSuggestion[] {
  const base: PilotSuggestion[] = [
    {
      id: 'cont-code',
      text: 'Continue your last coding project?',
      kind: 'action',
      workspaceId: 'coding',
      prompt: 'Continue helping with my last coding project.',
    },
    {
      id: 'health-check',
      text: 'Health checkup reminder — want a prep checklist?',
      kind: 'action',
      workspaceId: 'health',
      prompt: 'Create a simple health checkup preparation checklist.',
    },
    {
      id: 'study-pending',
      text: 'You may have pending study tasks — want a plan?',
      kind: 'action',
      workspaceId: 'student-shield',
      prompt: 'Help me clear pending assignments with a short plan.',
    },
  ];

  const mod = pilotForWorkspace(workspace);
  if (!mod) return base.slice(0, 3);

  return [
    {
      id: `enter-${mod.pilotId}`,
      text: mod.enterHint,
      kind: 'info',
    },
    ...mod.quickActions.slice(0, 2).map((a, i) => ({
      id: `${mod.pilotId}-qa-${i}`,
      text: a.label,
      kind: 'action' as const,
      workspaceId: mod.workspaceId,
      prompt: a.prompt,
    })),
  ];
}

export function createPilotJob(
  config: PilotModuleConfig,
  title: string,
): PilotJob {
  return {
    id: `pilot-${Date.now()}`,
    pilotId: config.pilotId,
    workspaceId: config.workspaceId,
    title,
    status: 'running',
    startedAt: Date.now(),
    estimatedMinutes: 12,
    steps: config.defaultSteps.map((label, i) => ({
      id: `s-${i}`,
      label,
      status: i === 0 ? 'active' : 'pending',
    })),
    resultPrompt: title,
  };
}
