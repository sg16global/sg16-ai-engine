import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { deleteMemory, formatMemoryContext, loadMemories, saveMemory } from '../../lib/utils';
import type { MemoryEntry } from '../../core/types';

export const MemoryVaultWorkspace = () => {
  const [memories, setMemories] = useState<MemoryEntry[]>(loadMemories);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveContent, setSaveContent] = useState('');
  const [, setTick] = useState(0);

  const refresh = () => {
    setMemories(loadMemories());
    setTick((t) => t + 1);
  };

  const handleSave = () => {
    if (!saveContent.trim()) return;
    saveMemory(saveTitle || saveContent.slice(0, 40), saveContent.trim());
    setSaveTitle('');
    setSaveContent('');
    refresh();
  };

  return (
    <WorkspaceShell
      title="Memory Vault"
      subtitle="Save notes, then ask SG16 AI to recall and connect them — notes stay on this device"
      badge="On device"
      badgeClass="text-[#FF5CB8]"
    >
      <div className="h-full flex flex-col lg:flex-row sg16-work-field">
        <aside className="sg16-sidebar lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 p-4 overflow-y-auto max-h-56 lg:max-h-none">
          <p className="text-[11px] text-white/40 uppercase tracking-[0.16em] mb-3">Saved memories · {memories.length}</p>

          <div className="space-y-2 mb-4">
            <input
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full bg-black/40 border border-white/10 focus:border-[#FF168D]/45 rounded-lg px-3 py-2 text-xs text-white outline-none placeholder:text-white/35"
            />
            <textarea
              value={saveContent}
              onChange={(e) => setSaveContent(e.target.value)}
              placeholder="Save a note to memory..."
              rows={2}
              className="w-full bg-black/40 border border-white/10 focus:border-[#FF168D]/45 rounded-lg px-3 py-2 text-xs text-white outline-none resize-none placeholder:text-white/35"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!saveContent.trim()}
              className="w-full flex items-center justify-center gap-1.5 bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] py-2 rounded-lg text-xs font-semibold disabled:opacity-40 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Save to Vault
            </button>
          </div>

          {memories.length === 0 ? (
            <p className="text-xs text-white/40">No memories saved yet.</p>
          ) : (
            memories.map((m) => (
              <div key={m.id} className="bg-black/30 border border-white/10 hover:border-[#FF168D]/30 rounded-lg p-3 mb-2 group transition">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs font-semibold text-[#FF5CB8] truncate">{m.title}</p>
                  <button
                    type="button"
                    onClick={() => { deleteMemory(m.id); refresh(); }}
                    title="Delete memory"
                    className="opacity-50 group-hover:opacity-100 text-white/40 hover:text-[#FF526B]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-white/55 mt-1 line-clamp-2">{m.content}</p>
              </div>
            ))
          )}
        </aside>

        <div className="flex-1 min-h-0 min-w-0">
          <ChatPanel
            workspaceId="memory"
            placeholder="Ask SG16 AI to recall or connect your saved memories..."
            suggestions={[
              'What did I save about my project?',
              'Summarize all my saved notes',
              'Connect my notes on AI and programming',
            ]}
            getExtraPayload={() => ({ memoryContext: formatMemoryContext() })}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
};

export default MemoryVaultWorkspace;
