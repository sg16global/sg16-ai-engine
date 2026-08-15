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
    accent: 'text-[#00ff8b]',
    ring: 'border-[#00ff8b]/30',
    soft: 'bg-[#00ff8b]/10',
    bar: 'bg-[#00ff8b]',
    iconBg: 'bg-[#00ff8b]/15 text-[#00ff8b]',
    btn: 'bg-[#8b5cf6] hover:bg-[#9d75ff] text-white',
  },
  chat: {
    label: 'Chat',
    accent: 'text-[#22d3ee]',
    ring: 'border-[#22d3ee]/30',
    soft: 'bg-[#22d3ee]/10',
    bar: 'bg-[#22d3ee]',
    iconBg: 'bg-[#22d3ee]/15 text-[#22d3ee]',
    btn: 'bg-[#8b5cf6] hover:bg-[#9d75ff] text-white',
  },
  student: {
    label: 'Student',
    accent: 'text-[#facc15]',
    ring: 'border-[#facc15]/30',
    soft: 'bg-[#facc15]/10',
    bar: 'bg-[#facc15]',
    iconBg: 'bg-[#facc15]/15 text-[#facc15]',
    btn: 'bg-[#8b5cf6] hover:bg-[#9d75ff] text-white',
  },
  coding: {
    label: 'Coding',
    accent: 'text-[#3b9eff]',
    ring: 'border-[#3b9eff]/30',
    soft: 'bg-[#3b9eff]/10',
    bar: 'bg-[#3b9eff]',
    iconBg: 'bg-[#3b9eff]/15 text-[#3b9eff]',
    btn: 'bg-[#8b5cf6] hover:bg-[#9d75ff] text-white',
  },
  health: {
    label: 'Health',
    accent: 'text-[#00ff8b]',
    ring: 'border-[#00ff8b]/30',
    soft: 'bg-[#00ff8b]/10',
    bar: 'bg-[#00ff8b]',
    iconBg: 'bg-[#00ff8b]/15 text-[#00ff8b]',
    btn: 'bg-[#8b5cf6] hover:bg-[#9d75ff] text-white',
  },
};
