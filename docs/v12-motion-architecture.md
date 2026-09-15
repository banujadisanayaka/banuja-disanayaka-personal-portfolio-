# V12 Cinematic Exhibition — Motion & Experience Architecture

## Creative intent

V12 treats the homepage as one directed exhibition rather than a stack of animated sections. The interaction language was derived from the supplied reference films: persistent spatial environments, large editorial typography, object continuity, camera-like scale changes, foreground/background separation, photographic transitions and deliberately paced scene changes. No reference layout is copied.

The visual identity stays specific to Banuja Disanayaka: observation, useful systems, visual communication, photography and creative direction. The palette remains restrained and editorial rather than neon, gaming or cyberpunk.

## Scene map

1. **Identity** — a six-beat pinned opening that moves from Banuja to work, photography, personal journey, VELORIA and invitation.
2. **Selected work** — a dark exhibition wall with a depth-based project canvas and contextual project index.
3. **The Daily Gaze** — a light editorial room containing a dark photographic stage; one photograph is treated as the active frame.
4. **About** — warm clay editorial portrait spread with oversized typography.
5. **Perspectives** — sage visual plates that let operations, design, product and observation change the composition.
6. **Experience** — a light timeline field; the continuity line becomes the career path.
7. **VELORIA** — a dark constellation-like brand architecture scene.
8. **Contact** — a bright closing frame with a single large invitation and orbital visual closure.

A persistent ambient world — wash, orbit, aperture, continuity thread and scene marker — connects the scenes. The scene navigator uses the same sequence, so orientation and storytelling reinforce each other.

## Motion language

V12 uses native browser scrolling. It does not intercept wheel/touch input and does not add a smooth-scroll library. The existing opening journey remains a sticky progressive enhancement, while the global V12 layer reads native scroll position and writes only composited visual properties.

The hierarchy is:

- macro: scene activation, environment changes and transition veil;
- meso: heading/image position, project depth and gallery composition;
- micro: magnetic links, fine-pointer cursor response and hover depth;
- ambient: very slow wash, orbit, grain and light movement.

Motion should never be applied simply because an element exists. Text needed for reading is kept stable; decorative depth carries most of the continuous motion.

## Performance architecture

The engine intentionally avoids WebGL and additional animation libraries. The current visual direction can be delivered with CSS and a small requestAnimationFrame controller, so adding Three.js or a smooth-scroll stack would add runtime cost without enough visual return.

Runtime rules:

- one scroll listener schedules one animation frame;
- expensive geometry is measured only when invalidated;
- only the active and adjacent scenes receive continuous style writes;
- offscreen scenes drop `will-change`;
- the opening journey already stops its animation loop while offscreen;
- images keep existing responsive derivatives, fixed dimensions and lazy loading;
- primary animation properties are transform and opacity;
- no continuous layout properties are animated;
- ambient effects become progressively simpler on medium and lite profiles;
- fixed backdrop blur is removed on constrained profiles;
- background motion pauses naturally when the document is hidden because the scroll painter does not run.

The existing 4× CPU mobile regression test remains part of CI.

## Adaptive profiles

`high` — fine pointer, sufficient viewport/hardware: complete ambient motion, cursor, magnetic interactions and photographic breathing.

`medium` — tablets/mobile or modest hardware: lower ambient density, no custom cursor, reduced background complexity and no fixed-header blur.

`lite` — small mobile or weak hardware: no grain/grid/aperture, simplified orbit and reduced scene displacement while keeping the same art direction.

`reduced` — `prefers-reduced-motion` or forced-colors: scene content remains fully available, continuous transforms stop, ambient animation stops and navigation stays functional.

## Accessibility contract

- semantic HTML and existing document order remain the source of truth;
- all V12 graphical layers are `aria-hidden`;
- the scene navigator is ordinary anchor navigation;
- keyboard navigation for projects, gallery, perspectives and dialogs is preserved;
- dialog focus restoration remains unchanged;
- visible focus states are retained;
- mobile scene navigation targets are at least 40px, with 44px targets on narrow phones;
- forced-colors removes decorative layers and restores Canvas/CanvasText colors;
- no content depends on hover, cursor or animation to be understood.

## Progressive enhancement

V12 is loaded after the proven V10 legacy interaction layer. If V12 fails to load, the underlying semantic content and V10 interaction architecture remain usable. If JavaScript is unavailable, the generated HTML still exposes the identity, projects, featured photographs, about content and contact information.

## QA gates

V12 browser QA covers 1440px, 1920px, 1024px, 768px, 412px, 390px, 360px, 320px, mobile landscape, reduced motion and forced colors. It checks scene count, navigation, overflow, project interaction, Daily Gaze selection/lightbox, perspective switching, closing-scene activation, page errors, progressive enhancement and late CMS updates.

The existing release, gallery, work, security, CMS concurrency, responsive and mobile performance suites remain active. Production should not be promoted until all gates are green.
