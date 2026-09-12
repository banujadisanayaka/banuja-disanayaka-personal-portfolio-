# V10: an open portfolio

The user asked for a version 10 upgrade informed by seven supplied videos and the complete removal of the welcome screen. The 3D avatar direction has been abandoned. Visitors should reach the real portfolio immediately, including through old `?intro=1` links.

## Reference study

All seven recordings were reviewed through chronological frame samples: approximately every three seconds for short clips and every ten seconds for the longer walkthrough.

| Supplied recording | Relevant design principle | V10 application |
| --- | --- | --- |
| 185429.mp4 | Architecture scenes transform as the narrative progresses | A native-scroll sequence connects observation, design and a working system |
| 185073.mp4 | Continuous visual storytelling with readable information, alternating light/dark sections | One visual thread through the portfolio, a sticky visual companion on desktop and concise mobile chapters |
| 185059.mp4 | Strong type and a photographic stage with depth | A wide editorial opening with original portrait and Daily Gaze photography |
| 185058.mp4 | Clear hierarchy, consistent spacing and coordinated motion | Shared V10 type, buttons, section rhythm and considered About/case-study styling |
| 185057.mp4 | Selected accordion panels expand to reveal a focus | Four illustrated About controls expand into their selected perspective |
| 185056.mp4 | A selected scene takes focus while thumbnails retain context | A user-controlled Daily Gaze viewer, original framing, keyboard controls and full-resolution lightbox |
| 185055.mp4 | Chapter selection keeps visitors oriented through a scene | A discreet desktop chapter rail that follows the visible content |

The recordings inform interaction and composition. Their brand assets, characters, commercial claims and copy are not reused. All visual material comes from Banuja's existing portfolio.

## Release behavior

- No welcome loader, overlay, subject isolation or WebGL portrait request.
- Immediate page content and navigable anchors, including without JavaScript.
- Existing accepted project carousel and five detailed case studies retained.
- Photo changes happen only through visitor actions. No autoplay.
- The native photo viewer preserves full-image framing and original downloads; small preview thumbnails may crop for navigation.
- Desktop story transitions follow normal scrolling. Mobile shows the three visual chapters without pinning or scroll interception.
- Motion preference, OS reduced motion, forced colors, menu, photo lightbox and content migration remain supported.
- Release version is 10.0.0. Content schema remains 9 to preserve CMS compatibility.
- V10 scripts/styles have content-based cache keys generated at build time.

## Verification

The V10 browser gate checks direct entry, absence of welcome requests, responsive layout, photo selection and keyboard use, original lightbox behavior, About panel selection, story progression, reduced motion, forced colors, unavailable JavaScript, CMS outage, late content replacement and an empty gallery. It runs against the exact Netlify PR deployment before the existing project, responsive, accessibility, backend-security, migration and CMS-concurrency gates complete.
