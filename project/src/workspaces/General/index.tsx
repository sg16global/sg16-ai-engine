import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { SG16_BRAND } from '../../core/branding';

export const GeneralWorkspace = () => (
  <WorkspaceShell
    title={SG16_BRAND.chatName}
    subtitle="Worldwide general chat — live answers, daily questions, clear SG16 help"
    badge="Worldwide"
    badgeClass="text-fuchsia-300"
    skin="chat"
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
