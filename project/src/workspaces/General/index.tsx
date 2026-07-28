import { useMemo, useState } from 'react';
import { MessageSquarePlus, Search, Trash2 } from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { SG16_BRAND } from '../../core/branding';
import { useAppStore } from '../../core/appState';

export const GeneralWorkspace = () => {
  const messages = useAppStore((s) => s.messages.general);
  const clearMessages = useAppStore((s) => s.clearMessages);
  const [query, setQuery] = useState('');

  const threads = useMemo(() => {
    const users = messages.filter((m) => m.role === 'user');
    const list = users.length
      ? users
          .slice()
          .reverse()
          .slice(0, 12)
          .map((m) => ({
            id: m.id,
            title: m.content.slice(0, 48) + (m.content.length > 48 ? '…' : ''),
            time: new Date(m.timestamp || Date.now()).toLocaleDateString(),
          }))
      : [
          { id: 'hint-1', title: 'Ask anything worldwide', time: 'Start' },
          { id: 'hint-2', title: 'News, facts, daily questions', time: 'Tip' },
        ];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((t) => t.title.toLowerCase().includes(q));
  }, [messages, query]);

  return (
    <WorkspaceShell
      title={SG16_BRAND.chatName}
      subtitle="Worldwide general chat — live answers, daily questions"
      badge="Worldwide"
      badgeClass="text-white"
      skin="shell"
    >
      <div className="h-full min-h-0 grid lg:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sg16-work-field">
        {/* Inner side panel — maroon (slim history rail) */}
        <aside className="hidden lg:flex flex-col sg16-side-maroon min-h-0 min-w-0 w-full max-w-[10rem] p-2 gap-1.5 border-r border-white/10">
          <button
            type="button"
            onClick={() => clearMessages('general')}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-black/35 hover:bg-black/50 text-white text-[11px] font-semibold py-2 transition"
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
            {threads.map((t) => (
              <div
                key={t.id}
                className="rounded-lg px-2 py-2 bg-black/20 hover:bg-black/35 border border-transparent hover:border-white/10"
              >
                <div className="text-[11px] text-white/90 line-clamp-2 leading-snug">{t.title}</div>
                <div className="text-[9px] text-white/45 mt-0.5">{t.time}</div>
              </div>
            ))}
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => clearMessages('general')}
              className="inline-flex items-center justify-center gap-1.5 text-[11px] text-white/70 hover:text-white py-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear thread
            </button>
          )}
        </aside>

        <div className="min-h-0 min-w-0 bg-black">
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
