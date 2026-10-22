import { useState, type ReactNode } from 'react';
import { Stethoscope, FileHeart, CalendarDays, Pill, Activity, Scale } from 'lucide-react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ModuleHub } from '../../components/workspace/ModuleHub';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { ToolCard } from '../../components/ui/Sg16Cards';
import { ToolPage } from '../../components/tools/ToolPage';
import { StatTile, formatDate } from '../../components/tools/RecordTool';
import {
  AppointmentsTool,
  BmiTool,
  HealthLogTool,
  MedicinesTool,
  healthStats,
} from '../../components/tools/healthTools';
import { useAppStore } from '../../core/appState';
import { useOpenChatRequest } from '../../hooks/useOpenChatRequest';

type View = 'hub' | 'chat' | 'medicines' | 'appointments' | 'log' | 'bmi';

const TOOLS: Record<Exclude<View, 'hub' | 'chat'>, { title: string; subtitle: string; body: () => ReactNode }> = {
  medicines: { title: 'Medicines', subtitle: 'What you take and when. Follow your doctor or pharmacist.', body: () => <MedicinesTool /> },
  appointments: { title: 'Appointments', subtitle: 'Upcoming visits and the questions you want to ask.', body: () => <AppointmentsTool /> },
  log: { title: 'Health log', subtitle: 'Weight, blood pressure, sleep, water and more.', body: () => <HealthLogTool /> },
  bmi: { title: 'BMI calculator', subtitle: 'Body mass index from your height and weight.', body: () => <BmiTool /> },
};

export const HealthWorkspace = () => {
  const [view, setView] = useState<View>('hub');

  const openChat = (prompt?: string) => {
    if (prompt) {
      useAppStore.setState({ pendingPrompt: prompt, pendingPromptToken: Date.now() });
    }
    setView('chat');
  };
  useOpenChatRequest('health', () => setView('chat'));

  if (view === 'chat') {
    return (
      <WorkspaceShell
        title="Health Guide"
        subtitle="Wellness questions & report explain — not a medical diagnosis"
        badge="AI"
        badgeClass="text-[#FF5CB8]"
        skin="health"
      >
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
          onBack={() => setView('hub')}
          backLabel="Back to Health"
        />
      </WorkspaceShell>
    );
  }

  if (view !== 'hub') {
    const tool = TOOLS[view];
    return (
      <div className="sg16-work-field h-full">
        <ToolPage title={tool.title} subtitle={tool.subtitle} backLabel="Back to Health" onBack={() => setView('hub')}>
          {tool.body()}
        </ToolPage>
      </div>
    );
  }

  const s = healthStats();

  return (
    <div className="sg16-work-field h-full">
    <ModuleHub
      title="Health Shield"
      subtitle="Your medicines, appointments and health log on this device — plus an AI guide for questions"
      skin="health"
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ToolCard
          title="Ask Health Guide (AI)"
          desc="Wellness and lifestyle questions — not a diagnosis"
          icon={<Stethoscope className="w-5 h-5" />}
          iconClass="bg-[#FF168D]/15 text-[#FF5CB8]"
          onClick={() => openChat()}
        />
        <ToolCard
          title="Explain a report (AI)"
          desc="Paste report text for a plain-language explanation"
          icon={<FileHeart className="w-5 h-5" />}
          iconClass="bg-[#FF168D]/15 text-[#FF5CB8]"
          onClick={() => openChat('Explain this health report summary in simple words:')}
        />
        <ToolCard
          title="Medicines"
          desc={s.activeMedicines ? `${s.activeMedicines} active · next dose ${s.nextDose ? s.nextDose.time : 'tomorrow'}` : 'Track what you take and when'}
          icon={<Pill className="w-5 h-5" />}
          iconClass="bg-[#FF168D]/15 text-[#FF5CB8]"
          onClick={() => setView('medicines')}
        />
        <ToolCard
          title="Appointments"
          desc={s.nextAppointment ? `Next: ${formatDate(s.nextAppointment.date)} · ${s.nextAppointment.with}` : 'Plan visits and questions to ask'}
          icon={<CalendarDays className="w-5 h-5" />}
          iconClass="bg-[#FF168D]/15 text-[#FF5CB8]"
          onClick={() => setView('appointments')}
        />
        <ToolCard
          title="Health log"
          desc={s.logEntries ? `${s.logEntries} entries` : 'Weight, blood pressure, sleep, water'}
          icon={<Activity className="w-5 h-5" />}
          iconClass="bg-[#FF168D]/15 text-[#FF5CB8]"
          onClick={() => setView('log')}
        />
        <ToolCard
          title="BMI calculator"
          desc="From your height and weight (WHO ranges)"
          icon={<Scale className="w-5 h-5" />}
          iconClass="bg-[#FF168D]/15 text-[#FF5CB8]"
          onClick={() => setView('bmi')}
        />
      </div>

      <div>
        <div className="sg16-bar mb-3">
          <h3 className="text-sm font-semibold text-white">Health Summary</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            label="Next dose"
            value={s.nextDose ? s.nextDose.time : '—'}
            hint={s.nextDose ? `${s.nextDose.name}${s.nextDose.dose ? ` · ${s.nextDose.dose}` : ''}` : s.activeMedicines ? 'No more doses today' : 'No medicines added'}
          />
          <StatTile
            label="Appointments"
            value={s.upcoming.length}
            hint={s.nextAppointment ? `Next ${formatDate(s.nextAppointment.date)}` : 'None upcoming'}
          />
          <StatTile label="Active medicines" value={s.activeMedicines} />
          <StatTile
            label={s.latest[0]?.type ?? 'Health log'}
            value={s.latest[0]?.value ?? '—'}
            hint={s.latest[0] ? formatDate(s.latest[0].date) : 'No entries yet'}
          />
        </div>
        <p className="text-[11px] text-white/30 mt-3">
          Numbers come from what you saved on this device. SG16 does not diagnose — always see a licensed clinician.
        </p>
      </div>
    </ModuleHub>
    </div>
  );
};

export default HealthWorkspace;
