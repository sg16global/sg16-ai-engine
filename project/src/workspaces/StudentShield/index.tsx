import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';

export const StudentShieldWorkspace = () => (
  <WorkspaceShell
    title="Student Shield"
    subtitle="Worldwide education-safe tutor — homework, exams, clear explanations"
    badge="Shield active"
    badgeClass="text-amber-300"
    skin="student"
  >
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
  </WorkspaceShell>
);

export default StudentShieldWorkspace;
