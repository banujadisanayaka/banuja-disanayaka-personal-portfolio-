# Cinematic chapter preview — 6 October 2026

Preview: https://deploy-preview-47--banujadisanayaka.netlify.app/
Draft PR: https://github.com/banujadisanayaka/banuja-disanayaka-personal-portfolio-/pull/47
Candidate: 46b6cd546306366c1f4ee41faeee2fdd7e9e1dbb

## Changes

- Green and gold editorial opening with larger serif typography and the existing portrait.
- Six-chapter timeline and current chapter label, retaining native scrolling.
- Full-screen native dialog menu with scene navigation and links to Moments, the journal, the full story, résumé and contact.
- Keyboard focus containment, Escape dismissal and focus restoration.
- Transform-only chapter indicator animation and stable, visibility-switched chapter labels. The initial preview exceeded the 12-layout budget (15 layouts); the transform-only change reduced that to 14. Switching label visibility resolved the remaining failure. The original performance budget is unchanged.
- Synchronous menu cleanup avoids an Escape timing race between native dialog dismissal and the expanded state.
- Existing About section spacing and in-flow footer motion control fixes remain included.

## Review evidence

- cinematic-mobile-opening-20261006.jpg: responsive opening, 375 CSS px content inside a 390 × 844 review iframe.
- cinematic-mobile-menu-20261006.jpg: responsive chapter menu.
- cinematic-desktop-menu-20261006.jpg: full-screen hosted chapter menu.

Browser automation uses Chromium/emulation, not a physical phone. Screenshots show the same design before the behavior-only fixes.

## Validation

Local release checks, JavaScript syntax and whitespace checks passed. The final candidate passed the mobile scrolling performance gate in run 37411476575. The full responsive and keyboard suite passed the preceding candidate in run 37410795038; the final full run is in progress.
