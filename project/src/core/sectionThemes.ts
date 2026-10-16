import type { WorkspaceId } from './types';

/** Module skins — geo black base; soft accent only for identity. */
export type SectionSkin = 'chat' | 'student' | 'coding' | 'health' | 'shell';

export const WORKSPACE_SKIN: Partial<Record<WorkspaceId, SectionSkin>> = {
  general: 'chat',
  'student-shield': 'student',
  coding: 'coding',
  health: 'health',
  market: 'shell',
};

export function skinForWorkspace(workspace: string): SectionSkin {
  return WORKSPACE_SKIN[workspace as WorkspaceId] ?? 'shell';
}

/** Global Neon Pink brand accents for workspaces and chrome */
export const SKIN_META: Record<
  SectionSkin,
  {
    label: string;
    accent: string;
    ring: string;
    soft: string;
    bar: string;
    iconBg: string;
    btn: string;
  }
> = {
  shell: {
    label: 'SG16',
    accent: 'text-[#FF168D]',
    ring: 'border-[#FF168D]/40 shadow-[0_0_18px_rgba(255,22,141,0.22)]',
    soft: 'bg-[#FF168D]/12',
    bar: 'bg-[#FF168D]',
    iconBg: 'bg-[#FF168D]/18 text-[#FF3DA5]',
    btn: 'bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] font-semibold shadow-[0_0_18px_rgba(255,22,141,0.38)]',
  },
  chat: {
    label: 'Chat',
    accent: 'text-[#FF168D]',
    ring: 'border-[#FF168D]/40 shadow-[0_0_18px_rgba(255,22,141,0.22)]',
    soft: 'bg-[#FF168D]/12',
    bar: 'bg-[#FF168D]',
    iconBg: 'bg-[#FF168D]/18 text-[#FF3DA5]',
    btn: 'bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] font-semibold shadow-[0_0_18px_rgba(255,22,141,0.38)]',
  },
  student: {
    label: 'Student',
    accent: 'text-[#FF168D]',
    ring: 'border-[#FF168D]/40 shadow-[0_0_18px_rgba(255,22,141,0.22)]',
    soft: 'bg-[#FF168D]/12',
    bar: 'bg-[#FF168D]',
    iconBg: 'bg-[#FF168D]/18 text-[#FF3DA5]',
    btn: 'bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] font-semibold shadow-[0_0_18px_rgba(255,22,141,0.38)]',
  },
  coding: {
    label: 'Coding',
    accent: 'text-[#FF168D]',
    ring: 'border-[#FF168D]/40 shadow-[0_0_18px_rgba(255,22,141,0.22)]',
    soft: 'bg-[#FF168D]/12',
    bar: 'bg-[#FF168D]',
    iconBg: 'bg-[#FF168D]/18 text-[#FF3DA5]',
    btn: 'bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] font-semibold shadow-[0_0_18px_rgba(255,22,141,0.38)]',
  },
  health: {
    label: 'Health',
    accent: 'text-[#FF168D]',
    ring: 'border-[#FF168D]/40 shadow-[0_0_18px_rgba(255,22,141,0.22)]',
    soft: 'bg-[#FF168D]/12',
    bar: 'bg-[#FF168D]',
    iconBg: 'bg-[#FF168D]/18 text-[#FF3DA5]',
    btn: 'bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] font-semibold shadow-[0_0_18px_rgba(255,22,141,0.38)]',
  },
};
