import { useMemo } from 'react';
import {
  ArrowLeft,
  Bot,
  Braces,
  Calendar,
  ChartNoAxesCombined,
  Clock,
  Crown,
  GraduationCap,
  HeartPulse,
  LogOut,
  MessageSquare,
  Shield,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { isAuthenticated, verificationStatusLabel } from '../../core/access';
import { planLabel } from '../../core/plans';
import { SG16_BRAND } from '../../core/branding';
import type { Message, WorkspaceId } from '../../core/types';

interface UserRoomActivity {
  workspaceId: string;
  messageCount: number;
  lastMessage: string;
  lastActivityAt: number;
}

/** Activity per workspace, from the chat history saved on this device. */
function localActivity(messages: Record<string, Message[]>): UserRoomActivity[] {
  return Object.entries(messages)
    .filter(([, list]) => list.length > 0)
    .map(([workspaceId, list]) => {
      const last = list[list.length - 1];
      return { workspaceId, messageCount: list.length, lastMessage: last.content.slice(0, 140), lastActivityAt: last.timestamp };
    })
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
}

const workspaceLabels: Record<string, string> = {
  general: SG16_BRAND.chatName,
  coding: 'Coding Hub',
  health: 'Health Shield',
  'student-shield': 'Student Shield',
  market: 'Market Shield',
  image: 'Image Studio',
  document: 'Document Lab',
  translate: 'Translate',
  voice: 'Voice AI',
  memory: 'Memory Vault',
};

const workspaceIcons: Record<string, typeof Bot> = {
  general: Bot,
  coding: Braces,
  health: HeartPulse,
  'student-shield': GraduationCap,
  market: ChartNoAxesCombined,
};

function formatMemberSince(ts: number) {
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(new Date(ts));
}

function formatWhen(ts: number) {
  if (!ts) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}

function ActivityRow({ item, onOpen }: { item: UserRoomActivity; onOpen: () => void }) {
  const Icon = workspaceIcons[item.workspaceId] ?? MessageSquare;
  const label = workspaceLabels[item.workspaceId] ?? item.workspaceId;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-xl border border-white/10 bg-[#0A0A12]/60 p-4 hover:border-[#FF168D]/30 transition"
    >
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-lg bg-[#FF168D]/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#FF5CB8]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm">{label}</h3>
            <span className="text-[11px] text-gray-500 shrink-0">{item.messageCount} msgs</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.lastMessage || 'No preview'}</p>
          <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatWhen(item.lastActivityAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function UserRoomPanel() {
  const authUser = useAppStore((s) => s.authUser);
  const subscription = useAppStore((s) => s.subscription);
  const launchFree = useAppStore((s) => s.launchFree);
  const launchMessage = useAppStore((s) => s.launchMessage);
  const startSession = useAppStore((s) => s.startSession);
  const goToHome = useAppStore((s) => s.goToHome);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const logout = useAppStore((s) => s.logout);
  const openPricing = useAppStore((s) => s.openPricing);

  const messages = useAppStore((s) => s.messages);
  const activity = useMemo(() => localActivity(messages), [messages]);
  const totalMessages = activity.reduce((sum, a) => sum + a.messageCount, 0);

  if (!isAuthenticated(authUser)) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto text-center space-y-4">
        <Shield className="w-12 h-12 mx-auto text-[#FF5CB8]/60" />
        <h1 className="text-2xl font-bold">Your User Room</h1>
        <p className="text-sm text-gray-400">
          Enter SG16 to open your room. No account needed — your history is saved on this device only.
        </p>
        <button
          type="button"
          onClick={() => startSession()}
          className="bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] font-semibold hover:shadow-[0_0_18px_rgba(255,22,141,0.4)] px-5 py-2.5 rounded-xl text-sm transition"
        >
          Enter SG16
        </button>
      </div>
    );
  }

  const openWorkspace = (id: string) => {
    setWorkspace(id as WorkspaceId);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goToHome}
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Shield Home
        </button>
      </div>

      <section className="rounded-2xl border border-[#FF168D]/25 bg-gradient-to-br from-[#191321] to-[#07070D] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {authUser.picture ? (
            <img
              src={authUser.picture}
              alt=""
              className="w-16 h-16 rounded-2xl border border-white/10 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#FF168D]/15 flex items-center justify-center">
              <UserRound className="w-8 h-8 text-[#FF5CB8]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-[#FF5CB8]/80">Your User Room</p>
            <h1 className="text-2xl font-bold truncate">{authUser.name}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {formatMemberSince(authUser.signupDate)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                {launchFree ? 'Launch Free' : planLabel(subscription.plan)}
              </span>
            </div>
          </div>
        </div>

        {launchFree && (
          <div className="mt-4 rounded-xl border border-[#FF168D]/20 bg-black/30 p-3 text-xs text-gray-400 flex gap-2">
            <Sparkles className="w-4 h-4 text-[#FF5CB8] shrink-0 mt-0.5" />
            <span>{launchMessage}</span>
          </div>
        )}

        {!launchFree && subscription.plan === 'student' && (
          <p className="mt-3 text-xs text-gray-500">
            Student verification: {verificationStatusLabel(subscription.studentVerification.status)}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your history</h2>
          <span className="text-xs text-gray-500">{totalMessages} messages on this device</span>
        </div>
        <p className="text-xs text-gray-500">
          Saved on this device only — SG16 never stores your chats on its servers.
        </p>

        {activity.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 font-medium">No history yet</p>
            <p className="text-xs text-gray-600 mt-2 max-w-sm mx-auto">
              Pick any Shield from Home and start chatting. Your messages will appear here and stay on this device.
            </p>
            <button
              type="button"
              onClick={goToHome}
              className="mt-4 text-xs bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] font-semibold hover:shadow-[0_0_18px_rgba(255,22,141,0.4)] px-4 py-2 rounded-lg transition"
            >
              Go to Shield Home
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((item) => (
              <ActivityRow
                key={item.workspaceId}
                item={item}
                onOpen={() => openWorkspace(item.workspaceId)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => setWorkspace('history')}
          className="text-xs border border-white/10 hover:border-[#FF168D]/30 px-3 py-2 rounded-lg text-gray-300"
        >
          Session history
        </button>
        <button
          type="button"
          onClick={() => setWorkspace('settings')}
          className="text-xs border border-white/10 hover:border-[#FF168D]/30 px-3 py-2 rounded-lg text-gray-300"
        >
          Settings
        </button>
        {!launchFree && (
          <button
            type="button"
            onClick={openPricing}
            className="text-xs border border-white/10 hover:border-[#FF168D]/30 px-3 py-2 rounded-lg text-gray-300"
          >
            Subscription
          </button>
        )}
        <button
          type="button"
          onClick={logout}
          className="text-xs border border-white/10 hover:border-[#FF526B]/40 px-3 py-2 rounded-lg text-gray-400 hover:text-[#FF526B] inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Exit
        </button>
      </section>
    </div>
  );
}
