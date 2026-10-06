# Reference fidelity review — PR 50

**Final result: passed**

This is a reference-led adaptation for Banuja, not a duplication of Kumar's identity, audience numbers, projects or photographs. Review scope: the ten-scene opening, mobile layout, native scrolling, navigation and content resilience. Production remains unchanged.

## Source and rendered evidence

Source: https://www.kumarjayaranga.com/ (live browser inspection, 6 October 2026).
Implementation: https://deploy-preview-50--banujadisanayaka.netlify.app/?ntl-drawer-state=hidden and the same source at http://terminal.local:4173/.

Evidence is in `qa-artifacts/reference-fidelity/`:

- `comparison-desktop.jpg`: opening, reference and implementation together.
- `comparison-mobile.jpg`: opening, reference and implementation together, 390 × 844 CSS viewport.
- `comparison-gaze.jpg`: photography/channel title hold, both implementations together.
- `comparison-type.jpg`: original-size display typography and spacing crops.
- `journey-small-mobile.jpg`: all five jobs at 320 × 700.
- `work-mobile.jpg`: five approved project covers and their real links at 390 × 844.
- `opening-desktop.jpg`, `opening-mobile.jpg`: individual implementation captures.

Desktop browser captures are 1348 × 926 pixels for the matched opening/title comparisons, at 1 image pixel per CSS pixel. The responsive review iframe is 390 × 844 CSS pixels (320 × 700 for the compact check). Full browser images containing the iframe were cropped to that exact rectangle before comparison. The desktop pair is normalized to the source image dimensions. No device bezel is included. Browser viewport emulation is not a physical Android/Safari test.

## Comparison history and fixes

1. **P1 — wrong visual hierarchy in the inherited draft.** The reference uses oversized heavy Bodoni type, a close portrait on black and a restrained chapter rail. Replaced the thin/small type, framed composition and tiny dots with locally hosted Bodoni Moda, the existing transparent portrait and labelled scene navigation. Post-fix: opening comparison pairs.
2. **P1 — photography title disappeared before its scene settled.** Replaced the equal-length overlapping fade model with weighted chapter durations. The title holds first, then six source photographs move through the reel. The incoming chapter overlays an opaque outgoing chapter, preserving a visible background at boundaries. Post-fix: title pair plus forward/reverse browser interaction.
3. **P2 — clipped surname at 390 px and overlapping tagline at 320 × 700.** Reduced the mobile surname scale and reserved a fixed copy zone on short phones. The portrait crop now stays inside the stage. Post-fix: mobile opening captures and bounding-box checks.
4. **P2 — older animation ownership leaked grid/ring decorations into the film.** Disabled the legacy chapter decorator only on the immersive homepage. Existing route behavior remains active. Post-fix: clean Work and Journey screenshots.
5. **P2 — project covers were too small and inside-page text leaked under covers.** Removed double scaling, sized the approved book artwork by aspect ratio and hid the unused inside-page/fan layers in this static project selection. Added space for the page edges. Post-fix: `work-mobile.jpg`.
6. **P2 — five-job rows crowded at short heights.** Adjusted row typography and spacing, moved the list up on short phones, and use the readable document layout below 650 px viewport height. Post-fix: `journey-small-mobile.jpg`.
7. **P2 — Netlify preview drawer covered the timeline.** The review URL and browser tests use Netlify's documented hidden-drawer query parameter. This is preview tooling, not a production site component.

No remaining actionable P0/P1/P2 visual findings in the reviewed viewports.

## Required fidelity surfaces

- **Fonts/typography:** locally hosted Bodoni Moda 900 display and 700 italic replace the mismatched hierarchy. Two-line personal name remains intact; the photography title has the reference's large italic treatment. Small metadata uses a monospace face. Banuja's longer surname and own copy intentionally differ in wrapping.
- **Spacing/layout:** full-screen composition, restrained top metadata, portrait across the right, large lower-left title and a persistent bottom timeline. Mobile has dedicated title, copy, metrics and navigation zones. Work and the five-job timeline clear the controls. Full-view and typography-region comparisons were reviewed together.
- **Colors/tokens:** near-black `#060807`, cream `#f0ece1`, lime `#c5ed23`; fine muted rules and subdued metadata. The lime is slightly brighter than the reference as an intentional adaptation. No green/gold card chrome remains in the opening.
- **Image quality/assets:** Banuja's existing cutout, six original photographs, existing approved project covers and supplied signature are retained. The portrait has a natural studio pose rather than Kumar's close face/hand pose; this is an intentional identity/source-asset difference. The geography is actual public-domain Natural Earth data, not invented decorative continents. No generated substitute portrait or copied reference photography.
- **Copy/content:** own professional statement, five projects, 115-photograph library, five jobs, six VELORIA brands, contact details and signature. The reference's follower/award claims are not attributed to Banuja. Full story and résumé links remain reachable in both motion modes.

## Interaction and resilience review

Browser-checked: opening, Gaze title and reel, Places globe, Work, Journey, VELORIA, Credits, scene-menu opening/closing, Escape focus return, scene selection and Motion off/on. Browser console inspection found no application-origin errors; recorded extension-metadata errors were from a browser extension, not the website.

Automated coverage added for all ten scenes at desktop/tablet/390/320 widths, forward/reverse boundaries, no empty midpoint, project routes, modal focus, motion persistence, deep-linked Contact, no JavaScript, missing runtime, reduced motion, forced colors, landscape, CMS outage and public CMS visibility/removal behavior. Existing gallery filtering/lightbox, route overflow, SEO and backend security checks remain. The original performance thresholds are unchanged: 12 layouts, 500 ms style recalculation, p95 ≤34 ms, ≤3 frames over 50 ms at 4× CPU slowdown.

Static release, SEO, security and executable CMS concurrency checks passed locally. Hosted browser/performance checks are recorded on the exact PR commit; their final results are separate from this visual review.

## Follow-up polish / limits

- Physical Samsung/Android and Safari testing is not represented by emulation.
- The portrait cannot reproduce the reference's lighting and pose without a new photograph; the current adaptation preserves the original person/photo.
- A free-running timecode and continuously rotating globe were deliberately avoided. Motion renders in response to scrolling and stops while idle.

## Implementation checklist

- [x] Reference and implementation viewed together at matching states.
- [x] Typography, spacing, palette, real assets and content checked.
- [x] Mobile clipping, compact rows, old decorations and cover leakage corrected.
- [x] Menu, timeline, fallback content and original route links reviewed.
- [x] Changes isolated to the draft preview; no production merge.
