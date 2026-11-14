# Campaign message box keyboard ownership

Issue #1038. Static, read-only Capstone 5.0.7 disassembly of the original
`d3dpoptb.exe` (SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`), cross-checked
against the retained Ghidra exports `decomp/generated/004a9d90.c`, `004aa1c0.c`,
`004a5590.c`, `004af1c0.c` and `decomp/research/native-tribe-controls/004aab80.retained.c`.
The executable was read as data only; no original code ran.

## The box is a modal state, not a free-floating panel

The auto-open caller in `004314c0` (see
[popup contract](campaign-message-popup-contract.md)) calls, in order:

1. `004af440(mode, string)` at `0043178c`. It clears the box block at `0089bb81`
   (0x72 bytes), stores mode `0089bb82` and string `0089bb89`, and **always sets
   `0089bb81 = 2`**, whatever the mode low byte (0, 1 or 2). The mode only selects the
   control layout: `0089bbf2` = 1, 3 or 2 entries, which `004af780` hit-tests (inferred buttons). Outside the key dispatcher
   (`005cdb78 == 0`) it then sets pause reason `0089c6b1 |= 0x10` and
   `level_flags_1 (0089c669) |= 0x10000000`, drains the DirectInput buffer (`00526c10`)
   and clears the held/down/up key arrays `0098e928`, `00984591` and `00984691`. Inside
   the dispatcher it defers the same work through `level_flags_1 |= 0x08000000`.
2. `004afac0(rect)` at `004317bd`: `0089bb87 = 1`, `0089bb81 = 3` (opening animation),
   `0089bb88 = 0`. The per-frame `004afa70` (called at `004a4b06`) moves state 3 to 2
   once `0089bb88` passes `0089d171`.
3. `004af630(slot)` at `004317c8`: `0089bb86 = slot`.

The other `004af440` callers are `0041be57`, `0041bf60`, `00431400`, `0044a05b`,
`0048d429` and `process_cmd` case `0xaf` (`004ab94c`). They all enter the same state.

## What reaches the game while `0089bb81` is 2 or 3

- **Keyboard (`004a9d90`).** Modifier/held-key bookkeeping runs first. Apart from the early `level_flags_1 & 0x08000000` return, the state test at
  `004a9f09`/`004a9f16` then precedes every other branch (`opened_files_flags`,
  `level_flags_1 & 0x10000000`, the binding matcher `00489470`). At `004aa0cb` a
  release returns. A press of DirectInput `0x1c` (Enter) or `0x9c` (keypad Enter)
  calls `process_cmd(0xb0, 0, 0)` and returns. Any other press returns without an
  action. No modifier is tested on this path, so Shift/Ctrl/Alt+Enter also close the
  box. Escape (`0x01`), Space, the number row, selection, guard and spell keys never
  reach their binding records.
- **Continuous camera keys.** `004aa532` tests `level_flags_1 & 0x10000000` and skips the
  block that calls the continuous list `00489520` (at `004aa6d9`). Cursor-key rotation
  and the other held camera records therefore stop while the box is open.
- **Mouse (`004aa1c0`).** Only a left-button (`0xf0`) release in state 2 passes, as
  `process_cmd(0x66)` → `004af780`. That routine hit-tests the box controls (`0089bbbf`
  rectangles) and then a message-area test (`00431de0`, not bound here). Other clicks do
  nothing.
- **Simulation (`004a5590`).** At `004a5985` the per-turn loop calls `004af640` instead
  of `process_rddata`/`process_tribe_1`/`004a5d40` while the state is 2 or 3. The
  world is frozen.

## Enter closes the box; it does not reach World View

`process_cmd` case `0xb0` (`004ab959`, predicate `004ff530` tests the same states):

- sets `0089bb81 = 0` and `0089bb83 = 1`;
- calls `00431bb0(slot)` when `0089bb86 != 0xff`. The message stays in the strip. If
  its flags hold `0x400|0x20`, it calls `00417ca0` with the message cell (inferred camera move).
  If they hold `0x1` and `0x200`, it sets `0x8|0x2`;
- calls `00479f00(10, tribe, 0)` and `004af1c0(0x10)`. On this Enter path `004a9d90` has
  set `005cdb78 = 1`, so `004af1c0` only defers the release: `level_flags_1 |= 0x04000000`
  and `0089c6b5 |= 0x10`. The input frame then runs the deferred call (`004aa6b6`: on
  `level_flags_1 & 0x04000000` it calls `004af1c0(0089c6b5)`). That clears pause reason
  `0x10`. When no other reason remains, it also clears `0x10000000`, the DirectInput buffer
  and the key arrays;
- sets `0089bb81 = 4` (closing animation) when `0089bb87` is set.

Because `004a9d90` returns after `process_cmd(0xb0)`, the same press never reaches the
plain-Enter overview record (`0x15`). In the original Tutorial the World View lesson
(stage 1, message 137) therefore takes **two** Enter presses. The first closes the
instruction box. The second leaves World View.

## Browser mapping (this change)

`app/page.tsx` already refused every gameplay key while any campaign `<details>` was
open. That gate was added in `8589d16b3` so that Escape could not open the Game menu
over a message. It matched the original for every key except Enter, which the browser
swallowed instead of closing the box. Now a fresh Enter press (keypad included;
Shift/Ctrl/Alt ignored; Meta left to the browser) closes every open message and is
consumed. The ready, menu, cheats and `input`/`dialog` gates still come first. Any focused
`button` or `summary` keeps its native Enter activation. The effect is re-registered for
each `world`.
Closing by Enter does not dismiss the message and does not move the camera, the same
as collapsing through the summary.

## Remaining divergences (not changed here)

- **No freeze.** The browser does not freeze the simulation, and the Scene camera keys
  (cursor keys, zoom, bookmarks) still work while a message is open. World clicks are
  not blocked either. The original freezes all of these (see above).
- **Several open boxes.** The browser can show several open messages at once. The
  original has a single box, and a new `004af440` call replaces it.
- **Camera on close.** For `0x400|0x20` messages the original calls `00417ca0` (inferred camera
  move) when the box closes (`00431bb0`). The browser focuses positioned messages on a user
  open, as documented in the [presentation note](campaign-message-presentation.md).
- **Flags on close.** On close, `00431bb0` sets `0x8|0x2` on `0x1&0x200` messages. No
  browser close path does this.
- **Focused summary.** After a click collapses a message, its summary keeps focus. If
  another message then auto-opens, Enter activates the focused summary and reopens the
  old message instead of closing the new one. The original has no focusable controls.

Evidence type: static disassembly. This is not an original-game execution witness.
