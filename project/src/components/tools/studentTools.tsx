import { useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { Download, Printer, Save } from 'lucide-react';
import { RecordTool, StatTile, formatDate, todayIso, type ToolRecord } from './RecordTool';
import { readLocal, useLocalValue } from '../../lib/localStore';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const todayName = () => DAYS[(new Date().getDay() + 6) % 7];

export const STUDENT_KEYS = {
  profile: 'student_profile',
  homework: 'student_homework',
  timetable: 'student_timetable',
  attendance: 'student_attendance',
  exams: 'student_exams',
  fees: 'student_fees',
} as const;

export interface StudentProfile {
  name: string;
  school: string;
  grade: string;
  studentId: string;
  email: string;
}
const EMPTY_PROFILE: StudentProfile = { name: '', school: '', grade: '', studentId: '', email: '' };

type Homework = ToolRecord & { subject: string; task: string; due: string; done: boolean };
type ClassSlot = ToolRecord & { day: string; start: string; end: string; subject: string; room: string };
type Attendance = ToolRecord & { date: string; subject: string; status: string };
type Exam = ToolRecord & { subject: string; exam: string; date: string; score: number; max: number };
type Fee = ToolRecord & { item: string; amount: number; due: string; paid: boolean };

const pct = (n: number) => `${Math.round(n)}%`;
const money = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

// ── Numbers for the dashboard and Pilot reminders (computed from saved records) ──

export function studentStats() {
  const homework = readLocal<Homework[]>(STUDENT_KEYS.homework, []);
  const timetable = readLocal<ClassSlot[]>(STUDENT_KEYS.timetable, []);
  const attendance = readLocal<Attendance[]>(STUDENT_KEYS.attendance, []);
  const exams = readLocal<Exam[]>(STUDENT_KEYS.exams, []);
  const fees = readLocal<Fee[]>(STUDENT_KEYS.fees, []);
  const today = todayIso();

  const pending = homework.filter((h) => !h.done);
  const attended = attendance.filter((a) => a.status !== 'Absent').length;
  const scored = exams.filter((e) => e.max > 0);
  return {
    pendingHomework: pending.length,
    overdueHomework: pending.filter((h) => h.due && h.due < today).length,
    dueSoon: pending.filter((h) => h.due && h.due >= today && h.due <= addDays(today, 1)),
    todayClasses: timetable.filter((c) => c.day === todayName()).sort((a, b) => a.start.localeCompare(b.start)),
    attendancePct: attendance.length ? (attended / attendance.length) * 100 : null,
    attendanceCount: attendance.length,
    examAverage: scored.length ? scored.reduce((s, e) => s + (e.score / e.max) * 100, 0) / scored.length : null,
    examCount: scored.length,
    feesOutstanding: fees.filter((f) => !f.paid).reduce((s, f) => s + (Number(f.amount) || 0), 0),
    feesUnpaid: fees.filter((f) => !f.paid).length,
  };
}

/** Local calendar date + n days (toISOString would shift to UTC and give the wrong day east of UTC). */
function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Tools ──

export function ProfileTool() {
  const [profile, setProfile] = useLocalValue<StudentProfile>(STUDENT_KEYS.profile, EMPTY_PROFILE);
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const fields: { key: keyof StudentProfile; label: string; placeholder: string }[] = [
    { key: 'name', label: 'Full name', placeholder: 'e.g. Aisha Rahman' },
    { key: 'school', label: 'School / college / university', placeholder: 'e.g. Malacca High School' },
    { key: 'grade', label: 'Class / grade / year', placeholder: 'e.g. Form 4, Year 2' },
    { key: 'studentId', label: 'Student ID', placeholder: 'As printed on your school card' },
    { key: 'email', label: 'Email (optional)', placeholder: 'you@example.com' },
  ];
  return (
    <div className="sg16-card p-4 sm:p-5 space-y-3 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-xs text-white/60">
            {f.label}
            <input
              className="sg16-field"
              value={draft[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => {
                setDraft({ ...draft, [f.key]: e.target.value });
                setSaved(false);
              }}
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setProfile({ ...draft, name: draft.name.trim() });
            setSaved(true);
          }}
          className="sg16-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <Save className="w-4 h-4" /> Save profile
        </button>
        {saved && <span className="text-xs text-emerald-400">Saved on this device.</span>}
      </div>
      <p className="text-[11px] text-white/35">Your profile is used for your dashboard and your QR ID card. It stays on this device.</p>
    </div>
  );
}

export function HomeworkTool() {
  return (
    <RecordTool<Homework>
      storageKey={STUDENT_KEYS.homework}
      itemLabel="homework"
      doneField="done"
      emptyText="No homework yet. Add your first task."
      fields={[
        { name: 'subject', label: 'Subject', required: true, placeholder: 'e.g. Mathematics' },
        { name: 'task', label: 'Task', required: true, placeholder: 'e.g. Exercise 4.2, questions 1–10' },
        { name: 'due', label: 'Due date', type: 'date', initial: todayIso },
        { name: 'done', label: 'Done', type: 'checkbox' },
      ]}
      sort={(a, b) => Number(a.done) - Number(b.done) || (a.due || '9').localeCompare(b.due || '9')}
      summary={(items) => {
        const pending = items.filter((h) => !h.done);
        const overdue = pending.filter((h) => h.due && h.due < todayIso()).length;
        return (
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Pending" value={pending.length} />
            <StatTile label="Overdue" value={overdue} tone={overdue ? 'text-[#FF5CB8]' : undefined} />
            <StatTile label="Completed" value={items.length - pending.length} tone="text-emerald-400" />
          </div>
        );
      }}
      renderRow={(h) => {
        const overdue = !h.done && h.due && h.due < todayIso();
        return (
          <>
            <div className="text-white">
              <span className="text-[#FF5CB8] font-medium">{h.subject}</span> · {h.task}
            </div>
            {h.due && (
              <div className={`text-xs mt-0.5 ${overdue ? 'text-[#FF5CB8]' : 'text-white/45'}`}>
                {overdue ? 'Overdue · ' : 'Due '}
                {formatDate(h.due)}
              </div>
            )}
          </>
        );
      }}
    />
  );
}

export function TimetableTool() {
  return (
    <RecordTool<ClassSlot>
      storageKey={STUDENT_KEYS.timetable}
      itemLabel="class"
      emptyText="No classes yet. Add your weekly classes once — the dashboard shows today's."
      fields={[
        { name: 'day', label: 'Day', type: 'select', options: DAYS, initial: todayName },
        { name: 'subject', label: 'Subject', required: true, placeholder: 'e.g. Physics' },
        { name: 'start', label: 'Starts', type: 'time', required: true },
        { name: 'end', label: 'Ends', type: 'time' },
        { name: 'room', label: 'Room / teacher', placeholder: 'Optional' },
      ]}
      sort={(a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start)}
      renderRow={(c) => (
        <>
          <div className="text-white">
            <span className={c.day === todayName() ? 'text-[#FF5CB8] font-medium' : 'text-white/70'}>{c.day}</span> ·{' '}
            {c.start}
            {c.end ? `–${c.end}` : ''} · {c.subject}
          </div>
          {c.room && <div className="text-xs text-white/45 mt-0.5">{c.room}</div>}
        </>
      )}
    />
  );
}

export function AttendanceTool() {
  return (
    <RecordTool<Attendance>
      storageKey={STUDENT_KEYS.attendance}
      itemLabel="attendance record"
      emptyText="No attendance yet. Mark each school day to see your attendance rate."
      fields={[
        { name: 'date', label: 'Date', type: 'date', initial: todayIso, required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Present', 'Late', 'Absent'] },
        { name: 'subject', label: 'Class / subject', placeholder: 'Optional — leave empty for the whole day' },
      ]}
      sort={(a, b) => b.date.localeCompare(a.date)}
      summary={(items) => {
        const absent = items.filter((a) => a.status === 'Absent').length;
        const rate = ((items.length - absent) / items.length) * 100;
        return (
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Attendance" value={pct(rate)} tone={rate >= 80 ? 'text-emerald-400' : 'text-[#FF5CB8]'} />
            <StatTile label="Days recorded" value={items.length} />
            <StatTile label="Absent" value={absent} />
          </div>
        );
      }}
      renderRow={(a) => (
        <div className="text-white">
          {formatDate(a.date)} ·{' '}
          <span className={a.status === 'Absent' ? 'text-[#FF5CB8]' : a.status === 'Late' ? 'text-amber-300' : 'text-emerald-400'}>
            {a.status}
          </span>
          {a.subject ? <span className="text-white/50"> · {a.subject}</span> : null}
        </div>
      )}
    />
  );
}

export function ExamTool() {
  return (
    <RecordTool<Exam>
      storageKey={STUDENT_KEYS.exams}
      itemLabel="exam result"
      emptyText="No results yet. Add a test or exam score to track your average."
      fields={[
        { name: 'subject', label: 'Subject', required: true },
        { name: 'exam', label: 'Exam / test', placeholder: 'e.g. Mid-term' },
        { name: 'score', label: 'Your score', type: 'number', required: true },
        { name: 'max', label: 'Out of', type: 'number', initial: () => '100', required: true },
        { name: 'date', label: 'Date', type: 'date', initial: todayIso },
      ]}
      sort={(a, b) => (b.date || '').localeCompare(a.date || '')}
      summary={(items) => {
        const scored = items.filter((e) => e.max > 0);
        const avg = scored.reduce((s, e) => s + (e.score / e.max) * 100, 0) / (scored.length || 1);
        const bySubject = new Map<string, number[]>();
        scored.forEach((e) => bySubject.set(e.subject, [...(bySubject.get(e.subject) ?? []), (e.score / e.max) * 100]));
        const ranked = [...bySubject].map(([s, v]) => [s, v.reduce((a, b) => a + b, 0) / v.length] as const).sort((a, b) => b[1] - a[1]);
        return (
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Average" value={pct(avg)} />
            <StatTile label="Best subject" value={ranked[0]?.[0] ?? '—'} hint={ranked[0] ? pct(ranked[0][1]) : undefined} />
            <StatTile label="Needs work" value={ranked.length > 1 ? ranked[ranked.length - 1][0] : '—'} hint={ranked.length > 1 ? pct(ranked[ranked.length - 1][1]) : undefined} />
          </div>
        );
      }}
      renderRow={(e) => (
        <>
          <div className="text-white">
            <span className="font-medium">{e.subject}</span>
            {e.exam ? ` · ${e.exam}` : ''} ·{' '}
            <span className="text-[#FF5CB8]">
              {e.score}/{e.max} ({e.max ? pct((e.score / e.max) * 100) : '—'})
            </span>
          </div>
          {e.date && <div className="text-xs text-white/45 mt-0.5">{formatDate(e.date)}</div>}
        </>
      )}
    />
  );
}

export function FeesTool() {
  return (
    <RecordTool<Fee>
      storageKey={STUDENT_KEYS.fees}
      itemLabel="fee"
      doneField="paid"
      emptyText="No fees yet. Add school fees to track what is paid and what is due."
      fields={[
        { name: 'item', label: 'Fee', required: true, placeholder: 'e.g. Term 2 tuition' },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'due', label: 'Due date', type: 'date' },
        { name: 'paid', label: 'Paid', type: 'checkbox' },
      ]}
      sort={(a, b) => Number(a.paid) - Number(b.paid) || (a.due || '9').localeCompare(b.due || '9')}
      summary={(items) => {
        const total = items.reduce((s, f) => s + (Number(f.amount) || 0), 0);
        const paid = items.filter((f) => f.paid).reduce((s, f) => s + (Number(f.amount) || 0), 0);
        return (
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Total" value={money(total)} />
            <StatTile label="Paid" value={money(paid)} tone="text-emerald-400" />
            <StatTile label="Outstanding" value={money(total - paid)} tone={total - paid > 0 ? 'text-[#FF5CB8]' : undefined} />
          </div>
        );
      }}
      renderRow={(f) => (
        <>
          <div className="text-white">
            {f.item} · <span className="font-medium">{money(Number(f.amount) || 0)}</span>
          </div>
          <div className="text-xs text-white/45 mt-0.5">
            {f.paid ? 'Paid' : f.due ? `Due ${formatDate(f.due)}` : 'Not paid'}
          </div>
        </>
      )}
    />
  );
}

/** Digital ID card with a real, scannable QR code built from the saved profile. */
export function IdCardTool({ onEditProfile }: { onEditProfile: () => void }) {
  const [profile] = useLocalValue<StudentProfile>(STUDENT_KEYS.profile, EMPTY_PROFILE);
  const complete = Boolean(profile.name && profile.studentId);
  const payload = [
    `Name: ${profile.name}`,
    profile.school && `School: ${profile.school}`,
    profile.grade && `Class: ${profile.grade}`,
    `Student ID: ${profile.studentId}`,
    profile.email && `Email: ${profile.email}`,
  ]
    .filter(Boolean)
    .join('\n');

  const svg = useMemo(() => {
    if (!complete) return '';
    const qr = qrcode(0, 'M');
    qr.addData(payload, 'Byte');
    qr.make();
    return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }, [complete, payload]);

  if (!complete) {
    return (
      <div className="sg16-card p-6 text-center space-y-3 max-w-md">
        <p className="text-sm text-white/70">Add your name and student ID in your profile to create your ID card.</p>
        <button type="button" onClick={onEditProfile} className="sg16-btn-primary px-4 py-2 text-sm">
          Open profile
        </button>
      </div>
    );
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-id-${profile.studentId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="sg16-neon-frame rounded-2xl p-5 sm:p-6 max-w-md flex gap-5 items-center print:shadow-none">
        <div className="w-32 h-32 shrink-0 rounded-lg bg-white p-1.5" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="min-w-0 space-y-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#FFB3DA]">Student ID</div>
          <div className="text-lg font-semibold text-white break-words">{profile.name}</div>
          {profile.school && <div className="text-xs text-white/65">{profile.school}</div>}
          {profile.grade && <div className="text-xs text-white/65">{profile.grade}</div>}
          <div className="text-xs font-mono text-[#FF5CB8]">{profile.studentId}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={download} className="sg16-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs">
          <Download className="w-3.5 h-3.5" /> Download QR
        </button>
        <button type="button" onClick={() => window.print()} className="sg16-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs">
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
        <button type="button" onClick={onEditProfile} className="sg16-btn-secondary px-3 py-2 text-xs">
          Edit profile
        </button>
      </div>
      <p className="text-[11px] text-white/35">
        The QR code holds the details shown on the card, so any phone camera can read it. It is not an official school document.
      </p>
    </div>
  );
}

export { EMPTY_PROFILE };
