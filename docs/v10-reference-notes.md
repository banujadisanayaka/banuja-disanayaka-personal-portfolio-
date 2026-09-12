# V10.1: a spatial photographic portfolio

The user asked for a version 10 upgrade informed by seven supplied videos and the complete removal of the welcome screen. The 3D avatar direction has been abandoned. Visitors should reach the real portfolio immediately, including through old `?intro=1` links.

## Reference study

The first V10 study used widely spaced frame samples and produced an upgrade that was too restrained. After the user's feedback, all seven recordings were studied again as close chronological sequences: two frames per second for the six short clips, and every four seconds across the complete 330-second logistics walkthrough. The second study focused on what moves between frames, camera direction, object continuity, and the relationship between imagery and text.

| Supplied recording | Relevant design principle | V10 application |
| --- | --- | --- |
| 185429.mp4 | At approximately 3–10 seconds the camera enters a drawing as it becomes a building; later the structure rotates and unfolds | The camera travels between observation, design and a working system. Translation, rotation, depth and scale follow every scroll position, including intermediate positions |
| 185073.mp4 | A container stays recognizable as it passes between crane, truck and ship; globe and transport scenes use different scales | Photography connects the opening to a continuous native-scroll journey. Large light/dark chapter changes create a deliberate rhythm |
| 185059.mp4 | Shuffled image stacks and a spatial photo wall interact with oversized typography | Three original photographic cards rotate through foreground and background using buttons, keyboard, mouse drag or a horizontal touch gesture |
| 185058.mp4 | A phone travels between coordinated scenes and background colors; elements move together | Story imagery, giant chapter words and the journey line respond together to scroll progress |
| 185057.mp4 | A narrow product strip expands across the canvas while its title changes scale | Four photographic About controls expand substantially. Desktop uses horizontal expansion; mobile uses a vertical accordion |
| 185056.mp4 | A miniature scene expands into the main stage, while the other thumbnails remain available | The selected Daily Gaze thumbnail grows into the original photograph. A soft photographic background gives the viewer a scene of its own |
| 185055.mp4 | Planet selection changes the whole scene while preserving chapter navigation | Visitor selection changes the photographic foreground. A desktop chapter rail preserves orientation |

The recordings inform interaction and composition. Their brand assets, characters, commercial claims and copy are not reused. All visual material comes from Banuja's existing portfolio.

## Release behavior

- No welcome loader, overlay, subject isolation or WebGL portrait request.
- Immediate page content and navigable anchors, including without JavaScript.
- Existing accepted project carousel and five detailed case studies retained.
- Photo changes happen only through visitor actions. No autoplay.
- The native photo viewer preserves full-image framing and original downloads; small preview thumbnails may crop for navigation.
- On desktop and tall mobile viewports, a sticky visual stage follows native scrolling through three chapters. Short landscape screens, reduced motion and missing JavaScript use readable stacked scenes. There is no scroll interception.
- Motion preference, OS reduced motion, forced colors, menu, photo lightbox and content migration remain supported.
- Release version is 10.1.0. Content schema remains 9 to preserve CMS compatibility.
- V10 scripts/styles have content-based cache keys generated at build time.

## Verification

The V10 browser gate checks direct entry, absence of welcome requests, responsive layout, photo selection and keyboard use, original lightbox behavior, About panel selection, story progression, reduced motion, forced colors, unavailable JavaScript, CMS outage, late content replacement and an empty gallery. It runs against the exact Netlify PR deployment before the existing project, responsive, accessibility, backend-security, migration and CMS-concurrency gates complete.

The additional motion gate verifies continuous transforms at intermediate scroll positions, reversible hero selection, mouse and touch dragging, native vertical scrolling, no autoplay, thumbnail expansion, original photo containment and cancellation when motion is disabled. Review captures include desktop/mobile intermediate scenes and the selected designer card.
