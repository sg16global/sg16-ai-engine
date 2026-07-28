/** Rotating full-cover shield backgrounds — Shield Home + workspace shell. */
export function ShieldBgSlides({ className = '' }: { className?: string }) {
  return (
    <>
      <div className={`sg16-shield-bg-slides ${className}`.trim()} aria-hidden>
        <div className="sg16-shield-bg-slide sg16-shield-bg-slide--1" />
        <div className="sg16-shield-bg-slide sg16-shield-bg-slide--2" />
        <div className="sg16-shield-bg-slide sg16-shield-bg-slide--3" />
      </div>
      <div className="sg16-shield-bg-overlay" aria-hidden />
    </>
  );
}
