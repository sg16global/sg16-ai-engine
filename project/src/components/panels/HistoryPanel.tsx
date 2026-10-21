import { useMemo, useState } from 'react';
import { MessageSquare, Search, Shield, Trash2 } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { workspaceLabels } from '../chat/ChatPanel';
import { plainPreview } from '../../lib/utils';
import type { WorkspaceId } from '../../core/types';

function formatWhen(ts: number) {
  const d = new Date(ts);
  return d.toDateString() === new Date().toDateString()
    ? `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleDateString();
}

export function HistoryPanel() {
  const threads = useAppStore((s) => s.threads);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const openThread = useAppStore((s) => s.openThread);
  const deleteThread = useAppStore((s) => s.deleteThread);
  const [query, setQuery] = useState('');

  const entries = useMemo(() => {
    const all = (Object.keys(threads) as WorkspaceId[]).flatMap((ws) =>
      threads[ws].map((t) => ({ ws, thread: t })),
    );
    const q = query.trim().toLowerCase();
    return all
      .filter(
        ({ ws, thread }) =>
          !q ||
          thread.title.toLowerCase().includes(q) ||
          workspaceLabels[ws].toLowerCase().includes(q) ||
          thread.messages.some((m) => (m.display ?? m.content).toLowerCase().includes(q)),
      )
      .sort((a, b) => b.thread.updatedAt - a.thread.updatedAt);
  }, [threads, query]);

  const total = useMemo(
    () => Object.values(threads).reduce((sum, list) => sum + list.length, 0),
    [threads],
  );

  const open = (ws: WorkspaceId, id: string) => {
    openThread(ws, id);
    setWorkspace(ws);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
      <div className="sg16-bar flex items-start gap-3">
        <span className="mt-1 h-8 w-1 rounded-full shrink-0 bg-[#FF168D]" aria-hidden />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-white">History</h1>
          <p className="text-sm text-white/45 mt-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#FF5CB8] shrink-0" />
            Every chat from every shield. Saved on this device only — SG16 never stores your chats on its servers.
          </p>
        </div>
      </div>

      {total > 0 && (
        <div className="relative flex items-center sg16-bar-soft !py-0">
          <Search className="w-4 h-4 text-white/40 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${total} chat${total === 1 ? '' : 's'}`}
            className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/35"
          />
        </div>
      )}

      {entries.length === 0 ? (
        <div className="sg16-card p-10 text-center text-white/45">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{total === 0 ? 'No chats yet. Open any shield and start chatting.' : 'No chats match your search.'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {entries.map(({ ws, thread }) => {
            const last = thread.messages[thread.messages.length - 1];
            return (
              <div key={thread.id} className="group sg16-card sg16-card-hover flex items-start gap-3 p-4">
                <button type="button" onClick={() => open(ws, thread.id)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
                    <span className="text-[#FF5CB8]">{workspaceLabels[ws]}</span>
                    <span className="text-white/30">{formatWhen(thread.updatedAt)}</span>
                  </div>
                  <h3 className="text-sm font-medium text-white mt-1 truncate">{thread.title}</h3>
                  {last && (
                    <p className="text-xs text-white/45 mt-1 line-clamp-2">{plainPreview(last.display ?? last.content)}</p>
                  )}
                  <p className="text-[11px] text-white/30 mt-1.5">
                    {thread.messages.length} message{thread.messages.length === 1 ? '' : 's'}
                  </p>
                </button>
                <button
                  type="button"
                  title="Delete chat"
                  onClick={() => {
                    if (window.confirm(`Delete "${thread.title}"? This cannot be undone.`)) {
                      deleteThread(ws, thread.id);
                    }
                  }}
                  className="p-1.5 text-white/30 hover:text-[#FF526B] opacity-60 group-hover:opacity-100"
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
