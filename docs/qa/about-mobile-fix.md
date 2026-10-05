# Mobile About overlap fix

Candidate: 160fa7ee9ce7c192d3e06d6a90579637cd62f66d
Merged: 4966c0497a05213fcd5ba3b788d95df187ddf517 (PR #45)

Fixed percentage row-gap overflow that clipped the story button; measured mobile clearance is now 65px. Outside the opening, the motion preference is in normal footer flow. Keyboard toggling retains focus.

Validation: Portfolio QA run 37325299561 and Netlify Build Smoke run 37325299555 passed. Responsive regression passed at 320×700, 390×844, 768×1024, 812×375, 1024×768 and 1366×900. No-JS, reduced-motion, forced-colors and CMS fallback checks passed. CPU-throttled scroll performance: p95 33ms, zero frames over 50ms, zero copy drift; existing thresholds unchanged.

The screenshot is the local responsive browser review (375px content inside a 390px iframe). Automated tests used browser emulation; no physical-phone test was performed.

Newer Moments gallery changes through abb7cfe were preserved by the merge.
