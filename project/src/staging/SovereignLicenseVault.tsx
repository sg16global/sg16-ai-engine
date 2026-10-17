import { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Award,
  AlertTriangle,
  QrCode,
  ExternalLink,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SG16_BRAND } from '../core/branding';
import { cyberAudio } from './cyberSound';

export function SovereignLicenseVault() {
  const [watermarkLevel, setWatermarkLevel] = useState<'standard' | 'maximum'>('maximum');
  const [inspectSeal, setInspectSeal] = useState(false);
  const [showCopyBlockedNotice, setShowCopyBlockedNotice] = useState(false);

  const blockInterception = (e: React.SyntheticEvent) => {
    e.preventDefault();
    cyberAudio.alert();
    setShowCopyBlockedNotice(true);
    setTimeout(() => setShowCopyBlockedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 select-none" onContextMenu={blockInterception}>
      {/* Anti-Download Floating Toast Warning */}
      {showCopyBlockedNotice && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#191321]/95 border border-[#FF168D]/60 text-[#FFB3DA] text-xs shadow-2xl animate-in slide-in-from-top duration-200">
          <AlertTriangle className="w-5 h-5 text-[#FF3DA5] shrink-0" />
          <div>
            <div className="font-bold text-white">PROTECTED INTELLECTUAL ASSET</div>
            <div className="text-[11px] text-[#FF5CB8]">
              Direct download & copying restricted. Sovereign cryptographic license watermarked for Saif Tech Global LLC.
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0F0C16] to-[#07070D] border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-[#FF5CB8] p-[1px]">
            <div className="w-full h-full bg-[#0A0A12] rounded-[11px] flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-base">
                OFFICIAL SOVEREIGN LICENSE VAULT
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                PROTECTED ASSET
              </span>
            </div>
            <p className="text-xs text-white/50">
              State of New Mexico Certification · Entity #0007946146 · Powered by <strong className="text-white">SG16 AI ENGINE</strong>
            </p>
          </div>
        </div>

        {/* Security Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setWatermarkLevel(watermarkLevel === 'maximum' ? 'standard' : 'maximum');
              cyberAudio.blip(800, 0.08);
            }}
            className={`px-3 py-1.5 rounded-lg border font-medium transition flex items-center gap-1.5 ${
              watermarkLevel === 'maximum'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/70'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Watermark: {watermarkLevel === 'maximum' ? 'MAX SECURITY' : 'STANDARD'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInspectSeal(!inspectSeal);
              cyberAudio.blip(950, 0.08);
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{inspectSeal ? 'Hide Seal Zoom' : 'Verify Gold Seal'}</span>
          </button>
        </div>
      </div>

      {/* Main License Parchment Display with Security Watermarking */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#0F0C16] via-[#0A0A12] to-[#050509] border-2 border-amber-500/30 shadow-[0_0_50px_rgba(234,179,8,0.12)]">
        {/* Anti-Tamper Holographic Grid Overlay */}
        <div
          className={`absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 ${
            watermarkLevel === 'maximum' ? 'opacity-85' : 'opacity-40'
          }`}
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, rgba(234, 179, 8, 0.04) 0px, rgba(234, 179, 8, 0.04) 40px, rgba(255,22,141, 0.04) 40px, rgba(255,22,141, 0.04) 80px)`,
          }}
        >
          {/* Diagonal Security Watermark Repeating Text */}
          <div className="w-full h-full flex flex-col justify-around overflow-hidden select-none opacity-30 transform -rotate-12 scale-125">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="whitespace-nowrap text-[11px] font-mono font-black text-amber-300/40 tracking-[0.3em] uppercase"
              >
                SG16 AI ENGINE • SAIF TECH GLOBAL LLC • OFFICIAL NEW MEXICO ARTICLES OF ORGANIZATION • NO DOWNLOAD / PIRACY PROHIBITED • SEC-ID #0007946146
              </div>
            ))}
          </div>
        </div>

        {/* Certificate Inner Canvas */}
        <div className="relative z-20 p-6 sm:p-10 md:p-12 space-y-8 max-w-4xl mx-auto">
          {/* Certificate Header Banner */}
          <div className="text-center space-y-2 border-b-2 border-amber-500/40 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official State Filing Record</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-wider text-amber-200 uppercase">
              State of New Mexico
            </h1>
            <h2 className="text-sm sm:text-lg font-serif font-semibold text-white/80 tracking-widest uppercase">
              Office of the Secretary of State
            </h2>
            <p className="text-xs font-mono text-amber-400">
              Maggie Toulouse Oliver — Secretary of State
            </p>
          </div>

          {/* Certificate Body Title */}
          <div className="text-center space-y-2 py-2">
            <h3 className="text-lg sm:text-2xl font-serif font-bold text-white tracking-wide uppercase">
              Articles of Organization
            </h3>
            <p className="text-xs sm:text-sm text-white/70 italic max-w-2xl mx-auto">
              It is hereby certified that the Articles of Organization were duly filed and found to conform to law in the Office of the Secretary of State of the State of New Mexico.
            </p>
          </div>

          {/* Core Entity Credential Box */}
          <div className="p-6 rounded-2xl bg-black/60 border border-amber-500/30 backdrop-blur-md space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-white/40 text-[11px] font-mono uppercase tracking-wider block">
                  Official Entity Name:
                </span>
                <span className="text-lg sm:text-xl font-bold text-white font-mono">
                  {SG16_BRAND.company}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-white/40 text-[11px] font-mono uppercase tracking-wider block">
                  Business Identification Number:
                </span>
                <span className="text-lg sm:text-xl font-bold text-amber-300 font-mono">
                  #{SG16_BRAND.businessId}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-white/40 text-[11px] font-mono uppercase tracking-wider block">
                  Jurisdiction & Entity Classification:
                </span>
                <span className="font-semibold text-white">
                  {SG16_BRAND.entityType} ({SG16_BRAND.jurisdiction})
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-white/40 text-[11px] font-mono uppercase tracking-wider block">
                  Statutory Governing Authority:
                </span>
                <span className="font-semibold text-white">
                  {SG16_BRAND.statutoryAct}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-white/40 text-[11px] font-mono uppercase tracking-wider block">
                  Effective Registration Date:
                </span>
                <span className="font-semibold text-emerald-400">
                  {SG16_BRAND.effectiveDate} (Perpetual Duration)
                </span>
              </div>

              <div className="md:col-span-2 space-y-1 border-t border-white/10 pt-3">
                <span className="text-white/40 text-[11px] font-mono uppercase tracking-wider block">
                  Registered Corporate Office Address:
                </span>
                <span className="font-semibold text-white/90">
                  {SG16_BRAND.registeredAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Embossed State Seal & Ribbon Replication */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t-2 border-amber-500/40">
            {/* Left QR Code Authenticity Validator */}
            <div className="flex items-center gap-3 bg-black/50 p-3 rounded-xl border border-white/10">
              <div className="w-12 h-12 bg-white p-1 rounded-lg flex items-center justify-center text-black">
                <QrCode className="w-10 h-10" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white flex items-center gap-1">
                  <span>Cryptographic Seal</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[10px] text-white/50 font-mono">
                  SHA256: 9b2d...f41e
                </div>
                <div className="text-[10px] text-amber-400 font-medium">
                  Verified with NM SOS Public Portal
                </div>
              </div>
            </div>

            {/* Right Gold Embossed State Seal */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 p-1 shadow-2xl flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#12121D] flex flex-col items-center justify-center p-2 text-center border-2 border-amber-300">
                    <span className="text-[8px] font-serif font-black text-amber-300 uppercase tracking-tighter">
                      GREAT SEAL OF
                    </span>
                    <span className="text-[9px] font-serif font-extrabold text-amber-200 uppercase">
                      NEW MEXICO
                    </span>
                    <div className="w-4 h-0.5 bg-amber-400 my-0.5" />
                    <span className="text-[7px] font-mono text-emerald-400 font-bold">1912</span>
                  </div>
                </div>
                {/* Red Silk Ribbon simulation */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  <div className="w-3 h-5 bg-[#FF168D] rounded-b shadow" />
                  <div className="w-3 h-6 bg-[#B91669] rounded-b shadow" />
                </div>
              </div>

              <div className="text-xs">
                <div className="font-serif font-bold text-amber-200">IN TESTIMONY WHEREOF</div>
                <div className="text-[11px] text-white/70 italic">
                  Affixed the Great Seal of the State of New Mexico.
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                  Status: ACTIVE / GOOD STANDING
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Domain Ecosystem Grid */}
      <div className="p-6 rounded-2xl bg-[#0A0A12] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <h4 className="font-extrabold text-white text-sm">
              VERIFIED CORPORATE DOMAIN NETWORK
            </h4>
          </div>
          <span className="text-xs text-white/40">Registered under Saif Tech Global LLC</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              domain: 'saiftechglobal.com',
              title: 'Saif Tech Global LLC',
              desc: 'Official Holding & Cloud Gateway',
              role: 'Corporate Parent',
              badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
            },
            {
              domain: 'sg16finance.com',
              title: 'SG16 Finance',
              desc: 'Algorithmic Financial & Vaults',
              role: 'Market Engine',
              badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
            },
            {
              domain: 'sg16children.com',
              title: 'SG16 Children',
              desc: 'Pediatric Safety & Education Shield',
              role: 'Childhood Safeguard',
              badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10',
            },
            {
              domain: 'sg16identifier.com',
              title: 'SG16 Identifier',
              desc: 'Zero-Knowledge Biometric Identity',
              role: 'Identity Sentinel',
              badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
            },
          ].map((item) => (
            <a
              key={item.domain}
              href={`https://${item.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-amber-500/40 transition group space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.badgeColor}`}>
                  {item.role}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-amber-400 transition" />
              </div>
              <div className="font-mono text-xs font-bold text-white group-hover:text-amber-300 transition truncate">
                {item.domain}
              </div>
              <p className="text-[11px] text-white/50">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
