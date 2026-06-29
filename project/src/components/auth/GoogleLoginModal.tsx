import { useState } from 'react';
import { X, Shield } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { loginWithGoogle } from '../../lib/authApi';
import { hasGoogleClientId } from '../../config/googleAuth';
import { SG16_BRAND } from '../../core/branding';
import { Sg16Logo } from '../ui/Sg16Logo';
import { GoogleSignInButton } from './GoogleSignInButton';

export function GoogleLoginModal() {
  const open = useAppStore((s) => s.loginModalOpen);
  const closeLoginModal = useAppStore((s) => s.closeLoginModal);
  const setAuthSession = useAppStore((s) => s.setAuthSession);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle(credential);
      setAuthSession(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 transition-opacity ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none invisible'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={closeLoginModal}
        aria-label="Close"
        tabIndex={open ? 0 : -1}
      />

      <div className="relative w-full max-w-md bg-zinc-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl shadow-emerald-500/10">
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 text-gray-400"
          aria-label="Close"
          tabIndex={open ? 0 : -1}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <Sg16Logo className="w-16 h-16 mx-auto mb-3" glow />
          <h2 className="text-xl font-bold mb-2">Sign in to continue</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Sign in with Google to unlock SG16 AI. New users get{' '}
            <strong className="text-emerald-400">3 days of full access</strong> to every workspace — active
            instantly from your signup timestamp.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 min-h-[48px]">
          {hasGoogleClientId ? (
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={setError}
              disabled={loading || !open}
            />
          ) : (
            <div className="text-xs text-amber-400/95 text-center max-w-xs space-y-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="font-medium">Google Client ID required</p>
              <p>
                Add to <strong className="text-white">project/.env</strong>:
              </p>
              <code className="block text-[10px] text-left bg-black/40 p-2 rounded-lg break-all">
                VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
              </code>
              <p className="text-[10px] text-gray-400">
                Same value in <strong>backend/.env</strong> as GOOGLE_CLIENT_ID, then restart both servers.
              </p>
            </div>
          )}
          {loading && <p className="text-xs text-emerald-400">Activating your account…</p>}
          {error && <p className="text-xs text-red-400 text-center max-w-xs">{error}</p>}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
          <p className="text-[11px] text-gray-500 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            Strict privacy: we only store your signup date for the trial. No chat history or messages are saved.
          </p>
          <p className="text-[11px] text-gray-500 text-center">
            After 3 days, Coding Hub, Image Studio & Document Lab lock. {SG16_BRAND.chatName} & Translate stay free
            forever.
          </p>
        </div>
      </div>
    </div>
  );
}
