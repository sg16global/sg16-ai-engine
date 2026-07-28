import { useCallback, useEffect, useRef, useState } from 'react';

const HIDE_DELAY_MS = 2800;

/** Auto-hide sidebar + header on desktop workspaces; open together on edge hover / tab click. */
export function useAutoHideChrome(workspaceKey: string, enabled: boolean) {
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverPinned = useRef(false);

  const clearTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const openChrome = useCallback(() => {
    if (!enabled) return;
    setOpen(true);
    clearTimer();
  }, [enabled, clearTimer]);

  const scheduleClose = useCallback(() => {
    if (!enabled || hoverPinned.current) return;
    clearTimer();
    hideTimer.current = setTimeout(() => setOpen(false), HIDE_DELAY_MS);
  }, [enabled, clearTimer]);

  const onChromeEnter = useCallback(() => {
    hoverPinned.current = true;
    openChrome();
  }, [openChrome]);

  const onChromeLeave = useCallback(() => {
    hoverPinned.current = false;
    scheduleClose();
  }, [scheduleClose]);

  const onNavSelect = useCallback(() => {
    openChrome();
    hoverPinned.current = false;
    scheduleClose();
  }, [openChrome, scheduleClose]);

  useEffect(() => {
    if (!enabled) {
      setOpen(true);
      return;
    }
    setOpen(false);
    hoverPinned.current = false;
    clearTimer();
  }, [workspaceKey, enabled, clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    open: enabled ? open : true,
    openChrome,
    onChromeEnter,
    onChromeLeave,
    onNavSelect,
  };
}
