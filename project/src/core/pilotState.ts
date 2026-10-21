import { create } from 'zustand';
import {
  buildSmartSuggestions,
  createPilotJob,
  pilotForWorkspace,
  type PilotJob,
  type PilotSuggestion,
} from './pilot';
import type { WorkspaceType } from './types';
import { useAppStore } from './appState';

interface PilotState {
  open: boolean;
  badgeCount: number;
  job: PilotJob | null;
  suggestions: PilotSuggestion[];
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  refreshSuggestions: (workspace: WorkspaceType) => void;
  startPilot: (title: string, workspace?: WorkspaceType) => void;
  pausePilot: () => void;
  resumePilot: () => void;
  stopPilot: () => void;
  tickPilot: () => void;
  clearBadge: () => void;
  dismissSuggestion: (id: string) => void;
  runSuggestion: (s: PilotSuggestion) => void;
}

let tickTimer: ReturnType<typeof setInterval> | null = null;

function clearTick() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

function startTick(tick: () => void) {
  clearTick();
  tickTimer = setInterval(tick, 4000);
}

export const usePilotStore = create<PilotState>((set, get) => ({
  open: false,
  badgeCount: 3,
  job: null,
  suggestions: buildSmartSuggestions('home'),

  setOpen: (open) => set({ open, badgeCount: open ? 0 : get().badgeCount }),
  toggleOpen: () => {
    const next = !get().open;
    set({ open: next, badgeCount: next ? 0 : get().badgeCount });
  },
  clearBadge: () => set({ badgeCount: 0 }),

  refreshSuggestions: (workspace) => {
    set({ suggestions: buildSmartSuggestions(workspace) });
  },

  dismissSuggestion: (id) => {
    set({ suggestions: get().suggestions.filter((s) => s.id !== id) });
  },

  runSuggestion: (s) => {
    get().dismissSuggestion(s.id);
    if (s.kind === 'action' && s.workspaceId) {
      useAppStore.getState().navigateToWorkspace(s.workspaceId, s.prompt);
      set({ open: false });
    }
  },

  startPilot: (title, workspace) => {
    const ws = workspace ?? useAppStore.getState().currentWorkspace;
    const config = pilotForWorkspace(ws === 'home' ? 'general' : ws);
    if (!config) return;
    const job = createPilotJob(config, title.trim() || `${config.name} task`);
    set({ job, open: true, badgeCount: 0 });
    useAppStore.getState().setWorkspace(config.workspaceId);
    startTick(() => get().tickPilot());
  },

  pausePilot: () => {
    const job = get().job;
    if (!job || job.status !== 'running') return;
    clearTick();
    set({ job: { ...job, status: 'paused' } });
  },

  resumePilot: () => {
    const job = get().job;
    if (!job || job.status !== 'paused') return;
    set({ job: { ...job, status: 'running' } });
    startTick(() => get().tickPilot());
  },

  stopPilot: () => {
    clearTick();
    const job = get().job;
    if (!job) return;
    set({ job: { ...job, status: 'stopped' } });
  },

  tickPilot: () => {
    const job = get().job;
    if (!job || job.status !== 'running') return;

    const steps = job.steps.map((s) => ({ ...s }));
    const activeIdx = steps.findIndex((s) => s.status === 'active');
    if (activeIdx === -1) {
      clearTick();
      set({ job: { ...job, status: 'done' }, badgeCount: get().badgeCount + 1 });
      return;
    }

    steps[activeIdx] = { ...steps[activeIdx], status: 'done' };
    if (activeIdx + 1 < steps.length) {
      steps[activeIdx + 1] = { ...steps[activeIdx + 1], status: 'active' };
      set({ job: { ...job, steps } });
      return;
    }

    clearTick();
    const doneJob = { ...job, steps, status: 'done' as const };
    set({ job: doneJob, badgeCount: get().badgeCount + 1 });

    // Hand finished work into the module chat
    if (doneJob.resultPrompt) {
      useAppStore.setState({
        pendingPrompt: [
          `[AI Pilot complete — ${doneJob.title}]`,
          '',
          'Continue from the finished pilot plan. Summarize what was done and deliver the useful result for the user.',
          '',
          `Original task: ${doneJob.resultPrompt}`,
        ].join('\n'),
        pendingPromptToken: Date.now(),
        currentWorkspace: doneJob.workspaceId,
      });
    }
  },
}));
