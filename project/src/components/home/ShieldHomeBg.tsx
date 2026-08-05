import { LandingVideoBg } from '../landing/LandingVideoBg';

type Props = {
  /** Guest tour from public homepage — match Earth background, not red shield texture. */
  guestTour?: boolean;
};

/** Shield Home background — Earth for guest tour; deep red for signed-in home. */
export function ShieldHomeBg({ guestTour = false }: Props) {
  if (guestTour) {
    return (
      <>
        <div className="shield-home__earth-bg" aria-hidden>
          <LandingVideoBg />
        </div>
        <div className="shield-home__earth-overlay" aria-hidden />
      </>
    );
  }

  return (
    <>
      <div className="shield-home__red-bg" aria-hidden />
      <div className="shield-home__red-overlay" aria-hidden />
    </>
  );
}
