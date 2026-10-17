import { useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Circle,
  CircleStop,
  Loader2,
  Pause,
  PauseCircle,
  Play,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { usePilotStore } from '../../core/pilotState';
import { useAppStore } from '../../core/appState';
import { isShieldWorkspace, pilotForWorkspace, type PilotJob } from '../../core/pilot';

const JOB_STATUS: Record<Exclude<PilotJob['status'], 'idle'>, { label: string; icon: typeof Bot; tone: string }> = {
  running: { label: 'Pilot running', icon: Loader2, tone: 'text-[#38D9A9]' },
  paused: { label: 'Paused', icon: PauseCircle, tone: 'text-[#FFB547]' },
  done: { label: 'Complete', icon: CheckCircle2, tone: 'text-[#38D9A9]' },
  stopped: { label: 'Stopped', icon: CircleStop, tone: 'text-white/60' },
};

interface PilotOrbProps {
  /**
   * Show the floating PILOT launcher. Shield Home opens Pilot from its status
   * bar instead, so it renders the panel docked above that bar.
   */
  launcher?: boolean;
}

/** Mandatory Pilot V1 UI — neon launcher + panel, available in every shield. */
export function PilotOrb({ launcher = true }: PilotOrbProps) {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const open = usePilotStore((s) => s.open);
  const badgeCount = usePilotStore((s) => s.badgeCount);
  const job = usePilotStore((s) => s.job);
  const suggestions = usePilotStore((s) => s.suggestions);
  const toggleOpen = usePilotStore((s) => s.toggleOpen);
  const setOpen = usePilotStore((s) => s.setOpen);
  const refreshSuggestions = usePilotStore((s) => s.refreshSuggestions);
  const startPilot = usePilotStore((s) => s.startPilot);
  const pausePilot = usePilotStore((s) => s.pausePilot);
  const resumePilot = usePilotStore((s) => s.resumePilot);
  const stopPilot = usePilotStore((s) => s.stopPilot);
  const runSuggestion = usePilotStore((s) => s.runSuggestion);
  const [task, setTask] = useState('');

  useEffect(() => {
    refreshSuggestions(currentWorkspace);
  }, [currentWorkspace, refreshSuggestions]);

  const config = pilotForWorkspace(
    isShieldWorkspace(currentWorkspace) ? currentWorkspace : 'general',
  );
  const running = job?.status === 'running';
  const status = job && job.status !== 'idle' ? JOB_STATUS[job.status] : null;

  const submitTask = () => {
    if (!task.trim()) return;
    startPilot(task.trim());
    setTask('');
  };

  const position = launcher
    ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-5 left-3 right-auto lg:left-auto lg:right-3 items-start lg:items-end'
    : 'bottom-[calc(7rem+env(safe-area-inset-bottom))] min-[761px]:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 items-end';

  if (!launcher && !open) return null;

  return (
    <div className={`fixed z-40 flex flex-col gap-2 ${position}`}>
      {open && (
        <section className="sg16-pilot-panel w-[min(92vw,360px)]" aria-label={config?.name ?? 'SG16 AI Pilot'}>
          <header className="sg16-pilot-panel__head">
            <span className="sg16-pilot-panel__icon">
              <Bot className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold truncate">{config?.name ?? 'SG16 AI Pilot'}</div>
              <div className="text-[10.5px] text-white/55 truncate">
                {config?.tagline ?? 'Powered by SG16 AI'} · pause anytime
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]"
              aria-label="Close pilot"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="max-h-[min(64vh,600px)] overflow-y-auto p-3.5 space-y-4">
            {config && <p className="text-xs text-white/75 leading-relaxed">{config.enterHint}</p>}

            {config && (
              <div className="space-y-2">
                <div className="sg16-pilot-label">Quick actions</div>
                <div className="flex flex-wrap gap-1.5">
                  {config.quickActions.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => startPilot(a.prompt, config.workspaceId)}
                      className="sg16-pilot-chip"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <div className="sg16-pilot-label">Across your shields</div>
                {suggestions.map((s) =>
                  s.kind === 'action' ? (
                    <button key={s.id} type="button" onClick={() => runSuggestion(s)} className="sg16-pilot-row">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#FF168D]" />
                      <span>{s.text}</span>
                    </button>
                  ) : (
                    <p key={s.id} className="text-xs text-white/60 px-1">
                      {s.text}
                    </p>
                  ),
                )}
              </div>
            )}

            {job && status && (
              <div className="sg16-pilot-job">
                <div className="flex items-center justify-between gap-2">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${status.tone}`}>
                    <status.icon className={`w-4 h-4 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                    {status.label}
                  </div>
                  {job.estimatedMinutes != null && job.status === 'running' && (
                    <div className="text-[10px] text-white/50">~{job.estimatedMinutes} min</div>
                  )}
                </div>
                <div className="text-[11px] text-white/65 line-clamp-2">{job.title}</div>
                <ul className="space-y-1">
                  {job.steps.map((step) => (
                    <li key={step.id} className="text-[11px] flex items-center gap-2">
                      {step.status === 'done' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#38D9A9]" />
                      ) : step.status === 'active' ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#FF168D] animate-spin" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-white/25" />
                      )}
                      <span
                        className={
                          step.status === 'active'
                            ? 'text-white'
                            : step.status === 'done'
                              ? 'text-white/55'
                              : 'text-white/35'
                        }
                      >
                        {step.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 pt-1">
                  {job.status === 'running' && (
                    <button type="button" onClick={pausePilot} className="sg16-pilot-ctl">
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}
                  {job.status === 'paused' && (
                    <button type="button" onClick={resumePilot} className="sg16-pilot-ctl">
                      <Play className="w-3.5 h-3.5" /> Resume
                    </button>
                  )}
                  {(job.status === 'running' || job.status === 'paused') && (
                    <button type="button" onClick={stopPilot} className="sg16-pilot-ctl">
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="sg16-pilot-label">Start AI Pilot</div>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitTask();
                }}
                rows={2}
                placeholder="Describe a multi-step task…"
                className="sg16-pilot-input"
              />
              <button
                type="button"
                onClick={submitTask}
                disabled={!task.trim()}
                className="sg16-btn-primary w-full inline-flex items-center justify-center gap-1.5 text-xs py-2.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Start AI Pilot
              </button>
              <p className="text-[10px] text-white/40 leading-relaxed">
                {config?.pilotId === 'market' && 'Market Pilot never buys or sells. '}
                Voice wake (“Hey SG16”) comes in Phase 2.
              </p>
            </div>
          </div>
        </section>
      )}

      {launcher && (
        <button
          type="button"
          onClick={toggleOpen}
          className={`sg16-pilot-launcher ${running ? 'sg16-pilot-launcher--running' : ''}`}
          aria-label={open ? 'Close AI Pilot' : 'Open AI Pilot'}
          aria-expanded={open}
        >
          <span className="sg16-pilot-launcher__orb">
            <Bot className="w-4 h-4" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider">Pilot</span>
          {badgeCount > 0 && !open && <span className="sg16-pilot-badge">{badgeCount > 9 ? '9+' : badgeCount}</span>}
        </button>
      )}
    </div>
  );
}
