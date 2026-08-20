import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, FileCode2, Folder, Loader2, Save, Send } from 'lucide-react';
import {
  askStudio,
  fetchStudioFile,
  fetchStudioStatus,
  fetchStudioTree,
  saveStudioFile,
  type StudioNode,
} from '../../lib/studioApi';

type ChatLine = { id: string; role: 'user' | 'assistant'; content: string };

function FileNode({
  node,
  active,
  onOpen,
}: {
  node: StudioNode;
  active: string | null;
  onOpen: (path: string) => void;
}) {
  const [open, setOpen] = useState(node.type === 'dir' && node.path.split('/').length < 2);
  if (node.type === 'dir') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-1 px-1.5 py-0.5 text-left text-[11px] text-white/60 hover:text-white hover:bg-white/5"
        >
          <ChevronRight className={`w-3 h-3 shrink-0 transition ${open ? 'rotate-90' : ''}`} />
          <Folder className="w-3 h-3 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        {open && (
          <div className="pl-3">
            {(node.children || []).map((child) => (
              <FileNode key={child.path} node={child} active={active} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(node.path)}
      className={`w-full flex items-center gap-1 px-1.5 py-0.5 text-left text-[11px] truncate ${
        active === node.path ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white hover:bg-white/5'
      }`}
    >
      <FileCode2 className="w-3 h-3 shrink-0" />
      {node.name}
    </button>
  );
}

/** Completely new flow — files + editor + Junior. Not a shield. */
export function DeveloperStudioApp() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [root, setRoot] = useState('');
  const [tree, setTree] = useState<StudioNode[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState('');
  const [status, setStatus] = useState('');
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const dirty = activePath != null && draft !== saved;

  useEffect(() => {
    document.title = 'SG16 Personal Developer';
    let alive = true;
    (async () => {
      try {
        const s = await fetchStudioStatus();
        if (!alive) return;
        setEnabled(s.enabled);
        if (!s.enabled) return;
        const t = await fetchStudioTree();
        if (!alive) return;
        setRoot(t.root);
        setTree(t.tree);
      } catch (err) {
        if (!alive) return;
        setEnabled(false);
        setStatus(err instanceof Error ? err.message : 'Studio unavailable');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const openFile = useCallback(async (path: string) => {
    setStatus('');
    try {
      const file = await fetchStudioFile(path);
      setActivePath(file.path);
      setDraft(file.content);
      setSaved(file.content);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not open file');
    }
  }, []);

  const save = useCallback(async () => {
    if (!activePath) return;
    setStatus('');
    try {
      await saveStudioFile(activePath, draft);
      setSaved(draft);
      setStatus(`Saved ${activePath}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    }
  }, [activePath, draft]);

  const ask = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    const userLine: ChatLine = { id: `u-${Date.now()}`, role: 'user', content: message };
    setChat((c) => [...c, userLine]);
    setInput('');
    setBusy(true);
    setStatus('');
    try {
      const history = [...chat, userLine].slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const file = activePath ? { path: activePath, content: draft } : undefined;
      const result = await askStudio(message, history, file);
      setChat((c) => [...c, { id: `a-${Date.now()}`, role: 'assistant', content: result.reply }]);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Developer unavailable');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#0b0d12] text-white flex flex-col">
      <header className="shrink-0 h-11 px-3 flex items-center gap-3 border-b border-white/10">
        <span className="text-sm font-semibold tracking-tight">SG16 Personal Developer</span>
        <span className="text-[10px] uppercase tracking-wider text-white/40">New flow · code on this machine</span>
        {root && <span className="ml-auto truncate text-[10px] text-white/35 max-w-[50%]">{root}</span>}
      </header>

      {enabled === false && (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-white/60">
          This developer codes on the PC. Open localhost / the desktop app — not the public website.
          {status && <p className="mt-2 text-red-300">{status}</p>}
        </div>
      )}

      {enabled && (
        <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)_minmax(0,40%)] lg:grid-rows-1 lg:grid-cols-[16rem_minmax(0,1fr)_20rem]">
          <aside className="hidden lg:block min-h-0 overflow-auto border-r border-white/10 p-2">
            {tree.map((n) => (
              <FileNode key={n.path} node={n} active={activePath} onOpen={openFile} />
            ))}
          </aside>

          <section className="min-h-0 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="shrink-0 h-9 px-3 flex items-center gap-2 border-b border-white/10 text-[11px]">
              <span className="truncate text-white/70">{activePath || 'Open a file'}</span>
              {dirty && <span className="text-amber-300">unsaved</span>}
              <button
                type="button"
                onClick={() => void save()}
                disabled={!dirty}
                className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 bg-white/10 disabled:opacity-30"
              >
                <Save className="w-3 h-3" /> Save
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              placeholder="Open a file from the tree. This is where apps are coded."
              className="flex-1 min-h-0 w-full resize-none bg-transparent p-3 font-mono text-[12px] leading-relaxed text-white/90 outline-none"
            />
            <div className="lg:hidden shrink-0 max-h-28 overflow-auto border-t border-white/10 p-2">
              {tree.map((n) => (
                <FileNode key={n.path} node={n} active={activePath} onOpen={openFile} />
              ))}
            </div>
          </section>

          <aside className="min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-auto p-3 space-y-2">
              {chat.length === 0 && (
                <p className="text-xs text-white/45">
                  Junior sits with the open file. Ask him to make a change, then Save.
                </p>
              )}
              {chat.map((m) => (
                <div
                  key={m.id}
                  className={`text-[12px] whitespace-pre-wrap rounded-lg px-2.5 py-2 ${
                    m.role === 'user' ? 'bg-white/10' : 'bg-black/40 font-mono text-[11px] text-white/80'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {busy && (
                <p className="inline-flex items-center gap-1 text-[11px] text-white/40">
                  <Loader2 className="w-3 h-3 animate-spin" /> Working…
                </p>
              )}
            </div>
            <form
              className="shrink-0 p-2 flex gap-2 border-t border-white/10"
              onSubmit={(e) => {
                e.preventDefault();
                void ask(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell Junior what to change in this file…"
                className="flex-1 min-w-0 rounded-lg bg-black/40 border border-white/10 px-2.5 py-2 text-xs outline-none"
              />
              <button type="submit" disabled={busy || !input.trim()} className="px-2 text-white disabled:opacity-30">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </aside>
        </div>
      )}

      {status && enabled && (
        <div className="shrink-0 px-3 py-1 text-[10px] text-white/45 border-t border-white/10">{status}</div>
      )}
    </div>
  );
}

export function DeveloperWorkspace() {
  return <DeveloperStudioApp />;
}
