# Campaign popup body restoration

This is a static reconstruction from the verified original data and instruction
paths documented in [FINDINGS.md](FINDINGS.md), not a capture of the original
executable running. No original binary was executed. `manifest.json` hashes the
research exports (raw instructions unchanged, FINDINGS parity clarified), including
the shared pause/skip evidence used by
separate UI changes.

## Source boundary

The body uses the thirteen HFX1450–1462 panel tiles, raw F00T3/F00T4 glyphs,
source integer wrapping and panel quantization, and the normal/hover/pressed
HFX821/830/839 button families. Native font selection depends on total screen
area, not the battlefield width. Small 13px buttons retain overlapping full
8px corners in the source painter order. `hud-button-selected.png` is the native
hover state; the old asset named `hud-button-hover.png` is the pressed state.
No tooltip border, generic Story/Hint heading, translucent CSS card, or × remains
in the normal campaign body.

`004314c0` selects OK/Delete from the actual message flags. `00431bb0` only
removes a flagged type0 record on OK when it already has `0x200`; ordinary OK
retains the notification. Delete opts that record into removal first. Current
campaign producers do not emit mode1 (`0x100000`), so this restoration does not
invent Save/Exit actions. Notification ownership, pending/open queue, authored
text, existing focus-on-open, pause state, and checkpoint storage stay with their
existing owners. The scene and fullscreen-session controller are unchanged. A single source-backed
visible body is enforced: opening another body (manual or automatic) closes the
previous details without acknowledging either notification. Positioned manual
opens retain their existing camera focus; reopening and one-shot semantics are
covered separately.

## Explicit browser adaptations

- The existing battlefield seam is the component viewport. The native 8u frame
  inset and side-width producer are documented, not fabricated in browser HUD
  layout.
- Existing HUD enlargement preference is preserved uniformly, with pixelated
  source images and exact layout in its logical coordinate space. It does not
  claim identical native high-resolution pixel geometry. Sub-1 HUD fitting does
  not reduce the bitmap font in ordinary compact windows; an otherwise oversized
  message is uniformly fitted so its complete authored text and actions remain
  reachable. Source line-count clipping is not copied.
- Browser focus indicators, accessible labels/full text, and keyboard-repeat
  isolation are accessibility/input adaptations. Native `004a9d90` gives a visible
  popup keyboard priority regardless of current browser focus: Enter ACKs; Space,
  Escape and other gameplay keys are consumed, including key-up. Automatic opening
  leaves focus in place and clears previously held camera/modifier keys. Focused
  HTML buttons/notification summaries retain standard Enter/Space activation; this
  is explicitly a web accessibility adaptation, not native Space-ACK evidence.
  ACK returns focus to a retained summary; removal returns it to the battlefield.
  F8/F9, Tab, diagnostic scrolling and fullscreen activation remain browser-owned.
  Fullscreen window-capture Escape runs before popup document-capture and retains
  the browser default. A readable plain-text recovery
  appears only if an original art dependency fails to decode.
- Existing F8 diagnostics are exempt from native artwork. Only while a campaign
  popup is open, the overlay moves below the authoritative native panel. Compact
  windows (width >=560, height <=700) use 11px/1.2 rows and tighter whitespace;
  wide-short windows use four independent content columns, reserving the full
  native Paused line with a minimum22px bottom reserve rather than moving that
  original status. The original notification strip width plus gutter is reserved.
  One popup-open available rectangle bounds F8 below the measured panel bottom,
  beside the notification strip, and above the native status floor. Both collapsed
  and expanded content scroll when necessary, with pointer/keyboard reachability
  to every field. Original12px fonts remain outside the compact adaptation. At900px short width, compact9px explanatory text
  uses10px line-height (non-overlapping visible glyph bounds), and padding is2px.
  No metric, caption,
  control, or optional picking field is removed. Closed-popup F8 styles are
  unchanged. This explicit responsive change replaces the obsolete assumption
  that the campaign body always occupies a 340px left-hand card.
- Source palette pixels are unmodulated. Inherited native GPU state is not fully
  recovered; this is not a claim of a native GPU-output pixel match.

## Reproduction

The data-only importer accepts independently verified original input roots:

```
python3 scripts/import-campaign-popup.py GAME_ROOT LANGUAGE_ROOT
```

It writes only `app/original-campaign-popup.json` and
`public/original/campaign-popup-tiles.png`. Existing fonts/buttons are reused.
`hud-font-pixel-verification.json` records all224 raw glyph comparisons for both
fonts, with zero mismatches. Generator ownership is registered in
`engineering/generated-files.json`.

Focused source and interaction tests:

```
node --test tests/campaign-popup.test.mjs tests/campaign-popup-keyboard.test.mjs tests/compact-message-layout.test.mjs
npm run typecheck
```

A bounded, sandboxed Chromium fixture uses the actual component and message
actions plus source-extracted actual Home effects/JSX and scene keyboard listeners,
without constructing the full Home/WebGL or game:

```
POPULOUS_BROWSER=/verified/path/to/chrome-headless-shell node scripts/campaign-popup-fixture/run.mjs /new/output/directory
```

The optional `POPULOUS_PAUSE_ROOT` imports the actual native pause component
read-only from a separate source worktree while integration is pending. Once
integrated, the current checkout component is used automatically. If neither is
available, the receipt explicitly labels the source-metric status fixture.

Its receipt hashes all source/assets and the browser, records raw geometry and
interaction results, and is successful only when `receipt.status` is `passed`.
The before mode uses the pinned be44bc76 global stylesheet and old body markup,
including the old lower-half placement rule, against identical authored text
and a neutral battlefield. These are component comparisons, not natural
campaign execution or original-executable screenshots. The fullscreen boundary
uses the actual fullscreen control/session with a supplied Fullscreen API, not
proof of native browser fullscreen exit. Outside-focus automatic opening and the
actual Home/scene key owners are exercised, not replaced by hand-copied handlers. Parent
integration must still run independent review and full source/browser gates.

## Panel parity audit

The raw `panel-tiles.asm` instructions, not an informal “alternating rails”
description, are authoritative. CMP parity,1 followed by ADC value,-1 retains
the high tile ID for parity0 (carry1), and subtracts one for parity1 (carry0).
Thus top =1454+(column even), bottom =1456+(column even). After the horizontal
loop EBX is columns−1. Left/right rails are selected ONCE as
1458/1460+((columns−1) even), then repeated unchanged for all interior rows.
The implementation and tests use this mapping; the result importer agrees.

## Review repairs and retained failures

`3e7e717` was rejected for missing outside-focus popup keyboard priority and
visual F8 overlap with the notification strip. The preceding visual correction
remains necessary: `bbd7b800` had positioned glyph DOM hidden behind the panel.
Those receipts and their rejection notes remain retained, not relabeled passing.
The repaired fixture tests actual visible glyph pixels, actual Home callbacks,
held input cleanup, standard focused-control activation, fullscreen priority,
all notification hit targets, compact text fragment collisions, and portrait
scroll-to-last-field reachability. New failed attempts are retained as well; a
final passed receipt binds only its own source fingerprint.
