import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity, ArrowLeft, Brain, CheckCircle2, Cpu, Database, Globe, KeyRound, Loader2, LogOut, Menu, PanelLeft,
  Plug, RefreshCw, Server, ShieldCheck, X, XCircle,
} from 'lucide-react';
import { useAutoHideChrome } from '../../hooks/useAutoHideChrome';
import { ApiError } from '../../lib/apiClient';
import {
  adminLogin, changeAdminPassword, fetchAdminStatus, loadAdminToken, saveAdminToken, saveConnection, testConnection,
  type AdminStatus, type BrainProbe, type ConnectionInput,
} from '../../lib/adminApi';

type Section = 'status' | 'connect' | 'security';

const SECTIONS: { id: Section; label: string; icon: typeof Activity; hint: string }[] = [
  { id: 'status', label: 'Live status', icon: Activity, hint: 'Engine, AI brain, search, database' },
  { id: 'connect', label: 'Connect AI API', icon: Plug, hint: 'VPS, SG16 Brain or any OpenAI-style API' },
  { id: 'security', label: 'Security', icon: ShieldCheck, hint: 'Change admin password' },
];

const PRESETS: { label: string; url: string; model: string; note: string }[] = [
  { label: 'VPS (Ollama)', url: 'http://YOUR-VPS-IP:11434/v1', model: 'mistral:7b-instruct', note: 'No key needed. Model = a name from `ollama list`.' },
  { label: 'SG16 Brain', url: 'https://mistralbrain.com/api/brain', model: '', note: 'Paste your sg16p_ project key.' },
  { label: 'OpenAI-style API', url: 'https://api.openai.com/v1', model: 'gpt-4o-mini', note: 'Groq, OpenRouter, Mistral… use their base URL and key.' },
];

const STATUS_REFRESH_MS = 30_000;

function errorText(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong';
}

function ago(ts?: number) {
  if (!ts) return '';
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function uptime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

// ── Small pieces ─────────────────────────────────────────────────────────────

type Tone = 'ok' | 'bad' | 'idle' | 'busy';

function Dot({ tone }: { tone: Tone }) {
  const color = { ok: 'bg-emerald-400', bad: 'bg-[#FF526B]', idle: 'bg-white/30', busy: 'bg-amber-300' }[tone];
  return (
    <span className="relative flex h-2.5 w-2.5">
      {tone === 'ok' && <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-60 animate-ping`} />}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

function StatusBox({
  icon: Icon, title, tone, value, detail, children,
}: { icon: typeof Activity; title: string; tone: Tone; value: string; detail?: ReactNode; children?: ReactNode }) {
  const border = { ok: 'border-emerald-400/30', bad: 'border-[#FF526B]/40', idle: 'border-white/10', busy: 'border-amber-300/30' }[tone];
  return (
    <div className={`sg16-card p-4 sm:p-5 border ${border} flex flex-col gap-2 min-h-[8.5rem]`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
          <Icon className="w-4 h-4 text-[#FF5CB8]" /> {title}
        </span>
        <Dot tone={tone} />
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
      {detail && <div className="text-xs text-white/50 leading-relaxed break-words">{detail}</div>}
      {children}
    </div>
  );
}

function ProbeResult({ probe }: { probe: BrainProbe }) {
  return probe.ok ? (
    <div className="flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] p-3 text-sm text-emerald-200">
      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
      <span>
        <strong>Active</strong> — the AI answered in {((probe.latencyMs ?? 0) / 1000).toFixed(1)}s
        {probe.model ? ` · model ${probe.model}` : ''}.
      </span>
    </div>
  ) : (
    <div className="flex items-start gap-2 rounded-xl border border-[#FF526B]/40 bg-[#FF526B]/[0.08] p-3 text-sm text-[#FFB3BF]">
      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>
        <strong>Not answering</strong> — {probe.error || 'no reply'}
      </span>
    </div>
  );
}

const inputClass =
  'w-full bg-black/40 border border-white/10 focus:border-[#FF168D]/50 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30';

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-white/70">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-white/40">{hint}</span>}
    </label>
  );
}

// ── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { token } = await adminLogin(email, password);
      onLogin(token);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="sg16-card w-full max-w-sm p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-[#FF168D]/15 border border-[#FF168D]/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#FF5CB8]" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-white">SG16 Admin</h1>
            <p className="text-xs text-white/45">Owner sign-in</p>
          </div>
        </div>
        <Field label="Email">
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Password">
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </Field>
        {error && <div className="sg16-bar-error text-sm">{error}</div>}
        <button type="submit" disabled={busy} className="w-full sg16-send rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Sign in
        </button>
        <a href="/app" className="block text-center text-xs text-white/40 hover:text-[#FF5CB8]">← Back to SG16 AI Engine</a>
      </form>
    </div>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

function StatusSection({ status, refreshing, onRefresh }: { status: AdminStatus | null; refreshing: boolean; onRefresh: () => void }) {
  if (!status) {
    return (
      <div className="flex items-center gap-2 text-white/50 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading status…
      </div>
    );
  }
  const { ai, brain } = status;
  const brainTone: Tone = refreshing ? 'busy' : !ai.connected ? 'idle' : brain?.ok ? 'ok' : 'bad';
  const db = status.database;
  const dbTone: Tone = db.ok ? 'ok' : db.enabled ? 'bad' : 'idle';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/50">Refreshes every 30 seconds. "Check now" asks the AI a test question.</p>
        <button type="button" onClick={onRefresh} disabled={refreshing} className="sg16-bar-soft !py-2 inline-flex items-center gap-2 text-xs text-white/80 hover:text-white disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Check now
        </button>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatusBox
          icon={Brain}
          title="AI brain"
          tone={brainTone}
          value={refreshing ? 'Checking…' : !ai.connected ? 'Not connected' : brain?.ok ? 'Active' : 'Not answering'}
          detail={
            ai.connected ? (
              <>
                {brain?.ok ? `Answered in ${((brain.latencyMs ?? 0) / 1000).toFixed(1)}s` : brain?.error}
                {brain?.checkedAt ? ` · checked ${ago(brain.checkedAt)}` : ''}
              </>
            ) : (
              'Open "Connect AI API" to connect your VPS or brain.'
            )
          }
        />
        <StatusBox
          icon={Plug}
          title="Connection"
          tone={ai.connected ? 'ok' : 'idle'}
          value={ai.connected ? (ai.format === 'sg16-brain' ? 'SG16 Brain' : 'OpenAI-style API') : 'None'}
          detail={
            ai.connected ? (
              <>
                <span className="font-mono text-white/70">{ai.url}</span>
                <br />
                Model {ai.model || '—'} · Key {ai.keySet ? ai.keyHint : 'none'}
                {ai.savedFromPanel ? ' · set in this panel' : ' · from server settings'}
              </>
            ) : (
              `Engine is using: ${ai.activeProvider ?? 'nothing'}`
            )
          }
        />
        <StatusBox
          icon={Server}
          title="Engine"
          tone="ok"
          value="Online"
          detail={`Up ${uptime(status.engine.uptimeSec)} · Node ${status.engine.node}`}
        />
        <StatusBox
          icon={Globe}
          title="Live web search"
          tone={status.liveSearch === 'ready' ? 'ok' : 'idle'}
          value={status.liveSearch === 'ready' ? 'Ready' : 'Off'}
          detail="News, weather and current events"
        />
        <StatusBox
          icon={Database}
          title="Database"
          tone={dbTone}
          value={db.ok ? 'Connected' : db.enabled ? 'Error' : 'Not used'}
          detail={
            db.ok
              ? `PostgreSQL · ${db.users ?? 0} users`
              : db.enabled
                ? db.error
                : 'No DATABASE_URL. Fine: chats stay on users’ devices by design.'
          }
        />
        <StatusBox icon={Cpu} title="Signed in as" tone="ok" value="Owner" detail={status.adminEmail} />
      </div>
    </div>
  );
}

function ConnectSection({ token, status, onSaved }: { token: string; status: AdminStatus | null; onSaved: () => void }) {
  const ai = status?.ai;
  const [form, setForm] = useState<ConnectionInput>({ url: '', key: '', model: '', visionModel: '', keepKey: true });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState<'test' | 'save' | null>(null);
  const [probe, setProbe] = useState<BrainProbe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!touched && ai) {
      setForm((f) => ({ ...f, url: ai.url ?? '', model: ai.model ?? '', visionModel: ai.visionModel ?? '' }));
    }
  }, [ai, touched]);

  const update = (patch: Partial<ConnectionInput>) => {
    setTouched(true);
    setSaved(false);
    setProbe(null);
    setForm((f) => ({ ...f, ...patch }));
  };

  const run = async (kind: 'test' | 'save') => {
    setBusy(kind);
    setError(null);
    setProbe(null);
    try {
      if (kind === 'test') {
        setProbe((await testConnection(token, form)).brain);
      } else {
        const res = await saveConnection(token, form);
        setProbe(res.brain);
        setSaved(true);
        setTouched(false);
        setForm((f) => ({ ...f, key: '' }));
        onSaved();
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="sg16-card p-4 sm:p-5 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-white/40">Quick fill</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => update({ url: p.url, model: p.model })}
              title={p.note}
              className="px-3 py-1.5 rounded-full text-xs border border-[#FF168D]/30 bg-[#FF168D]/10 text-[#FFD0E8] hover:bg-[#FF168D]/20"
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-white/40">
          {PRESETS.find((p) => p.url === form.url)?.note ?? 'Pick one, then replace the parts in CAPITALS.'}
        </p>
      </div>

      <form
        className="sg16-card p-4 sm:p-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run('save');
        }}
      >
        <Field label="AI API URL" hint="Ollama on a VPS: http://IP:11434/v1 · SG16 Brain: ends with /api/brain">
          <input value={form.url} onChange={(e) => update({ url: e.target.value })} placeholder="http://YOUR-VPS-IP:11434/v1" className={`${inputClass} font-mono`} required />
        </Field>
        <Field
          label="API key"
          hint={ai?.keySet ? `A key is saved (${ai.keyHint}). Leave blank to keep it.` : 'Leave blank if your API needs no key (e.g. Ollama).'}
        >
          <input
            type="password"
            autoComplete="off"
            value={form.key}
            onChange={(e) => update({ key: e.target.value })}
            placeholder={ai?.keySet ? `Saved key ${ai.keyHint}` : 'Optional'}
            className={`${inputClass} font-mono`}
          />
        </Field>
        {ai?.keySet && !form.key && (
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input type="checkbox" checked={!form.keepKey} onChange={(e) => update({ keepKey: !e.target.checked })} />
            Remove the saved key
          </label>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Model" hint="Not needed for SG16 Brain">
            <input value={form.model} onChange={(e) => update({ model: e.target.value })} placeholder="mistral:7b-instruct" className={`${inputClass} font-mono`} />
          </Field>
          <Field label="Vision model (optional)" hint="For photo questions">
            <input value={form.visionModel} onChange={(e) => update({ visionModel: e.target.value })} placeholder="llava" className={`${inputClass} font-mono`} />
          </Field>
        </div>

        {error && <div className="sg16-bar-error text-sm">{error}</div>}
        {probe && <ProbeResult probe={probe} />}
        {saved && (
          <p className="text-xs text-emerald-300/90">
            Saved. Every shield now uses this connection, and it stays after restarts.
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => void run('test')}
            disabled={!!busy || !form.url.trim()}
            className="sg16-bar-soft !py-2.5 inline-flex items-center gap-2 text-sm text-white/85 hover:text-white disabled:opacity-40"
          >
            {busy === 'test' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Test connection
          </button>
          <button type="submit" disabled={!!busy || !form.url.trim()} className="sg16-send rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40">
            {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
            Save &amp; connect
          </button>
        </div>
        <p className="text-[11px] text-white/35">
          A slow or sleeping AI can take up to a minute to answer the first test.
        </p>
      </form>
    </div>
  );
}

function SecuritySection({ token, onToken }: { token: string; onToken: (t: string) => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setMsg({ ok: false, text: 'The new passwords do not match.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await changeAdminPassword(token, current, next);
      onToken(res.token);
      setCurrent('');
      setNext('');
      setConfirm('');
      setMsg({ ok: true, text: 'Password changed. Other signed-in admin tabs are signed out.' });
    } catch (err) {
      setMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="sg16-card p-4 sm:p-5 space-y-4 max-w-md">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <KeyRound className="w-4 h-4 text-[#FF5CB8]" /> Change admin password
      </div>
      <Field label="Current password">
        <input type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
      </Field>
      <Field label="New password" hint="At least 10 characters.">
        <input type="password" autoComplete="new-password" required minLength={10} value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Repeat new password">
        <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
      </Field>
      {msg && <div className={msg.ok ? 'text-sm text-emerald-300' : 'sg16-bar-error text-sm'}>{msg.text}</div>}
      <button type="submit" disabled={busy} className="sg16-send rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Change password
      </button>
    </form>
  );
}

// ── Shell with the auto open/close side panel ────────────────────────────────

function useIsDesktop() {
  const query = '(min-width: 1024px)';
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const on = () => setDesktop(mql.matches);
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, []);
  return desktop;
}

export function AdminApp() {
  const [token, setToken] = useState<string | null>(() => loadAdminToken());
  const [section, setSection] = useState<Section>('status');
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktop = useIsDesktop();
  const chrome = useAutoHideChrome(`admin-${section}`, desktop);

  useEffect(() => {
    document.title = 'SG16 Admin';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const signIn = (t: string) => {
    saveAdminToken(t);
    setToken(t);
  };

  const signOut = useCallback(() => {
    saveAdminToken(null);
    setToken(null);
    setStatus(null);
  }, []);

  const load = useCallback(
    async (probe = false) => {
      if (!token) return;
      if (probe) setRefreshing(true);
      try {
        setStatus(await fetchAdminStatus(token, probe));
        setLoadError(null);
      } catch (err) {
        if (err instanceof ApiError && err.unauthorized) signOut();
        else setLoadError(errorText(err));
      } finally {
        if (probe) setRefreshing(false);
      }
    },
    [token, signOut],
  );

  useEffect(() => {
    if (!token) return;
    void load();
    const timer = window.setInterval(() => void load(), STATUS_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [token, load]);

  const active = useMemo(() => SECTIONS.find((s) => s.id === section)!, [section]);

  if (!token) return <LoginScreen onLogin={signIn} />;

  const brainTone: Tone = !status ? 'idle' : !status.ai.connected ? 'idle' : status.brain?.ok ? 'ok' : 'bad';

  const nav = (
    <nav className="flex flex-col h-full p-3 gap-1.5">
      <div className="flex items-center gap-2.5 px-2 py-3">
        <span className="w-9 h-9 rounded-2xl bg-[#FF168D]/15 border border-[#FF168D]/30 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-[#FF5CB8]" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">SG16 Admin</div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/45">
            <Dot tone={brainTone} /> AI {brainTone === 'ok' ? 'active' : brainTone === 'bad' ? 'down' : 'not connected'}
          </div>
        </div>
      </div>
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => {
            setSection(s.id);
            setMobileOpen(false);
            chrome.onNavSelect();
          }}
          className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition border ${
            s.id === section ? 'bg-[#FF168D]/12 border-[#FF168D]/35 text-white' : 'border-transparent text-white/70 hover:bg-white/[0.04]'
          }`}
        >
          <s.icon className="w-4 h-4 mt-0.5 text-[#FF5CB8] shrink-0" />
          <span>
            <span className="block text-sm">{s.label}</span>
            <span className="block text-[11px] text-white/40">{s.hint}</span>
          </span>
        </button>
      ))}
      <div className="mt-auto space-y-1.5">
        <a href="/app" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/55 hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5" /> Open SG16 app
        </a>
        <button type="button" onClick={signOut} className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/55 hover:text-[#FF526B]">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="relative h-screen overflow-hidden flex">
      {/* Desktop: side panel opens on edge hover / Menu tab and closes by itself. */}
      {desktop && !chrome.open && (
        <button
          type="button"
          className="sg16-chrome-tab sg16-chrome-tab--left flex"
          onMouseEnter={chrome.openChrome}
          onFocus={chrome.openChrome}
          onClick={chrome.openChrome}
          aria-label="Open admin menu"
        >
          <PanelLeft className="h-3.5 w-3.5" />
          <span>Menu</span>
        </button>
      )}
      {desktop && <div className="absolute left-0 top-0 bottom-0 w-2 z-40" onMouseEnter={chrome.openChrome} aria-hidden />}
      {desktop && (
        <aside
          className={`absolute z-50 left-0 top-0 bottom-0 w-72 border-r border-[#FF168D]/20 transition-transform duration-300 ${
            chrome.open ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ background: 'rgba(14, 11, 20, 0.97)' }}
          onMouseEnter={chrome.onChromeEnter}
          onMouseLeave={chrome.onChromeLeave}
        >
          {nav}
        </aside>
      )}

      {/* Phone: menu button opens a drawer. */}
      {!desktop && mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="w-72 h-full border-r border-[#FF168D]/20" style={{ background: '#0E0B14' }}>
            {nav}
          </aside>
          <button type="button" aria-label="Close menu" className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-5 sm:py-8 space-y-5">
          <header className="sg16-bar flex items-start gap-3">
            {!desktop && (
              <button type="button" onClick={() => setMobileOpen((o) => !o)} className="p-1 -ml-1 text-white/70" aria-label="Menu">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <span className="mt-1 h-8 w-1 rounded-full shrink-0 bg-[#FF168D]" aria-hidden />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">{active.label}</h1>
              <p className="text-sm text-white/45 mt-0.5">{active.hint}</p>
            </div>
            <span className="hidden sm:flex items-center gap-2 text-xs text-white/50 mt-1.5">
              <Dot tone={brainTone} /> AI {brainTone === 'ok' ? 'active' : brainTone === 'bad' ? 'down' : 'not connected'}
            </span>
          </header>

          {loadError && <div className="sg16-bar-error text-sm">{loadError}</div>}

          {section === 'status' && <StatusSection status={status} refreshing={refreshing} onRefresh={() => void load(true)} />}
          {section === 'connect' && <ConnectSection token={token} status={status} onSaved={() => void load()} />}
          {section === 'security' && <SecuritySection token={token} onToken={signIn} />}
        </div>
      </main>
    </div>
  );
}

export default AdminApp;
