import { ShieldCheck, X, Building2, CheckCircle2, Lock } from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';

interface CompanyCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyCertificateModal({ isOpen, onClose }: CompanyCertificateModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] bg-[#0A0A12] border border-[#FF168D]/40 rounded-2xl shadow-[0_0_50px_rgba(255,22,141,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#121626] border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#FF168D]" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Official Entity Certificate — {SG16_BRAND.company}
              </h3>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> State of New Mexico · Filing #{SG16_BRAND.businessId} · Verified
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close certificate"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Anti-download & Security Notice Strip */}
        <div className="flex items-center justify-between gap-3 px-5 py-2 bg-[#FF168D]/10 border-b border-[#FF168D]/20 text-[11px] text-white/80">
          <div className="flex items-center gap-1.5 text-[#FF5CB8]">
            <Lock className="w-3.5 h-3.5" />
            <span>Protected Verified Record · Watermarked · Direct Download Disabled</span>
          </div>
          <span className="text-white/50 hidden sm:inline">SG16 AI ENGINE Official Credentials</span>
        </div>

        {/* Scrollable Document Area with Watermark */}
        <div className="relative overflow-y-auto p-4 sm:p-6 flex justify-center bg-[#070913]">
          {/* Transparent click/drag interceptor to prevent downloading */}
          <div
            className="absolute inset-0 z-30 cursor-default"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />

          {/* Certificate Canvas */}
          <div
            className="relative w-full max-w-[580px] bg-[#fbfbfa] text-[#0a1832] rounded-lg p-6 sm:p-8 shadow-2xl border-[3px] border-[#1a4a84] select-none"
            style={{
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              fontFamily: '"Times New Roman", Times, Georgia, serif',
            }}
          >
            {/* Ornate Inner Border */}
            <div className="absolute inset-2 sm:inset-3 border-2 border-dashed border-[#1a4a84]/60 pointer-events-none rounded" />

            {/* Heavy Diagonal Security Watermark */}
            <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden flex flex-col justify-around opacity-30 select-none">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="whitespace-nowrap text-[15px] sm:text-[18px] font-black uppercase text-[#ff173d] tracking-widest transform -rotate-[24deg] translate-x-[-10%]"
                >
                  SAIF TECH GLOBAL LLC · OFFICIAL REGISTRATION #0008128993 · DO NOT DUPLICATE · SG16 AI ENGINE
                </div>
              ))}
            </div>

            {/* Background State Seal Silhouette */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.14] z-10">
              <svg viewBox="0 0 200 200" className="w-72 h-72 text-[#1a4a84]" fill="currentColor">
                <circle cx="100" cy="100" r="95" stroke="currentColor" strokeWidth="4" fill="none" />
                <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" fill="none" />
                <path d="M100 20 L103 40 L100 45 L97 40 Z" />
                <text x="100" y="70" textAnchor="middle" fontSize="13" fontWeight="bold">GREAT SEAL OF THE</text>
                <text x="100" y="85" textAnchor="middle" fontSize="12" fontWeight="bold">STATE OF NEW MEXICO</text>
                <text x="100" y="145" textAnchor="middle" fontSize="15" fontWeight="bold">★ 1912 ★</text>
              </svg>
            </div>

            {/* Document Content */}
            <div className="relative z-10 text-center">
              <div className="text-[17px] sm:text-[20px] font-extrabold tracking-widest text-[#0c2242] uppercase">
                STATE OF NEW MEXICO
              </div>
              <div className="text-[14px] sm:text-[16px] font-bold tracking-wider text-[#0c2242] mt-0.5 uppercase">
                OFFICE OF THE SECRETARY OF STATE
              </div>

              <div className="my-5 sm:my-6">
                <h1 className="text-[22px] sm:text-[26px] font-bold text-[#0c2242] tracking-wide">
                  Certificate of Organization
                </h1>
              </div>

              <p className="text-[13px] sm:text-[15px] italic text-[#222] leading-relaxed max-w-md mx-auto">
                The undersigned Secretary of State for the State of New Mexico has hereby registered and granted
                authority to transact business in the state of New Mexico to
              </p>

              <div className="my-4 py-2 border-y border-[#1a4a84]/30">
                <div className="text-[20px] sm:text-[24px] font-black tracking-wider text-[#081830] uppercase">
                  {SG16_BRAND.company}
                </div>
                <div className="text-[16px] sm:text-[18px] font-bold text-[#1a4a84] tracking-widest mt-1">
                  {SG16_BRAND.businessId}
                </div>
                <div className="text-[13px] sm:text-[14px] font-semibold italic text-[#333] mt-0.5">
                  {SG16_BRAND.entityType}
                </div>
              </div>

              <div className="text-[12px] sm:text-[13px] text-[#333] leading-relaxed my-4 max-w-lg mx-auto">
                <p>
                  This entity is subject to and governed by {SG16_BRAND.statutoryAct}.
                </p>
                <p className="mt-2 font-semibold">
                  Effective in the State of New Mexico on {SG16_BRAND.effectiveDate}
                </p>
              </div>

              {/* Signatures & Seal Info */}
              <div className="mt-6 pt-4 flex flex-col items-center">
                <div className="text-[16px] sm:text-[18px] italic font-serif text-[#0c2242] tracking-wide">
                  {SG16_BRAND.secretaryOfState}
                </div>
                <div className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-[#0c2242]">
                  {SG16_BRAND.secretaryOfState}
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#555] uppercase tracking-wide">
                  {SG16_BRAND.governingAuthority}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info & verify strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-[#121626] border-t border-white/10 text-xs">
          <div className="text-white/70 text-center sm:text-left">
            <span className="font-semibold text-white">Registered Address:</span> {SG16_BRAND.registeredAddress}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Entity
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
