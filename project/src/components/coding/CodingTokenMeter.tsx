import type { CodingUsage } from '../../core/types';

interface CodingTokenMeterProps {
  usage: CodingUsage;
}

/** Shown inside Coding Hub only — after the user's first coding request today. */
export function CodingTokenMeter({ usage }: CodingTokenMeterProps) {
  const pct = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const low = usage.remaining <= 5;

  return (
    <div className="sg16-chat-col px-4 sm:px-5 pb-2">
      <div
        className={`rounded-[var(--sg16-r-bar)] border px-3 py-2.5 ${
          low
            ? 'border-amber-400/30 bg-amber-500/8'
            : 'border-sky-400/20 bg-sky-500/8'
        }`}
      >
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className={low ? 'text-amber-200/90' : 'text-sky-100/90'}>
            Coding tokens today
          </span>
          <span className={`font-semibold tabular-nums ${low ? 'text-amber-300' : 'text-sky-200'}`}>
            {usage.remaining} / {usage.limit} left
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-black/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${low ? 'bg-amber-400' : 'bg-sky-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-white/35">
          Resets daily · check, repair & coding help each use 1 token
        </p>
      </div>
    </div>
  );
}
