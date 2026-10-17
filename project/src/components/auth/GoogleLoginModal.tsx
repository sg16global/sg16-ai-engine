import { useEffect, useState } from 'react';
import { X, Shield } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { loginWithGoogle } from '../../lib/authApi';
import { SG16_BRAND } from '../../core/branding';
import { Sg16Logo } from '../ui/Sg16Logo';
import { GoogleSignInButton } from './GoogleSignInButton';
import { isValidGoogleClientId, resolveGoogleClientId } from '../../lib/googleIdentity';

export function GoogleLoginModal() {
  const open = useAppStore((s) => s.loginModalOpen);
  const launchFree = useAppStore((s) => s.launchFree);
  const launchMessage = useAppStore((s) => s.launchMessage);
  const closeLoginModal = useAppStore((s) => s.closeLoginModal);
  const setAuthSession = useAppStore((s) => s.setAuthSession);
  const enterLocalPreview = useAppStore((s) => s.enterLocalPreview);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientConfigured, setClientConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    void resolveGoogleClientId().then((id) => {
      setClientConfigured(isValidGoogleClientId(id));
    });
  }, []);

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

      <div className="relative w-full max-w-md bg-[#0A0A12] border border-[#29202F] rounded-2xl p-6 shadow-2xl shadow-[#FF168D]/15">
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
          <h2 className="text-xl font-bold mb-2 text-white">Sign in to continue</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {launchFree ? (
              <>
                Sign in with Google to use SG16 AI. During launch,{' '}
                <strong className="text-[#FF5CB8]">every workspace is free and unlimited</strong>.
              </>
            ) : (
              <>
                Sign in with Google to unlock SG16 AI. New users get{' '}
                <strong className="text-[#FF5CB8]">3 days of full access</strong> to every workspace — active
                instantly from your signup timestamp.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 min-h-[48px]">
          {clientConfigured ? (
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={setError}
              disabled={loading || !open}
            />
          ) : null}

          {loading && <p className="text-xs text-[#FF5CB8]">Activating your account…</p>}
          {error && <p className="text-xs text-[#FF526B] text-center max-w-xs">{error}</p>}

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              void enterLocalPreview()
                .then(() => {
                  closeLoginModal();
                })
                .catch((err) => {
                  setError(err instanceof Error ? err.message : 'Sign-in failed');
                })
                .finally(() => setLoading(false));
            }}
            disabled={loading}
            className="w-full mt-1 rounded-xl bg-[#FF168D] hover:bg-[#FF3DA5] py-3.5 text-sm font-bold text-[#09060B] shadow-[0_0_24px_rgba(255,22,141,0.4)] transition disabled:opacity-50"
          >
            {loading ? 'Entering SG16 Workspace…' : 'Enter SG16 Workspace →'}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-[#29202F] space-y-2">
          <p className="text-[11px] text-gray-400 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-[#FF168D] shrink-0 mt-0.5" />
            Strict privacy: Your chat history saves to your personal user room when signed in.
          </p>
          <p className="text-[11px] text-gray-500 text-center">
            {launchFree
              ? launchMessage
              : `After 3 days, Coding Hub, Image Studio & Document Lab lock. ${SG16_BRAND.chatName} & Translate stay free forever.`}
          </p>
        </div>
      </div>
    </div>
  );
}

