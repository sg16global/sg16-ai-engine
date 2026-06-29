import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';

export const DocumentWorkspace = () => (
  <WorkspaceShell
    title="Document Lab"
    subtitle="Summarize and analyze text files and PDFs with SG16 AI"
    badge="Analysis"
    badgeClass="text-purple-400"
  >
    <ChatPanel
      workspaceId="document"
      allowDocument
      placeholder="Paste text or upload a document to analyze..."
      suggestions={[
        'Summarize this in 3 bullet points',
        'Extract key dates and names',
        'Create an executive summary',
        'Compare these two sections',
      ]}
    />
  </WorkspaceShell>
);

export default DocumentWorkspace;
