import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Download,
  Eye,
  EyeOff,
  FlaskConical,
  Loader2,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { useAiConfigStore } from '../../core/aiConfigStore';
import { useAppStore } from '../../core/appState';
import { APP_PATHS, pushAppPath } from '../../core/routes';
import { checkEngineHealth, useEngineHealth, useEngineStatus, type EngineStatus } from '../../lib/apiStatus';
import { readLaunchConfig, saveLaunchConfig, type LaunchConfig } from '../../lib/billingApi';
import {
  AI_PROVIDER_PRESETS,
  activeProvider,
  createProviderFromPreset,
  isProviderUsable,
  listProviderModels,
  modelForIntent,
  providerChain,
  testProvider,
  type AiProviderConfig,
  type ProviderTestResult,
} from '../../lib/ai';
import { Sg16Logo } from '../ui/Sg16Logo';

/**
 * Admin panel (/admin) — connect and manage the external AI APIs that power
 * every SG16 feature (chat, Pilot, Shields, student verification, images, voice).
 *
 * Fully self-contained: providers are configured here and stored on this
 * device (localStorage). API keys go straight from this browser to the
 * provider — there is no SG16 server in between. Switching providers or
 * models is a config change; every internal feature follows automatically
 * because they all call lib/ai/client.ts.
 */

const inputClass =
  'w-full bg-[#08080F] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#FF168D]/50 transition';
const labelClass = 'block text-[11px] text-gray-400 mb-1.5';
const primaryButtonClass =
  'inline-flex items-center gap-1.5 bg-[#FF168D] hover:bg-[#FF3DA5] disabled:opacity-50 disabled:cursor-not-allowed text-[#09060B] px-4 py-2 rounded-lg text-sm font-semibold transition';
const secondaryButtonClass =
  'inline-flex items-center gap-1.5 border border-white/10 hover:border-white/25 text-gray-300 px-3 py-2 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed';
const iconButtonClass =
  'inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition disabled:opacity-40 disabled:cursor-not-allowed';

type TestState = { status: 'idle' } | { status: 'testing' } | { status: 'done'; result: ProviderTestResult };

interface ProviderFormState {
  presetId: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  chat: string;
  coding: string;
  vision: string;
  audio: string;
  image: string;
  /** Comma-separated chat fallbacks. */
  fallbacks: string;
}

function formFromPreset(presetId: string): ProviderFormState {
  const preset = AI_PROVIDER_PRESETS.find((p) => p.id === presetId);
  const m = preset?.defaultModels;
  return {
    presetId,
    name: preset?.name ?? 'Custom provider',
    baseUrl: preset?.baseUrl ?? '',
    apiKey: '',
    chat: m?.chat ?? '',
    coding: m?.coding ?? '',
    vision: m?.vision ?? '',
    audio: m?.audio ?? '',
    image: m?.image ?? '',
    fallbacks: (m?.fallbacks ?? []).join(', '),
  };
}

function formFromProvider(provider: AiProviderConfig): ProviderFormState {
  return {
    presetId: provider.presetId,
    name: provider.name,
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
    chat: provider.models.chat,
    coding: provider.models.coding,
    vision: provider.models.vision,
    audio: provider.models.audio,
    image: provider.models.image,
    fallbacks: provider.models.fallbacks.join(', '),
  };
}

function parseFallbacks(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Build a provider instance from the form. `existing` keeps id/priority/enabled when editing. */
function buildProvider(form: ProviderFormState, existing?: AiProviderConfig): AiProviderConfig | null {
  const provider = createProviderFromPreset(form.presetId, {
    id: existing?.id,
    name: form.name.trim() || undefined,
    baseUrl: form.baseUrl.trim() || undefined,
    apiKey: form.apiKey.trim(),
    enabled: existing?.enabled ?? true,
    priority: existing?.priority ?? useAiConfigStore.getState().providers.length,
  });
  if (!provider) return null;
  provider.models = {
    chat: form.chat.trim(),
    coding: form.coding.trim(),
    vision: form.vision.trim(),
    audio: form.audio.trim(),
    image: form.image.trim(),
    fallbacks: parseFallbacks(form.fallbacks),
  };
  return provider;
}

function EnginePill({ status }: { status: EngineStatus }) {
  const online = status === 'checking' ? null : status === 'online';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
        online === null
          ? 'border-yellow-500/30 text-yellow-200'
          : online
            ? 'border-emerald-500/30 text-emerald-300'
            : 'border-[#FF526B]/40 text-[#FFB3BE]'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          online === null ? 'bg-yellow-300 animate-pulse' : online ? 'bg-emerald-400' : 'bg-[#FF526B]'
        }`}
      />
      {online === null ? 'CHECKING' : online ? 'ONLINE' : 'OFFLINE'}
    </span>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-[#0A0A12]/80 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-white">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-9 h-5 rounded-full transition ${checked ? 'bg-[#FF168D]' : 'bg-white/15'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

/** Number input that commits on blur; empty means null (use the workspace default). Free typing while focused. */
function NullableNumberInput({
  value,
  onCommit,
  min,
  max,
  step,
  placeholder,
}: {
  value: number | null;
  onCommit: (next: number | null) => void;
  min: number;
  max: number;
  step: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? (value === null ? '' : String(value));
  return (
    <input
      className={inputClass}
      type="number"
      min={min}
      max={max}
      step={step}
      value={display}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const raw = (draft ?? '').trim();
        if (raw === '') onCommit(null);
        else {
          const n = Number(raw);
          if (Number.isFinite(n)) onCommit(Math.min(max, Math.max(min, n)));
        }
        setDraft(null);
      }}
    />
  );
}

function StatusCard() {
  const providers = useAiConfigStore((s) => s.providers);
  const activeProviderId = useAiConfigStore((s) => s.activeProviderId);
  const liveSearch = useAiConfigStore((s) => s.options.liveSearch);
  const engineStatus = useEngineStatus();
  const health = useEngineHealth();

  const chain = useMemo(() => providerChain(providers), [providers]);
  const active = useMemo(() => activeProvider(providers, activeProviderId), [providers, activeProviderId]);
  const disabled = providers.filter((p) => !p.enabled);

  return (
    <Section
      title="Engine status"
      description="The engine is this browser plus the AI providers below — there is no SG16 server."
      action={
        <button type="button" onClick={() => void checkEngineHealth()} className={secondaryButtonClass}>
          <RefreshCw className="w-3.5 h-3.5" />
          Re-check
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <EnginePill status={engineStatus} />
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
            health.aiConfigured ? 'border-emerald-500/30 text-emerald-300' : 'border-[#FF526B]/40 text-[#FFB3BE]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${health.aiConfigured ? 'bg-emerald-400' : 'bg-[#FF526B]'}`} />
          {health.aiConfigured ? 'AI CONNECTED' : 'AI NOT SET UP'}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
            liveSearch ? 'border-emerald-500/30 text-emerald-300' : 'border-white/15 text-white/50'
          }`}
        >
          LIVE SEARCH {liveSearch ? 'ON' : 'OFF'}
        </span>
      </div>

      {active ? (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Active provider</p>
              <p className="text-sm font-semibold text-white truncate">{active.name}</p>
            </div>
            <span className="text-[11px] font-mono text-[#FF5CB8]">{modelForIntent(active, 'chat')}</span>
          </div>
          <p className="text-[11px] text-white/40 font-mono truncate">{active.baseUrl}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/15 p-4">
          <p className="text-sm text-white/70">No AI provider connected yet.</p>
          <p className="text-xs text-white/45 mt-1 leading-relaxed">
            Add one below — OpenAI, Qwen, DeepSeek, Anthropic, Gemini, Groq, Mistral, xAI, OpenRouter, a local
            Ollama, or any OpenAI-compatible endpoint. It takes under a minute.
          </p>
        </div>
      )}

      {chain.length > 1 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45 mb-2">Fallback chain (tried in order)</p>
          <ol className="space-y-1.5">
            {chain.map((provider, index) => (
              <li key={provider.id} className="flex items-center gap-2.5 text-sm">
                <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <span
                  className={`font-medium truncate ${provider.id === active?.id ? 'text-[#FF5CB8]' : 'text-white/80'}`}
                >
                  {provider.name}
                </span>
                <span className="text-xs text-white/40 font-mono truncate">{modelForIntent(provider, 'chat')}</span>
                {!isProviderUsable(provider) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-200 shrink-0">
                    incomplete
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {disabled.length > 0 && (
        <p className="text-xs text-white/40">Disabled (skipped by the chain): {disabled.map((p) => p.name).join(', ')}</p>
      )}
    </Section>
  );
}

function ProviderList({ onEdit }: { onEdit: (provider: AiProviderConfig) => void }) {
  const providers = useAiConfigStore((s) => s.providers);
  const activeProviderId = useAiConfigStore((s) => s.activeProviderId);
  const setProviderEnabled = useAiConfigStore((s) => s.setProviderEnabled);
  const setActiveProvider = useAiConfigStore((s) => s.setActiveProvider);
  const moveProvider = useAiConfigStore((s) => s.moveProvider);
  const removeProvider = useAiConfigStore((s) => s.removeProvider);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ProviderTestResult>>({});

  const ordered = useMemo(() => providerChain(providers), [providers]);
  const disabled = providers.filter((p) => !p.enabled);

  const runTest = async (provider: AiProviderConfig) => {
    setTestingId(provider.id);
    const result = await testProvider(provider);
    setResults((prev) => ({ ...prev, [provider.id]: result }));
    setTestingId(null);
    void checkEngineHealth();
  };

  const remove = (provider: AiProviderConfig) => {
    if (!window.confirm(`Remove "${provider.name}" from this device? Its API key is deleted with it.`)) return;
    removeProvider(provider.id);
    setResults((prev) => {
      const next = { ...prev };
      delete next[provider.id];
      return next;
    });
  };

  if (!providers.length) return null;

  const renderRow = (provider: AiProviderConfig, position: number | null) => {
    const active = provider.id === activeProviderId;
    const usable = isProviderUsable(provider);
    const testing = testingId === provider.id;
    const result = results[provider.id];

    return (
      <li key={provider.id}>
        <div
          className={`rounded-xl border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 ${
            active ? 'border-[#FF168D]/40 bg-[#FF168D]/5' : 'border-white/10 bg-black/30'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="pt-0.5">
              <Toggle
                checked={provider.enabled}
                onChange={(enabled) => setProviderEnabled(provider.id, enabled)}
                label={`Enable ${provider.name}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {position !== null && (
                  <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 flex items-center justify-center shrink-0">
                    {position + 1}
                  </span>
                )}
                <span
                  className={`text-sm font-semibold truncate ${provider.enabled ? 'text-white' : 'text-white/45'}`}
                >
                  {provider.name}
                </span>
                {active && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF168D]/20 text-[#FF5CB8] font-semibold shrink-0">
                    ACTIVE
                  </span>
                )}
                {!usable && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-200 shrink-0">
                    {provider.requiresKey && !provider.apiKey.trim() ? 'missing key' : 'incomplete'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 font-mono truncate mt-0.5">{provider.baseUrl}</p>
              <p className="text-[11px] text-white/50 mt-1">
                chat <span className="font-mono text-white/70">{provider.models.chat || '—'}</span>
                {' · '}code <span className="font-mono text-white/70">{provider.models.coding || provider.models.chat || '—'}</span>
                {' · '}vision <span className="font-mono text-white/70">{provider.models.vision || '—'}</span>
                {provider.models.audio && (
                  <>
                    {' · '}audio <span className="font-mono text-white/70">{provider.models.audio}</span>
                  </>
                )}
                {provider.models.image && (
                  <>
                    {' · '}image <span className="font-mono text-white/70">{provider.models.image}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveProvider(provider.id)}
              disabled={active}
              className={iconButtonClass}
              title="Make primary (first in the fallback chain)"
            >
              <Star className={`w-3.5 h-3.5 ${active ? 'fill-[#FF5CB8] text-[#FF5CB8]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => moveProvider(provider.id, -1)}
              className={iconButtonClass}
              title="Move up the chain"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => moveProvider(provider.id, 1)}
              className={iconButtonClass}
              title="Move down the chain"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(provider)}
              className={iconButtonClass}
              title="Edit provider"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void runTest(provider)}
              disabled={testing || !usable}
              className={iconButtonClass}
              title={usable ? 'Test connection' : 'Complete the provider first'}
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => remove(provider)}
              className={`${iconButtonClass} hover:border-[#FF526B]/40 hover:text-[#FF526B]`}
              title="Remove provider"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {result && (
          <div
            className={`mt-1.5 ml-1 text-xs flex items-start gap-1.5 ${
              result.ok ? 'text-emerald-300' : 'text-[#FFB3BE]'
            }`}
          >
            {result.ok ? (
              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            )}
            <span>
              {result.ok
                ? `Connected in ${result.latencyMs} ms via ${result.model}. Reply: "${result.sample}"`
                : result.error}
            </span>
          </div>
        )}
      </li>
    );
  };

  return (
    <Section
      title="Connected providers"
      description="Enabled providers form the fallback chain — the active one is tried first, then each model's fallbacks. Keys stay on this device."
    >
      <ul className="space-y-2">
        {ordered.map((provider, index) => renderRow(provider, index))}
        {disabled.map((provider) => renderRow(provider, null))}
      </ul>
    </Section>
  );
}

function ConnectProviderForm({
  editing,
  onEditingDone,
}: {
  editing: AiProviderConfig | null;
  onEditingDone: () => void;
}) {
  const upsertProvider = useAiConfigStore((s) => s.upsertProvider);
  const setActiveProvider = useAiConfigStore((s) => s.setActiveProvider);
  const activeProviderId = useAiConfigStore((s) => s.activeProviderId);

  const [form, setForm] = useState<ProviderFormState>(() => formFromPreset('openai'));
  const [showKey, setShowKey] = useState(false);
  const [testState, setTestState] = useState<TestState>({ status: 'idle' });
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Load the provider being edited into the form.
  useEffect(() => {
    if (!editing) return;
    setForm(formFromProvider(editing));
    setTestState({ status: 'idle' });
    setFetchedModels([]);
    setFetchAttempted(false);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editing]);

  const preset = AI_PROVIDER_PRESETS.find((p) => p.id === form.presetId);
  const candidate = useMemo(() => buildProvider(form, editing ?? undefined), [form, editing]);
  const formValid = Boolean(
    preset &&
      candidate &&
      form.name.trim() &&
      form.baseUrl.trim() &&
      (!preset.requiresKey || form.apiKey.trim()) &&
      form.chat.trim(),
  );

  const patch = (partial: Partial<ProviderFormState>) => setForm((prev) => ({ ...prev, ...partial }));

  const selectPreset = (presetId: string) => {
    setForm(formFromPreset(presetId));
    setTestState({ status: 'idle' });
    setFetchedModels([]);
    setFetchAttempted(false);
  };

  const fetchModels = async () => {
    if (!candidate) return;
    setFetchingModels(true);
    setFetchAttempted(true);
    const models = await listProviderModels(candidate);
    setFetchedModels(models);
    setFetchingModels(false);
  };

  const runTest = async () => {
    if (!candidate) return;
    setTestState({ status: 'testing' });
    const result = await testProvider(candidate);
    setTestState({ status: 'done', result });
    void checkEngineHealth();
  };

  const save = () => {
    if (!candidate) return;
    upsertProvider(candidate);
    if (!activeProviderId) setActiveProvider(candidate.id);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2500);
    onEditingDone();
    setForm(formFromPreset(form.presetId));
    setTestState({ status: 'idle' });
    setFetchedModels([]);
    setFetchAttempted(false);
    void checkEngineHealth();
  };

  return (
    <div ref={formRef}>
      <Section
        title={editing ? `Edit provider — ${editing.name}` : 'Connect an AI provider'}
        description="Pick a preset or enter any OpenAI-compatible endpoint. The key is stored only in this browser and sent straight to the provider."
        action={
          editing ? (
            <button type="button" onClick={onEditingDone} className={secondaryButtonClass}>
              <X className="w-3.5 h-3.5" />
              Cancel edit
            </button>
          ) : undefined
        }
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45 mb-2">Presets</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AI_PROVIDER_PRESETS.map((p) => {
              const selected = p.id === form.presetId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPreset(p.id)}
                  className={`text-left rounded-xl border p-3 transition ${
                    selected
                      ? 'border-[#FF168D]/50 bg-[#FF168D]/10'
                      : 'border-white/10 bg-black/30 hover:border-white/25'
                  }`}
                >
                  <p className={`text-xs font-semibold ${selected ? 'text-[#FF5CB8]' : 'text-white/85'}`}>{p.name}</p>
                  <p className="text-[10px] text-white/45 mt-0.5 leading-snug">{p.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={labelClass}>
            Display name
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="My Qwen"
            />
          </label>
          <label className={labelClass}>
            Base URL
            <input
              className={`${inputClass} font-mono`}
              value={form.baseUrl}
              onChange={(e) => patch({ baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            API key {preset?.requiresKey ? '(required)' : '(optional)'}
            <div className="relative">
              <input
                className={`${inputClass} pr-10 font-mono`}
                type={showKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={(e) => patch({ apiKey: e.target.value })}
                placeholder={preset?.requiresKey ? 'sk-…' : 'not needed for local endpoints'}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Models</p>
            <button
              type="button"
              onClick={() => void fetchModels()}
              disabled={!candidate || fetchingModels}
              className={secondaryButtonClass}
            >
              {fetchingModels ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Fetch models
            </button>
          </div>
          <datalist id="sg16-admin-model-list">
            {fetchedModels.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={labelClass}>
              Chat model
              <input
                className={`${inputClass} font-mono`}
                list="sg16-admin-model-list"
                value={form.chat}
                onChange={(e) => patch({ chat: e.target.value })}
                placeholder="gpt-4o-mini"
              />
            </label>
            <label className={labelClass}>
              Coding model <span className="text-white/30">(falls back to chat)</span>
              <input
                className={`${inputClass} font-mono`}
                list="sg16-admin-model-list"
                value={form.coding}
                onChange={(e) => patch({ coding: e.target.value })}
                placeholder="gpt-4o"
              />
            </label>
            <label className={labelClass}>
              Vision model <span className="text-white/30">(image questions, student ID)</span>
              <input
                className={`${inputClass} font-mono`}
                list="sg16-admin-model-list"
                value={form.vision}
                onChange={(e) => patch({ vision: e.target.value })}
                placeholder="gpt-4o-mini"
              />
            </label>
            <label className={labelClass}>
              Audio model <span className="text-white/30">(voice transcription)</span>
              <input
                className={`${inputClass} font-mono`}
                list="sg16-admin-model-list"
                value={form.audio}
                onChange={(e) => patch({ audio: e.target.value })}
                placeholder="whisper-1"
              />
            </label>
            <label className={labelClass}>
              Image model <span className="text-white/30">(image generation)</span>
              <input
                className={`${inputClass} font-mono`}
                list="sg16-admin-model-list"
                value={form.image}
                onChange={(e) => patch({ image: e.target.value })}
                placeholder="gpt-image-1"
              />
            </label>
            <label className={labelClass}>
              Chat fallbacks <span className="text-white/30">(comma separated)</span>
              <input
                className={`${inputClass} font-mono`}
                value={form.fallbacks}
                onChange={(e) => patch({ fallbacks: e.target.value })}
                placeholder="gpt-4o-mini, gpt-4o"
              />
            </label>
          </div>
          {fetchAttempted && !fetchingModels && fetchedModels.length === 0 && (
            <p className="text-[11px] text-white/40 mt-2">
              This endpoint did not list models — enter the model names manually.
            </p>
          )}
          {fetchedModels.length > 0 && (
            <p className="text-[11px] text-white/40 mt-2">
              {fetchedModels.length} model(s) available — start typing in a field to pick one.
            </p>
          )}
        </div>

        {testState.status === 'done' && (
          <div
            className={`rounded-xl border p-3 text-xs flex items-start gap-2 ${
              testState.result.ok
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
                : 'border-[#FF526B]/30 bg-[#FF526B]/5 text-[#FFB3BE]'
            }`}
          >
            {testState.result.ok ? (
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <X className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>
              {testState.result.ok
                ? `OK — ${testState.result.model} answered in ${testState.result.latencyMs} ms. "${testState.result.sample}"`
                : testState.result.error}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={save} disabled={!formValid} className={primaryButtonClass}>
            <Check className="w-3.5 h-3.5" />
            {savedFlash ? 'Saved' : editing ? 'Save changes' : 'Save provider'}
          </button>
          <button
            type="button"
            onClick={() => void runTest()}
            disabled={!formValid || testState.status === 'testing'}
            className={secondaryButtonClass}
          >
            {testState.status === 'testing' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FlaskConical className="w-3.5 h-3.5" />
            )}
            Test connection
          </button>
          {!formValid && (
            <span className="text-[11px] text-white/40">
              {preset?.requiresKey && !form.apiKey.trim()
                ? 'Enter an API key to continue.'
                : 'Name, base URL and a chat model are required.'}
            </span>
          )}
        </div>
      </Section>
    </div>
  );
}

function GenerationOptions() {
  const options = useAiConfigStore((s) => s.options);
  const setOptions = useAiConfigStore((s) => s.setOptions);

  return (
    <Section
      title="Generation options"
      description="Applied to every AI call in the app. Leave a field empty to use each workspace's own default."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className={labelClass}>
          Temperature (0–2, empty = default)
          <NullableNumberInput
            value={options.temperature}
            onCommit={(temperature) => setOptions({ temperature })}
            min={0}
            max={2}
            step={0.1}
            placeholder="default"
          />
        </label>
        <label className={labelClass}>
          Max tokens (empty = default)
          <NullableNumberInput
            value={options.maxTokens}
            onCommit={(maxTokens) => setOptions({ maxTokens })}
            min={1}
            max={1000000}
            step={1}
            placeholder="default"
          />
        </label>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-gray-300 min-w-0">
            Live web search
            <span className="block text-[11px] text-white/40 mt-0.5">
              Time-sensitive questions get fresh news/web context via the edge functions.
            </span>
          </div>
          <Toggle
            checked={options.liveSearch}
            onChange={(liveSearch) => setOptions({ liveSearch })}
            label="Live web search"
          />
        </div>
      </div>
    </Section>
  );
}

function LaunchConfigSection() {
  const [config, setConfig] = useState<LaunchConfig>(() => readLaunchConfig());
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveLaunchConfig(config);
    // Refresh the app store so the new launch settings apply immediately.
    void useAppStore.getState().loadPublicConfig();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Section
      title="Launch & billing (this device)"
      description="Local launch settings. There is no payment server — checkout stays off until a payment provider is connected."
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-gray-300 min-w-0">
            Launch mode — all features free unlimited
            <span className="block text-[11px] text-white/40 mt-0.5">Turn off when paid plans begin.</span>
          </div>
          <Toggle
            checked={config.launchFree}
            onChange={(launchFree) => setConfig((c) => ({ ...c, launchFree }))}
            label="Launch mode"
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-gray-300 min-w-0">
            Checkout enabled
            <span className="block text-[11px] text-white/40 mt-0.5">
              Only meaningful once a payment provider is wired up.
            </span>
          </div>
          <Toggle
            checked={config.checkoutEnabled}
            onChange={(checkoutEnabled) => setConfig((c) => ({ ...c, checkoutEnabled }))}
            label="Checkout enabled"
          />
        </div>
        <label className={labelClass}>
          Launch message shown in the app
          <textarea
            className={`${inputClass} min-h-[70px] resize-y`}
            value={config.launchMessage}
            onChange={(e) => setConfig((c) => ({ ...c, launchMessage: e.target.value }))}
          />
        </label>
        <div>
          <button type="button" onClick={save} className={primaryButtonClass}>
            <Check className="w-3.5 h-3.5" />
            {saved ? 'Saved' : 'Save launch settings'}
          </button>
        </div>
      </div>
    </Section>
  );
}

function BackupSection() {
  const exportConfig = useAiConfigStore((s) => s.exportConfig);
  const importConfig = useAiConfigStore((s) => s.importConfig);
  const resetToDefaults = useAiConfigStore((s) => s.resetToDefaults);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (tone: 'ok' | 'error', text: string) => {
    setMessage({ tone, text });
    window.setTimeout(() => setMessage(null), 5000);
  };

  const exportToFile = () => {
    const blob = new Blob([exportConfig()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sg16-ai-config.json';
    a.click();
    URL.revokeObjectURL(url);
    flash('ok', 'Config exported as sg16-ai-config.json — it contains your API keys, keep it private.');
  };

  const importFromFile = async (file: File) => {
    try {
      const text = await file.text();
      const result = importConfig(text);
      if (result.ok) flash('ok', 'Config imported — providers restored on this device.');
      else flash('error', result.error);
      void checkEngineHealth();
    } catch {
      flash('error', 'Could not read that file.');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const reset = () => {
    if (
      !window.confirm('Reset the AI configuration to defaults? All connected providers and keys on this device are removed.')
    ) {
      return;
    }
    resetToDefaults();
    flash('ok', 'Configuration reset to defaults.');
    void checkEngineHealth();
  };

  return (
    <Section
      title="Backup & reset"
      description="The config (including API keys) lives only in this browser. Export it to move it to another device."
    >
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={exportToFile} className={secondaryButtonClass}>
          <Download className="w-3.5 h-3.5" />
          Export config
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className={secondaryButtonClass}>
          <Upload className="w-3.5 h-3.5" />
          Import config
        </button>
        <button
          type="button"
          onClick={reset}
          className={`${secondaryButtonClass} hover:border-[#FF526B]/40 hover:text-[#FF526B]`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Reset to defaults
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importFromFile(file);
          }}
        />
      </div>
      {message && (
        <p className={`text-xs ${message.tone === 'ok' ? 'text-emerald-300' : 'text-[#FFB3BE]'}`}>{message.text}</p>
      )}
    </Section>
  );
}

export function AdminApp() {
  const hydrate = useAiConfigStore((s) => s.hydrate);
  const hydrated = useAiConfigStore((s) => s.hydrated);
  const providers = useAiConfigStore((s) => s.providers);
  const engineStatus = useEngineStatus();
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    void checkEngineHealth();
  }, [hydrate]);

  const editing = useMemo(() => providers.find((p) => p.id === editingId) ?? null, [providers, editingId]);

  return (
    <div className="sg16-app-shell min-h-[100dvh] bg-[#050507] text-white">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Sg16Logo className="w-11 h-11 rounded-xl shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight">SG16 Admin</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Connect the AI APIs that power every shield — no server involved.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <EnginePill status={engineStatus} />
            <button type="button" onClick={() => pushAppPath(APP_PATHS.app)} className={secondaryButtonClass}>
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to app
            </button>
          </div>
        </header>

        {!hydrated ? (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading configuration…
          </div>
        ) : (
          <>
            <StatusCard />
            <ProviderList onEdit={(provider) => setEditingId(provider.id)} />
            <ConnectProviderForm editing={editing} onEditingDone={() => setEditingId(null)} />
            <GenerationOptions />
            <LaunchConfigSection />
            <BackupSection />
          </>
        )}

        <footer className="pt-2 pb-4 text-[11px] text-white/35 leading-relaxed">
          SG16 AI Engine is self-contained: API keys are stored in this browser's localStorage and sent directly to
          the provider you connect. Nothing is sent to an SG16 server — there isn't one. Clearing site data removes
          this configuration.
        </footer>
      </div>
    </div>
  );
}

export default AdminApp;
