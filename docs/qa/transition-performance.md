# Transition refinement — 2026-10-05

Request: continue polishing the transitions between the six opening screens, informed by `1000022732.mp4` (10.46-second phone recording).

Baseline: production commit `32b10cf41040f2b27bf2e2c227c788528700de82`.
Candidate: PR #44, commit `3cd152017dfce9b1165c68dc6c23a259176fdee3`.

## Findings and changes

The recording shows copy arriving late relative to the artwork and the Contact scene beginning to leave before its entrance appears settled. It is evidence of the user's experience, not a device performance trace.

- Phone rendering now follows native scrolling directly, removing the second 65 ms camera filter. Desktop wheel smoothing retains a shorter 45 ms filter.
- Incoming headings and captions begin earlier, after outgoing copy has disappeared. Midpoint regression checks now require visible incoming copy for every transition.
- Mobile artwork travels a shorter distance, making the transition less sweeping.
- Released input starts scene completion after 120 ms of scroll inactivity, previously 180 ms. Touch scrolling remains native and a reverse gesture can interrupt completion.
- Contact remains pinned for an extra 0.28 scene step after arrival. Scrolling can still exit naturally; no input is canceled or trapped.
- Navigation geometry is cached during measurement instead of read after frame-time style writes. Accessibility state writes are also cached. Only nearby artwork receives compositor hints.

## Verification

Local build, release content, SEO, security, CMS concurrency, JavaScript syntax and whitespace checks passed.

Manual browser review at 390 × 844 confirmed short forward scrolling, Work → Gaze, reverse completion back to Work, direct Contact navigation, and a fully visible Contact heading. The stage remained at y=0 after scrolling 112 pixels beyond the Contact landing point, then exited naturally after continued scrolling.

This is browser emulation. Physical-phone performance has not been measured after the changes. Existing frame interval, layout, copy drift and long-frame budgets are unchanged.

## Release results

PR #44 passed the build smoke check and all checks in GitHub Actions run `37316128556`: static checks, deployed API boundaries, browser accessibility/responsive checks, native touch handling, forward/reverse settling, compact and reduced-motion fallbacks, and mobile performance.

Same-run 4× CPU slowdown results:

| Metric | Production baseline | Candidate |
| --- | ---: | ---: |
| Sampled frame intervals | 119 | 119 |
| p95 frame interval | 17 ms | 17 ms |
| Frame intervals above 50 ms | 0 | 0 |
| Layout count | 11 | 10 |
| Style recalculation time | 141 ms | 118 ms |
| Script time | 98 ms | 84 ms |
| Pinned reading-frame drift | 0 px | 0 px |

Style processing was approximately 16% lower and script time 14% lower in this run. Frame pacing was unchanged. This is a controlled browser comparison, not a guarantee for every physical device.

Production is ready: Netlify deploy `6ac3a60aa2f6870008e32dae` published commit `00b0bede30cce86f71cf29c6243f2f1f728b44a9` at 2026-10-05 13:29:26 UTC. The live homepage and scene navigation were checked after publication. `transition-live.jpg` records the published Contact view.

Result: passed and published.
