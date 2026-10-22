import { useMemo, useState } from 'react';
import { MessageSquare, Search, Shield, Trash2 } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { SG16_BRAND } from '../../core/branding';
import { plainText } from '../chat/MessageContent';
import type { WorkspaceId } from '../../core/types';

const workspaceLabels: Record<WorkspaceId, string> = {
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

export function HistoryPanel() {
  const threads = useAppStore((s) => s.chatThreads);
  const openThread = useAppStore((s) => s.openThread);
  const deleteThread = useAppStore((s) => s.deleteThread);
  const [filter, setFilter] = useState<WorkspaceId | 'all'>('all');
  const [query, setQuery] = useState('');

  const shields = useMemo(() => [...new Set(threads.map((t) => t.workspaceId))], [threads]);
  const shown = threads.filter(
    (t) =>
      (filter === 'all' || t.workspaceId === filter) &&
      (!query.trim() || t.messages.some((m) => m.content.toLowerCase().includes(query.toLowerCase()))),
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-white/50 mt-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Every conversation from every shield. Saved on this device only — never stored on our servers.
        </p>
      </div>

      {threads.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex items-center rounded-xl bg-black/30 border border-white/10 px-2 flex-1 min-w-[12rem]">
            <Search className="w-3.5 h-3.5 text-white/45" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              className="w-full bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>
          {(['all', ...shields] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                filter === id ? 'border-[#FF168D] bg-[#FF168D]/15 text-white' : 'border-white/15 text-white/60 hover:text-white'
              }`}
            >
              {id === 'all' ? 'All' : workspaceLabels[id]}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="bg-[#0A0A12]/50 border border-white/10 rounded-2xl p-10 text-center text-white/45">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{threads.length ? 'No conversations match.' : 'No conversations yet. Chats from any shield appear here.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((t) => {
            const last = t.messages[t.messages.length - 1];
            return (
              <div key={t.id} className="flex items-start gap-3 bg-[#0A0A12]/80 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-[#FF168D]/40 transition">
                <button type="button" onClick={() => openThread(t.id)} className="min-w-0 flex-1 text-left">
                  <div className="text-[11px] uppercase tracking-wider text-[#FF5CB8]">{workspaceLabels[t.workspaceId]}</div>
                  <h3 className="font-semibold text-white mt-0.5 line-clamp-1">{t.title}</h3>
                  {last && <p className="text-sm text-white/50 mt-1 line-clamp-2 [overflow-wrap:anywhere]">{plainText(last.content)}</p>}
                  <p className="text-xs text-white/35 mt-2">
                    {t.messages.length} message{t.messages.length !== 1 ? 's' : ''} ·{' '}
                    {new Date(t.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this conversation?')) deleteThread(t.id);
                  }}
                  className="p-2 text-white/35 hover:text-[#FF5CB8]"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
