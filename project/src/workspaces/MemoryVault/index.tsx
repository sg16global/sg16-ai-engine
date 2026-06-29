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
      subtitle="Store and recall your knowledge with SG16 AI"
      badge="Persistent"
      badgeClass="text-orange-400"
    >
      <div className="h-full flex flex-col lg:flex-row">
        <aside className="lg:w-72 border-b lg:border-b-0 lg:border-r border-white/10 p-4 overflow-y-auto max-h-48 lg:max-h-none">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Saved Memories</p>

          <div className="space-y-2 mb-4">
            <input
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none"
            />
            <textarea
              value={saveContent}
              onChange={(e) => setSaveContent(e.target.value)}
              placeholder="Save a note to memory..."
              rows={2}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none resize-none"
            />
            <button
              type="button"
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-lg text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Save to Vault
            </button>
          </div>

          {memories.length === 0 ? (
            <p className="text-xs text-gray-600">No memories saved yet.</p>
          ) : (
            memories.map((m) => (
              <div key={m.id} className="bg-zinc-900/80 border border-white/10 rounded-lg p-3 mb-2 group">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs font-semibold text-emerald-400 truncate">{m.title}</p>
                  <button
                    type="button"
                    onClick={() => { deleteMemory(m.id); refresh(); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.content}</p>
              </div>
            ))
          )}
        </aside>

        <div className="flex-1 min-h-0">
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
