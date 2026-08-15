import type { WorkspaceId } from './types';

/** Module skins — geo black base; soft accent only for identity. */
export type SectionSkin = 'chat' | 'student' | 'coding' | 'health' | 'shell';

export const WORKSPACE_SKIN: Partial<Record<WorkspaceId, SectionSkin>> = {
  general: 'chat',
  'student-shield': 'student',
  coding: 'coding',
  developer: 'coding',
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
    accent: 'text-[#FF8A8A]',
    ring: 'border-[#FF2E2E]/30',
    soft: 'bg-[#FF2E2E]/10',
    bar: 'bg-[#FF2E2E]',
    iconBg: 'bg-[#FF2E2E]/15 text-[#FF8A8A]',
    btn: 'bg-[#FF2E2E] hover:bg-[#FF5C5C] text-white',
  },
  coding: {
    label: 'Coding',
    accent: 'text-[#FF8A8A]',
    ring: 'border-[#FF2E2E]/30',
    soft: 'bg-[#FF2E2E]/10',
    bar: 'bg-[#FF2E2E]',
    iconBg: 'bg-[#FF2E2E]/15 text-[#FF8A8A]',
    btn: 'bg-[#FF2E2E] hover:bg-[#FF5C5C] text-white',
  },
  health: {
    label: 'Health',
    accent: 'text-[#FF8A8A]',
    ring: 'border-[#FF2E2E]/30',
    soft: 'bg-[#FF2E2E]/10',
    bar: 'bg-[#FF2E2E]',
    iconBg: 'bg-[#FF2E2E]/15 text-[#FF8A8A]',
    btn: 'bg-[#FF2E2E] hover:bg-[#FF5C5C] text-white',
  },
};
