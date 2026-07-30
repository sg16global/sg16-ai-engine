# SG16 Public Home — Live Animated Tour

Changed only the public landing-page presentation.

## Added
- `project/src/components/landing/AnimatedProductTour.tsx`
  - Live React/CSS animated SG16 showcase.
  - No MP4, iframe, YouTube, canvas video, or uploaded video file.
  - Cycles through AI Chat, Student Shield, Coding Hub, Health Shield, and Market Shield.

## Updated
- `project/src/components/landing/LandingPage.tsx`
  - Keeps the public header and footer.
  - Replaces the static hero image/login block with the live animated tour.
  - Google sign-in is no longer displayed in the public hero.
- `project/src/components/landing/landingStyles.css`
  - Adds 3D-style depth, moving stars, breathing Earth, orbits, scan line, scene transitions, and responsive mobile rules.

## Cursor instruction
Open this ZIP as the main project. Do not redesign the public landing page. Only fix genuine integration/build issues, and preserve the animation, existing header, footer, backend, authentication, and routes.
