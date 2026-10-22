import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppStore } from '../../core/appState';
import { checkEngineHealth, useEngineStatus } from '../../lib/apiStatus';
import { isStudentVerified, verificationStatusLabel } from '../../core/access';
import { planLabel } from '../../core/plans';
import { SG16_BRAND } from '../../core/branding';
import { CompanyDetailsCard } from '../company/CompanyDetailsCard';

export function SettingsPanel() {
  const settings = useAppStore((s) => s.settings);
  const subscription = useAppStore((s) => s.subscription);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const authUser = useAppStore((s) => s.authUser);
  const launchFree = useAppStore((s) => s.launchFree);
  const launchMessage = useAppStore((s) => s.launchMessage);
  const openLaunchNotice = useAppStore((s) => s.openLaunchNotice);
  const logout = useAppStore((s) => s.logout);
  const startSession = useAppStore((s) => s.startSession);
  const wipeSession = useAppStore((s) => s.wipeSession);
  const openPricing = useAppStore((s) => s.openPricing);
  const openStudentVerify = useAppStore((s) => s.openStudentVerify);
  const engineStatus = useEngineStatus();
  const engineOnline = engineStatus === 'checking' ? null : engineStatus === 'online';
  const [saved, setSaved] = useState(false);
  const [wiped, setWiped] = useState(false);

  useEffect(() => {
    void checkEngineHealth();
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

      <section className="bg-[#0A0A12]/80 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <label className="block text-sm text-gray-400">
          Display name
          <input
            value={settings.displayName}
            onChange={(e) => updateSettings({ displayName: e.target.value })}
            className="mt-1.5 w-full bg-[#08080F] border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500/40"
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

      <section className="bg-[#0A0A12]/80 border border-white/10 rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold">Engine Status</h2>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              engineOnline === null
                ? 'bg-yellow-400 animate-pulse'
                : engineOnline
                  ? 'bg-emerald-400'
                  : 'bg-[#FF526B]'
            }`}
          />
          {engineOnline === null && 'Checking SG16 AI Engine...'}
          {engineOnline === true && 'SG16 AI Engine is online and ready'}
          {engineOnline === false && 'SG16 AI Engine is offline — check your connection or server'}
        </div>
      </section>

      <section className="bg-[#0A0A12]/80 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Subscription</h2>

        {launchFree ? (
          <>
            <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/50 to-[#07070D]/80 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-sm font-semibold">Launch — Full unlimited access</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{launchMessage}</p>
              <ul className="text-xs text-emerald-100/80 space-y-1">
                <li>• All 5 shields included</li>
                <li>• No payment during launch</li>
                <li>• Pass prices (from $2) shown for reference only</li>
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
                className="text-xs bg-[#FF168D] hover:bg-[#FF3DA5] text-[#09060B] px-3 py-2 rounded-lg font-semibold transition"
              >
                See passes
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

      <section className="bg-[#0A0A12]/80 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Account</h2>
        {authUser ? (
          <div className="text-sm text-gray-300 space-y-2">
            <p>No account — this device has its own private SG16 space.</p>
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
              className="text-xs border border-white/10 hover:border-[#FF526B]/40 px-3 py-2 rounded-lg text-gray-400 hover:text-[#FF526B]"
            >
              Exit
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => startSession()}
            className="text-sm bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-medium"
          >
            Enter SG16
          </button>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">Company & Entity Registration</h2>
        <CompanyDetailsCard />
      </section>

      <section className="bg-[#0A0A12]/80 border border-white/10 rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold text-[#FF526B]">Privacy</h2>
        <p className="text-xs text-gray-500">
          Your chat history is saved on this device only — SG16 never stores it on its servers. Clear it anytime below.
          Your shield tools (homework, medicines, alerts…) are not affected.
        </p>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm('Delete every chat conversation saved on this device? This cannot be undone.')) return;
            wipeSession();
            setWiped(true);
          }}
          className="text-xs border border-white/10 hover:border-[#FF526B]/40 px-3 py-2 rounded-lg text-gray-400 hover:text-[#FF526B]"
        >
          Delete all chat history
        </button>
        {wiped && <p className="text-xs text-emerald-400">All chat history on this device was deleted.</p>}
      </section>
    </div>
  );
}
