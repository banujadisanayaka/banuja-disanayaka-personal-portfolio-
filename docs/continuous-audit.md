# Portfolio improvement cycle

Owner: Banuja Disanayaka. Production: https://banujadisanayaka.netlify.app/.
Repository: banujadisanayaka/banuja-disanayaka-personal-portfolio-.
Netlify project: banujadisanayaka (caf01a3b-bf76-42af-8fd9-d8a67dbf0c7f).

The owner requested an ongoing audit, fix, UI/UX and animation improvement, SEO and deployment cycle on 12 September 2026, continuing until stopped. Inspect current main, open PRs, workflow results and the published deployment at the start of each iteration. Continue unfinished work before starting a competing branch. Never overlap releases. Use the GitHub/Netlify workflow for this existing site.

Each iteration should address concrete, high-impact findings, verify them, and deploy a coherent release after the exact proposed commit passes all required gates. Do not manufacture changes, rerun a completed redesign, or deploy for the sake of the schedule. If no meaningful issue remains, report the healthy state. Record actual findings and practical limits. Do not claim all devices are lag-free or guarantee search rankings.

Audit scope: initial load and scroll performance, touch/keyboard navigation, all nine public routes, five case studies and interactive workflows, all 115 archive images and filters, lightbox/downloads, mobile/landscape/320px layouts, accessibility and reduced motion, content consistency, name SEO/canonical/social/structured metadata, API privacy, CMS/auth/concurrency and Netlify deploy health. Fix regressions before adding effects. Add regression checks for actual risks; retain existing gates.

Preserve original photography, image proportions and downloads; the accepted project carousel, substantive case studies and About; the verified education (G.C.E. O/L, Thurston College, Colombo 07, 2011–2021); and schema9 CMS/backend security. No welcome gate/avatar, gallery autoplay, invented experience or metrics, new tracking, paid services, private identity data or weakened authentication. Do not replace the site. User approval is already given for ordinary fixes, improvements and tested deployment.

## V10.2 recording study and fixes

Baseline: V10.1, main 12e2afeacf873688c8a9937c9679dd854b108114.
User recording: 1000001774.mp4, 10.8917 seconds, 1080×2340. Inspected 131 chronological frames at 12 frames/second across the entire recording, with attention to the transitions around 5.1 and 7.4 seconds. This is a recording analysis, not a device profiler measurement.

Visible defect: story copy jumps relative to imagery during touch scrolling, then briefly overlaps outgoing copy. Source diagnosis: JavaScript counter-translates three flowing articles on every scroll frame while the browser independently pins the photographic stage. The scroll path also mixes geometry reads with style writes and repeatedly updates an inherited root custom property across the entire document.

Repair: one native sticky stage contains both images and copy; inactive copy is invisible and inert. Geometry is cached and invalidated on actual layout changes. Per-frame updates affect only transforms/opacity on scene layers and the progress bars; the story is idle offscreen. Mobile uses lighter two-dimensional card movement, smaller shadows and a static gradient instead of a large blurred photo. Original photographs remain intact. Direct chapter buttons and a skip-to-work link give visitors control, with space reserved for the motion preference.

SEO: nine canonical public routes identify Banuja Disanayaka consistently, share the same Person/WebSite entities, connect case studies to their creator and expose breadcrumbs. Social title/description/image metadata is complete; CMS title/description changes update corresponding social and page schema fields. The 404 has an explicit noindex directive. No ranking promises.

Validation: retain all existing responsive, native touch, reduced-motion, forced-colors, no-JS, CMS and backend gates. Added a 4× CPU mobile comparison against the pre-release production site, a <=1px story-copy drift assertion, <=12 scroll layouts and <=500ms style recalculation budgets, chapter control checks and offscreen-idle assertion. Record measured results after CI completes.

Technical references consulted: https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing and https://developers.google.com/search/docs/appearance/structured-data/profile-page.


Measured before release (same 390×844 viewport, device scale 2, Chromium, 4× CPU slowdown, 119 sampled frame intervals):

| Measure | V10.1 production | V10.2 preview |
| --- | ---: | ---: |
| Story text drift within one chapter | 30.24 px | 0 px |
| Frames over 50 ms | 82 | 0 |
| 95th-percentile frame interval | 133 ms | 17 ms |
| Style recalculation time | 8251 ms | 32 ms |
| Script time | 200 ms | 56 ms |
| Layout count | 0 | 0 |

This establishes style invalidation and asynchronous text compensation as the problems measured here; layout count alone would not have caught them. A 500ms style-work ceiling gives the observed candidate substantial CI headroom while rejecting the original regression. These are controlled lab measurements, not a guarantee for every physical device. All existing browser scenarios, nine responsive routes, native gestures, reduced/no-JS/forced-color fallbacks, CMS and security checks passed on 0654e7de9d4ab1c3c8bc62d22fcca3435ed8d88b. Final release also requires the same gates on the final commit.


## V10.2.1 canonical-origin release integrity

Finding on 13 September 2026: Netlify production had been renamed to `banujadisanayaka.netlify.app` and was healthy at main commit `282effe5d4d3afa422848a732b26d48a7a43df85`, but Portfolio QA failed because the structured-data generator used the new origin while the SEO assertion still expected the retired origin. The pull-request preview URL and performance baseline also targeted the retired Netlify project name.

Repair: export one canonical `siteOrigin` from `scripts/seo.mjs` and consume it in both page generation and SEO QA. The QA now rejects the retired origin in every generated public route, `robots.txt` and `sitemap.xml`. Netlify builds no longer require a post-build search-and-replace pass. Preview and production comparison targets use the renamed Netlify project, and the public security contact plus this audit record use the current canonical address.

The first renamed preview confirmed that individual Netlify function routes can reach the edge at different times: the public content route was ready before both protected routes. Preview QA now waits for the complete `200/401/401` privacy boundary before evaluating headers, while preserving every status and header assertion.

Validation required before release: release/content/media, SEO, backend security, CMS concurrency, all browser accessibility/responsive/motion/workflow scenarios, mobile performance budgets, Netlify build smoke, exact preview commit, and final published production commit. Next useful audit: verify the retired Netlify hostname redirects cleanly if Netlify continues serving it; canonical metadata must remain on the current hostname regardless.


## V10.2.2 public-name entity continuity

Audit on 13 September 2026: an exact-name search for “Banuja Disanayaka” already returned the new portfolio URL and its intended portfolio description. The public LinkedIn and Instagram profiles for the same name were also visible, while the Person graph only linked GitHub. The retired `banuja-personal-log.netlify.app` hostname returned Netlify `404` responses for the homepage, About, Daily Gaze, a project case study and `robots.txt`; it does not reach the renamed project, so a redirect cannot be implemented inside this repository.

Repair: connect the existing Person entity to Banuja Disanayaka’s verified public GitHub, LinkedIn and Instagram profile URLs through `sameAs`. SEO QA asserts the exact identity set on every public route so CMS or template changes cannot silently remove or alter it. No private identity fields, tracking or unverified claims are added.

Validation required before release: the complete static, SEO, security, CMS concurrency, responsive, accessibility, motion and mobile-performance gates on the exact final commit, followed by Netlify production-commit and live structured-data verification. Next useful step: recheck search indexing after crawlers process the strengthened graph; preserving the retired hostname would require a separately routed redirect host and is intentionally not created by this existing-site iteration.


## V10.2.3 deterministic motion-preference gate

The V10.2.2 exact preview passed, but its squash-merge push exposed a timing race in the mobile performance test: after the keyboard activated the motion preference, the assertion read story-panel accessibility state before the production `MutationObserver` completed. Performance itself remained within budget at 4× CPU slowdown: 0 frames over 50 ms, 17 ms p95, 25 ms style recalculation, 1 layout and 0 px copy drift.

Repair: wait for both the root `data-motion="off"` state and all three story beats to become accessibility-visible, then assert the toggle’s `aria-pressed="false"` state. This retains the keyboard and reduced-motion coverage while removing scheduler-dependent ordering.

The first PR19 preview also showed one transient edge-readiness response during the landscape scenario after four successful viewport loads. The V10 entry helper now allows three bounded initial navigations and still requires `body[data-version="10"]` before any interaction assertions. It does not retry failed controls, accessibility behavior or performance budgets.


## V10.3 graphical chapter transformations

Audit on 15 September 2026: the opening and Observe → Connect → Create sequence already use spatial, visitor-controlled motion, while Work, Daily Gaze, About, Perspectives and Contact still arrive primarily as conventional stacked sections. This leaves the later homepage short of the requested feeling that each chapter is its own graphical screen and transforms into the next.

Repair: give all five later chapters distinct, lightweight graphical identities and observer-driven next/active/past states. The transitions use compositor-friendly opacity and transform changes, perform no continuous scroll reads, add no timers or autoplay, and remain absent when motion is disabled or reduced motion is requested. Mobile keeps the graphical identity without the large desktop transforms. Browser QA now asserts that all five scenes initialize and that anchor navigation activates the intended chapter.

Validation required before release: run the complete static, responsive, accessibility, CMS/security/concurrency and V10 browser gates on the exact commit, including the mobile performance regression budget and offscreen-idle checks. Then verify the exact Netlify production commit and live scene activation, project carousel, Daily Gaze controls and motion preference. Next useful step: if the transformation language is accepted, tune only individual scene art direction from observed user feedback rather than adding more global motion.


## V10.4 — approved six-scene scroll journey

Owner approved the graphical motion study and its smoothed revision, then explicitly requested the real build on 15 September 2026. This release replaces the opening orbit and Observe/Connect/Create introduction with one native sticky composition spanning Identity, Work, Daily Gaze, Journey, VELORIA and Contact. The full project carousel, five case studies, 115-photo archive, About, education and schema-9 CMS remain available.

Motion follows native scroll with a bounded time-based critically damped camera and quintic scene transitions. Geometry is cached; animated layers write only transforms and opacity. Backgrounds and precomputed contour artwork move as part of the scene. Original photographs use contain fitting. Mobile derives the artwork area from the measured heading and caption boundaries. Scene buttons, keyboard navigation and skip-to-work provide direct access. Motion-off, reduced motion, short landscape and missing-JavaScript render six ordinary readable panels. Rendering stops when idle, hidden or offscreen.

Required final release coverage on the exact pull-request preview: scene layout and controls at 1366, 768, 390 and 320px; native touch scrolling; reduced/no-JS/forced-colour fallbacks; original content/CMS/security/concurrency gates; existing 4×-CPU mobile layout and style-work budgets. The previous orbit-specific motion test is superseded by scene-journey-qa.mjs; gallery, project, pointer-depth and privacy gates are retained. The first preview (74759c4, PR #21) passed the full suite and desktop visual review. Its 390×844, DPR2, 4× CPU sample recorded 119 intervals, p95 17ms, zero frames above 50ms, 8 layouts, 45ms of style work and zero pinned-stage drift; these are lab results, not a guarantee for every device. The existing GitHub artifact quota is full, so the established log fallback retains visual evidence, including the new six-scene captures.

Follow-up integration keeps scene photographs aligned with CMS gallery edits, removes them when the journal is emptied, and applies section visibility to the matching scene. The final commit must still pass the same release gates before merging; see PR #21 for its exact verification and deployment record.

## V10.5 — readable pauses and living backgrounds

The owner supplied 1000003931.mp4 (38.788 seconds, 1080×2340) and requested deep diagnosis plus animated backgrounds. Reviewed the entire recording in 116 chronological frames at 3 fps, then sampled 23–26 seconds at 12 fps. At approximately 23.3–25.3 seconds the page stops with no readable heading/caption and a ghosted portrait over the workflow graphic. This is a deterministic transition defect, not evidence of device frame rate: the scroll-scrubbed opacity functions hold both text groups at zero near the midpoint while blending two photographs indefinitely. The recording also shows the fixed motion switch covering the last scene buttons after Chrome retracts its address bar, with a strip of the root background below the small-viewport stage.

Repair: the camera and palette still follow native scroll, but one complete, opaque scene stays readable at every paused position. A small hysteresis band prevents back-and-forth gestures from flickering the scene identity. Brief arrival motion completes independently of scroll and never fades text away. Contrast is checked against the interpolated background. The stage fills the dynamic viewport, while a separate small-viewport measurement keeps the scroll distance stable. The same motion button docks beside the skip link in the scene controls, then returns to its usual position outside the introduction. Its touch target stays at least 44px.

The six backgrounds now have distinct slow-moving vector treatments: flowing lines, a systems grid, lens rings, topographic curves, six orbital paths and ripples of light. Only the active backdrop's two lightweight layers animate; original portraits and reading copy stay still while idle. Backgrounds pause offscreen, in hidden tabs and behind dialogs, and disappear when motion is off or reduced. No canvas, video, tracking, generated photography or animation dependency is added.

Regression coverage now includes pauses at intermediate scroll positions in both directions, one fully opaque artwork, readable copy/actions, ambient movement without scene autoplay, an expanded mobile viewport with stable small-viewport geometry, all six unobstructed scene buttons and the existing responsive/accessibility/security/CMS/performance gates. Exact-preview and production verification will be recorded in the release PR. Technical references: https://web.dev/blog/viewport-units and https://web.dev/articles/animations-guide.

The first preview passed interaction checks but exceeded the existing mobile layout budget (18 layouts, limit 12). Keeping arrival containing blocks stable reduced this to 17. Failure-only ablation measured 17 with arrival effects disabled and 8 with the background stage omitted, isolating the additional layout work to the atmosphere. The vector artwork is now built into six content-addressed SVG image resources, keeping its internal layout separate from the animated HTML layers. The artwork and motion paths are preserved. The same performance gate runs before the longer interaction suite for faster feedback; diagnostic variants can never satisfy or replace its assertions. Temporary transition ink is scoped to the animated layout, with a motion-off contrast regression check. Final exact-commit results remain required before release.

A subsequent Chromium invalidation trace identified the remaining layout roots precisely: `.journey-background` and `.journey-ambience` changed stacking-context state at opacity endpoints, flushed by the shared scroll-position reader. Both now retain their opacity composition layers; the two ambient children retain transform layers. This removes the endpoint rebuild mechanism while preserving all six backgrounds and their timing. Native-touch QA waits for the compositor fling to settle before testing a separate exact scroll position, avoiding interference between the gesture and contrast checks.
