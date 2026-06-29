import { useState } from 'react';
import { Camera, Loader2, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '../../core/appState';
import { readImageFile, verifyStudentId } from '../../lib/chatApi';
import { verificationStatusLabel } from '../../core/access';

export function StudentVerifyPanel() {
  const subscription = useAppStore((s) => s.subscription);
  const applyStudentVerification = useAppStore((s) => s.applyStudentVerification);
  const openPricing = useAppStore((s) => s.openPricing);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verification = subscription.studentVerification;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const url = await readImageFile(file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!imageUrl || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await verifyStudentId(imageUrl);
      applyStudentVerification(result);
      if (!result.approved) {
        setError(result.reason);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Student ID Verification</h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Student Shield ($4/month) unlocks all SG16 AI workspaces after verification. Upload a clear selfie
          holding your valid school or college Student ID card. SG16 AI will scan the image, verify your
          institution, and check the expiry date.
        </p>
        <p className="text-xs text-emerald-400 mt-2">
          Status: {verificationStatusLabel(verification.status)}
          {verification.institutionName && ` · ${verification.institutionName}`}
        </p>
      </div>

      {verification.status === 'approved' && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-sm text-emerald-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          You are verified. All SG16 AI workspaces are unlocked.
        </div>
      )}

      {verification.status === 'rejected' && verification.reason && (
        <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          {verification.reason}
        </div>
      )}

      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 text-sm text-gray-300">
          <Camera className="w-5 h-5 text-emerald-400" />
          <span>Hold your Student ID next to your face — both must be clearly visible.</span>
        </div>

        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/15 hover:border-emerald-500/40 rounded-xl p-8 cursor-pointer transition">
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Upload className="w-8 h-8 text-gray-500" />
          <span className="text-sm text-gray-400">Click to upload selfie with Student ID</span>
        </label>

        {imageUrl && (
          <img src={imageUrl} alt="Student ID verification" className="rounded-xl max-h-64 mx-auto object-contain" />
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!imageUrl || loading || verification.status === 'approved'}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 py-3 rounded-xl text-sm font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> SG16 AI is verifying...
            </>
          ) : (
            'Submit for AI verification'
          )}
        </button>
      </div>

      <button type="button" onClick={openPricing} className="mt-6 text-xs text-gray-500 hover:text-white">
        ← Back to pricing
      </button>
    </div>
  );
}
