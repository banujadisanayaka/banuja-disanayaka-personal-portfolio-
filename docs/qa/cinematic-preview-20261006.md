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

Local release checks, JavaScript syntax and whitespace checks passed. Final candidate 46b6cd546306366c1f4ee41faeee2fdd7e9e1dbb passed Portfolio QA run 37411476575 (static and browser jobs) and Netlify Build Smoke run 37411476587.

Responsive browser checks passed at 320×700, 390×844, 768×1024, 812×375, 1024×768 and 1366×900. Menu focus containment, Escape dismissal, focus restoration, scene navigation, reduced motion, forced colors, no-JavaScript content, gallery interactions and CMS outage fallback passed.

At 4× CPU throttling, both baseline and candidate recorded 9 layouts, p95 frame interval 17 ms, zero frames over 50 ms and zero pinned-stage drift. Candidate style recalculation time was 70 ms versus the 500 ms budget. This is an automated lab result, not a physical-device guarantee.
