# Portfolio improvement cycle

Owner: Banuja Disanayaka. Production: https://banuja-personal-log.netlify.app/.
Repository: banujadisanayaka/banuja-disanayaka-personal-portfolio-.
Netlify project: banuja-personal-log (caf01a3b-bf76-42af-8fd9-d8a67dbf0c7f).

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

Validation: retain all existing responsive, native touch, reduced-motion, forced-colors, no-JS, CMS and backend gates. Added a 4× CPU mobile comparison against the pre-release production site, a <=1px story-copy drift assertion, <=12 scroll layouts budget, chapter control checks and offscreen-idle assertion. Record measured results after CI completes.

Technical references consulted: https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing and https://developers.google.com/search/docs/appearance/structured-data/profile-page.
