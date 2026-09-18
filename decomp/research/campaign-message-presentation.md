# Campaign message presentation

Issue #59 implementation evidence, refreshed from main
`f859a2cf43b886f7d8c09f578bd521d7a8aedbe7`. This note consolidates retained
message evidence; no new native sweep was run for this slice. The verified executable
used by the existing message probes has SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

## Existing state and producer evidence

`app/messages.ts` already matches the retained allocation and motion evidence from
`00430bd0`, `00430e40`, `00431a80` and `00431c40`. Existing
`scripts/check-native-messages.py` compares native slot allocation/eviction, one shared
message RNG draw, text binding, Mission 2 message commands, and nine complete
oldest-first motion/collision/rebound profiles. This repair does not replace those
rules.

Mission 2 retained authored evidence remains:

- [`mission2-message-103.md`](mission2-message-103.md): message 103 -> string 642,
  type 3, flags `0x2d1`, cue `0xe3`, one shared RNG draw; source
  `levels/cpscr074.dat` SHA-256
  `03931ad1bc69860177c0a0d7d850db46b268683bf95b274926e18fe1f8a5d9db`.
- [`mission2-positioned-message.md`](mission2-positioned-message.md): opcode 1177
  stores target cell `0x60cc`, payload 308, lifetime 3000 and flags `0x36f1`.
  Payload 308 remains neutrally named because its downstream camera meaning is not
  recovered.

The browser game clock calls `stepMessages` at the existing 24 Hz presentation
interval. Native `004314c0` gates age/lifetime work on changes to
`game_state.offset_counter_2`; the complete native scheduling relationship is still
open. Consequently lifetimes such as **3000 are presentation update counts, not a
wall-clock duration**. This repair does not change `app/game-clock.ts`,
`app/world-turn.ts`, campaign commands or RNG.

## Pending auto-open: exact retained flag lifecycle

`decomp/generated/004314c0.c` runs message motion before popup consumption. In its
oldest-first message list it selects at most one record per presentation visit:

1. require pending bit `0x20000`;
2. require an existing motion collision/settled bit, `(flags & 0xc0000) != 0`;
3. clear `0x20000`;
4. for ordinary message records with bit `0x10`, invoke the popup consumer;
5. set transient message flag bit `0x2`.

The `uVar4 == 0xffffffff` guard makes this max-one behavior explicit.
`0049f9c0` subsequently tests bit `0x2` as a presentation/draw condition and clears
it (`flags &= ~2`) while rendering the message record. Therefore `0x2` is **not a
durable browser-open flag**. The browser maps it to a one-shot request to open the
uncontrolled `<details>` element, then clears the transient bit after the element has
received that open request. User open/close state remains DOM-owned; a consumed
message cannot be forced open again merely by a React rerender or checkpoint reload.

This also corrects the old browser binding, which rendered `open` directly from
`0x20000` before motion had reached the native gate and never consumed the pending
bit.

## Exact screen parameterization

Native notification layout in `004314c0` is not tied to the user HUD-size setting.
The retained coordinate converters are:

- `0044a1f0 parameterize_by_screen_width(value)`:
  `product = screenWidth * value`; return
  `(product + ((product >> 31) & 0xffff)) >> 16`.
- `0044a210 parameterize_by_screen_height(value)`:
  `product = trunc(screenHeight / 2) + screenHeight * value`; return
  `(product + ((product >> 31) & 0xffff)) >> 16`.

`004314c0` initializes the message strip with normalized X `0x2800` and normalized
width `0x0ccc`. It first parameterizes `0x0ccc`; if that pixel width is odd it adds
`0x66` to the normalized width, then parameterizes the corrected value. Each message
record's normalized `position` and `height` are independently passed through the
height converter.

The implementation therefore:

- computes strip X/width from the actual viewport width in the existing resize path;
- computes each message top/height from the actual viewport height using the exact
  integer formulas above;
- keeps this independent from `--hud-scale`, so changing the modern sidebar size does
  not move campaign notifications;
- removes the browser-only `top .2s linear` transition rather than replacing it with
  guessed easing or RAF interpolation.

At the 640x480 reference viewport the values remain the original browser reference
geometry. Modern viewports use the native independent X/Y parameterization and its
rounding, rather than multiplying 480-reference pixels by the uniformly capped HUD
scale.

## Interaction preserved

- A user opening a positioned message still focuses the proven target from
  `messageViewPoint`; auto-open itself does not invent camera movement.
- Direct dismissal remains `removeMessage`, corresponding to retained `00430fe0`
  type-3 removal ownership.
- Popup body typography/frame and exact native popup positioning remain a browser
  adapter. Existing durable research explicitly leaves native font rasterization,
  popup positioning and broader click-state flags open. This slice does not guess a
  replacement.

## Validation boundary

Focused portable tests own pending/settle/max-one consumption, pause, and existing
refresh-schedule invariance. The dedicated browser acceptance uses ordinary Mission 2
startup/route for authored strings 641, 644 and 642, while any artificially rapid
message stack is labeled as a supporting presentation fixture. Task-relevant
screenshots are limited to those authored message states. Final aggregate repository
check/build remains integration-owner work.
