import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

/** Home solution card — standard height 280px */
export function SolutionCard({
  title,
  desc,
  icon,
  iconClass,
  orbClass,
  onClick,
}: {
  title: string;
  desc: string;
  icon: ReactNode;
  iconClass: string;
  orbClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group sg16-card sg16-card-hover sg16-card-solution w-full text-left"
    >
      <span className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${iconClass}`}>
        {icon}
      </span>
      <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
      <p className="text-sm text-[color:var(--sg16-muted)] mt-2 leading-relaxed flex-1">{desc}</p>
      <div className="mt-5 flex justify-end">
        <span className={`sg16-orb ${orbClass}`}>
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </button>
  );
}

/** Hub tool card — standard height 140px */
export function ToolCard({
  title,
  desc,
  icon,
  iconClass,
  onClick,
}: {
  title: string;
  desc: string;
  icon: ReactNode;
  iconClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sg16-card sg16-card-hover sg16-card-tool w-full text-left"
    >
      <span className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${iconClass}`}>
        {icon}
      </span>
      <h3 className="font-semibold text-white tracking-tight text-[0.95rem]">{title}</h3>
      <p className="text-xs text-[color:var(--sg16-muted)] mt-1 leading-relaxed line-clamp-2">{desc}</p>
    </button>
  );
}

/** Primary hub hero card */
export function HeroCard({
  title,
  desc,
  icon,
  iconClass,
  cta,
  onClick,
}: {
  title: string;
  desc: string;
  icon: ReactNode;
  iconClass: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="sg16-card-hero w-full text-left group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
        <div className="flex items-start gap-4">
          <span className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${iconClass}`}>
            {icon}
          </span>
          <div>
            <h3 className="text-xl font-semibold text-white tracking-tight">{title}</h3>
            <p className="text-sm text-[color:var(--sg16-muted)] mt-1.5 leading-relaxed max-w-md">
              {desc}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-semibold shrink-0 bg-[color:var(--sg16-red)] text-white group-hover:bg-[#FF5C5C] transition">
          {cta}
        </span>
      </div>
    </button>
  );
}

/** Section list wrapped as a card with bar rows inside */
export function BarListCard({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="sg16-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {right}
      </div>
      <div className="divide-y divide-white/[0.05]">{children}</div>
    </div>
  );
}

export function BarRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  const className =
    'w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition';
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }
  return <div className={className}>{children}</div>;
}
