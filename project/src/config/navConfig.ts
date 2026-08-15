import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Code2,
  GraduationCap,
  MessageSquare,
  HeartPulse,
  TrendingUp,
  Clock,
  Settings,
  HelpCircle,
  Crown,
  UserRound,
} from 'lucide-react';
import type { WorkspaceType } from '../core/types';

export interface NavItem {
  id: WorkspaceType;
  label: string;
  icon: LucideIcon;
  premium?: boolean;
  mobileBottom?: boolean;
}

/** Forever V1 — 5 shields + Home (sidebar only after entering a module). */
export const mainNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, mobileBottom: true },
  { id: 'student-shield', label: 'Student Shield', icon: GraduationCap, premium: true },
  { id: 'coding', label: 'Coding Hub', icon: Code2, premium: true },
  { id: 'health', label: 'Health Shield', icon: HeartPulse },
  { id: 'general', label: 'AI Chat', icon: MessageSquare, mobileBottom: true },
  { id: 'market', label: 'Market Shield', icon: TrendingUp },
];

export const utilityNavItems: NavItem[] = [
  { id: 'user-room', label: 'My Room', icon: UserRound },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings, mobileBottom: true },
  { id: 'help', label: 'Help Center', icon: HelpCircle },
];

export const mobileBottomNavItems = [
  { id: 'home' as WorkspaceType, label: 'Home', icon: Home },
  { id: 'general' as WorkspaceType, label: 'Chat', icon: MessageSquare },
  { id: 'coding' as WorkspaceType, label: 'Coding', icon: Code2 },
  { id: 'market' as WorkspaceType, label: 'Market', icon: TrendingUp },
  { id: 'pricing' as WorkspaceType, label: 'Premium', icon: Crown },
];
