# ThreeUI-inspired portfolio upgrade QA

final result: passed

Reviewed 2026-10-01. Scope: the approved Quiet Project Library, Editorial Photo Stack and Connected VELORIA concepts, adapted to the existing Signal Field portfolio. Existing typefaces, photography, project content, archive carousel and legal licence files are retained.

## Evidence and normalization

Source visual truth (approved generated concepts, 853 × 1844 pixels):
- Work: `../generated_images/exec-5964cf6e-0cf2-44b4-bf0a-25b47944801a.png`
- Gaze: `../generated_images/exec-e1c12179-b6f9-4c03-95f3-19440740467c.png`
- VELORIA: `../generated_images/exec-ca6d9d8f-c1a3-43b8-ae24-568f66d04d3d.png`

Browser-rendered implementation: `http://terminal.local:4173/`, with a local-only responsive review iframe. The iframe is 405 × 844 CSS pixels including a 15-pixel scrollbar; app content is 390 × 844 CSS pixels, confirmed from the DOM. Full browser captures are 1363 × 936 pixels. App content was cropped at 1 screenshot pixel per CSS pixel; references were resized to 390 × 844 (less than 0.2% aspect-ratio difference). Browser device emulation/deviceScaleFactor was not overridden. This is responsive browser verification, not physical-phone verification.

Source and implementation were opened together, at the same normalized dimensions and selection state:
- `docs/qa/work-comparison.jpg`: Work, TFC Orders Tracker, 01/05, Motion on.
- `docs/qa/gaze-comparison.jpg`: Gaze, Nature, Into the mist, Motion on.
- `docs/qa/veloria-comparison.jpg`: VELORIA, The Daily Gaze selected, Motion on.
- `docs/qa/threeui-upgrades-mobile.jpg`: final implemented views.

The full-view pairs make the main copy, selected controls and composition readable. Work caption overlap was additionally inspected in the full-resolution browser capture; no additional focused crop was necessary. Desktop compositions were also inspected at 1363 × 936 during implementation.

## Findings and comparison history

No actionable P0/P1/P2 findings remain in the reviewed states.

1. [P1, fixed] Gaze image was placed outside its intended mobile scene by a conflicting relative-position rule. Restored absolute positioning for the pinned scene; the final Gaze comparison shows the complete photo and controls in view.
2. [P2, fixed] Rear photo layers could cover the caption area. Added explicit foreground stacking and a paper-colored caption background. Final Gaze comparison shows the caption and original watermark unobstructed.
3. [P2, fixed] Mobile Work navigation and caption competed for vertical space. Included stepper/photo picker in artwork sizing, moved the Work stepper, and adjusted caption/chip spacing. Final Work comparison shows separated book, stepper, copy and dock.
4. [P2, fixed] The first Work comparison showed an undersized book. Increased only the pinned mobile book to 200 × 294 logical pixels before scene fitting. This revealed the duplicate figure caption beneath the larger book; the next comparison caught that overlap. Hid the redundant caption on mobile, captured again, and compared `work-comparison.jpg` against the approved target. The selected title remains in the main content and accessible book label.

## Required fidelity surfaces

- **Typography:** Existing sans-serif and italic Georgia are retained. Heading line breaks match the references; lighter existing display weights are an intentional portfolio consistency choice. Main labels and body copy are legible, with no clipped text in the captured states. The book's small metadata is decorative; the title and project description are repeated at readable size below.
- **Spacing/layout:** Same hierarchy of heading, artwork, selection controls, supporting copy and bottom dock. Artwork fits above controls. All six scene controls stay visible at 390 × 844. Motion off uses native document flow. Short mobile screens also use native flow instead of squeezing the pinned composition.
- **Colors/tokens:** Existing cream, sage, forest and gold palette preserved. Active controls use solid forest/gold on light scenes and gold accents on the dark constellation. VELORIA's selected outline provides a visible state beyond text changes.
- **Image/asset fidelity:** Original forest/city photographs and watermarks are used. Existing ThreeUI-derived interactive book rendering is reused, as authorized, rather than introducing a new illustrated asset. Constellation SVG paths are functional diagram connections between semantic buttons, not a replacement brand logo. Original portfolio backgrounds remain.
- **Copy/content:** Project names and descriptions come from canonical content. Labels such as Previous/Next and Open [project] intentionally clarify actions. Gaze uses the original photo title. VELORIA detail and destination change with selection. Visible attribution wording is absent; the MIT licence file remains.

## Primary interactions checked in the browser

- Project selection updates the book, title, description, counter and destination.
- Next project wraps from VELORIA (05/05) to TFC (01/05).
- TFC's Open action opens the existing project dialog; Escape closes it.
- Gaze City selection shows Towers before the storm; ArrowLeft returns to Into the mist.
- VELORIA Clouds selection changes the detail to “Where stories become worlds.”; ArrowRight selects Aura and updates the detail.
- Motion off restores native document flow; Motion on restores scene navigation.
- Mobile content width and scroll width both equal 390, with Motion on and off.
- App console errors: none observed. Browser-extension metadata errors were excluded as unrelated to site code.

## Technical validation

Passed: regenerated site build, canonical-origin enforcement, release/content QA including 115 photographs, SEO QA, static security invariants, JavaScript syntax and whitespace checks. The finite project/photo transitions cancel stale animations or decode requests. The constellation has no idle animation loop. Existing archive carousel motion code is unchanged.

These checks do not establish a frame-rate guarantee. Physical-phone smoothness, throttled performance, forced-colors rendering, OS reduced-motion runtime behavior, full CMS concurrency tests and the blocked GitHub Actions runner remain outside the verified scope. Existing CI jobs previously failed before executing any steps. Production has not been updated.

## Follow-up polish

[P3] Optional closer typographic matching to generated concepts could use heavier headings, but this would depart from the existing portfolio typography. The current implementation intentionally preserves it. Exact decorative constellation curves differ while retaining the hierarchy and interactive relationships.

## Implementation checklist

- [x] Three approved concepts implemented in existing site.
- [x] Primary interactions verified in the cloud browser.
- [x] Reference and implementation compared together.
- [x] Identified P1/P2 issues fixed and recaptured.
- [x] Local build/content/SEO/static security checks passed.
- [x] Existing photo assets and licence preserved.
- [ ] Production release gates and physical-device review remain separate.
