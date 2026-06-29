import { useEffect, useRef, useState } from 'react';
import {
  getGoogleOriginSetupHint,
  initGoogleIdentity,
  loadGsiScript,
  renderGoogleSignInButton,
  resolveGoogleClientId,
  validateGoogleAuthEnvironment,
} from '../../lib/googleIdentity';
import { getPageOrigin } from '../../config/googleAuth';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

/** Stable GIS button — initialize() runs once per page, button stays mounted. */
export function GoogleSignInButton({ onCredential, onError, disabled }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  onCredentialRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const clientId = await resolveGoogleClientId();
        if (cancelled) return;

        const envError = validateGoogleAuthEnvironment(clientId);
        if (envError) {
          setStatus('error');
          onError(envError);
          return;
        }

        await loadGsiScript(clientId);
        if (cancelled || !containerRef.current) return;

        initGoogleIdentity(clientId, (credential) => onCredentialRef.current(credential));
        renderGoogleSignInButton(containerRef.current);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        onError(err instanceof Error ? err.message : 'Google sign-in failed to initialize');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onError]);

  return (
    <div
      className={`min-h-[44px] flex flex-col items-center justify-center gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {status === 'loading' && (
        <p className="text-xs text-gray-400 animate-pulse">Loading Google sign-in…</p>
      )}
      <div ref={containerRef} className={status === 'ready' ? '' : 'sr-only'} aria-hidden={status !== 'ready'} />
      {import.meta.env.DEV && status === 'ready' && (
        <p className="text-[10px] text-gray-600 text-center max-w-xs">
          Origin: {getPageOrigin()}
        </p>
      )}
      {status === 'error' && import.meta.env.DEV && (
        <pre className="text-[9px] text-gray-500 whitespace-pre-wrap text-left max-w-xs bg-black/30 p-2 rounded-lg">
          {getGoogleOriginSetupHint()}
        </pre>
      )}
    </div>
  );
}
