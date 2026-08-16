import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Terminal } from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { useAppStore } from '../../core/appState';
import { isAuthenticated } from '../../core/access';
import { fetchJuniorHealth, runJunior } from '../../lib/juniorApi';
import { uid } from '../../lib/utils';
import type { Message } from '../../core/types';

const SUGGESTIONS = [
  'Build a small feature for this project, then teach what you did.',
  'Explain our own brain, Kali Shell, and layers — step by step.',
  'Where should Cloudflare take pressure and Railway stay the brain pipe?',
];

export function DeveloperWorkspace() {
  const authUser = useAppStore((s) => s.authUser);
  const messages = useAppStore((s) => s.messages.developer) ?? [];
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const addMessage = useAppStore((s) => s.addMessage);
  const setLoading = useAppStore((s) => s.setLoading);
  const setError = useAppStore((s) => s.setError);
  const requireAuth = useAppStore((s) => s.requireAuth);
  const openLoginModal = useAppStore((s) => s.openLoginModal);

  const [input, setInput] = useState('');
  const [brain, setBrain] = useState('checking…');
  const onPcRoad = typeof window !== 'undefined' && Boolean(window.sg16Junior);
  const signedIn = isAuthenticated(authUser);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetchJuniorHealth()
      .then((h) => {
        if (!alive) return;
        setBrain(h.brain || h.status || 'ok');
      })
      .catch(() => {
        if (!alive) return;
        setBrain('offline');
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, loading]);

  const send = (text: string) => {
    const message = text.trim();
    if (!message || loading) return;

    const run = async () => {
      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };
      addMessage('developer', userMsg);
      setInput('');
      setLoading(true);
      setError(null);
      try {
        const history = [...messages, userMsg].slice(-12).map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const result = await runJunior(message, history);
        addMessage('developer', {
          id: uid(),
          role: 'assistant',
          content: result.reply,
          timestamp: Date.now(),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Developer unavailable';
        if (msg === 'AUTH_REQUIRED') {
          openLoginModal(() => send(message));
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (!signedIn) {
      requireAuth(() => {
        void run();
      });
      return;
    }
    void run();
  };

  return (
    <WorkspaceShell
      title="SG16 Personal Developer"
      subtitle="Sit down and build. Make the app, then teach the brain project. Not the public site."
      badge="Developer"
      badgeClass="text-sky-300"
      skin="coding"
    >
      <div className="h-full min-h-0 flex flex-col sg16-work-field">
        <div className="px-4 sm:px-5 pt-3 shrink-0 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2.5 py-1">
            <Terminal className="w-3 h-3" />
            {onPcRoad ? 'PC road — door open' : 'House developer'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2.5 py-1">
            Brain: {brain}
          </span>
        </div>

        {!signedIn && (
          <div className="mx-4 sm:mx-5 mt-3 shrink-0 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
            <p className="text-sm text-white/80">Sign in to work with your developer — coding, not the landing page.</p>
            <button
              type="button"
              onClick={() => openLoginModal()}
              className="mt-2 text-xs font-semibold text-sky-300 hover:text-sky-200"
            >
              Sign in with Google
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-auto px-4 sm:px-5 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-sm text-white/55">Ask the developer to make something, then explain the house.</p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="block w-full text-left text-xs rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white/70 hover:text-white hover:border-white/25"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl px-3 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-sky-500/15 border border-sky-400/20 text-white ml-6'
                  : 'bg-black/40 border border-white/10 text-white/90 mr-6 font-mono text-[13px] leading-relaxed'
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <p className="inline-flex items-center gap-2 text-xs text-white/45">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Developer is working…
            </p>
          )}
          {error && <p className="text-xs text-red-300">{error}</p>}
          <div ref={bottomRef} />
        </div>

        <form
          className="shrink-0 px-4 sm:px-5 pb-3 pt-1 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell the developer what to make…"
            className="flex-1 min-w-0 rounded-xl bg-black/50 border border-white/15 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-sky-400/40"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-3 text-white"
            aria-label="Send to developer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </WorkspaceShell>
  );
}
