import { useCallback, useEffect, useState } from 'react';

const DISMISS_KEY = 'sg16_pwa_install_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const onChange = () => {
      setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
    };
    window.matchMedia('(display-mode: standalone)').addEventListener('change', onChange);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', onChange);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setIsInstalled(true);
      return true;
    }
    dismiss();
    return false;
  }, [deferredPrompt, dismiss]);

  const canPrompt = !isInstalled && !dismissed && (!!deferredPrompt || isIOS);

  return { canPrompt, isInstalled, isIOS, install, dismiss, hasNativePrompt: !!deferredPrompt };
}
