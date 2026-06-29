import { useEffect } from 'react';
import { useAppStore } from '../core/appState';
import { enrichAuthUser } from '../core/authSession';

/** Keeps trial countdown in sync from raw signupDate without extra API calls. */
export function useTrialSync() {
  const signupDate = useAppStore((s) => s.authUser?.signupDate);

  useEffect(() => {
    if (!signupDate) return;

    const tick = () => {
      const user = useAppStore.getState().authUser;
      if (!user) return;
      useAppStore.setState({ authUser: enrichAuthUser(user) });
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [signupDate]);
}
