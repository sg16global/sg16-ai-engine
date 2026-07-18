import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';

export const HealthWorkspace = () => (
  <WorkspaceShell
    title="Health Guide"
    subtitle="Wellness questions, report explanations & lifestyle suggestions — not a medical diagnosis"
    badge="Worldwide"
    badgeClass="text-teal-300"
    skin="health"
  >
    <ChatPanel
      workspaceId="health"
      placeholder="Ask about symptoms info, habits, or paste a report summary to explain..."
      suggestions={[
        'Explain this blood test summary in simple words',
        'Healthy sleep routine suggestions',
        'When should I see a doctor for a fever?',
        'Diet tips for more energy',
      ]}
      loadingLabel="SG16 Health is reviewing..."
    />
  </WorkspaceShell>
);

export default HealthWorkspace;
