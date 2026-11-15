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

## What `004af640` does each turn (#1046)

Static Capstone read of the same executable. `004af640` is the whole replacement for
the per-turn block at `004a5985`; it runs no simulation, script, AI, message motion or
animation work:

- If `0089c661 & 2` is already set it returns at once (`004af643`/`004af64c`).
- Otherwise it calls `00479f00(10, player_tribe, 1)`. Cases 5 and 10 of `00479f00`
  share the branch at `0047a1ba`; case 5 is the P binding (action `0x0f`, `004aabfe`)
  and toggles `0089c661 ^= 2`, while case 10 sets (`1`) or clears (`0`) it. With the
  bit set, the branch calls `0048b4b0` (walks the sound list `0089ce6d` through an
  interface method; inferred sound pause), sets `008922ee |= 2` and copies 0x50 bytes
  from `[00972f44]` into `00892397` (inferred: the pause label).
  `00523200` then draws that status. Its alternative branch (`0052322d`..`00523241`)
  needs `level_flags_1 & 0x10000000` together with a pause reason in `0xce`; the box
  reason `0x10` is not in that mask, so an open box shows the ordinary "Paused" status.
- Outside the key dispatcher it sets pause reason `0089c6b1 |= 0x10`, clears
  `0x08000000` and, once, sets `level_flags_1 |= 0x10000000`, drains DirectInput and
  clears the key arrays and the six held-input words `00984560`..`00984574`. Inside the
  dispatcher it defers through `0089c6b5 |= 0x10` and `level_flags_1 |= 0x08000000`.

So an open box is the ordinary game pause. Other per-frame owners follow that pause:
the flyby step `00449320` returns early on `0089c661 & 2` (`00449332`), and message
motion stays still because `004314c0` only ages records on `offset_counter_2` changes.
The closing `00479f00(10, tribe, 0)` clears the pause unconditionally.

The input frame `004aa4e0` skips the whole block from `004aa53f` to `004aa6ed` when
`level_flags_1 & 0x10000000` is set (`004aa532`). That block calls the held camera list
`00489520` (`004aa6d9`), the screen-edge scroll `004adbb0` (`004aa6de`), `00480100` and
`0041ce30`. Edge scrolling therefore stops as well as cursor-key rotation.

## Browser mapping (#1046)

- **Freeze.** Opening a campaign message box sets `world.paused` (the browser's
  ordinary pause; Space and the HUD pause button) and shows the original "Paused"
  status. The world, flyby, sprite animation, message motion and paused sound follow
  the existing pause owners. Closing restores the pause state from before the box.
  Every auto-opened box starts unpaused (auto-open needs running presentation visits),
  so closing it resumes, as `00479f00(10, tribe, 0)` does. A box the player opens from
  the strip while already paused keeps that pause after closing; this is a deliberate
  browser difference, because the native pause bit has a single owner.
- **No turn before the pause.** `messageBoxRequested` (transient bit 2) holds
  `advanceGame` from the presentation visit that requested the box until the page has
  opened it and paused, so no turn runs in between, as at `004a5985`. The page keyboard
  handler and press guard already treat that pending request as an open box, so the
  Menu, Space and HUD cannot change the pause in the gap. Headless callers without the
  hook are unchanged.
- **Input.** While a box is open the Scene drops cursor/held camera keys, zoom keys and
  wheel, bookmarks, group-display keys, the screen edge, world presses and minimap
  presses. The page drops HUD presses. Only the box (its summary and dismiss button),
  the browser fullscreen control and the desktop notice take presses. Enter keeps the
  #1045 behavior; Escape still does not open the menu.
- **One box.** The strip keeps every message, but at most one `<details>` is open. A
  newer auto-open or a player opening another message replaces the open box, like a
  new `004af440` call. Keeping the strip of collapsed messages is the #457 modern-screen
  presentation; only the open element is the modal box.
- **Focus edge case.** Only controls inside the open box keep native Enter/Space
  activation. Enter from any other focused control closes the box, and Enter/Space are
  refused for those controls. An auto-open also blurs a stale strip summary.

## Remaining divergences (not changed here)

- **Camera on close.** For `0x400|0x20` messages the original calls `00417ca0` (inferred camera
  move) when the box closes (`00431bb0`). The browser focuses positioned messages on a user
  open, as documented in the [presentation note](campaign-message-presentation.md).
- **Flags on close.** On close, `00431bb0` sets `0x8|0x2` on `0x1&0x200` messages. No
  browser close path does this.
- **Pause owner.** See the freeze bullet above: a player-opened box over an existing
  pause keeps that pause on close. The browser also pauses when the window loses
  focus; if that happens while a box is open, closing the box still restores the
  pause state from before the box, so the game resumes on that explicit close.
- **Box controls.** `004af780` hit-tests the mode-dependent box controls (`0089bbf2`
  entries). The browser box has its summary and dismiss button instead.

Evidence type: static disassembly (Capstone 5.0.7 on the hash above for the #1046
additions). This is not an original-game execution witness.
