import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Code2,
  Image,
  FileText,
  GraduationCap,
  MessageSquare,
  Mic,
  Languages,
  Brain,
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

export const mainNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, mobileBottom: true },
  { id: 'coding', label: 'Coding Hub', icon: Code2, premium: true },
  { id: 'image', label: 'Image Studio', icon: Image, premium: true },
  { id: 'document', label: 'Document Lab', icon: FileText, premium: true },
  { id: 'student-shield', label: 'Student Shield', icon: GraduationCap, premium: true },
  { id: 'general', label: 'SG16 Chatting', icon: MessageSquare, mobileBottom: true },
  { id: 'voice', label: 'Voice AI', icon: Mic, premium: true },
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'memory', label: 'Memory Vault', icon: Brain, premium: true },
];

export const utilityNavItems: NavItem[] = [
  { id: 'history', label: 'History', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings, mobileBottom: true },
  { id: 'help', label: 'Help Center', icon: HelpCircle },
];

export const mobileBottomNavItems = [
  { id: 'home' as WorkspaceType, label: 'Home', icon: Home },
  { id: 'history' as WorkspaceType, label: 'History', icon: Clock },
  { id: 'general' as WorkspaceType, label: 'Chat', icon: MessageSquare },
  { id: 'settings' as WorkspaceType, label: 'Settings', icon: Settings },
  { id: 'pricing' as WorkspaceType, label: 'Premium', icon: Crown },
];
