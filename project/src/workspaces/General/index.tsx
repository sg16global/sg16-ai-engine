import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { SG16_BRAND } from '../../core/branding';

export const GeneralWorkspace = () => (
  <WorkspaceShell
    title={SG16_BRAND.chatName}
    subtitle="Real-time answers from the live web — powered by SG16 AI"
    badge="SG16 AI"
  >
    <ChatPanel
      workspaceId="general"
      placeholder={`Message ${SG16_BRAND.chatName}...`}
      suggestions={[
        'What is the news today?',
        'Latest tech headlines',
        'Explain quantum computing simply',
        'Weather forecast today',
      ]}
      loadingLabel="SG16 AI is thinking..."
    />
  </WorkspaceShell>
);

export default GeneralWorkspace;
