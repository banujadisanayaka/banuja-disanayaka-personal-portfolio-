# ThreeUI Project Library — experiment 01

Preview-only exploration at `/experiments/project-library/` built on production
commit `101cd2d2849df2b3a2c3142ba3d9b87e65088c78`. It does not replace the
homepage or change the six-scene motion controller, production CMS or security.

## Adaptation

Source: Meng To, ThreeUI Community, `public/landing-pages/bestsellers-book-showcase.html`
at `68802d5428071ada5c20db8094b1649e6bb770ed` (MIT).
Retained/adapted CSS concepts and code: 1400px perspective, front/back covers,
translated page block, repeating page-edge gradients, left-origin hinged cover
and three fanned pages. Full copyright/license accompanies the public source.
Original source images, embedded media, brands and marketing copy are excluded.

New original code handles a native dialog, native horizontal touch scrolling,
semantic anchor fallbacks, focus restoration, reduced motion and five project
covers. No React, WebGL, npm dependencies, remote scripts, trackers or fonts.
The covers are editorial project illustrations; VELORIA is plain project text,
not a recreated logo. Original photography and locked assets are untouched.

## User behavior

Desktop presents five volumes. Mobile/tablet uses a native scroll-snap shelf,
with Previous/Next buttons and arrow/Home/End keyboard support. A tap opens a
project with a finite cover-opening animation, summary, maturity status,
limitations and the existing full case study. Escape/Close restores focus.
No-JS uses the original case-study anchor. Reduced-motion and forced-colors
settings disable animation, and the user's local motion preference persists.

## Maintenance and validation

`node scripts/build-project-library.mjs` rebuilds the HTML from
`content/projects.mjs`. The dedicated PR workflow checks this generated output,
all five links/details, seven responsive/accessibility scenarios, native touch,
focus containment/restoration, no-JS navigation and 4× CPU emulated opening
motion. Budgets: p95 <=34ms, <=3 intervals >50ms, <=12 layouts, <=500ms styles.
The normal full portfolio regression workflow also runs unchanged.

This is a design evaluation, not a production release. Real-phone acceptance
on Banu's device remains necessary before choosing it as the main Work scene.
