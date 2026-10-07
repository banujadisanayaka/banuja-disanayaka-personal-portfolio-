# Continuous motion review

The ten-scene homepage remains on draft PR 50. Production is unchanged.

## Motion contract

One native-scroll controller computes scene composition, mask, camera offset and shared anchor geometry from position. There are no chained transition timers or wheel/touch interception. Seeking and reversing use the same renderer.

The persistent rig contains a signal dot, circular aperture and vertical gate. It moves from the portrait focal area to the photography frame, globe perimeter, chapter gates, Work, the five-role Journey path, six VELORIA branches and the signature entrance. The original signature image is revealed using a traced pen mask; the image itself is unchanged.

Scene roots remain opaque. Incoming masks replace crossfades, and title scale/position changes keep the middle of a transition composed. Project covers occupy different depth planes during entrance and departure. Outgoing masked controls become inert and return keyboard focus to the scene navigation.

## Preservation

Original portrait, photos, five projects, five jobs, six worlds, contact destinations, Moments routes, CMS projection and security boundaries are retained. Motion-off, reduced motion, forced colors, short landscape screens and missing JavaScript keep the readable document fallback.

## Verification

`scripts/continuous-motion-qa.mjs` visits all nine boundaries forward and backward at desktop 1366 × 900 and emulated mobile 390 × 844. It captures midpoint and arrival images, records both directions, checks opaque scene layers, reversible state, stable pauses, masked-control focus exclusion and signature completion.

The existing responsive, gallery, CMS and security suites remain in place. Performance thresholds are unchanged: at 4× CPU slowdown, at most 12 layouts, 500 ms style recalculation, p95 frame interval 34 ms, three intervals over 50 ms and one pixel pinned-stage drift.

Browser emulation is not physical-device validation. Screenshot evidence and recordings are saved in the CI `v10-visual-qa` artifact under `continuous-motion/`.
