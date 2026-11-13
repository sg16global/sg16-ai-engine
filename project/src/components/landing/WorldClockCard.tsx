import { useEffect, useState } from 'react';
import { Clock3, Moon, Sun } from 'lucide-react';
import { Flag, type FlagCode } from './Flag';

/** Capital / main city time zone for each flag shown on the homepage. */
const ZONES: Partial<Record<FlagCode, { city: string; tz: string }>> = {
  us: { city: 'New York', tz: 'America/New_York' },
  gb: { city: 'London', tz: 'Europe/London' },
  fr: { city: 'Paris', tz: 'Europe/Paris' },
  ru: { city: 'Moscow', tz: 'Europe/Moscow' },
  cn: { city: 'Beijing', tz: 'Asia/Shanghai' },
  de: { city: 'Berlin', tz: 'Europe/Berlin' },
};

function timeIn(now: Date, tz: string | undefined, seconds = false): string {
  return now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    hour12: true,
    ...(tz ? { timeZone: tz } : {}),
  });
}

/** Calendar date (YYYY-MM-DD) in a time zone, to show "+1 day" / "−1 day" against the visitor's date. */
function dayIn(now: Date, tz?: string): string {
  return now.toLocaleDateString('en-CA', tz ? { timeZone: tz } : {});
}

function hourIn(now: Date, tz: string): number {
  return Number(now.toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: tz }));
}

/** World Clock — the visitor's own time and the local time in each country on the homepage flags. */
export function WorldClockCard({ flags }: { flags: { code: FlagCode; name: string }[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const myDay = dayIn(now);
  const myZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <section className="lp-panel lp-neon lp-monitor" aria-label="World Clock">
      <div className="lp-monitor__head">
        <span className="lp-icon-tile h-[46px] w-[46px]">
          <Clock3 className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <span className="lp-live">LIVE</span>
          <h3 className="lp-monitor__title">World Clock</h3>
          <p className="lp-monitor__sub">Local time in our nations</p>
        </div>
      </div>

      <p className="lp-monitor__meta">
        Your time — {timeIn(now, undefined, true)}
        {myZone ? <span className="lp-clock__zone"> · {myZone.replace(/_/g, ' ')}</span> : null}
      </p>

      <div className="mt-2">
        {flags.map((f) => {
          const zone = ZONES[f.code];
          if (!zone) return null;
          const day = dayIn(now, zone.tz);
          const shift = day === myDay ? '' : day > myDay ? '+1 day' : '−1 day';
          const hour = hourIn(now, zone.tz);
          const daytime = hour >= 6 && hour < 18;
          return (
            <div key={f.code} className="lp-clock">
              <span className="lp-clock__place">
                <Flag code={f.code} />
                <span>
                  {f.name} <em>· {zone.city}</em>
                </span>
              </span>
              <span className="lp-clock__time">
                {timeIn(now, zone.tz)}
                {shift && <small>{shift}</small>}
              </span>
              {daytime ? (
                <Sun className="lp-clock__icon" aria-label="Daytime" />
              ) : (
                <Moon className="lp-clock__icon" aria-label="Night" />
              )}
            </div>
          );
        })}
      </div>

      <p className="lp-monitor__meta lp-clock__foot">Updates every second from your device clock</p>
    </section>
  );
}
