import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';

export const StudentShieldWorkspace = () => (
  <WorkspaceShell
    title="Student Shield"
    subtitle="Safe, educational tutoring — study topics only"
    badge="🛡️ Shield Active"
    badgeClass="text-amber-400"
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
