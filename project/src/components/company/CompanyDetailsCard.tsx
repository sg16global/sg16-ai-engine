import { useState } from 'react';
import { Building2, ShieldCheck, FileCheck } from 'lucide-react';
import { SG16_BRAND } from '../../core/branding';
import { CompanyCertificateModal } from './CompanyCertificateModal';

export function CompanyDetailsCard({ className = '' }: { className?: string }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className={`p-5 rounded-2xl bg-[#0f1422] border border-[#FF168D]/30 shadow-lg text-white ${className}`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FF168D]/10 border border-[#FF168D]/30 text-[#FF168D]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-wide">{SG16_BRAND.company}</h4>
              <p className="text-xs text-white/50">{SG16_BRAND.entityType}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Entity
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase font-semibold">Business ID (Filing #)</span>
            <span className="text-white font-mono font-bold text-sm tracking-wider text-[#FF5CB8]">{SG16_BRAND.businessId}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase font-semibold">Jurisdiction</span>
            <span className="text-white font-medium">{SG16_BRAND.jurisdiction}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase font-semibold">Governing Body</span>
            <span className="text-white font-medium">{SG16_BRAND.governingAuthority}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-white/40 block text-[10px] uppercase font-semibold">Effective Date</span>
            <span className="text-white font-medium">{SG16_BRAND.effectiveDate}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px] text-white/70 mb-4 leading-relaxed">
          <span className="font-semibold text-white">Registered Office:</span> {SG16_BRAND.registeredAddress}
          <div className="mt-1 text-white/50">{SG16_BRAND.statutoryAct}</div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FF168D]/15 hover:bg-[#FF168D]/25 border border-[#FF168D]/40 text-[#FF5CB8] hover:text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(255,22,141,0.15)]"
        >
          <FileCheck className="w-4 h-4" />
          <span>View Official Certificate of Organization</span>
        </button>
      </div>

      <CompanyCertificateModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
