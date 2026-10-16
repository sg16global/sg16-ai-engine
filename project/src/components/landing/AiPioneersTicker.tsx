import { useState, useEffect } from 'react';
import { Flame, Heart, ChevronRight, Award } from 'lucide-react';
import { AI_PIONEERS, AI_PIONEERS_PASSED } from './aiPioneersData';

interface AiPioneersTickerProps {
  onOpenMemorial: () => void;
}

export function AiPioneersTicker({ onOpenMemorial }: AiPioneersTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % AI_PIONEERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const pioneer = AI_PIONEERS[currentIndex];

  return (
    <div className="w-full max-w-4xl mx-auto my-4 px-3 sm:px-4">
      <div className="relative group overflow-hidden rounded-2xl border border-[#FF168D]/30 bg-gradient-to-r from-[#191321]/90 via-[#08080F]/95 to-[#191321]/90 p-3 sm:p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(255,22,141,0.18)] transition-all hover:border-[#FF168D]/60 hover:shadow-[0_0_35px_rgba(255,22,141,0.3)]">
        {/* Subtle orange animated scanline */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FF168D]/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Badge & Tribute count */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="p-2 rounded-xl bg-[#FF168D]/20 border border-[#FF168D]/40 text-[#FF3DA5] shadow-[0_0_10px_rgba(255,22,141,0.3)]">
              <Flame className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider text-[11px]">
                <span>Pioneers of AI</span>
                <span className="text-[#FF5CB8]">({AI_PIONEERS_PASSED} of 10 Passed Away)</span>
              </div>
              <p className="text-[10px] text-white/50">Foundational Dartmouth 1956 Heritage</p>
            </div>
          </div>

          {/* Active Pioneer Rotating Card */}
          <div className="flex-1 min-w-0 text-center md:text-left px-2">
            <div className="inline-flex items-center gap-2">
              <span className="font-bold text-white tracking-wide text-xs sm:text-sm">
                {pioneer.name}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/60 border border-[#FF168D]/30 text-[#FF5CB8]">
                {pioneer.years}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-white/60 truncate">
                — {pioneer.role}
              </span>
            </div>
            <p className="text-[11px] text-white/70 truncate mt-0.5 hidden sm:block">
              &ldquo;{pioneer.quote}&rdquo;
            </p>
          </div>

          {/* Action CTAs: Pioneer Memorial + Father & Daughter */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenMemorial}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF168D]/15 hover:bg-[#FF168D]/30 border border-[#FF168D]/40 text-[#FF5CB8] hover:text-white font-semibold text-[11px] transition-all shadow-[0_0_10px_rgba(255,22,141,0.15)]"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Explore 10 Giants</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onOpenMemorial}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] transition-all"
              title="Father & Daughter Intergenerational Continuity"
            >
              <Heart className="w-3.5 h-3.5 text-[#FF168D]" />
              <span className="hidden sm:inline">Father & Daughter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
