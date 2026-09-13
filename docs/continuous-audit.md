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
