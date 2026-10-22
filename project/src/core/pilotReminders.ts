import type { WorkspaceId } from './types';
import type { ChatThread } from '../lib/chatThreads';
import { readLocal } from '../lib/localStore';
import { studentStats } from '../components/tools/studentTools';
import { healthStats } from '../components/tools/healthTools';
import { MARKET_KEYS, type PriceAlert } from '../components/tools/marketTools';
import { formatDate, todayIso } from '../components/tools/RecordTool';
import { formatPrice } from '../lib/marketApi';

/** One Pilot reminder, built only from what the user saved on this device. */
export interface PilotReminder {
  id: string;
  text: string;
  /** Counts toward the Pilot badge (due now / today). */
  urgent: boolean;
  workspaceId: WorkspaceId;
  threadId?: string;
}

const DAY_MS = 86_400_000;

function minutesUntil(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  return h * 60 + m - (now.getHours() * 60 + now.getMinutes());
}

export function buildReminders(threads: ChatThread[]): PilotReminder[] {
  const out: PilotReminder[] = [];
  const student = studentStats();
  const health = healthStats();

  if (student.overdueHomework) {
    out.push({ id: 'hw-overdue', text: `${student.overdueHomework} homework overdue`, urgent: true, workspaceId: 'student-shield' });
  }
  if (student.dueSoon.length) {
    const first = student.dueSoon[0];
    out.push({
      id: 'hw-due',
      text: `Due ${first.due === todayIso() ? 'today' : 'tomorrow'}: ${first.subject} — ${first.task}${student.dueSoon.length > 1 ? ` (+${student.dueSoon.length - 1} more)` : ''}`,
      urgent: true,
      workspaceId: 'student-shield',
    });
  }
  const nextClass = student.todayClasses.find((c) => minutesUntil(c.start) >= 0);
  if (nextClass) {
    out.push({ id: 'class-next', text: `Next class ${nextClass.start}: ${nextClass.subject}`, urgent: minutesUntil(nextClass.start) <= 30, workspaceId: 'student-shield' });
  }

  if (health.nextDose) {
    const mins = minutesUntil(health.nextDose.time);
    out.push({
      id: 'dose-next',
      text: `Medicine at ${health.nextDose.time}: ${health.nextDose.name}${health.nextDose.dose ? ` (${health.nextDose.dose})` : ''}`,
      urgent: mins <= 60,
      workspaceId: 'health',
    });
  }
  if (health.nextAppointment) {
    const days = Math.round((Date.parse(`${health.nextAppointment.date}T00:00:00`) - Date.parse(`${todayIso()}T00:00:00`)) / DAY_MS);
    if (days <= 7) {
      out.push({
        id: 'appt-next',
        text: `Appointment ${days === 0 ? 'today' : days === 1 ? 'tomorrow' : formatDate(health.nextAppointment.date)}${health.nextAppointment.time ? ` ${health.nextAppointment.time}` : ''}: ${health.nextAppointment.with}`,
        urgent: days <= 1,
        workspaceId: 'health',
      });
    }
  }

  readLocal<PriceAlert[]>(MARKET_KEYS.alerts, [])
    .filter((a) => a.triggeredAt && Date.now() - a.triggeredAt < DAY_MS)
    .forEach((a) =>
      out.push({
        id: `alert-${a.id}`,
        text: `Price alert: ${a.name} went ${a.direction} ${formatPrice(a.price)}`,
        urgent: true,
        workspaceId: 'market',
      }),
    );

  const last = threads[0];
  if (last) {
    out.push({ id: `thread-${last.id}`, text: `Continue: ${last.title}`, urgent: false, workspaceId: last.workspaceId, threadId: last.id });
  }
  return out;
}
