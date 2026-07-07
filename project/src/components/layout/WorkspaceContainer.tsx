import { useAppStore } from '../../core/appState';

import { canAccessWorkspace } from '../../core/access';

import type { WorkspaceId } from '../../core/types';

import { UpgradeGate } from '../workspace/UpgradeGate';

import { CodingWorkspace } from '../../workspaces/Coding';

import { StudentShieldWorkspace } from '../../workspaces/StudentShield';

import { ImageWorkspace } from '../../workspaces/Image';

import { DocumentWorkspace } from '../../workspaces/Document';

import { GeneralWorkspace } from '../../workspaces/General';

import { VoiceWorkspace } from '../../workspaces/Voice';

import { TranslateWorkspace } from '../../workspaces/Translate';

import { MemoryVaultWorkspace } from '../../workspaces/MemoryVault';



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

    case 'image':

      return <ImageWorkspace />;

    case 'document':

      return <DocumentWorkspace />;

    case 'general':

      return <GeneralWorkspace />;

    case 'voice':

      return <VoiceWorkspace />;

    case 'translate':

      return <TranslateWorkspace />;

    case 'memory':

      return <MemoryVaultWorkspace />;

    default:

      return null;

  }
      })()}
    </div>
  );

};

