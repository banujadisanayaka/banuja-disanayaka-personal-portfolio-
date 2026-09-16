# V12.2 — Immersive Worlds

Status: Draft / production protected.
Branch: `v12.2-immersive-worlds`.
Recovery checkpoint: V12.1 `905f97f86f115c0ffcded3a012e0a7292c23e4c1`.

## North star

V12.2 moves the portfolio from an editorial page with cinematic decoration to a fully choreographed visual experience. The inspiration is the layered, depth-driven, artistic-parallax class of experience seen on premium interactive agency sites such as WEAREBRAND, but all layout, code, imagery, typography, scene composition and interaction logic in this repository remain original to Banuja Disanayaka.

The website must feel like one continuous exhibition. Scrolling does not merely reveal the next rectangular section; it changes the surrounding visual world.

## Architecture

The V10 semantic content, CMS, backend security, SEO metadata, accessibility semantics and project routes remain authoritative.

V12.2 adds one fixed visual stage containing eight independent worlds:

1. Identity
2. Selected Work
3. The Daily Gaze
4. About
5. Perspectives
6. Journey
7. VELORIA
8. Contact

Each world owns:

- a static atmosphere plate;
- scene-specific geometry;
- up to three live media planes mirrored from the semantic section, with controlled fallbacks;
- oversized word art and outline typography;
- a scene caption and accent pair;
- its own spatial composition.

On full desktop profiles, section geometry is measured only during initialization/resizing. The scroll handler performs no layout reads. A passive scroll event schedules one `requestAnimationFrame`; that frame updates only visual presence/transform values on the fixed worlds. Adjacent worlds overlap in visibility so the visual environment morphs continuously instead of making abrupt chapter cuts.

Pointer depth is also isolated to `requestAnimationFrame` and updates only compositor-oriented transforms.

## Lightweight profiles

Mobile/coarse-pointer devices do not run the continuous scroll renderer. They use IntersectionObserver to select one world at a time, render only the lead media plane, and remove secondary planes/orbits/plates.

Reduced-motion profiles use the same observer path with transitions and decorative animation disabled.

Forced-colour mode hides the visual stage so semantic content remains authoritative and legible.

## Performance rules

- No geometry reads inside the scroll handler.
- No layout reads in the continuous animation frame.
- No WebGL or canvas dependency for the first immersive pass.
- No heavy blur/filter animation.
- Decorative motion is transform/opacity based.
- Mobile must stay on the lightweight scene path.
- Existing generic mobile performance regression remains a release gate.

## Release contract

Production remains untouched until all existing static, CMS, security, SEO, responsive, accessibility and performance gates pass on the exact deploy preview.

V12.2 also requires:

- exactly eight semantic V12.2 chapters;
- exactly eight visual worlds;
- three media planes per visual world on the DOM architecture, with lightweight CSS removing secondary planes on mobile;
- retired V12 and V12.1 engines do not initialize;
- no horizontal overflow;
- no page errors;
- 8 desktop + 2 mobile visual captures reviewed before release.

The V12.1 branch remains available as a rollback/recovery checkpoint and is not deleted.
