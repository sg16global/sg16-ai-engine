import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Code2,
  GraduationCap,
  MessageSquare,
  HeartPulse,
  Clock,
  Settings,
  HelpCircle,
  Crown,
} from 'lucide-react';
import type { WorkspaceType } from '../core/types';

export interface NavItem {
  id: WorkspaceType;
  label: string;
  icon: LucideIcon;
  premium?: boolean;
  mobileBottom?: boolean;
}

/** Only 4 worldwide services + Home */
export const mainNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, mobileBottom: true },
  { id: 'general', label: 'Chat', icon: MessageSquare, mobileBottom: true },
  { id: 'student-shield', label: 'Student Shield', icon: GraduationCap, premium: true },
  { id: 'coding', label: 'Coding', icon: Code2, premium: true },
  { id: 'health', label: 'Health', icon: HeartPulse },
];

export const utilityNavItems: NavItem[] = [
  { id: 'history', label: 'History', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings, mobileBottom: true },
  { id: 'help', label: 'Help Center', icon: HelpCircle },
];

export const mobileBottomNavItems = [
  { id: 'home' as WorkspaceType, label: 'Home', icon: Home },
  { id: 'general' as WorkspaceType, label: 'Chat', icon: MessageSquare },
  { id: 'coding' as WorkspaceType, label: 'Coding', icon: Code2 },
  { id: 'health' as WorkspaceType, label: 'Health', icon: HeartPulse },
  { id: 'pricing' as WorkspaceType, label: 'Premium', icon: Crown },
];
