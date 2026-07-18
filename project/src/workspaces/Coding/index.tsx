import { useRef } from 'react';
import { WorkspaceShell } from '../../components/workspace/WorkspaceShell';
import { ChatPanel } from '../../components/chat/ChatPanel';
import { ProjectCheckPanel } from '../../components/coding/ProjectCheckPanel';
import { useAppStore } from '../../core/appState';

export const CodingWorkspace = () => {
  const bump = useRef(0);

  const onAnalyze = (prompt: string) => {
    bump.current += 1;
    useAppStore.setState({ pendingPrompt: prompt, pendingPromptToken: Date.now() });
  };

  return (
    <WorkspaceShell
      title="Coding Hub"
      subtitle="Check any project → score from every side → Premium repair when you want a rewrite"
      badge="Developer"
      badgeClass="text-sky-300"
      skin="coding"
    >
      <div className="h-full flex flex-col min-h-0">
        <ProjectCheckPanel onAnalyze={onAnalyze} />
        <div className="flex-1 min-h-0">
          <ChatPanel
            workspaceId="coding"
            monospace
            placeholder="Describe what to build, or use Project check above..."
            suggestions={[
              'Review this React component for bugs',
              'Write a secure Express API route',
              'Explain this TypeScript error',
              'Refactor this function for clarity',
            ]}
          />
        </div>
      </div>
    </WorkspaceShell>
  );
};

export default CodingWorkspace;
