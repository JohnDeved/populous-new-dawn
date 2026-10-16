# Original loading identity and browser recovery

Issue #457. This slice replaces the invented rune/green overlay used during
browser checkpoint lookup and scene-load failure. `Home` now uses one
`OriginalLoadingScreen` for lookup, resource loading, and recoverable failure.

## Original evidence and bounded reconstruction

- [Loading mask research](../decomp/research/loading-art.md) proves the default
  `loadlog2.dat` nonzero white mask at 130×161 and independently centered placement.
  The existing importer and PNG are unchanged.
- `scripts/import-loading-label.py` checks the original executable, English
  language table, and Western `FEFT20WE.spr` identities. It reuses only the existing
  sprite/PNG decoder definitions. It never runs the executable or broad importer.
- The selected frontend font slot 1 measures `Loading...` as 81×19. The software
  solid-colour glyph path paints FE gray (131) then FF white at (+1,+1), producing
  an 82×20 transparent composite. First-pass X is `trunc((W−81)/2)`, independently
  of the mask; first-pass Y is mask Y−26. Odd widths therefore matter.
- `public/original/loading-label.json` retains input/decoder hashes, glyph metrics,
  source addresses, exact output hashes, and limitations. The linked research note
  includes the retained static font/clear follow-up. This is static source-data
  reconstruction, not a native screenshot or hardware colour-quantization claim.

The original clear uses the active system-palette entry 0, whose RGB varies across
contexts. An opaque black full-viewport clear is an explicit browser compatibility
choice; it prevents HUD and desktop-notice bleed. It is not asserted to be the
universal native background. The original 512×384 offset branch is not reproduced.
Pending art stays intrinsic and proportionate across desktop sizes and DPRs.

## Browser adaptations

Checkpoint discovery remains a browser operation, identified by its own note.
Failure retains the original mask but uses a responsive, scrollable recovery stack
with plain text, technical details, and `Try again`. This stack and its controls are
browser recovery, not original save slots, failure dialogs, or campaign behavior.
Missing mask/label images do not prevent resource readiness; readable text remains.
Focus stays on the pending surface, or within the failure controls. One failed
presentation accepts one retry; Home keys each phase so a later failure may retry
again. The request itself remains owned by Home's existing `loadRequest` ref.

No store, scene, save format, readiness, cancellation, pause, timing, RNG, campaign,
or input-readiness rules are changed. No percentage, artificial delay, movie,
mission-specific loading art, persistence repair, or parity credit is introduced.

## Verification

The draft implementation has focused component/asset checks and a TypeScript pass.
Final source-bound browser, full inventory, quality attribution, and canonical
build evidence are still required before acceptance. Browser scripts retain their
readiness/freeze/cache/stale-owner assertions and use the current shipped failure
heading and Restart Level confirmation. Physical HUD clicks hit the full-screen
overlay; a separately labeled injected DOM event also checks its existing handler
guard. Any injected resource failure or outcome/checkpoint test setup is bounded
test evidence, not a naturally occurring gameplay result.
