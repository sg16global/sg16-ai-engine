import { useState } from 'react';
import {
  X,
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  Building,
  Quote,
  Heart,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  AI_PIONEERS,
  AI_PIONEERS_PASSED,
  AI_PIONEERS_COUNT,
  FATHER_DAUGHTER_LEGACY,
  type AiPioneer,
} from './aiPioneersData';

interface AiPioneersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiPioneersModal({ isOpen, onClose }: AiPioneersModalProps) {
  const [activeTab, setActiveTab] = useState<'pioneers' | 'continuity'>('pioneers');
  const [selectedPioneer, setSelectedPioneer] = useState<AiPioneer>(AI_PIONEERS[0]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pioneers-title"
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-[#FF168D]/40 bg-[#0A0A12] text-white shadow-[0_0_50px_rgba(255,22,141,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Orange-Black Glow */}
        <div className="relative p-5 sm:p-6 border-b border-[#FF168D]/25 bg-gradient-to-r from-[#191321] via-[#0D0D16] to-[#191321]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#FF168D]/15 border border-[#FF168D]/40 text-[#FF3DA5] shadow-[0_0_15px_rgba(255,22,141,0.3)]">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="pioneers-title" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Pioneers of Artificial Intelligence
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FF168D]/20 text-[#FF5CB8] border border-[#FF168D]/40">
                    Dartmouth 1956 Heritage
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-white/70">
                  <strong className="text-[#FF5CB8]">
                    {AI_PIONEERS_PASSED} of the original {AI_PIONEERS_COUNT} founders have passed away.
                  </strong>{' '}
                  Their mathematical formulas live on inside the SG16 AI Engine.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-[#FF168D]/20 text-white/70 hover:text-white transition-colors border border-white/10 hover:border-[#FF168D]/40"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('pioneers')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'pioneers'
                  ? 'bg-[#FF168D] text-black shadow-[0_0_16px_rgba(255,22,141,0.4)]'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              The 10 Founding Pioneers ({AI_PIONEERS_PASSED} Deceased)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('continuity')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'continuity'
                  ? 'bg-[#FF168D] text-black shadow-[0_0_16px_rgba(255,22,141,0.4)]'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Father & Daughter Continuity
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'pioneers' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Pioneer List */}
              <div className="lg:col-span-5 space-y-2 pr-1 max-h-[55vh] overflow-y-auto">
                {AI_PIONEERS.map((p) => {
                  const isSelected = selectedPioneer.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPioneer(p)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#FF168D] bg-[#FF168D]/15 shadow-[0_0_12px_rgba(255,22,141,0.2)]'
                          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{p.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FF168D]/15 text-[#FFB3DA] border border-[#FF168D]/30">
                            {p.years}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 truncate mt-0.5">{p.role}</p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? 'text-[#FF168D] translate-x-1' : 'text-white/30'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Detailed Tribute Card */}
              <div className="lg:col-span-7 p-5 rounded-2xl border border-[#FF168D]/30 bg-gradient-to-br from-[#12121D] to-[#07070D] flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FF168D]/20 text-[#FF5CB8] border border-[#FF168D]/40 mb-2">
                        {selectedPioneer.badge}
                      </span>
                      <h4 className="text-2xl font-bold text-white tracking-wide">{selectedPioneer.name}</h4>
                      <p className="text-sm text-[#FF5CB8] font-medium">{selectedPioneer.role}</p>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-[#2A0F16]/70 border border-[#FF526B]/40 text-[#FF8A9B]">
                        <Calendar className="w-3.5 h-3.5" />
                        {selectedPioneer.years}
                      </span>
                      <span className="block text-[11px] text-white/50 mt-1">In Memoriam</span>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-xl bg-black/50 border border-white/5">
                      <span className="text-[11px] uppercase tracking-wider text-white/40 block font-semibold mb-1 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#FF168D]" />
                        Seminal Discovery & Contribution
                      </span>
                      <p className="text-white/90 leading-relaxed">{selectedPioneer.contribution}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/50 border border-white/5">
                      <span className="text-[11px] uppercase tracking-wider text-white/40 block font-semibold mb-1 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#FF168D]" />
                        Key Historical Publication / Artifact
                      </span>
                      <p className="text-white/80 font-mono text-xs">{selectedPioneer.keyWork}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/50 border border-white/5">
                      <span className="text-[11px] uppercase tracking-wider text-white/40 block font-semibold mb-1 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#FF168D]" />
                        Institutional Anchor
                      </span>
                      <p className="text-white/80">{selectedPioneer.institution}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FF168D]/10 border border-[#FF168D]/25 italic text-white/90 flex items-start gap-2.5">
                      <Quote className="w-4 h-4 text-[#FF168D] shrink-0 mt-0.5" />
                      <p>&ldquo;{selectedPioneer.quote}&rdquo;</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                  <span>SG16 Pioneer Memorial Archive</span>
                  <span className="text-[#FF5CB8] font-medium">Original Dartmouth 10</span>
                </div>
              </div>
            </div>
          ) : (
            /* Continuity / Father & Daughter View */
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="p-6 rounded-2xl border border-[#FF168D]/40 bg-gradient-to-br from-[#191321] to-[#08080F] shadow-[0_0_30px_rgba(255,22,141,0.15)] text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF168D]/20 text-[#FFB3DA] border border-[#FF168D]/40 mb-3">
                  <Heart className="w-3.5 h-3.5 text-[#FF168D]" />
                  Human Heritage & Family Continuity
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {FATHER_DAUGHTER_LEGACY.title}
                </h4>
                <p className="text-sm text-[#FF5CB8] font-medium mb-4">
                  {FATHER_DAUGHTER_LEGACY.tagline}
                </p>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-6">
                  {FATHER_DAUGHTER_LEGACY.narrative}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  {FATHER_DAUGHTER_LEGACY.principles.map((pr) => (
                    <div key={pr.title} className="p-4 rounded-xl bg-black/60 border border-white/10">
                      <div className="flex items-center gap-1.5 text-[#FF3DA5] font-bold text-xs mb-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{pr.title}</span>
                      </div>
                      <p className="text-[11px] text-white/60 leading-relaxed">{pr.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generational Bridge graphic card */}
              <div className="p-5 rounded-2xl border border-white/10 bg-black/40 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#FF168D]/15 border border-[#FF168D]/30 text-[#FF168D]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Sovereign Protection for Future Generations</h5>
                    <p className="text-xs text-white/60">
                      Safe educational chat, zero tracking, device-local history.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#FFB3DA] px-3 py-1.5 rounded-lg bg-[#FF168D]/10 border border-[#FF168D]/30">
                  SG16 AI Engine 2026
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#090503] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Sparkles className="w-4 h-4 text-[#FF168D]" />
            <span>Dedicated to the foundational architects who created Artificial Intelligence.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#FF168D] hover:bg-[#FF3DA5] text-black font-bold text-xs transition-all shadow-[0_0_12px_rgba(255,22,141,0.3)]"
          >
            Close Tribute
          </button>
        </div>
      </div>
    </div>
  );
}
