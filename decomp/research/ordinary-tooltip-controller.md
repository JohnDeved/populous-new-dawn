# Ordinary tooltip activation and ownership

Issue 19, 2026-10-09. **Static source finding; no runtime repair or parity credit.**
Main `d6cf109474379172728a3ccebf46ef72a15f3a58` requests ordinary object text
immediately through a temporary forced-tooltip state in
[`renderTooltip`](../../app/scene-input-runtime.ts). Original `0044d0c0` acquires
a name without drawing, waits for repeated same-object controller visits, then
also requests object inspection. The activation gap is real; its modern elapsed
time and ownership mapping remains a design decision.

## Retained evidence

[Controller bytes](ordinary-tooltip-controller/controllers.asm.txt) retain the
complete ordinary object/cell/HUD/status controllers, world priority dispatcher,
reset helpers, and first-display callback. [Clock/caller bytes](ordinary-tooltip-controller/clock-and-caller.asm.txt)
retain the immediate composed callers, frame sample, initialization and dwell
acceleration. [Provenance](ordinary-tooltip-controller/provenance.json) binds
all excerpt ranges, raw-output/excerpt/file hashes, exact original commands,
retained source hashes and accepted assessment hashes.

The supplied 2,275,840-byte `d3dpoptb.exe` was read as data with installed GNU
objdump 2.44. Its before/after SHA-256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No executable/archive/profile is included. The bytes are disassembly excerpts,
not recovered source or Ghidra exports. No original game, native/emulation probe,
Ghidra, browser, dependency or test was run for this assessment.

## Object transition

Shared state: category `0068c6a1`, 16-bit key `0068c6a5`, signed dwell counter
`0068c6af`, cached threshold `005cae90` (T), text `0068b6a1`, and one-draw request
`0068b69d`. `00684218` enables tooltips.

`0044d0c0` clears its owner word `0098db48`, rejects disabled/null input, then
copies object ID at +0x24 into that word. It compares category 4 and retained ID.

- New category/ID (`0044d1a5`): clear text/fixed state, store category/key, and
  obtain a name through retained [`004f0f90`](../generated/004f0f90.c). A nonzero
  name resets dwell=0 at `0044d1e1` and formats text. This visit never requests draw.
- Empty name: category/key change and text clears, but the previous dwell counter
  is not reset. Same-ID visits cannot display empty text; elapsed time alone does
  not refresh that object's name.
- Same named object: initialize T only if zero as `max(005ca850,12)`
  (`0044d113–0044d135`). While dwell<T, increment at `0044d199` without draw.
  At dwell>=T, nonempty text requests draw at `0044d150`.
- At equality only, increment once more and call `00508fe0` (`0044d188–0044d18e`).
  Later visits keep requesting draw without repeating this callback.

With no other producer, acquisition is visit 1 with counter 0; visits 2 through
T+1 increment; **visit T+2 first requests object display**. Mouse movement inside
the same object is not a reset condition here. Other ordinary owners use `>T`,
so their boundary is one visit later; do not merge that HUD rule into the object
rule. Cell controller `0044d2a0` also has an explicit flag-driven immediate route.

The callback `00508fe0–00508ffa` sets `0098e908 |= 0x40` and calls
[`0047ae00(1,0)`](../generated/0047ae00.c). Picked objects or terrain/cell fallback
reach class-specific inspection eligibility and panel records through
[`0047b1d0`](../generated/0047b1d0.c) and [`00504060`](../generated/00504060.c).
It does not directly change tooltip text/draw. Building allocation can call
`004a2530`, forcing shared dwell=T+1. Full inspection allocation/lifetime remains
its own subsystem; excluding it must be explicit in a text-delay-only repair.

## Composed ownership and retention

[`004aa4e0`](../generated/004aa4e0.c) requires an active UI and ordinarily a clear
`level_flags_1 & 0x10000000`. It samples pointer/buttons, then:

1. Calls HUD `0044b130`, which invokes `0044d470` for an active control and can set
   world-hover blocker `00684214`.
2. Calls forced lifetime [`0044db60`](../generated/0044db60.c). Nonzero remaining
   returns 1 even on the expiry/reset visit, suppressing world hover and cleanup.
   HUD processing already happened; this is not absolute forced-over-HUD ordering.
3. Only if forced returns 0, calls world `004af340` when blocker is zero, then
   calls `0044b070` and `0044b090`.

World priority is: message/UI entry `0098db40` → special valid cell (mode 7,
player mask `0x7fc00000` plus pending/already-retained ownership) → status string
`0098db2c` → primary painter object `0087cac2` → model object `0087cace` → valid
cell (mode 2) → no helper. Cell coordinates use bytes `0087caba/bb` masked by 0xfe.

`0044b090` clears key/count/text/category/forced target/flags/lifetime/fixed state
only when all five owner words are zero:

| Word | Bounded role |
| --- | --- |
| `0098db0c` | Active HUD control, recomputed by `0044b130` |
| `0098db48` | Object ID, written by `0044d0c0` |
| `0098db44` | Packed cell, written by `0044d2a0` |
| `0098db2c` | Status language-string ID, produced by `00504bc0` |
| `0098db40` | Hovered 45-byte message/UI table entry index+1, from `004314c0` |

A new named object resets count; an unnamed object clears text without resetting
count; a HUD/cell route takes its own ownership. A no-handler visit need not reset
retained state. Object/cell owner words are not universally zeroed by this decoded
dispatcher. A literal-reference search cannot exclude indirect resets elsewhere:
**no-target leave/reentry retention remains conditional**, not a universal clear.
Explicit `0044b100`, forced acquisition and forced expiry clear controller state.

The renderer [`0044a2f0`](../generated/0044a2f0.c) consumes the one-draw latch.
`0044b070` resets scroll offset and sets scroll hold to `2*005ca850` when draw is
zero. **This hold governs long-text scrolling, not hover activation.** Ordinary
object acquisition does not set forced anchor flags; with cleared ordinary flags,
the renderer positions text relative to the pointer. The port currently uses the
forced object anchor, a separate presentation difference.

## Cached frontend rate; no fixed-Hz contract

[`004a4450`](../generated/004a4450.c) measures the rate, increments frontend
`sprite_animation_counter` at `004a4710`, then dispatches game `draw_main`.
[`004a4960`](../generated/004a4960.c) invokes `004aa4e0` once at `004a4b25` only
outside teardown and when level flag `0x80000000` is clear. This precedes simulation
and rendering. An eligible controller visit is not guaranteed to produce a frame.

[`0049c9f0`](../generated/0049c9f0.c) samples after at least 1000 ms and stores the
nonnegative frontend-counter delta in `005ca850`; world-turn delta is separately
stored in `005ca84c`. It does not divide by actual elapsed sample duration. End-loop
pacing can cap `005ca850` (`004a47b7`); [`0049cfc0`](../generated/0049cfc0.c) and
[`0049cfe0`](../generated/0049cfe0.c) select that mode and 60/24/20/14 limits.
`0049cfa0` can restore the saved sample from `005ca848`.

T starts at zero in initialized executable data and is lazily cached by the first
applicable owner or `004a2530`. `0044a280` resets `[00684210,0068c6ca)`, including
controller count/state, **but not T at `005cae90`**. Level initialization
[`0042b230`](../generated/0042b230.c) calls it and enables tooltips only when
`level_flags & 0x800`. T can therefore survive restart and reflect an earlier
HUD/cell/object visitor. The bounded direct-reference search found no other direct
T accesses; it does not prove absence of indirect writes.

No fixed seconds or fixed 12/24/40 Hz port schedule follows from these facts.
The existing 24 Hz `updateFlyby` loop is explicitly provisional and is skipped
when camera motion short-circuits it in `GameScene.animate`. The separate 12 Hz
animation clock is also not this controller's owner. A modern elapsed-time adapter
must be chosen explicitly and reviewed rather than copying native render counts.

## Smallest ordinary witness and remaining limits

Use ordinary Mission 1 startup, real readiness/Skip/default Shaman, and the
authored Blue Hut DAT object 42. Resolve
its native anchor `(64512,54784)` and actual runtime identity/origin; do not assume
DAT index equals runtime ID. After intro/input masks and forced ownership clear,
use actual pointer input and record pick → tooltip render opportunities. Native
first acquisition has no draw; current main displays at its next tooltip render
opportunity. `renderTooltip` currently precedes `updatePointerFrame`, so this need
not be the same RAF.

A later implementation witness should cover same-target movement, target
replacement, unnamed-tree transit/reacquisition, actual HUD leave, forced expiry
ownership, and inspection-panel timing without panel suppression or world/clock
injection. Preserve selection/order/RNG snapshots around actual inputs. An exact
after-delay image requires an agreed elapsed-time contract; original-pixel
comparison requires separately authorized native execution.

Unresolved cell/message name helpers `004f1160`/`00432210`, full producer/indirect
reset lifecycle, and complete panel behavior are outside this packet. No browser,
native-runtime, hardware-performance or complete hover-parity result is claimed.
