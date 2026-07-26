import { useState } from 'react';
import { ArrowLeft, Stethoscope, FileHeart, CalendarDays, Pill } from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ModuleHub } from '../../components/workspace/ModuleHub';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { ToolCard } from '../../components/ui/Sg16Cards';
import { useAppStore } from '../../core/appState';

type View = 'hub' | 'chat';

const summary = [
  { label: 'Upcoming', value: '2', hint: 'reminders' },
  { label: 'Reports', value: '5', hint: 'explained' },
  { label: 'Prescriptions', value: '3', hint: 'tracked' },
  { label: 'Health Score', value: '92', hint: 'Excellent' },
];

export const HealthWorkspace = () => {
  const [view, setView] = useState<View>('hub');

  const openChat = (prompt?: string) => {
    if (prompt) {
      useAppStore.setState({ pendingPrompt: prompt, pendingPromptToken: Date.now() });
    }
    setView('chat');
  };

  if (view === 'chat') {
    return (
      <WorkspaceShell
        title="Health Guide"
        subtitle="Wellness questions & report explain — not a medical diagnosis"
        badge="Worldwide"
        badgeClass="text-teal-300"
        skin="health"
      >
        <div className="h-full flex flex-col min-h-0">
          <div className="px-4 sm:px-5 pt-3">
            <button
              type="button"
              onClick={() => setView('hub')}
              className="sg16-bar-soft inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Health
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <ChatPanel
              workspaceId="health"
              placeholder="Ask about symptoms info, habits, or paste a report summary..."
              suggestions={[
                'Explain this blood test summary in simple words',
                'Healthy sleep routine suggestions',
                'When should I see a doctor for a fever?',
                'Diet tips for more energy',
              ]}
              loadingLabel="SG16 Health is reviewing..."
            />
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <div className="sg16-work-field h-full">
    <ModuleHub
      title="Health Shield"
      subtitle="Wellness tools — ask questions, explain reports, track habits"
      skin="health"
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ToolCard
          title="Medical Services"
          desc="Ask wellness & lifestyle questions"
          icon={<Stethoscope className="w-5 h-5" />}
          iconClass="bg-teal-500/15 text-teal-300"
          onClick={() => openChat()}
        />
        <ToolCard
          title="Health Reports"
          desc="Paste a summary for plain-language explain"
          icon={<FileHeart className="w-5 h-5" />}
          iconClass="bg-teal-500/15 text-teal-300"
          onClick={() => openChat('Explain this health report summary in simple words:')}
        />
        <ToolCard
          title="Appointments"
          desc="Prep questions before you see a doctor"
          icon={<CalendarDays className="w-5 h-5" />}
          iconClass="bg-teal-500/15 text-teal-300"
          onClick={() => openChat('Help me prepare questions for a doctor appointment.')}
        />
        <ToolCard
          title="Prescriptions"
          desc="General info about habits & meds (not advice)"
          icon={<Pill className="w-5 h-5" />}
          iconClass="bg-teal-500/15 text-teal-300"
          onClick={() => openChat('Explain general prescription safety tips (not medical advice).')}
        />
      </div>

      <div>
        <div className="sg16-bar mb-3">
          <h3 className="text-sm font-semibold text-white">Health Summary</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {summary.map((s) => (
            <div key={s.label} className="sg16-card p-4 min-h-[7.5rem] flex flex-col">
              <div className="text-[11px] uppercase tracking-wider text-white/35">{s.label}</div>
              <div className="text-2xl font-semibold text-white mt-2">{s.value}</div>
              <div
                className={`text-xs mt-auto pt-2 ${
                  s.label === 'Health Score' ? 'text-emerald-400' : 'text-white/40'
                }`}
              >
                {s.hint}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-white/30 mt-3">
          Summary cards are local placeholders — always seek a licensed clinician for diagnosis.
        </p>
      </div>
    </ModuleHub>
    </div>
  );
};

export default HealthWorkspace;
