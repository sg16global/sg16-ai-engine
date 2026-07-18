import { useAppStore } from '../../core/appState';
import { canAccessWorkspace } from '../../core/access';
import type { WorkspaceId } from '../../core/types';
import { UpgradeGate } from '../workspace/UpgradeGate';
import { CodingWorkspace } from '../../workspaces/Coding';
import { StudentShieldWorkspace } from '../../workspaces/StudentShield';
import { GeneralWorkspace } from '../../workspaces/General';
import { HealthWorkspace } from '../../workspaces/Health';

export const WorkspaceContainer = () => {
  const currentWorkspace = useAppStore((state) => state.currentWorkspace);
  const subscription = useAppStore((state) => state.subscription);
  const authUser = useAppStore((state) => state.authUser);
  const workspaceId = currentWorkspace as WorkspaceId;

  if (!canAccessWorkspace(workspaceId, subscription, authUser)) {
    return <UpgradeGate workspaceId={workspaceId} />;
  }

  return (
    <div key={currentWorkspace} className="h-full min-h-0">
      {(() => {
        switch (currentWorkspace) {
          case 'coding':
            return <CodingWorkspace />;
          case 'student-shield':
            return <StudentShieldWorkspace />;
          case 'general':
            return <GeneralWorkspace />;
          case 'health':
            return <HealthWorkspace />;
          default:
            return <GeneralWorkspace />;
        }
      })()}
    </div>
  );
};
