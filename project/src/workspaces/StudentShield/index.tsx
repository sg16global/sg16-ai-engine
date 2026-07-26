import { useState } from 'react';
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
} from 'lucide-react';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { useAppStore } from '../../core/appState';
import { SG16_SHIELD_RED } from '../../core/pilot';

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

const nav: { id: StudentView; label: string; icon: typeof User; prompt?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'Profile', icon: User, prompt: 'Help me update and organize my student profile information.' },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, prompt: 'Help me track and understand my attendance status.' },
  { id: 'homework', label: 'Homework', icon: BookOpen, prompt: 'Help me check and complete my homework step by step.' },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays, prompt: 'Create or explain a clear class timetable for me.' },
  { id: 'exam', label: 'Exam Result', icon: ClipboardList, prompt: 'Help me review exam results and plan improvement.' },
  { id: 'fees', label: 'Fees & Payment', icon: Wallet, prompt: 'Explain student fees structure and payment planning (general guidance).' },
  { id: 'qr', label: 'QR ID Card', icon: QrCode, prompt: 'Help me prepare a digital student ID card summary.' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const dashCards: { id: StudentView; title: string; desc: string; icon: typeof User }[] = [
  { id: 'profile', title: 'Profile', desc: 'View and edit your personal information.', icon: User },
  { id: 'attendance', title: 'Attendance', desc: 'Check your attendance records and status.', icon: CalendarCheck },
  { id: 'homework', title: 'Homework', desc: 'View and submit your homework.', icon: BookOpen },
  { id: 'timetable', title: 'Timetable', desc: 'View your class schedule and timing.', icon: CalendarDays },
  { id: 'exam', title: 'Exam Result', desc: 'Check your exam results and grades.', icon: ClipboardList },
  { id: 'fees', title: 'Fees & Payment', desc: 'View fees structure and payment history.', icon: Wallet },
];

export const StudentShieldWorkspace = () => {
  const [view, setView] = useState<StudentView>('dashboard');
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const authUser = useAppStore((s) => s.authUser);
  const settings = useAppStore((s) => s.settings);
  const openHelp = useAppStore((s) => s.openHelp);
  const name = authUser?.name || settings.displayName || 'SG16 USER';

  const openTool = (id: StudentView, prompt?: string) => {
    if (id === 'dashboard') {
      setView('dashboard');
      return;
    }
    if (id === 'settings') {
      setWorkspace('settings');
      return;
    }
    if (prompt) {
      useAppStore.setState({ pendingPrompt: prompt, pendingPromptToken: Date.now() });
    }
    setView('chat');
  };

  return (
    <div className="sg16-earth-stage h-full flex overflow-hidden">
      {/* Picture 1 — maroon side panel */}
      <aside className="sg16-side-maroon hidden md:flex w-56 lg:w-60 flex-col shrink-0 relative z-10">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.35)', boxShadow: `0 0 16px ${SG16_SHIELD_RED}` }}
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
            const active =
              view === item.id || (view === 'chat' && item.id !== 'dashboard' && item.id === 'homework');
            const isDash = item.id === 'dashboard' && view === 'dashboard';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openTool(item.id, item.prompt)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition ${
                  isDash || (view === 'chat' && item.prompt && active)
                    ? 'bg-black/35 text-white shadow-[0_0_16px_rgba(0,0,0,0.35)]'
                    : 'text-white/80 hover:bg-black/25'
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
            className="w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl bg-black/30 hover:bg-black/45"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Shields
          </button>
        </div>
      </aside>

      {/* Main field */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col min-h-0">
        <div className="m-3 sm:m-4 flex-1 min-h-0 flex flex-col sg16-neon-frame rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(128,0,0,0.5)] bg-black/40">
            <div
              className="text-xs sm:text-sm font-bold tracking-[0.18em] px-3 py-1 rounded-md"
              style={{ border: `1px solid ${SG16_SHIELD_RED}`, color: '#ffb3b3' }}
            >
              STUDENT SHIELD
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {name}
                </div>
                <div className="text-[10px]" style={{ color: '#ffb3b3' }}>
                  Student ID: SG16-2026
                </div>
              </div>
              <button type="button" onClick={() => openHelp('overview')} className="relative p-2">
                <Bell className="w-4 h-4" style={{ color: '#ffb3b3' }} />
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-[#800000]">
                  3
                </span>
              </button>
              <button type="button" onClick={() => setWorkspace('home')} className="p-2 md:hidden">
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          {view === 'dashboard' ? (
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-black/50">
              <div className="mb-5">
                <div className="text-sm text-white/70">Welcome Back,</div>
                <div className="text-2xl sm:text-3xl font-bold" style={{ color: '#ff4d4d', textShadow: '0 0 18px rgba(128,0,0,0.55)' }}>
                  {name}
                </div>
                <div className="text-sm text-white/55 mt-1">Stay focused and keep learning.</div>
              </div>

              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
                {dashCards.map((c) => {
                  const Icon = c.icon;
                  const item = nav.find((n) => n.id === c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openTool(c.id, item?.prompt)}
                      className="sg16-neon-frame rounded-xl p-4 text-left flex items-center gap-3 hover:bg-black/55 transition"
                    >
                      <span
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(128,0,0,0.45)' }}
                      >
                        <Icon className="w-5 h-5" style={{ color: '#ffb3b3' }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm">{c.title}</div>
                        <div className="text-[11px] text-white/50 mt-0.5 leading-snug">{c.desc}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#ffb3b3' }} />
                    </button>
                  );
                })}
              </div>

              <div className="grid lg:grid-cols-[1fr_1.4fr] gap-3">
                <button
                  type="button"
                  onClick={() => openTool('qr', nav.find((n) => n.id === 'qr')?.prompt)}
                  className="sg16-neon-frame rounded-xl p-4 text-left"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="w-5 h-5" style={{ color: '#ffb3b3' }} />
                    <span className="font-semibold text-sm">QR ID Card</span>
                  </div>
                  <div
                    className="w-28 h-28 mx-auto rounded-lg flex items-center justify-center text-[10px] text-center p-2"
                    style={{ border: `1px solid ${SG16_SHIELD_RED}`, boxShadow: `0 0 20px rgba(128,0,0,0.4)` }}
                  >
                    Digital ID
                    <br />
                    SG16-2026
                  </div>
                  <div className="text-[11px] text-white/50 mt-3 text-center">
                    View your digital student ID card.
                  </div>
                </button>

                <div className="sg16-neon-frame rounded-xl p-4">
                  <div className="font-semibold text-sm mb-4">Academic Overview</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Current GPA', value: '3.85' },
                      { label: 'Total Courses', value: '08' },
                      { label: 'Completed', value: '05' },
                      { label: 'Pending', value: '03' },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="text-[10px] text-white/45 uppercase tracking-wide">{s.label}</div>
                        <div className="text-2xl font-bold mt-1" style={{ color: '#ff4d4d' }}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/35 mt-4">
                    Overview numbers are local placeholders until school data sync is connected.
                  </p>
                </div>
              </div>

              {/* Mobile nav */}
              <div className="md:hidden mt-4 flex flex-wrap gap-2">
                {nav.slice(1, 5).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openTool(n.id, n.prompt)}
                    className="text-[11px] px-3 py-2 rounded-full border border-[rgba(128,0,0,0.7)]"
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col sg16-work-field">
              <div className="px-4 pt-3">
                <button
                  type="button"
                  onClick={() => setView('dashboard')}
                  className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/15 rounded-xl px-3 py-2"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ChatPanel
                  workspaceId="student-shield"
                  placeholder="Ask about homework, science, math, or career guidance..."
                  suggestions={[
                    'Explain photosynthesis for a 10-year-old',
                    'Help me understand fractions',
                    'How do I write a good essay introduction?',
                    'What career paths exist in software engineering?',
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentShieldWorkspace;
