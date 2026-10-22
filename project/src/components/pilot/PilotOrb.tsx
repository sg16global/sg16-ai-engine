import { useEffect, useState } from 'react';
import { Bot, Clock, MessageSquare, Send, X } from 'lucide-react';
import { usePilotStore } from '../../core/pilotState';
import { useAppStore } from '../../core/appState';
import { isShieldWorkspace, pilotForWorkspace } from '../../core/pilot';

interface PilotOrbProps {
  /**
   * Show the floating PILOT launcher. Shield Home opens Pilot from its status
   * bar instead, so it renders the panel docked above that bar.
   */
  launcher?: boolean;
}

/** Pilot: quick AI actions for the current shield + reminders from the user's own saved data. */
export function PilotOrb({ launcher = true }: PilotOrbProps) {
  const currentWorkspace = useAppStore((s) => s.currentWorkspace);
  const threads = useAppStore((s) => s.chatThreads);
  const open = usePilotStore((s) => s.open);
  const badgeCount = usePilotStore((s) => s.badgeCount);
  const reminders = usePilotStore((s) => s.reminders);
  const toggleOpen = usePilotStore((s) => s.toggleOpen);
  const setOpen = usePilotStore((s) => s.setOpen);
  const refreshReminders = usePilotStore((s) => s.refreshReminders);
  const runReminder = usePilotStore((s) => s.runReminder);
  const ask = usePilotStore((s) => s.ask);
  const [task, setTask] = useState('');

  // Reminders follow the clock (next class, next dose) and the user's data.
  useEffect(() => {
    refreshReminders();
    const t = window.setInterval(refreshReminders, 60_000);
    return () => window.clearInterval(t);
  }, [currentWorkspace, threads, open, refreshReminders]);

  const config = pilotForWorkspace(isShieldWorkspace(currentWorkspace) ? currentWorkspace : 'general');

  const submitTask = () => {
    if (!task.trim() || !config) return;
    ask(config.workspaceId, task.trim());
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
              <div className="text-[10.5px] text-white/55 truncate">{config?.tagline ?? 'Powered by SG16 AI'}</div>
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

            <div className="space-y-1.5">
              <div className="sg16-pilot-label">Your reminders</div>
              {reminders.length === 0 ? (
                <p className="text-xs text-white/50 px-1">
                  Nothing due. Add homework, classes, medicines, appointments or price alerts in the shields and they show here.
                </p>
              ) : (
                reminders.map((r) => (
                  <button key={r.id} type="button" onClick={() => runReminder(r)} className="sg16-pilot-row">
                    {r.threadId ? (
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-white/50" />
                    ) : (
                      <Clock className={`w-3.5 h-3.5 shrink-0 ${r.urgent ? 'text-[#FF168D]' : 'text-white/50'}`} />
                    )}
                    <span className="text-left">{r.text}</span>
                  </button>
                ))
              )}
            </div>

            {config && (
              <div className="space-y-2">
                <div className="sg16-pilot-label">Quick actions (AI)</div>
                <div className="flex flex-wrap gap-1.5">
                  {config.quickActions.map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => ask(config.workspaceId, a.prompt)}
                      className="sg16-pilot-chip"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="sg16-pilot-label">Ask {config?.shortName ?? 'SG16'}</div>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitTask();
                  }
                }}
                rows={2}
                placeholder="Type a question — it opens in the shield's chat"
                className="sg16-pilot-input"
              />
              <button
                type="button"
                onClick={submitTask}
                disabled={!task.trim()}
                className="sg16-btn-primary w-full inline-flex items-center justify-center gap-1.5 text-xs py-2.5"
              >
                <Send className="w-3.5 h-3.5" /> Ask
              </button>
              {config?.pilotId === 'market' && (
                <p className="text-[10px] text-white/40 leading-relaxed">Market Pilot never buys or sells.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {launcher && (
        <button
          type="button"
          onClick={toggleOpen}
          className="sg16-pilot-launcher"
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
