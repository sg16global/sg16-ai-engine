import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  User,
  CalendarCheck,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Wallet,
  QrCode,
  Settings,
  Bell,
  X,
  ChevronLeft,
  ArrowRight,
  GraduationCap,
  PanelLeft,
  MessageSquare,
} from 'lucide-react';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { useAppStore } from '../../core/appState';
import { usePilotStore } from '../../core/pilotState';
import { SG16_ACCENT } from '../../core/pilot';
import { useAutoHideChrome } from '../../hooks/useAutoHideChrome';
import { useOpenChatRequest } from '../../hooks/useOpenChatRequest';
import { ToolPage } from '../../components/tools/ToolPage';
import { StatTile, formatDate } from '../../components/tools/RecordTool';
import {
  AttendanceTool,
  EMPTY_PROFILE,
  ExamTool,
  FeesTool,
  HomeworkTool,
  IdCardTool,
  ProfileTool,
  STUDENT_KEYS,
  TimetableTool,
  studentStats,
  type StudentProfile,
} from '../../components/tools/studentTools';
import { useLocalValue } from '../../lib/localStore';

type StudentView =
  | 'dashboard'
  | 'profile'
  | 'attendance'
  | 'homework'
  | 'timetable'
  | 'exam'
  | 'fees'
  | 'qr'
  | 'settings'
  | 'chat';

const nav: { id: StudentView; label: string; icon: typeof User }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', label: 'Ask Tutor (AI)', icon: MessageSquare },
  { id: 'homework', label: 'Homework', icon: BookOpen },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'exam', label: 'Exam Results', icon: ClipboardList },
  { id: 'fees', label: 'Fees & Payment', icon: Wallet },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'qr', label: 'QR ID Card', icon: QrCode },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const TOOL_PAGES: Partial<Record<StudentView, { title: string; subtitle: string }>> = {
  homework: { title: 'Homework', subtitle: 'Your tasks and due dates — tick them off when done.' },
  timetable: { title: 'Timetable', subtitle: 'Your weekly classes. Today’s classes show on the dashboard.' },
  attendance: { title: 'Attendance', subtitle: 'Mark each day to see your real attendance rate.' },
  exam: { title: 'Exam Results', subtitle: 'Record scores to see your average and weakest subject.' },
  fees: { title: 'Fees & Payment', subtitle: 'Track what is paid and what is still due.' },
  profile: { title: 'Profile', subtitle: 'Your student details, used for the dashboard and ID card.' },
  qr: { title: 'QR ID Card', subtitle: 'A digital card with a scannable QR code.' },
};

export const StudentShieldWorkspace = () => {
  const [view, setView] = useState<StudentView>('dashboard');
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const authUser = useAppStore((s) => s.authUser);
  const openPilot = usePilotStore((s) => s.setOpen);
  const [profile] = useLocalValue<StudentProfile>(STUDENT_KEYS.profile, EMPTY_PROFILE);
  const name = profile.name || authUser?.name || 'Student';
  const chrome = useAutoHideChrome(`student-${view}`, true);
  const chromeOpen = chrome.open;

  useOpenChatRequest('student-shield', () => setView('chat'));

  const openTool = (id: StudentView) => {
    if (id === 'settings') {
      setWorkspace('settings');
    } else {
      setView(id);
    }
    chrome.onNavSelect();
  };

  const toolPage = TOOL_PAGES[view];
  let toolBody: ReactNode = null;
  if (view === 'homework') toolBody = <HomeworkTool />;
  else if (view === 'timetable') toolBody = <TimetableTool />;
  else if (view === 'attendance') toolBody = <AttendanceTool />;
  else if (view === 'exam') toolBody = <ExamTool />;
  else if (view === 'fees') toolBody = <FeesTool />;
  else if (view === 'profile') toolBody = <ProfileTool />;
  else if (view === 'qr') toolBody = <IdCardTool onEditProfile={() => setView('profile')} />;

  return (
    <div className="sg16-student-chrome h-full flex overflow-hidden relative">
      {!chromeOpen && (
        <button
          type="button"
          className="sg16-chrome-tab sg16-chrome-tab--top hidden lg:flex"
          onMouseEnter={chrome.openChrome}
          onClick={chrome.openChrome}
          aria-label="Open student menu"
        >
          <PanelLeft className="h-3.5 w-3.5" />
          <span>Menu</span>
          <i className="sg16-chrome-tab__sep" aria-hidden />
          <span>Student Shield</span>
        </button>
      )}
      <div
        className="sg16-chrome-edge sg16-chrome-edge--left hidden md:block"
        onMouseEnter={chrome.openChrome}
        aria-hidden
      />

      <div
        className={`sg16-student-sidebar-wrap hidden md:flex ${chromeOpen ? 'sg16-student-sidebar-wrap--open' : ''}`}
        onMouseEnter={chrome.onChromeEnter}
        onMouseLeave={chrome.onChromeLeave}
      >
      <aside className="sg16-sidebar flex w-full flex-col shrink-0 h-full relative z-10">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.35)', boxShadow: `0 0 16px ${SG16_ACCENT}` }}
            >
              <GraduationCap className="w-6 h-6 text-white" />
            </span>
            <div>
              <div className="text-sm font-bold">Student Shield</div>
              <div className="text-[10px] text-white/60">SG16 Engine</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openTool(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition ${
                  view === item.id ? 'sg16-nav-active' : 'text-white/80 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="font-medium text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setWorkspace('home')}
            className="sg16-btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Shields
          </button>
        </div>
      </aside>
      </div>

      {/* Main field */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col min-h-0">
        <div
          className={`m-3 sm:m-4 flex-1 min-h-0 flex flex-col sg16-neon-frame rounded-2xl overflow-hidden ${
            !chromeOpen ? 'lg:mt-10' : ''
          }`}
        >
          <div
            className={`sg16-student-header-wrap ${chromeOpen ? 'sg16-student-header-wrap--open' : ''}`}
            onMouseEnter={chrome.onChromeEnter}
            onMouseLeave={chrome.onChromeLeave}
          >
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(185,22,105,0.5)] bg-black/40">
            <div
              className="text-xs sm:text-sm font-bold tracking-[0.18em] px-3 py-1 rounded-md"
              style={{ border: `1px solid ${SG16_ACCENT}`, color: '#FFB3DA' }}
            >
              STUDENT SHIELD
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {name}
                </div>
                {profile.studentId && (
                  <div className="text-[10px]" style={{ color: '#FFB3DA' }}>
                    Student ID: {profile.studentId}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => openPilot(true)} className="p-2" aria-label="Your reminders">
                <Bell className="w-4 h-4" style={{ color: '#FFB3DA' }} />
              </button>
              <button type="button" onClick={() => setWorkspace('home')} className="p-2 md:hidden" aria-label="Back to Shields">
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>
          </div>

          {view === 'dashboard' ? (
            <StudentDashboard name={name} hasProfile={Boolean(profile.name)} openTool={openTool} />
          ) : view === 'chat' ? (
            <div className="flex-1 min-h-0 flex flex-col sg16-work-field">
              <ChatPanel
                workspaceId="student-shield"
                placeholder="Ask about homework, science, math, or career guidance..."
                suggestions={[
                  'Explain photosynthesis for a 10-year-old',
                  'Help me understand fractions',
                  'How do I write a good essay introduction?',
                  'What career paths exist in software engineering?',
                ]}
                onBack={() => setView('dashboard')}
                backLabel="Back to Dashboard"
              />
            </div>
          ) : toolPage ? (
            <div className="flex-1 min-h-0 bg-black/50 sg16-work-field">
              <ToolPage
                title={toolPage.title}
                subtitle={toolPage.subtitle}
                backLabel="Dashboard"
                onBack={() => setView('dashboard')}
              >
                {toolBody}
              </ToolPage>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

function StudentDashboard({
  name,
  hasProfile,
  openTool,
}: {
  name: string;
  hasProfile: boolean;
  openTool: (id: StudentView) => void;
}) {
  const s = studentStats();
  const cards: { id: StudentView; title: string; desc: string; icon: typeof User }[] = [
    {
      id: 'homework',
      title: 'Homework',
      desc: s.pendingHomework ? `${s.pendingHomework} pending${s.overdueHomework ? ` · ${s.overdueHomework} overdue` : ''}` : 'Add and tick off your tasks.',
      icon: BookOpen,
    },
    {
      id: 'timetable',
      title: 'Timetable',
      desc: s.todayClasses.length ? `${s.todayClasses.length} class${s.todayClasses.length > 1 ? 'es' : ''} today` : 'Add your weekly classes.',
      icon: CalendarDays,
    },
    {
      id: 'attendance',
      title: 'Attendance',
      desc: s.attendancePct != null ? `${Math.round(s.attendancePct)}% over ${s.attendanceCount} days` : 'Mark your school days.',
      icon: CalendarCheck,
    },
    {
      id: 'exam',
      title: 'Exam Results',
      desc: s.examAverage != null ? `Average ${Math.round(s.examAverage)}% · ${s.examCount} results` : 'Record your scores.',
      icon: ClipboardList,
    },
    {
      id: 'fees',
      title: 'Fees & Payment',
      desc: s.feesUnpaid ? `${s.feesUnpaid} unpaid · ${s.feesOutstanding.toLocaleString()} due` : 'Track fees and payments.',
      icon: Wallet,
    },
    { id: 'chat', title: 'Ask Tutor (AI)', desc: 'Homework help, explanations and career guidance.', icon: MessageSquare },
  ];

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-black/50">
      <div className="mb-5">
        <div className="text-sm text-white/70">Welcome back,</div>
        <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#FF3DA5', textShadow: '0 0 18px rgba(185,22,105,0.55)' }}>
          {name}
        </div>
        {!hasProfile && (
          <button type="button" onClick={() => openTool('profile')} className="text-xs text-white/55 hover:text-white mt-1 underline underline-offset-2">
            Set up your student profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatTile label="Homework pending" value={s.pendingHomework} hint={s.overdueHomework ? `${s.overdueHomework} overdue` : undefined} tone={s.overdueHomework ? 'text-[#FF5CB8]' : undefined} />
        <StatTile label="Classes today" value={s.todayClasses.length} />
        <StatTile label="Attendance" value={s.attendancePct != null ? `${Math.round(s.attendancePct)}%` : '—'} hint={s.attendanceCount ? `${s.attendanceCount} days recorded` : 'No records yet'} />
        <StatTile label="Exam average" value={s.examAverage != null ? `${Math.round(s.examAverage)}%` : '—'} hint={s.examCount ? `${s.examCount} results` : 'No results yet'} />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => openTool(c.id)}
              className="sg16-neon-frame rounded-xl p-4 text-left flex items-center gap-3 hover:bg-black/55 transition"
            >
              <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(185,22,105,0.45)' }}>
                <Icon className="w-5 h-5" style={{ color: '#FFB3DA' }} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">{c.title}</div>
                <div className="text-[11px] text-white/55 mt-0.5 leading-snug">{c.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#FFB3DA' }} />
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="sg16-neon-frame rounded-xl p-4">
          <div className="font-semibold text-sm mb-3">Today’s classes</div>
          {s.todayClasses.length ? (
            <ul className="space-y-1.5 text-sm">
              {s.todayClasses.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <span className="font-mono text-[#FF5CB8] w-24 shrink-0">
                    {c.start}
                    {c.end ? `–${c.end}` : ''}
                  </span>
                  <span className="text-white/85">{c.subject}</span>
                  {c.room && <span className="text-white/40 truncate">{c.room}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-white/45">No classes today in your timetable.</p>
          )}
        </div>
        <div className="sg16-neon-frame rounded-xl p-4">
          <div className="font-semibold text-sm mb-3">Due today or tomorrow</div>
          {s.dueSoon.length ? (
            <ul className="space-y-1.5 text-sm">
              {s.dueSoon.map((h) => (
                <li key={h.id} className="text-white/85">
                  <span className="text-[#FF5CB8]">{h.subject}</span> · {h.task}{' '}
                  <span className="text-white/40 text-xs">({formatDate(h.due)})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-white/45">Nothing due in the next two days.</p>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden mt-4 flex flex-wrap gap-2">
        {nav.slice(1).map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => openTool(n.id)}
            className="text-[11px] px-3 py-2 rounded-full border border-[rgba(185,22,105,0.7)]"
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}
