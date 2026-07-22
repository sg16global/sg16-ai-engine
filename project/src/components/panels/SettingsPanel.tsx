import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppStore } from '../../core/appState';
import { checkEngineHealth } from '../../lib/apiStatus';
import { isStudentVerified, verificationStatusLabel } from '../../core/access';
import { planLabel } from '../../core/plans';
import { SG16_BRAND } from '../../core/branding';

export function SettingsPanel() {
  const settings = useAppStore((s) => s.settings);
  const subscription = useAppStore((s) => s.subscription);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const authUser = useAppStore((s) => s.authUser);
  const launchFree = useAppStore((s) => s.launchFree);
  const launchMessage = useAppStore((s) => s.launchMessage);
  const openLaunchNotice = useAppStore((s) => s.openLaunchNotice);
  const logout = useAppStore((s) => s.logout);
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const wipeSession = useAppStore((s) => s.wipeSession);
  const openPricing = useAppStore((s) => s.openPricing);
  const openStudentVerify = useAppStore((s) => s.openStudentVerify);
  const [engineOnline, setEngineOnline] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    checkEngineHealth().then(setEngineOnline);
  }, []);

  const handleSave = () => {
    updateSettings({ displayName: settings.displayName.trim() || 'SG16 User' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your SG16 AI Engine preferences on this device.</p>
      </div>

      <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <label className="block text-sm text-gray-400">
          Display name
          <input
            value={settings.displayName}
            onChange={(e) => updateSettings({ displayName: e.target.value })}
            className="mt-1.5 w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/40"
          />
        </label>
        <button
          type="button"
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm font-medium"
        >
          {saved ? 'Saved' : 'Save profile'}
        </button>
      </section>

      <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Voice AI</h2>
        <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoSendVoice}
            onChange={(e) => updateSettings({ autoSendVoice: e.target.checked })}
            className="rounded border-white/20"
          />
          Auto-send message after voice input
        </label>
      </section>

      <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold">Engine Status</h2>
        <p className="text-xs text-gray-500">
          Photo edits use in-place editing — your original face and photo are preserved, not recreated from scratch.
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              engineOnline === null
                ? 'bg-yellow-400 animate-pulse'
                : engineOnline
                  ? 'bg-emerald-400'
                  : 'bg-red-400'
            }`}
          />
          {engineOnline === null && 'Checking SG16 AI Engine...'}
          {engineOnline === true && 'SG16 AI Engine is online and ready'}
          {engineOnline === false && 'SG16 AI Engine is offline — check your connection or server'}
        </div>
      </section>

      <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Subscription</h2>

        {launchFree ? (
          <>
            <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/50 to-zinc-950/80 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">Launch — Full unlimited access</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{launchMessage}</p>
              <ul className="text-xs text-emerald-100/80 space-y-1">
                <li>• All 8 SG16 AI workspaces included</li>
                <li>• No payment during launch</li>
                <li>• Student Shield & Pro pricing shown for reference only</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openLaunchNotice}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg font-medium"
              >
                Why is everything free?
              </button>
              <button
                type="button"
                onClick={openPricing}
                className="text-xs border border-white/10 hover:border-emerald-500/30 text-gray-300 px-3 py-2 rounded-lg"
              >
                View future pricing
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-gray-300">
              <p>
                Current plan: <strong className="text-emerald-400">{planLabel(subscription.plan)}</strong>
              </p>
              {subscription.plan === 'student' && (
                <p className="text-xs text-gray-500 mt-1">
                  Verification: {verificationStatusLabel(subscription.studentVerification.status)}
                  {subscription.studentVerification.institutionName &&
                    ` · ${subscription.studentVerification.institutionName}`}
                </p>
              )}
              {subscription.plan === 'free' && (
                <p className="text-xs text-gray-500 mt-1">
                  {SG16_BRAND.chatName} only. Upgrade for Image Studio, Coding Hub, and more.
                </p>
              )}
              {subscription.billingActive && (
                <p className="text-xs text-emerald-400/80 mt-1">Billing active</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openPricing}
                className="text-xs bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-lg font-medium"
              >
                View pricing
              </button>
              {subscription.plan === 'student' && !isStudentVerified(subscription) && (
                <button
                  type="button"
                  onClick={openStudentVerify}
                  className="text-xs border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 px-3 py-2 rounded-lg"
                >
                  Complete Student ID verification
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Account</h2>
        {authUser ? (
          <div className="text-sm text-gray-300 space-y-2">
            <p>Signed in as <strong className="text-white">{authUser.name}</strong></p>
            {launchFree ? (
              <p className="text-xs text-emerald-400">Launch period — all workspaces are free and unlimited.</p>
            ) : authUser.trialActive ? (
              <p className="text-xs text-emerald-400">Trial active — {authUser.trialDaysRemaining} day(s) of full access remaining.</p>
            ) : (
              <p className="text-xs text-gray-500">Trial ended. {SG16_BRAND.chatName} and Translate remain free.</p>
            )}
            <button
              type="button"
              onClick={logout}
              className="text-xs border border-white/10 hover:border-red-500/40 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400"
            >
              Sign out & wipe session
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openLoginModal()}
            className="text-sm bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-medium"
          >
            Login with Google
          </button>
        )}
      </section>

      <section className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold text-red-400">Privacy</h2>
        <p className="text-xs text-gray-500">
          SG16 stores only your Google signup date for account access. No chat history, messages, or conversations are saved to disk.
        </p>
        <button
          type="button"
          onClick={wipeSession}
          className="text-xs border border-white/10 hover:border-red-500/40 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400"
        >
          Wipe this session now
        </button>
      </section>
    </div>
  );
}
