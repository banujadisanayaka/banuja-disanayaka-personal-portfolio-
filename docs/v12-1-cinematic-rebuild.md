# V12.1 cinematic rebuild

Status: Draft / validation required before merge.
Branch: `v12.1-cinematic-rebuild`.
Pull request: #29.

## Direction

V12.1 is a clean cinematic visual system, not an iteration of the retired V12 orbit/grid overlay. The V10 semantic content, CMS, security, accessibility and workflow foundation remains authoritative.

The homepage has eight physical worlds: Identity, Selected Work, The Daily Gaze, About, Perspectives, Journey, VELORIA and Contact. A persistent editorial stage uses oversized typography, framing, light planes, live image planes and scene-specific compositions. Desktop scene activation is driven by `IntersectionObserver`; V12.1 has no JavaScript scroll listener and performs no geometry reads during scrolling.

## Art-direction pass 2

On 16 September 2026, the visual benchmark study identified the largest remaining gap: Identity, Photography and About already had live image planes, while Work, Perspectives, Journey, VELORIA and Contact relied mostly on wash/frame treatments. The second art-direction pass adds two fixed-size compositor composition planes behind the existing stage. Each scene gives those planes a distinct poster-like spatial arrangement using transform, opacity, border and lightweight background treatment. The system does not add continuous scroll work.

The new composition layer lives in `public/v12-1-compositions.css` so it can be tuned or removed independently from the established V12.1 baseline. It is desktop-first. Compact/coarse-pointer, reduced-motion and forced-colour profiles do not render the additional composition planes.

## Mainline performance carry-forward

Main advanced during this rebuild with V12.0.2, which demonstrated that compact/coarse-pointer profiles were more stable when they did not register per-section observation at all. V12.1 carries that performance principle forward without restoring any retired V12 runtime: desktop observes and transforms between all eight worlds, while lightweight profiles keep one static ambient world and do not register the scene observer.

This preserves the unchanged mobile performance budget and prevents decorative world changes from creating unnecessary mobile style/layout work. Desktop pointer ambience remains isolated to `requestAnimationFrame` and is inactive on lightweight profiles.

## Validation contract

Keep all existing release, SEO, backend security, CMS concurrency, V10 responsive/accessibility/workflow and generic 4×-CPU mobile performance gates. The dedicated V12.1 browser gate must verify:

- exactly eight V12.1 chapters and three live media planes;
- retired V12 runtime/stage do not initialize;
- the independent composition stylesheet loads;
- desktop uses section observation and renders the composition planes;
- mobile/compact uses static ambient activation and does not render the extra composition planes;
- reduced motion runs no decorative animation;
- forced colours hides the decorative stage;
- no horizontal overflow or page errors.

The visual QA captures all eight desktop worlds plus mobile opening and a mid-page mobile static-ambient view. PR #29 must remain Draft until its exact head has passed the required gates and the visual review is accepted. Do not merge or deploy to production on structural QA alone.
