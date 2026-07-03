import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Trash2, Mic, MicOff, Volume2, Upload, Image as ImageIcon, Download, Globe } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { isStudentVerified } from '../../core/access';
import { sendChat, readDocumentFile, readImageFile } from '../../lib/chatApi';
import { uid } from '../../lib/utils';
import { SG16_BRAND } from '../../core/branding';
import type { Message, WorkspaceId } from '../../core/types';

interface ChatPanelProps {
  workspaceId: WorkspaceId;
  placeholder?: string;
  suggestions?: string[];
  allowImage?: boolean;
  allowDocument?: boolean;
  allowVoice?: boolean;
  monospace?: boolean;
  loadingLabel?: string;
  extraControls?: React.ReactNode;
  getExtraPayload?: () => Record<string, string | undefined>;
}

export function ChatPanel({
  workspaceId,
  placeholder = 'Ask SG16 AI...',
  suggestions = [],
  allowImage = false,
  allowDocument = false,
  allowVoice = false,
  monospace = false,
  loadingLabel = 'SG16 AI is thinking...',
  extraControls,
  getExtraPayload,
}: ChatPanelProps) {
  const messages = useAppStore((s) => s.messages[workspaceId]);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const addMessage = useAppStore((s) => s.addMessage);
  const clearMessages = useAppStore((s) => s.clearMessages);
  const setLoading = useAppStore((s) => s.setLoading);
  const setError = useAppStore((s) => s.setError);
  const consumePendingPrompt = useAppStore((s) => s.consumePendingPrompt);
  const consumePendingImage = useAppStore((s) => s.consumePendingImage);
  const settings = useAppStore((s) => s.settings);
  const subscription = useAppStore((s) => s.subscription);
  const requireAuth = useAppStore((s) => s.requireAuth);
  const openLoginModal = useAppStore((s) => s.openLoginModal);

  const [input, setInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [pendingDoc, setPendingDoc] = useState<{ name: string; text: string } | null>(null);
  const [listening, setListening] = useState(false);
  const [activeLoadingLabel, setActiveLoadingLabel] = useState(loadingLabel);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text?: string, image?: string) => {
      const raw = (text ?? input).trim();
      const img = image ?? imageUrl;
      const docBlock = pendingDoc
        ? `Document (${pendingDoc.name}):\n\n${pendingDoc.text}`
        : '';
      const content = raw || (img ? 'Analyze this image' : '') || (docBlock ? 'Analyze this document' : '');
      if (loading || (!content && !docBlock)) return;

      const messageText = docBlock
        ? raw
          ? `${raw}\n\n---\n\n${docBlock}`
          : `Analyze this document (${pendingDoc!.name}):\n\n${pendingDoc!.text}`
        : content;

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content: messageText,
        timestamp: Date.now(),
        imageUrl: img,
      };

      addMessage(workspaceId, userMsg);
      setInput('');
      setImageUrl(undefined);
      setPendingDoc(null);
      setActiveLoadingLabel(
        /\b(news|today|latest|weather|headlines|breaking|current|happening|forecast)\b/i.test(messageText)
          ? 'SG16 AI is searching the web...'
          : loadingLabel,
      );
      setLoading(true);
      setError(null);

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

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

        addMessage(workspaceId, {
          id: uid(),
          role: 'assistant',
          content: result.reply,
          timestamp: Date.now(),
          generatedImageUrl: result.generatedImageUrl,
          liveSearch: result.liveSearch,
        });

        if (allowVoice && 'speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(result.reply.slice(0, 500));
          utter.rate = 1;
          window.speechSynthesis.speak(utter);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        if (msg === 'AUTH_REQUIRED') {
          openLoginModal();
          setLoading(false);
          return;
        }
        setError(msg);
        addMessage(workspaceId, {
          id: uid(),
          role: 'assistant',
          content: `Sorry — ${msg}`,
          timestamp: Date.now(),
        });
      } finally {
        setLoading(false);
      }
    },
    [
      input, imageUrl, pendingDoc, loading, messages, workspaceId,
      addMessage, setLoading, setError, getExtraPayload, allowVoice, settings.autoSendVoice, subscription,
    ],
  );

  useEffect(() => {
    const pending = consumePendingPrompt();
    const pendingImg = consumePendingImage();
    if (pendingImg) setImageUrl(pendingImg);
    if (pending) sendMessage(pending, pendingImg ?? undefined);
    else if (pendingImg) sendMessage('Analyze this image', pendingImg);
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setListening(false);
      if (settings.autoSendVoice) {
        sendMessage(transcript);
      } else {
        setInput(transcript);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-end px-4 py-2 border-b border-white/5 gap-2">
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => clearMessages(workspaceId)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition px-2 py-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.length === 0 && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 hover:border-emerald-500/30 text-gray-300 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-500/15 border border-emerald-500/25 text-white'
                  : 'bg-zinc-900 border border-white/10 text-gray-200'
              }`}
            >
              {msg.role === 'assistant' && workspaceId === 'general' && (
                <div className="text-[10px] text-emerald-400 mb-1.5 font-semibold tracking-wide">
                  {SG16_BRAND.chatName}
                </div>
              )}
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="" className="rounded-lg mb-2 max-h-40 object-cover" />
              )}
              {msg.generatedImageUrl && (
                <div className="mb-2">
                  <img src={msg.generatedImageUrl} alt="SG16 AI generated" className="rounded-lg max-h-80 object-contain w-full" />
                  <a
                    href={msg.generatedImageUrl}
                    download={`sg16-image-${msg.id}.png`}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    <Download className="w-3.5 h-3.5" /> Download image
                  </a>
                </div>
              )}
              {msg.liveSearch && msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 text-[10px] text-sky-400 mb-2">
                  <Globe className="w-3 h-3" /> Live web answer · SG16 AI
                </div>
              )}
              <p className={`whitespace-pre-wrap ${monospace ? 'font-mono text-xs' : ''}`}>{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> {activeLoadingLabel}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="px-3 sm:px-4 py-3 sm:py-4 border-t border-white/10 bg-black/40">
        {extraControls && <div className="mb-3">{extraControls}</div>}

        {imageUrl && (
          <div className="mb-2 flex items-center gap-2">
            <img src={imageUrl} alt="Preview" className="h-12 rounded-lg" />
            <button type="button" onClick={() => setImageUrl(undefined)} className="text-xs text-gray-500 hover:text-red-400">
              Remove
            </button>
          </div>
        )}

        {pendingDoc && (
          <div className="mb-2 flex items-center gap-2 text-xs bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2">
            <Upload className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-purple-200 truncate flex-1">
              {pendingDoc.name} · {Math.round(pendingDoc.text.length / 1000)}K chars — type your question, then send
            </span>
            <button type="button" onClick={() => setPendingDoc(null)} className="text-gray-500 hover:text-red-400 shrink-0">
              Remove
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end flex-wrap sm:flex-nowrap">
          {allowImage && (
            <>
              <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <button type="button" onClick={() => imageRef.current?.click()} className="p-2.5 hover:bg-white/10 rounded-xl shrink-0" title="Upload image">
                <ImageIcon className="w-5 h-5" />
              </button>
            </>
          )}
          {allowDocument && (
            <>
              <input ref={docRef} type="file" accept=".txt,.md,.csv,.json,.html,.js,.ts,.py,.java,.xml,.pdf" className="hidden" onChange={handleDocUpload} />
              <button type="button" onClick={() => docRef.current?.click()} className="p-2.5 hover:bg-white/10 rounded-xl shrink-0" title="Upload document">
                <Upload className="w-5 h-5" />
              </button>
            </>
          )}
          {allowVoice && (
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2.5 rounded-xl shrink-0 ${listening ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10'}`}
              title="Voice input"
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
                requireAuth(() => sendMessage());
              }
            }}
            placeholder={placeholder}
            rows={1}
            className="flex-1 min-w-0 bg-zinc-900 border border-white/10 rounded-xl px-3 sm:px-4 py-3 text-sm outline-none focus:border-emerald-500/40 resize-none min-h-[48px] max-h-32"
          />

          <button
            type="button"
            onClick={() => requireAuth(() => sendMessage())}
            disabled={loading || (!input.trim() && !imageUrl && !pendingDoc)}
            className="p-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl disabled:opacity-40 shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {allowVoice && (
          <button
            type="button"
            onClick={() => {
              const last = [...messages].reverse().find((m) => m.role === 'assistant');
              if (last && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(last.content.slice(0, 800));
                window.speechSynthesis.speak(u);
              }
            }}
            className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400"
          >
            <Volume2 className="w-3.5 h-3.5" /> Read last reply aloud
          </button>
        )}
      </div>
    </div>
  );
}
