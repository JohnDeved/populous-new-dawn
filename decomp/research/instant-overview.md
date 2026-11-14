# Instant World View: Shift/Ctrl+Return (#1006)

Static research, 2026-11-14. Capstone 5.0.7 (private venv) disassembled the original
`d3dpoptb.exe` (SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, pinned in
`decomp/tools.json`). The executable was read as data only and never ran. The retained
Ghidra exports `decomp/generated/004aab80.c`, `00418890.c`, `00418950.c`, `0041d4b0.c`,
`0041d450.c`, `0041d410.c`, `0041d680.c`, `00479f00.c` and `0047a930.c` were checked
against the bytes. Their names and types are inferred.

## Bindings

The [binding atlas](native-input-bindings/README.md) decodes the records:

- `005d5f68`: Enter (DIK `0x1c`), press, exact empty modifiers, gate 1 → action `0x15`.
- `005d5f74`: Shift+Enter → action `0xc5`.
- `005d5f80`: Ctrl+Enter → action `0xc5`.

Matching uses exact modifier masks, so Shift+Ctrl+Enter and Alt+Enter match no
overview record. Keypad Enter (DIK `0x9c`) is a different record (action `0x9c`,
predicate `004ff450`). It is not an overview key.

## The two `process_cmd` cases

The cases share a prefix: case `0x15` at `004aacde` and case `0xc5` at `004abb83`.

1. When `0059ce08` is nonzero, the case clears it and does nothing else. The press
   is consumed.
2. When `00969bd7 & 1` is set, nothing happens.
3. Each case calls `0041fad0`. Outside World View this records whether the side-panel
   mode `0089c6e7` is 7 (in `005fe3fc` bit 0). Inside World View it restores mode 7
   when that bit is set.

Then they differ:

- `0x15` calls `00418890` (`004aad08`).
- `0xc5` calls `0041d4b0(draw_mode != 2)` (`004abba6`–`004abbb9`:
  `ax = draw_mode − 2; cmp ax, 1; sbb al, al; inc al`). Argument 1 enters World View
  and argument 0 leaves it.

## Animated path (`00418890`, plain Enter)

- If `level_flags (00895da8) & 8` is set, nothing happens. Only this path tests that
  flag.
- **Leave** (`draw_mode == 2`). It calls `0041fb10`, then `0041d450(100000, 0xe)`.
  - That starts the globe morph `005fe400` from its current value to `0x100` over
    `005fe428` frames. `0041ce00` initialises that count to 6 (`0041d2ff` also writes
    it).
  - The morph is ignored while one is already running (`005fe420`).
  - When the morph ends, `0041d680` calls `set_draw_mode(0)` and stores state `0xe` in
    `0089ce36`.
  - States `0xe`→`0xf`→`0x10` in `00418950` restore the saved view-config index
    (`0089c6eb`). Over `0089ce34` frames they rotate the tribe angle from 0 back to
    `0041cdf0()`, which reads `005fe42c`.
- **Enter** (`draw_mode != 2`).
  - Panel side effects run first: mode 9 queues chunk `0x6c` and calls `00443d30`;
    mode 7 calls `004b9150`/`004ba5d0`; both then call `004b00c0`.
  - If `0089ce36 == 0`, it stores state `0xb`. This path does not test `0089ce34` or
    `005fe420`.
  - State `0xb` saves the angle (`0041cdc0` → `005fe42c`) and selects view-config index
    4. It arms the countdown `0089ce34` from the frame rate (¾ of it, even, clamped to
    8–32, then rescaled while a `level_flags_1` bit is set). Over that countdown the
    angle rotates to 0.
  - State `0xc` waits until `0089ce34 == 1`, then calls `set_draw_mode(2)` and
    `0041d410`. `0041d410` starts the morph `005fe400` from `0x100` to 0.

## Instant path (`0041d4b0`, Shift/Ctrl+Enter)

**Guard.** The routine returns at once when `0089ce36 != 0` (overview state machine),
`005fe420 != 0` (globe morph) or `0089ce34 != 0` (view-config countdown). The ordinary
zoom-level change (`00479f00` case `0xb`, write at `0047a461`) also arms `0089ce34`. So
the instant chord is ignored during any animated overview transition **and** during an
ordinary zoom transition. Plain Enter tests only `0089ce36`.

**Enter (argument 1).** It does the following in one call, with no `0089ce36` state and
no morph:

- sets `005fe404 = 0`;
- stores `GetTickCount` and calls `0048b8d0` and `0048b450(1)` (inferred sound/CD
  calls);
- sets `0089ce35 = 0`;
- saves view-config index `0089c6ec` into `0089c6eb` and sets it to 4;
- saves the tribe angle (`+0x32`) into `005fe42c` and zeroes it;
- calls `00418810`, the same panel side effects as the animated entry;
- calls `set_draw_mode(2)`;
- sets tribe `+0x34 = 0x100`.

**Leave (argument 0).** It sets `005fe404 = 0x100` and calls `0048b500` (inferred
sound). It restores view-config index `0089c6eb` and calls `0042d380`, the same call
as the animated leave's `0041fb10`. Then it calls `set_draw_mode(0)` and restores the
tribe angle from `005fe42c`.

**Both directions.** Each loads the target view-config matrix (`00417980`) and sets
render flag `0087ca1c |= 0x80`. It calls `00417310` (Ghidra: `update_vfconfig`), clears
`0089ce36`/`005fe420`, and sets the morph `005fe400 = 0059bc0c = 005fe404`. That is 0 (the
complete globe) on entry and `0x100` (flat ground) on leave.

**Shared saved angle.** The animated and instant paths use the same angle slot,
`005fe42c`, so they compose. An animated entry followed by an instant leave restores the
angle saved at entry, and the reverse also holds.

## Browser mapping

- `overviewShortcut` in `app/quick-camera-shortcuts.ts` maps Enter to the animated
  action. Exactly Shift or exactly Ctrl selects the instant action. Repeats, Alt, Meta
  and Shift+Ctrl match nothing.
  - Keypad Enter remains the existing browser alias for Enter, so Shift/Ctrl+keypad
    Enter is also instant.
- `GameScene.overview({ instant })` is the single entry. Plain Enter still reaches the
  animated `overview()`/`leaveOverview()` owners in `app/scene-camera-runtime.ts`.
  The instant chord reaches `instantOverview` in `app/instant-overview.ts`, which uses
  the same scene state (`overviewActive`, `overviewStage`, `overviewReturn`,
  `globeMorph`, `viewPreset`, camera pose, `world.drawMode`).
  - It is a separate file because the performance source admission
    (`scripts/browser-performance/snapshot-drag-contract.mjs`) pins all of
    `scene-camera-runtime.ts` byte for byte. Editing that file would need a new
    reviewed drag-source profile.
  - It is ignored while `overviewStage`, a ground `viewTransition` (the `0089ce34`
    analogue) or a globe morph is active, and under the input mask.
  - It applies the end state of the animated path at once:
    - entry: preset 4, angle 0, completed globe morph (0), `drawMode = 2`;
    - leave: saved preset and angle, flat morph (256), `drawMode = 0`.
  - Both directions clear the stage and the view transition and update the view.
  - Entry keeps the animated entry's resets: camera capture, globe-motion reset, armed
    spell/plan cleared, focus motion stopped. Leave keeps the animated leave's resets.
- The Page keyboard gates (ready, menu, cheats, editable/dialog targets, focused
  button, input mask, open campaign messages) apply unchanged. Enter with any modifier
  still only closes an open campaign message ([note](campaign-message-keyboard.md)).
  - The Page listener now drives only the scene of its own current world. A listener
    left over from a replaced world (load, restart) cannot move the replacement scene.
    This also applies to period/H.

## Not modelled / open

- `0059ce08`, `00969bd7 & 1` and `00895da8 & 8` (animated path only) have unestablished
  meanings. The browser applies only its own gates, as before for plain Enter.
- Side-panel mode 7/9 retention (`0041fad0`, `00418810`) and the entry/leave sounds
  (`0048b8d0`, `0048b450`, `0048b500`) are not modelled.
- The meaning of tribe `+0x34 = 0x100` on instant entry is not established. That field
  appears in the flyby routines `00448fa0`–`00449b30`. The browser resets `viewZoom` to 0,
  the same as its animated path.
- A save made in World View still re-enters World View through the animated path when
  loaded. Whether the original restores `draw_mode` instantly is not established.

Evidence type: static disassembly. This is not an original-game execution witness,
browser acceptance or parity claim.
