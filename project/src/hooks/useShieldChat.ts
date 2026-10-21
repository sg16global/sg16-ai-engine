import { useEffect, useState } from 'react';
import { useAppStore } from '../core/appState';
import type { WorkspaceId } from '../core/types';

function wantsChat(workspaceId: WorkspaceId) {
  const s = useAppStore.getState();
  return s.pendingPrompt?.workspaceId === workspaceId || !!s.activeThreadId[workspaceId];
}

/**
 * Hub-style shields (Coding, Health, Market, Student) show a tool hub and a chat.
 * The chat opens by itself when a prompt is queued for this shield or a saved thread is opened.
 */
export function useShieldChat(workspaceId: WorkspaceId) {
  const [inChat, setInChat] = useState(() => wantsChat(workspaceId));
  const token = useAppStore((s) => s.pendingPromptToken);
  const activeId = useAppStore((s) => s.activeThreadId[workspaceId]);

  useEffect(() => {
    if (wantsChat(workspaceId)) setInChat(true);
  }, [token, activeId, workspaceId]);

  /** Opens a fresh chat; with a prompt, sends it there. */
  const openChat = (prompt?: string, display?: string) => {
    const store = useAppStore.getState();
    if (prompt) store.queuePrompt(workspaceId, prompt, { display });
    else store.newThread(workspaceId);
    setInChat(true);
  };

  /** Opens a fresh chat with `text` typed into the message box, for the user to complete. */
  const openDraft = (text: string) => {
    useAppStore.getState().queuePrompt(workspaceId, text, { draft: true });
    setInChat(true);
  };

  /** Back to the hub — the conversation stays in history. */
  const backToHub = () => {
    useAppStore.getState().newThread(workspaceId);
    setInChat(false);
  };

  return { inChat, openChat, openDraft, backToHub };
}
