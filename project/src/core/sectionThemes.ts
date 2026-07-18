import type { WorkspaceId } from './types';

/** After-login section skins — deep purple family, each room feels different. */
export type SectionSkin = 'chat' | 'student' | 'coding' | 'health' | 'shell';

export const WORKSPACE_SKIN: Partial<Record<WorkspaceId, SectionSkin>> = {
  general: 'chat',
  'student-shield': 'student',
  coding: 'coding',
  health: 'health',
};

export function skinForWorkspace(workspace: string): SectionSkin {
  return WORKSPACE_SKIN[workspace as WorkspaceId] ?? 'shell';
}

export const SKIN_META: Record<
  SectionSkin,
  { label: string; accent: string; ring: string; soft: string }
> = {
  shell: {
    label: 'SG16',
    accent: 'text-violet-300',
    ring: 'border-violet-500/35',
    soft: 'bg-violet-500/10',
  },
  chat: {
    label: 'Chat',
    accent: 'text-fuchsia-300',
    ring: 'border-fuchsia-500/35',
    soft: 'bg-fuchsia-500/10',
  },
  student: {
    label: 'Student',
    accent: 'text-amber-300',
    ring: 'border-amber-500/35',
    soft: 'bg-amber-500/10',
  },
  coding: {
    label: 'Coding',
    accent: 'text-sky-300',
    ring: 'border-sky-500/35',
    soft: 'bg-sky-500/10',
  },
  health: {
    label: 'Health',
    accent: 'text-teal-300',
    ring: 'border-teal-500/35',
    soft: 'bg-teal-500/10',
  },
};
