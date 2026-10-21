import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';

export const VoiceWorkspace = () => (
  <WorkspaceShell
    title="Voice AI"
    subtitle="Tap mic → speak → tap mic again. Works on iPhone via SG16 server."
    badge="Voice"
    badgeClass="text-pink-400"
  >
    <ChatPanel
      workspaceId="voice"
      allowVoice
      placeholder="Type or use the microphone to speak..."
      suggestions={[
        'Give me a 30-second podcast intro',
        'Explain blockchain in simple spoken words',
        'Summarize today\'s learning goals aloud',
      ]}
    />
  </WorkspaceShell>
);

export default VoiceWorkspace;
