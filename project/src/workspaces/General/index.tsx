import { useMemo, useState } from 'react';
import { MessageSquarePlus, Search, Trash2 } from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { SG16_BRAND } from '../../core/branding';
import { sortedThreads, useAppStore } from '../../core/appState';

function threadDate(ts: number) {
  const d = new Date(ts);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString();
}

export const GeneralWorkspace = () => {
  const threads = useAppStore((s) => s.threads.general);
  const activeId = useAppStore((s) => s.activeThreadId.general ?? null);
  const newThread = useAppStore((s) => s.newThread);
  const openThread = useAppStore((s) => s.openThread);
  const deleteThread = useAppStore((s) => s.deleteThread);
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const ordered = sortedThreads(threads);
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.messages.some((m) => (m.display ?? m.content).toLowerCase().includes(q)),
    );
  }, [threads, query]);

  const remove = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) deleteThread('general', id);
  };

  return (
    <WorkspaceShell
      title={SG16_BRAND.chatName}
      subtitle="Worldwide general chat — live answers, daily questions"
      badge="Worldwide"
      badgeClass="text-white"
      skin="shell"
    >
      <div className="h-full min-h-0 grid lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sg16-work-field">
        {/* Chat history rail — every conversation on this device */}
        <aside className="hidden lg:flex flex-col sg16-sidebar min-h-0 min-w-0 w-full p-2 gap-1.5 border-r border-white/10">
          <button
            type="button"
            onClick={() => newThread('general')}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FF168D]/15 hover:bg-[#FF168D]/25 border border-[#FF168D]/30 text-white text-xs font-semibold py-2 transition"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" /> New chat
          </button>

          <div className="relative flex items-center rounded-lg bg-black/25 border border-white/10 px-1.5">
            <Search className="w-3 h-3 text-white/50 ml-0.5 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full min-w-0 bg-transparent pl-1.5 pr-1.5 py-2 text-[11px] text-white outline-none placeholder:text-white/40"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 pt-0.5">
            {list.length === 0 && (
              <p className="px-2 py-4 text-[11px] text-white/40 leading-relaxed">
                {threads.length === 0
                  ? 'Your chats appear here. They are saved on this device only.'
                  : 'No chats match your search.'}
              </p>
            )}
            {list.map((t) => (
              <div
                key={t.id}
                className={`group flex items-start gap-1 rounded-lg px-2 py-2 border transition ${
                  t.id === activeId
                    ? 'bg-[#FF168D]/12 border-[#FF168D]/35'
                    : 'bg-black/20 border-transparent hover:bg-black/35 hover:border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => openThread('general', t.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="text-[11px] text-white/90 line-clamp-2 leading-snug">{t.title}</div>
                  <div className="text-[9px] text-white/45 mt-0.5">{threadDate(t.updatedAt)}</div>
                </button>
                <button
                  type="button"
                  onClick={() => remove(t.id, t.title)}
                  title="Delete chat"
                  className="p-0.5 text-white/30 hover:text-[#FF526B] opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-white/30 text-center pb-1">Saved on this device only</p>
        </aside>

        <div className="min-h-0 min-w-0">
          <ChatPanel
            workspaceId="general"
            placeholder={`Message ${SG16_BRAND.chatName}...`}
            hideHistoryOnDesktop
            suggestions={[
              'What is the news today?',
              'Latest tech headlines',
              'Explain quantum computing simply',
              'Weather forecast today',
            ]}
            loadingLabel="SG16 AI is thinking..."
          />
        </div>
      </div>
    </WorkspaceShell>
  );
};

export default GeneralWorkspace;
