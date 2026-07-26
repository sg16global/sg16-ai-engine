import type { LucideIcon } from 'lucide-react';
import { MilitaryShieldArt } from './MilitaryShieldArt';

type ShieldCardProps = {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  variant: 'normal' | 'center';
  positionClass: string;
  onClick: () => void;
  ariaLabel: string;
};

export function ShieldCard({
  id,
  title,
  subtitle,
  icon: Icon,
  variant,
  positionClass,
  onClick,
  ariaLabel,
}: ShieldCardProps) {
  const sizeClass =
    variant === 'center' ? 'sg16-sh__shield--center' : 'sg16-sh__shield--normal';

  return (
    <button
      type="button"
      className={`sg16-sh__shield ${sizeClass} ${positionClass}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <MilitaryShieldArt id={id} />

      <span className="sg16-sh__shield-content">
        <Icon className="sg16-sh__shield-ico" strokeWidth={1.45} />
        <span className="sg16-sh__shield-title">{title}</span>
        <span className="sg16-sh__shield-sub">{subtitle}</span>
      </span>
    </button>
  );
}
