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

/** Soft module accent (cards/icons). Shell chrome stays geo red. */
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
    accent: 'text-[#FF8A8A]',
    ring: 'border-[#FF2E2E]/30',
    soft: 'bg-[#FF2E2E]/10',
    bar: 'bg-[#FF2E2E]',
    iconBg: 'bg-[#FF2E2E]/15 text-[#FF8A8A]',
    btn: 'bg-[#FF2E2E] hover:bg-[#FF5C5C] text-white',
  },
  chat: {
    label: 'Chat',
    accent: 'text-[#FF8A8A]',
    ring: 'border-[#FF2E2E]/30',
    soft: 'bg-[#FF2E2E]/10',
    bar: 'bg-[#FF2E2E]',
    iconBg: 'bg-[#FF2E2E]/15 text-[#FF8A8A]',
    btn: 'bg-[#FF2E2E] hover:bg-[#FF5C5C] text-white',
  },
  student: {
    label: 'Student',
    accent: 'text-emerald-300',
    ring: 'border-emerald-500/30',
    soft: 'bg-emerald-500/10',
    bar: 'bg-emerald-500',
    iconBg: 'bg-emerald-500/15 text-emerald-300',
    btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  },
  coding: {
    label: 'Coding',
    accent: 'text-sky-300',
    ring: 'border-sky-500/30',
    soft: 'bg-sky-500/10',
    bar: 'bg-sky-500',
    iconBg: 'bg-sky-500/15 text-sky-300',
    btn: 'bg-sky-600 hover:bg-sky-500 text-white',
  },
  health: {
    label: 'Health',
    accent: 'text-teal-300',
    ring: 'border-teal-500/30',
    soft: 'bg-teal-500/10',
    bar: 'bg-teal-500',
    iconBg: 'bg-teal-500/15 text-teal-300',
    btn: 'bg-teal-600 hover:bg-teal-500 text-white',
  },
};
