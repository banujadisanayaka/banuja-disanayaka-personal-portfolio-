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


## V12 performance-first rebuild

Audit on 16 September 2026: the first cinematic exhibition implementation in PR #25 achieved the intended art direction but failed the established throttled-mobile performance gates. Its scroll engine repeatedly invalidated inherited styles across the full homepage and later tracing still exposed forced-layout work above budget. PR #25 was retired unmerged; production and main remained on the stable V11 release.

Repair direction: PR #26 rebuilds V12 from stable main with no V12 JavaScript scroll listener and no V12 geometry reads during scrolling. Eight physical exhibition sections are activated by IntersectionObserver: the opening six-scene journey, Selected Work, The Daily Gaze, About, Perspectives, Experience, VELORIA and Contact. The former standalone #approach section is already folded into the generated opening journey and must not be counted as a ninth section. Desktop enhancement uses CSS view timelines where supported; mobile, reduced-motion and forced-colour profiles stay lightweight and readable.

Release requirement: the draft remains blocked until its exact deploy preview passes responsive and accessibility coverage plus the unchanged mobile performance, content, CMS, authentication, API privacy, security and concurrency gates. Then verify the exact production commit and live journey, projects, gallery, lightbox/download and motion controls before release. The next useful step after the foundation passes is section-by-section visual tuning without reintroducing a JavaScript scroll engine.


### V12.0.1 mobile activation follow-up

Post-merge main QA on 16 September 2026 exposed a narrow V12 full-journey regression: 32 layout events against the unchanged budget of 30, while the existing mobile regression gate still passed. PR #27 removes two mobile-only activation mutations whose effects were hidden or overridden in the lightweight profile: per-section active-state attributes and world-label text updates. Desktop section emphasis and labels, mobile world-tone transitions, reduced motion and all content remain unchanged.

On the settled exact PR preview at commit b298acb7840749ea95a3e1055cb4e741bd26dd63, the existing 4×-CPU mobile gate measured 8 layouts, 0 frames over 50ms, 17ms p95 and 0px copy drift. The V12 full-journey gate measured 28 layouts, 194ms of style work, 166ms of script work, 0 frames over 100ms and 50ms p95. All desktop, mobile, landscape, reduced-motion and forced-colour V12 scenarios passed. Re-run the complete suite on the documentation-inclusive final commit before merge, then verify the exact Netlify production commit.


### V12.0.2 lightweight static ambient follow-up

The V12.0.1 exact preview passed, but its post-merge main run still varied to 31 layouts against the unchanged full-journey budget of 30. PR #28 removes section IntersectionObserver registration from compact and coarse-pointer profiles entirely. Those profiles now keep a static ambient world with no per-section activation mutations; desktop retains section observation, labels, emphasis and CSS view-timeline motion. Breakpoint changes safely reconfigure observation.

On exact PR commit ff9189c2ced2d2e15a3850de3d39994fb39f2856, all desktop, mobile, landscape, reduced-motion and forced-colour scenarios passed. The existing 4×-CPU mobile gate measured 8 layouts, 46ms style work, 61ms script work, 0 frames over 50ms, 17ms p95 and 0px copy drift. The V12 full-journey gate measured 29 layouts, 362 style recalculations, 88ms style work, 71ms script work, 0 frames over 50ms, 0 frames over 100ms and 17ms p95. No performance threshold was relaxed. Re-run the complete suite on this documentation-inclusive final commit, then verify the exact published Netlify commit and live controls before release.


### V12.0.3 bounded mobile rendering follow-up

The V12.0.2 exact preview passed at 29 layouts, but its post-merge production run measured 32 layouts against the unchanged budget of 30. Long-frame behavior remained healthy at 0 frames over 50ms and 17ms p95. The remaining variance tracks the base stylesheet's `content-visibility:auto` activation across six below-fold homepage chapters rather than V12 scroll scripting; the lightweight profile already has no scroll listener, geometry reads or section observer.

This follow-up keeps the media-heavy Work carousel and Daily Gaze archive deferred offscreen, while laying out the four text-led About, Experience, VELORIA and Contact chapters up front on compact or coarse-pointer profiles. Browser QA locks that balanced rendering contract. No performance threshold is relaxed. Release remains blocked until the exact final preview and post-merge main workflows pass, Netlify publishes the exact commit, and production controls plus API privacy are verified.
