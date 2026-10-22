import { useEffect } from 'react';
import { useAppStore } from '../core/appState';
import type { WorkspaceId } from '../core/types';

/** Switch a shield to its chat view when History or Pilot asks for it (openShieldChat / openThread). */
export function useOpenChatRequest(workspaceId: WorkspaceId, openChat: () => void) {
  const openChatFor = useAppStore((s) => s.openChatFor);
  useEffect(() => {
    if (openChatFor === workspaceId && useAppStore.getState().consumeOpenChat(workspaceId)) openChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openChatFor, workspaceId]);
}
