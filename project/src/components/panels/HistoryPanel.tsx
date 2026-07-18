import { MessageSquare, Shield } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { SG16_BRAND } from '../../core/branding';
import type { WorkspaceId } from '../../core/types';

const workspaceLabels: Record<WorkspaceId, string> = {
  general: SG16_BRAND.chatName,
  coding: 'Coding Hub',
  health: 'Health Guide',
  'student-shield': 'Student Shield',
  image: 'Image Studio',
  document: 'Document Lab',
  translate: 'Translate',
  voice: 'Voice AI',
  memory: 'Memory Vault',
};

export function HistoryPanel() {
  const messages = useAppStore((s) => s.messages);
  const setWorkspace = useAppStore((s) => s.setWorkspace);

  const entries = (Object.keys(messages) as WorkspaceId[])
    .map((id) => ({
      id,
      label: workspaceLabels[id],
      msgs: messages[id],
    }))
    .filter((e) => e.msgs.length > 0)
    .sort((a, b) => {
      const aLast = a.msgs[a.msgs.length - 1]?.timestamp ?? 0;
      const bLast = b.msgs[b.msgs.length - 1]?.timestamp ?? 0;
      return bLast - aLast;
    });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">This session</h1>
        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Each workspace has its own chat. Saved on this device only — not on SG16 servers.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-10 text-center text-gray-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No messages in this session yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(({ id, label, msgs }) => {
            const last = msgs[msgs.length - 1];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setWorkspace(id)}
                className="w-full text-left bg-zinc-900/80 border border-white/10 rounded-2xl p-5 hover:border-emerald-500/30 transition"
              >
                <h3 className="font-semibold text-emerald-400">{label}</h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{last.content}</p>
                <p className="text-xs text-gray-600 mt-2">
                  {msgs.length} message{msgs.length !== 1 ? 's' : ''} · session only
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
