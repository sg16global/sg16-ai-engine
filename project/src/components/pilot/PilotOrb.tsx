import { useEffect, useState } from 'react';
import { Bot, Pause, Play, Square, X, Sparkles } from 'lucide-react';
import { usePilotStore } from '../../core/pilotState';
import { useAppStore } from '../../core/appState';
import { pilotForWorkspace, SG16_SHIELD_RED } from '../../core/pilot';
import { isShieldWorkspace } from '../../core/pilot';

/**
 * Mandatory Pilot V1 UI — orb + panel.
 * Home/shield identity uses #800000; panel content stays B&W for clarity.
 */
export function PilotOrb() {
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

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-5 right-3 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-[min(92vw,360px)] rounded-2xl border border-white/15 bg-black text-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="w-4 h-4 shrink-0" style={{ color: SG16_SHIELD_RED }} />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">
                  {config?.name ?? 'SG16 AI Pilot'}
                </div>
                <div className="text-[10px] text-white/45">
                  Mandatory assistant · pause anytime
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 text-white/50 hover:text-white"
              aria-label="Close pilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-3 space-y-3">
            {config && (
              <p className="text-xs text-white/60 leading-relaxed">{config.enterHint}</p>
            )}

            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-white/35">
                Smart suggestions
              </div>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => (s.kind === 'action' ? runSuggestion(s) : undefined)}
                  className="w-full text-left text-xs rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] px-3 py-2 text-white/85"
                >
                  {s.text}
                </button>
              ))}
            </div>

            {config && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-white/35">
                  Quick actions
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {config.quickActions.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => startPilot(a.prompt, config.workspaceId)}
                      className="text-[11px] px-2.5 py-1.5 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/[0.08]"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {job && (
              <div className="rounded-xl border border-white/15 bg-white/[0.03] p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold">
                    {job.status === 'running' && '🟢 Pilot running'}
                    {job.status === 'paused' && '⏸ Paused'}
                    {job.status === 'done' && '✅ Complete'}
                    {job.status === 'stopped' && '⏹ Stopped'}
                  </div>
                  {job.estimatedMinutes != null && job.status === 'running' && (
                    <div className="text-[10px] text-white/40">~{job.estimatedMinutes} min</div>
                  )}
                </div>
                <div className="text-[11px] text-white/55 line-clamp-2">{job.title}</div>
                <ul className="space-y-1">
                  {job.steps.map((step) => (
                    <li key={step.id} className="text-[11px] flex items-center gap-2">
                      <span className="w-4 text-center">
                        {step.status === 'done' ? '✓' : step.status === 'active' ? '⏳' : '⬜'}
                      </span>
                      <span
                        className={
                          step.status === 'active'
                            ? 'text-white'
                            : step.status === 'done'
                              ? 'text-white/50'
                              : 'text-white/30'
                        }
                      >
                        {step.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 pt-1">
                  {job.status === 'running' && (
                    <button
                      type="button"
                      onClick={pausePilot}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] py-2 rounded-lg border border-white/15"
                    >
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}
                  {job.status === 'paused' && (
                    <button
                      type="button"
                      onClick={resumePilot}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] py-2 rounded-lg border border-white/15"
                    >
                      <Play className="w-3.5 h-3.5" /> Resume
                    </button>
                  )}
                  {(job.status === 'running' || job.status === 'paused') && (
                    <button
                      type="button"
                      onClick={stopPilot}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] py-2 rounded-lg border border-white/15"
                    >
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-white/35">
                Start AI Pilot
              </div>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={2}
                placeholder="Describe a multi-step task…"
                className="w-full rounded-xl bg-white/[0.04] border border-white/15 px-3 py-2 text-xs outline-none focus:border-white/35 resize-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!task.trim()) return;
                  startPilot(task.trim());
                  setTask('');
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl text-white"
                style={{ background: SG16_SHIELD_RED }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Start AI Pilot
              </button>
              <p className="text-[10px] text-white/30 leading-relaxed">
                Market Pilot never buys or sells. Voice wake (“Hey SG16”) comes in Phase 2.
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggleOpen}
        className={`relative flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full border text-white transition ${
          running ? 'animate-pulse' : ''
        }`}
        style={{
          background: '#0a0a0a',
          borderColor: SG16_SHIELD_RED,
          boxShadow: `0 0 20px ${SG16_SHIELD_RED}55`,
        }}
        aria-label="Open AI Pilot"
      >
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: SG16_SHIELD_RED }}
        >
          <Bot className="w-4 h-4 text-white" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider">Pilot</span>
        {badgeCount > 0 && !open && (
          <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>
    </div>
  );
}
