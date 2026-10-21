import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Loader2, Trash2, Mic, MicOff, Volume2, Upload, Image as ImageIcon, Download, Globe,
  History, MessageSquarePlus, X, Paperclip,
} from 'lucide-react';
import { getActiveThread, selectActiveMessages, sortedThreads, useAppStore } from '../../core/appState';
import { isStudentVerified } from '../../core/access';
import { sendChat, readDocumentFile, readImageFile } from '../../lib/chatApi';
import { uid } from '../../lib/utils';
import { startVoiceCapture, speakText, voiceInputAvailable } from '../../lib/voiceInput';
import { SG16_BRAND } from '../../core/branding';
import { Markdown } from './Markdown';
import type { Message, WorkspaceId } from '../../core/types';

export const workspaceLabels: Record<WorkspaceId, string> = {
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

/** Prior turns sent to the AI as context (the backend keeps the last few). */
const HISTORY_TURNS = 12;

const LIVE_HINT = /\b(news|today|latest|weather|headlines|breaking|current|happening|forecast)\b/i;

function formatThreadDate(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString();
}

interface ChatPanelProps {
  workspaceId: WorkspaceId;
  placeholder?: string;
  suggestions?: string[];
  /** Shown in an empty chat when there are no suggestions. */
  emptyHint?: string;
  allowImage?: boolean;
  allowDocument?: boolean;
  allowVoice?: boolean;
  monospace?: boolean;
  loadingLabel?: string;
  extraControls?: React.ReactNode;
  getExtraPayload?: () => Record<string, string | undefined>;
  /** Hide the History button on wide screens when the shield has its own history rail. */
  hideHistoryOnDesktop?: boolean;
}

export function ChatPanel({
  workspaceId,
  placeholder = 'Ask SG16 AI...',
  suggestions = [],
  emptyHint,
  allowImage = false,
  allowDocument = false,
  allowVoice = false,
  monospace = false,
  loadingLabel = 'SG16 AI is thinking...',
  extraControls,
  getExtraPayload,
  hideHistoryOnDesktop = false,
}: ChatPanelProps) {
  const messages = useAppStore((s) => selectActiveMessages(s, workspaceId));
  const activeThread = useAppStore((s) => getActiveThread(s, workspaceId));
  const threads = useAppStore((s) => s.threads[workspaceId]);
  const busy = useAppStore((s) => !!s.busy[workspaceId]);
  const error = useAppStore((s) => s.error);
  const addMessage = useAppStore((s) => s.addMessage);
  const newThread = useAppStore((s) => s.newThread);
  const openThread = useAppStore((s) => s.openThread);
  const deleteThread = useAppStore((s) => s.deleteThread);
  const setBusy = useAppStore((s) => s.setBusy);
  const setError = useAppStore((s) => s.setError);
  const consumePendingPrompt = useAppStore((s) => s.consumePendingPrompt);
  const pendingPromptToken = useAppStore((s) => s.pendingPromptToken);
  const settings = useAppStore((s) => s.settings);
  const subscription = useAppStore((s) => s.subscription);
  const requireAuth = useAppStore((s) => s.requireAuth);
  const startSession = useAppStore((s) => s.startSession);

  const [input, setInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [pendingDoc, setPendingDoc] = useState<{ name: string; text: string } | null>(null);
  const [listening, setListening] = useState(false);
  const [activeLoadingLabel, setActiveLoadingLabel] = useState(loadingLabel);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const voiceSessionRef = useRef<ReturnType<typeof startVoiceCapture> | null>(null);

  const activeThreadId = activeThread?.id ?? null;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setHistoryOpen(false);
  }, [workspaceId, activeThreadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  useEffect(() => {
    if (!historyOpen) return;
    const close = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) setHistoryOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [historyOpen]);

  const sendMessage = useCallback(
    async (text?: string, image?: string, display?: string) => {
      const raw = (text ?? input).trim();
      const img = image ?? imageUrl;
      const doc = pendingDoc;
      const docBlock = doc ? `Document (${doc.name}):\n\n${doc.text}` : '';
      if (busy || (!raw && !img && !docBlock)) return;

      const ask = raw || (img ? 'Analyze this image' : 'Analyze this document');
      const messageText = docBlock ? `${ask}\n\n---\n\n${docBlock}` : ask;
      const bubbleText =
        display ?? (doc ? `${ask}\n\n📎 ${doc.name} · ${Math.max(1, Math.round(doc.text.length / 1000))}K chars` : undefined);

      // Context = earlier turns of this thread only; the new message travels as `message`.
      const history = selectActiveMessages(useAppStore.getState(), workspaceId)
        .filter((m) => !m.error)
        .slice(-HISTORY_TURNS)
        .map((m) => ({ role: m.role, content: m.content }));

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content: messageText,
        timestamp: Date.now(),
        imageUrl: img,
        ...(bubbleText ? { display: bubbleText } : {}),
      };

      const threadId = addMessage(workspaceId, userMsg);
      setInput('');
      setImageUrl(undefined);
      setPendingDoc(null);
      setActiveLoadingLabel(LIVE_HINT.test(ask) ? 'SG16 AI is searching the web...' : loadingLabel);
      setBusy(workspaceId, true);
      setError(null);

      try {
        const extra = getExtraPayload?.() ?? {};
        const result = await sendChat({
          message: messageText,
          workspaceId,
          imageUrl: img,
          history,
          targetLanguage: extra.targetLanguage,
          memoryContext: extra.memoryContext,
          planTier: subscription.plan,
          studentVerified: isStudentVerified(subscription),
        });

        addMessage(
          workspaceId,
          {
            id: uid(),
            role: 'assistant',
            content: result.reply,
            timestamp: Date.now(),
            generatedImageUrl: result.generatedImageUrl,
            liveSearch: result.liveSearch,
          },
          threadId,
        );

        if (allowVoice && result.reply) speakText(result.reply);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        if (msg === 'AUTH_REQUIRED') {
          void startSession();
          return;
        }
        addMessage(
          workspaceId,
          { id: uid(), role: 'assistant', content: `Sorry — ${msg}`, timestamp: Date.now(), error: true },
          threadId,
        );
      } finally {
        setBusy(workspaceId, false);
      }
    },
    [
      input, imageUrl, pendingDoc, busy, workspaceId, loadingLabel,
      addMessage, setBusy, setError, getExtraPayload, allowVoice, subscription, startSession,
    ],
  );

  useEffect(() => {
    const pending = consumePendingPrompt(workspaceId);
    if (!pending) return;
    if (pending.draft) setInput(pending.content);
    else void sendMessage(pending.content, pending.imageUrl, pending.display);
  }, [workspaceId, pendingPromptToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      voiceSessionRef.current?.cancel();
      voiceSessionRef.current = null;
    };
  }, [workspaceId]);

  const toggleVoice = () => {
    requireAuth(async () => {
      if (!voiceInputAvailable()) {
        setError('Voice input is not supported on this device. Type your message instead.');
        return;
      }

      if (listening && voiceSessionRef.current) {
        setListening(false);
        try {
          const transcript = await voiceSessionRef.current.stop();
          voiceSessionRef.current = null;
          if (settings.autoSendVoice) {
            await sendMessage(transcript);
          } else {
            setInput(transcript);
          }
        } catch (err) {
          voiceSessionRef.current = null;
          setError(err instanceof Error ? err.message : 'Voice input failed');
        }
        return;
      }

      try {
        setError(null);
        voiceSessionRef.current = startVoiceCapture('en-US');
        setListening(true);
      } catch (err) {
        voiceSessionRef.current = null;
        setListening(false);
        setError(err instanceof Error ? err.message : 'Voice input failed');
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await readImageFile(file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    }
    e.target.value = '';
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readDocumentFile(file);
      setPendingDoc({ name: file.name, text });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document upload failed');
    }
    e.target.value = '';
  };

  const removeThread = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) deleteThread(workspaceId, id);
  };

  const ordered = sortedThreads(threads);

  return (
    <div key={workspaceId} className="h-full flex flex-col">
      <div className="px-4 sm:px-5 pt-3 shrink-0">
        <div className="sg16-chat-col relative" ref={historyRef}>
          <div className="flex items-center justify-between gap-2 sg16-bar-soft !py-1.5 !pr-1.5">
            <span className="text-[11px] text-white/45 truncate tracking-wide min-w-0">
              {workspaceLabels[workspaceId]} ·{' '}
              <span className="text-white/75">{activeThread?.title ?? 'New chat'}</span>
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setHistoryOpen((o) => !o)}
                aria-expanded={historyOpen}
                className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg transition ${
                  historyOpen ? 'bg-[#FF168D]/15 text-[#FF5CB8]' : 'text-white/50 hover:text-[#FF5CB8]'
                } ${hideHistoryOnDesktop ? 'lg:hidden' : ''}`}
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
                {threads.length > 0 && <span className="text-[10px] text-white/35">{threads.length}</span>}
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => newThread(workspaceId)}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-[#FF5CB8] transition px-2 py-1.5 rounded-lg"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New chat</span>
                </button>
              )}
              {activeThread && (
                <button
                  type="button"
                  onClick={() => removeThread(activeThread.id, activeThread.title)}
                  title="Delete this chat"
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#FF526B] transition px-2 py-1.5 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {historyOpen && (
            <div
              className="absolute z-30 left-0 right-0 mt-1.5 rounded-xl border border-[#FF168D]/25 p-2 max-h-80 overflow-y-auto shadow-[0_18px_50px_rgba(0,0,0,0.7)]"
              style={{ background: '#0E0B14' }}
            >
              <div className="flex items-center justify-between px-2 pb-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                  {workspaceLabels[workspaceId]} chats · on this device
                </span>
                <button type="button" onClick={() => setHistoryOpen(false)} className="text-white/40 hover:text-white p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {ordered.length === 0 ? (
                <p className="px-2 py-4 text-xs text-white/40 text-center">No saved chats yet.</p>
              ) : (
                ordered.map((t) => (
                  <div
                    key={t.id}
                    className={`group flex items-center gap-2 rounded-lg px-2 py-2 ${
                      t.id === activeThreadId ? 'bg-[#FF168D]/12 border border-[#FF168D]/30' : 'hover:bg-white/[0.05] border border-transparent'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        openThread(workspaceId, t.id);
                        setHistoryOpen(false);
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="text-xs text-white/90 truncate">{t.title}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">
                        {formatThreadDate(t.updatedAt)} · {t.messages.length} message{t.messages.length === 1 ? '' : 's'}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeThread(t.id, t.title)}
                      title="Delete chat"
                      className="p-1 text-white/30 hover:text-[#FF526B] opacity-60 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="sg16-write-zone overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 mobile-scroll-main"
      >
        <div className="sg16-chat-col space-y-3">
          {messages.length === 0 && !busy && suggestions.length > 0 && (
            <div className="sg16-card p-5 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/30 mb-1">Start here</p>
              <p className="text-sm text-white/55 mb-4 leading-relaxed">
                Pick a prompt — or type below.
              </p>
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => requireAuth(() => void sendMessage(s))}
                    className="sg16-bar-row sg16-bar-row--prompt w-full text-left text-sm text-white/85"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length === 0 && !busy && suggestions.length === 0 && emptyHint && (
            <p className="text-center text-sm text-white/40 py-8">{emptyHint}</p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`text-sm leading-relaxed ${
                msg.role === 'user' ? 'sg16-bar-accent' : msg.error ? 'sg16-bar-error' : 'sg16-bar'
              }`}
            >
              {msg.role === 'assistant' && !msg.error && (
                <div className="text-[10px] text-[#FF5CB8] mb-1.5 font-semibold tracking-[0.12em] uppercase">
                  {workspaceId === 'general' ? SG16_BRAND.chatName : 'SG16 AI'}
                </div>
              )}
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="" className="rounded-lg mb-2 max-h-40 object-cover" />
              )}
              {msg.generatedImageUrl && (
                <div className="mb-2">
                  <img
                    src={msg.generatedImageUrl}
                    alt="SG16 AI generated"
                    className="rounded-lg max-h-80 object-contain w-full"
                  />
                  <a
                    href={msg.generatedImageUrl}
                    download={`sg16-image-${msg.id}.png`}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#FF5CB8] hover:text-[#FF168D]"
                  >
                    <Download className="w-3.5 h-3.5" /> Download image
                  </a>
                </div>
              )}
              {msg.liveSearch && msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 text-[10px] text-sky-400/90 mb-2">
                  <Globe className="w-3 h-3" /> Live web answer · SG16 AI
                </div>
              )}
              {msg.role === 'assistant' && !msg.error ? (
                <Markdown text={msg.content} mono={monospace} />
              ) : (
                <p className={`whitespace-pre-wrap break-words ${monospace && !msg.display ? 'font-mono text-xs' : ''}`}>
                  {msg.display ?? msg.content}
                </p>
              )}
            </div>
          ))}

          {busy && (
            <div className="sg16-bar-soft flex items-center gap-2 text-[#FF5CB8] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> {activeLoadingLabel}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-white/[0.08] bg-[rgba(12,12,18,0.55)] backdrop-blur-md">
        <div className="sg16-chat-col space-y-2">
          {error && <div className="sg16-bar-error">{error}</div>}

          {extraControls && <div>{extraControls}</div>}

          {imageUrl && (
            <div className="sg16-bar-soft flex items-center gap-2">
              <img src={imageUrl} alt="Preview" className="h-12 rounded-lg" />
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                className="text-xs text-white/40 hover:text-[#FF5CB8]"
              >
                Remove
              </button>
            </div>
          )}

          {pendingDoc && (
            <div className="sg16-bar-soft flex items-center gap-2 text-xs">
              <Paperclip className="w-4 h-4 text-[#FF5CB8] shrink-0" />
              <span className="text-white/80 truncate flex-1">
                {pendingDoc.name} · {Math.max(1, Math.round(pendingDoc.text.length / 1000))}K chars — type your
                question, then send
              </span>
              <button
                type="button"
                onClick={() => setPendingDoc(null)}
                className="text-white/40 hover:text-[#FF5CB8] shrink-0"
              >
                Remove
              </button>
            </div>
          )}

          <div className="sg16-composer">
            {allowImage && (
              <>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => imageRef.current?.click()}
                  className="p-2.5 hover:bg-white/[0.06] rounded-xl shrink-0 text-white/50 hover:text-white"
                  title="Upload image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </>
            )}
            {allowDocument && (
              <>
                <input
                  ref={docRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,.html,.js,.ts,.py,.java,.xml,.pdf"
                  className="hidden"
                  onChange={handleDocUpload}
                />
                <button
                  type="button"
                  onClick={() => docRef.current?.click()}
                  className="p-2.5 hover:bg-white/[0.06] rounded-xl shrink-0 text-white/50 hover:text-white"
                  title="Upload document"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </>
            )}
            {allowVoice && (
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-2.5 rounded-xl shrink-0 ${
                  listening
                    ? 'bg-[#FF168D]/20 text-[#FF5CB8]'
                    : 'hover:bg-white/[0.06] text-white/50 hover:text-white'
                }`}
                title={listening ? 'Stop recording' : 'Voice input'}
              >
                {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            <textarea
              value={input}
              onFocus={() => requireAuth(() => {})}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  requireAuth(() => void sendMessage());
                }
              }}
              placeholder={placeholder}
              rows={1}
              className="sg16-composer-input flex-1 min-w-0 bg-transparent border-0 px-2 sm:px-3 py-2.5 text-base outline-none resize-none min-h-[44px] max-h-32"
            />

            <button
              type="button"
              onClick={() => requireAuth(() => void sendMessage())}
              disabled={busy || (!input.trim() && !imageUrl && !pendingDoc)}
              className="sg16-send p-3 shrink-0 disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {allowVoice && (
            <button
              type="button"
              onClick={() => {
                const last = [...messages].reverse().find((m) => m.role === 'assistant' && !m.error);
                if (last) speakText(last.content);
              }}
              className="flex items-center gap-1.5 text-xs text-white/35 hover:text-[#FF5CB8]"
            >
              <Volume2 className="w-3.5 h-3.5" /> Read last reply aloud
            </button>
          )}
          {allowVoice && listening && (
            <p className="text-[11px] text-[#FF5CB8]">
              Recording… tap mic again when finished speaking.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
