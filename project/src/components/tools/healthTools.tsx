import { useState } from 'react';
import { RecordTool, StatTile, formatDate, todayIso, type ToolRecord } from './RecordTool';
import { readLocal, useLocalValue } from '../../lib/localStore';

export const HEALTH_KEYS = {
  medicines: 'health_medicines',
  appointments: 'health_appointments',
  log: 'health_log',
  bmi: 'health_bmi',
} as const;

type Medicine = ToolRecord & { name: string; dose: string; times: string; notes: string; active: boolean };
type Appointment = ToolRecord & { date: string; time: string; with: string; reason: string };
type LogEntry = ToolRecord & { date: string; type: string; value: string; note: string };

export const LOG_TYPES = ['Weight (kg)', 'Blood pressure', 'Blood sugar', 'Sleep (hours)', 'Water (glasses)', 'Steps', 'Mood'];

/** "08:00, 20:00" → ["08:00", "20:00"] (24-hour times only). */
function parseTimes(text: string) {
  return (text || '')
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter((t) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(t))
    .map((t) => t.padStart(5, '0'))
    .sort();
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function healthStats() {
  const medicines = readLocal<Medicine[]>(HEALTH_KEYS.medicines, []).filter((m) => m.active);
  const appointments = readLocal<Appointment[]>(HEALTH_KEYS.appointments, []);
  const log = readLocal<LogEntry[]>(HEALTH_KEYS.log, []);
  const today = todayIso();
  const now = nowHHMM();

  const nextDoses = medicines
    .flatMap((m) => parseTimes(m.times).filter((t) => t >= now).map((t) => ({ time: t, name: m.name, dose: m.dose })))
    .sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = appointments
    .filter((a) => a.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const latestByType = new Map<string, LogEntry>();
  [...log].sort((a, b) => a.date.localeCompare(b.date)).forEach((e) => latestByType.set(e.type, e));

  return {
    activeMedicines: medicines.length,
    nextDose: nextDoses[0] ?? null,
    upcoming,
    nextAppointment: upcoming[0] ?? null,
    logEntries: log.length,
    latest: [...latestByType.values()],
  };
}

export function MedicinesTool() {
  return (
    <RecordTool<Medicine>
      storageKey={HEALTH_KEYS.medicines}
      itemLabel="medicine"
      emptyText="No medicines yet. Add what you take and when — the Health dashboard shows your next dose."
      fields={[
        { name: 'name', label: 'Medicine', required: true, placeholder: 'As written on the box' },
        { name: 'dose', label: 'Dose', placeholder: 'e.g. 1 tablet, 5 ml' },
        { name: 'times', label: 'Times (24-hour)', placeholder: 'e.g. 08:00, 20:00' },
        { name: 'active', label: 'Currently taking', type: 'checkbox', initial: () => true },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'e.g. after food — follow your doctor or pharmacist' },
      ]}
      sort={(a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)}
      renderRow={(m) => (
        <>
          <div className="text-white">
            <span className="font-medium">{m.name}</span>
            {m.dose ? ` · ${m.dose}` : ''}
            {!m.active && <span className="text-white/40"> · stopped</span>}
          </div>
          <div className="text-xs text-white/45 mt-0.5">
            {parseTimes(m.times).join(' · ') || 'No times set'}
            {m.notes ? ` — ${m.notes}` : ''}
          </div>
        </>
      )}
    />
  );
}

export function AppointmentsTool() {
  return (
    <RecordTool<Appointment>
      storageKey={HEALTH_KEYS.appointments}
      itemLabel="appointment"
      emptyText="No appointments yet."
      fields={[
        { name: 'date', label: 'Date', type: 'date', required: true, initial: todayIso },
        { name: 'time', label: 'Time', type: 'time' },
        { name: 'with', label: 'Doctor / clinic', required: true },
        { name: 'reason', label: 'Reason / questions to ask', type: 'textarea' },
      ]}
      sort={(a, b) => {
        const today = todayIso();
        const pa = a.date >= today ? 0 : 1;
        const pb = b.date >= today ? 0 : 1;
        return pa - pb || (pa ? b.date.localeCompare(a.date) : `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
      }}
      renderRow={(a) => {
        const past = a.date < todayIso();
        return (
          <>
            <div className="text-white">
              <span className={past ? 'text-white/50' : 'text-[#FF5CB8] font-medium'}>
                {formatDate(a.date)}
                {a.time ? ` ${a.time}` : ''}
              </span>{' '}
              · {a.with}
              {past && <span className="text-white/40"> · past</span>}
            </div>
            {a.reason && <div className="text-xs text-white/45 mt-0.5 whitespace-pre-wrap">{a.reason}</div>}
          </>
        );
      }}
    />
  );
}

export function HealthLogTool() {
  return (
    <RecordTool<LogEntry>
      storageKey={HEALTH_KEYS.log}
      itemLabel="entry"
      emptyText="No entries yet. Log weight, blood pressure, sleep or water to see your latest values."
      fields={[
        { name: 'date', label: 'Date', type: 'date', required: true, initial: todayIso },
        { name: 'type', label: 'What', type: 'select', options: LOG_TYPES },
        { name: 'value', label: 'Value', required: true, placeholder: 'e.g. 68.5 or 120/80' },
        { name: 'note', label: 'Note', placeholder: 'Optional' },
      ]}
      sort={(a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt}
      summary={(items) => {
        const latest = new Map<string, LogEntry>();
        [...items].sort((a, b) => a.date.localeCompare(b.date)).forEach((e) => latest.set(e.type, e));
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...latest.values()].slice(0, 4).map((e) => (
              <StatTile key={e.type} label={e.type} value={e.value} hint={formatDate(e.date)} />
            ))}
          </div>
        );
      }}
      renderRow={(e) => (
        <div className="text-white">
          {formatDate(e.date)} · <span className="text-white/70">{e.type}</span> ·{' '}
          <span className="font-medium text-[#FF5CB8]">{e.value}</span>
          {e.note ? <span className="text-white/45"> — {e.note}</span> : null}
        </div>
      )}
    />
  );
}

/** WHO adult BMI bands. */
export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: 'Underweight', tone: 'text-amber-300' };
  if (bmi < 25) return { label: 'Healthy range', tone: 'text-emerald-400' };
  if (bmi < 30) return { label: 'Overweight', tone: 'text-amber-300' };
  return { label: 'Obesity range', tone: 'text-[#FF5CB8]' };
}

export function BmiTool() {
  const [saved, setSaved] = useLocalValue(HEALTH_KEYS.bmi, { height: '', weight: '' });
  const [height, setHeight] = useState(saved.height);
  const [weight, setWeight] = useState(saved.weight);
  const h = Number(height) / 100;
  const w = Number(weight);
  const bmi = h > 0.5 && h < 2.6 && w > 10 && w < 400 ? w / (h * h) : null;
  const cat = bmi ? bmiCategory(bmi) : null;

  return (
    <div className="sg16-card p-4 sm:p-5 space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-white/60">
          Height (cm)
          <input className="sg16-field" type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} onBlur={() => setSaved({ height, weight })} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-white/60">
          Weight (kg)
          <input className="sg16-field" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} onBlur={() => setSaved({ height, weight })} />
        </label>
      </div>
      {bmi && cat ? (
        <div>
          <div className="text-3xl font-semibold text-white">{bmi.toFixed(1)}</div>
          <div className={`text-sm ${cat.tone}`}>{cat.label}</div>
          {h > 0 && (
            <p className="text-xs text-white/45 mt-2">
              Healthy range for your height: {(18.5 * h * h).toFixed(1)}–{(24.9 * h * h).toFixed(1)} kg.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-white/45">Enter your height and weight.</p>
      )}
      <p className="text-[11px] text-white/35">
        BMI uses the WHO adult ranges. It does not apply to children, pregnancy or very muscular people — ask a clinician.
      </p>
    </div>
  );
}
