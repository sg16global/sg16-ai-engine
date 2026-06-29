import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';

export const CodingWorkspace = () => (
  <WorkspaceShell
    title="Coding Hub"
    subtitle="Write, debug, and build software with SG16 AI"
    badge="Developer Mode"
    badgeClass="text-blue-400"
  >
    <ChatPanel
      workspaceId="coding"
      monospace
      placeholder="Describe what you want to build or paste code to review..."
      suggestions={[
        'Write a Python function to sort a list',
        'Review this React component for bugs',
        'Explain async/await in JavaScript',
        'Create a REST API with Express',
      ]}
    />
  </WorkspaceShell>
);

export default CodingWorkspace;
