import { useMemo, useState } from 'react';
import { MessageSquarePlus, Search, Trash2 } from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { SG16_BRAND } from '../../core/branding';
import { useAppStore } from '../../core/appState';

export const GeneralWorkspace = () => {
  const messages = useAppStore((s) => s.messages.general);
  const allThreads = useAppStore((s) => s.chatThreads);
  const activeId = useAppStore((s) => s.activeThreadIds.general);
  const newChat = useAppStore((s) => s.newChat);
  const openThread = useAppStore((s) => s.openThread);
  const deleteThread = useAppStore((s) => s.deleteThread);
  const [query, setQuery] = useState('');

  const threads = useMemo(() => {
    const list = allThreads.filter((t) => t.workspaceId === 'general');
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((t) => t.title.toLowerCase().includes(q) || t.messages.some((m) => m.content.toLowerCase().includes(q)));
  }, [allThreads, query]);

  return (
    <WorkspaceShell
      title={SG16_BRAND.chatName}
      subtitle="Worldwide general chat — live answers, daily questions"
      badge="Worldwide"
      badgeClass="text-white"
      skin="shell"
    >
      <div className="h-full min-h-0 grid lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sg16-work-field">
        {/* Saved conversations on this device */}
        <aside className="hidden lg:flex flex-col sg16-sidebar min-h-0 min-w-0 w-full p-2 gap-1.5 border-r border-white/10">
          <button
            type="button"
            onClick={() => newChat('general')}
            disabled={messages.length === 0}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-black/35 hover:bg-black/50 text-white text-[11px] font-semibold py-2 transition disabled:opacity-50"
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
            {threads.length === 0 && (
              <p className="px-2 py-3 text-[11px] text-white/40">
                {query ? 'No chats match.' : 'Your conversations appear here and stay on this device.'}
              </p>
            )}
            {threads.map((t) => (
              <div
                key={t.id}
                className={`group flex items-start gap-1 rounded-lg px-2 py-2 border ${
                  t.id === activeId ? 'bg-[#FF168D]/10 border-[#FF168D]/30' : 'bg-black/20 hover:bg-black/35 border-transparent hover:border-white/10'
                }`}
              >
                <button type="button" onClick={() => openThread(t.id)} className="min-w-0 flex-1 text-left">
                  <div className="text-[11px] text-white/90 line-clamp-2 leading-snug">{t.title}</div>
                  <div className="text-[9px] text-white/45 mt-0.5">{new Date(t.updatedAt).toLocaleDateString()}</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this conversation?')) deleteThread(t.id);
                  }}
                  className="p-0.5 text-white/30 hover:text-[#FF5CB8] opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-h-0 min-w-0">
          <ChatPanel
            workspaceId="general"
            placeholder={`Message ${SG16_BRAND.chatName}...`}
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
