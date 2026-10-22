import { create } from 'zustand';
import { buildReminders, type PilotReminder } from './pilotReminders';
import type { WorkspaceId } from './types';
import { useAppStore } from './appState';

interface PilotState {
  open: boolean;
  /** Reminders due now or today — computed from the user's saved data, never a fixed number. */
  badgeCount: number;
  reminders: PilotReminder[];
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  refreshReminders: () => void;
  runReminder: (r: PilotReminder) => void;
  /** Quick actions and the Ask box send straight to the shield's AI chat. */
  ask: (workspaceId: WorkspaceId, prompt: string) => void;
}

export const usePilotStore = create<PilotState>((set, get) => ({
  open: false,
  badgeCount: 0,
  reminders: [],

  setOpen: (open) => {
    set({ open });
    if (open) get().refreshReminders();
  },
  toggleOpen: () => get().setOpen(!get().open),

  refreshReminders: () => {
    const reminders = buildReminders(useAppStore.getState().chatThreads);
    set({ reminders, badgeCount: reminders.filter((r) => r.urgent).length });
  },

  runReminder: (r) => {
    const app = useAppStore.getState();
    set({ open: false });
    if (r.threadId) app.openThread(r.threadId);
    else app.requireAuth(() => app.setWorkspace(r.workspaceId));
  },

  ask: (workspaceId, prompt) => {
    set({ open: false });
    useAppStore.getState().openShieldChat(workspaceId, prompt);
  },
}));
