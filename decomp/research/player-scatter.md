# Player scatter (D) and person state 43

Issue [#1004](https://github.com/JohnDeved/populous-new-dawn/issues/1004), base
`532cd9efb13acf0a36f2b9774c8892b18f918be6`. Static, read-only evidence from the
original `d3dpoptb.exe` (SHA-256 `3a5065c7…dfbe4f`, see `decomp/tools.json`):
retained Ghidra 12.1.3 exports plus capstone 5.0.7 disassembly of the same bytes.
No original execution, probe, fixture recording or parity claim.

## Native chain

- **Binding.** Default record `005d61fc`: char `d`, press, no modifiers, no predicate,
  gate 0 -> action `0xc0` (binding atlas, [PR #1030](https://github.com/JohnDeved/populous-new-dawn/pull/1030)). Shift/Ctrl/Alt+D do not match it.
  `0xc0` is a stage-2 `process_cmd` case, so it is ignored while `land_flags_1 & 2`
  (pause) is set.
- **Producer.** `process_cmd` case `0xc0` (`004ad2fe`): only
  `set_tribe_command(player, 0x7e, 0, 0)`. No message, sound, selection change or
  retain-selection argument (unlike G's `004999d0` value).
- **Queue.** `set_tribe_command` (`00479cf0`) drops the command while
  `land_flags_1 & 0x800`; for `0x7e` it writes the tribe's one-slot temporary buffer
  only when that slot is empty (first command per tick wins). `main_loop_outer`
  (`004a5590`) runs `process_tribes_cmd` before the tick's person processing.
- **Consumer.** `process_tribe_cmd` (`0043e8e0`) switch index `0x7e - 0xc`, jump slot
  `004423cc` -> `00441c62`. It walks the tribe person list (`tribe+0x881`, next at
  `+8`) and admits a person only when all of these hold:
  `+0x7a & 0x80` (selected), word `+0x9f == 0` (no vehicle), `flags2 & 0x800000 == 0`
  (not inside a building), state `+0x2c` not `0x19`/`0x1d` (25/29 fighting) and
  `flags2 & 0x100000 == 0`. There is no model, class, order, terrain or current-state
  whitelist, so the Shaman, casting people and an existing state 43 are admitted.
  For each: previous state `+0x7d` = state; `empty_unit_function` (`004ed6f0`, a bare
  `ret`); state = `0x2b` (43); `init_unit_class` (`004ed640` -> `004d2740`).
- **Initializer.** `004d2740` state-43 slot (`004d31dc` -> `004d3091`) adds nothing
  to the generic prefix: substate 0, timer 0, flags2 `|0x40000000`. The generic
  prefix draws one random speed because state flags `0x1904` lack `0x200`. Selection
  and queues are untouched (only previous state 14 deselects there).
- **Controller.** `unit_processing_class_1_person` (`004d32b0`) dispatches state 43
  through table `004d3d18[42]` -> `004d3a73` -> `004e2fe0`, after preparation and
  ground motion (`004e6d00`). `004e2fe0`:
  1. First visit (substate 0): substate 1; draw A; flags2 `|0x200000` (instant turn
     in `004e6d00`); timer 12; release motion route (`004ea460`); flags2 `|0x1080`;
     turn angle `A & 0x7ff`; draw B for speed `base + B % max(base >> 2, 1)` from
     `005a7b94[physics*26]`, doubled by bloodlust (`+0x16 & 8`); run animation
     `005a6f12[model]` (person animation row 25).
  2. Every visit: timer `-= 1`. Continue while timer > 0 and `flags2 & 0x800`
     (ground-obstacle recovery) is clear.
  3. End: only when command status `+0xa7 == 0`, anchor `+0x68` = current position,
     or the occupied building's outside point (`004044b0`) on a building cell, snapped
     to the cell centre (`00405090`), anchor flags cleared. Return the default state:
     39 for model 7 under `level_flags & 2`, otherwise the model's next state (10 for
     followers). The dispatcher re-initializes unless `flags2 & 0x100000`.

RNG per admitted person: one draw at command time (generic speed), then exactly
two on its first controller visit (heading before speed), none afterwards.
Queued commands are never cleared: state 10 restarts the retained queue.

## Browser port

`app/person-scatter.ts` holds the native admission predicate and the 0x4e2fe0
controller. `scatterSelected` (`app/live-command.ts`) visits `World.units` roster
order, not the native linked list (as for G). It applies the command at input time;
native applies it at the start of the next tick before people move, so ordering
against the person pass is equivalent. The one-slot same-tick collision with another
tribe command (for example G and D in one tick) is not modelled.

`scatterSelected` returns without effect while paused, outside `playing`, with an
input mask, or with `landFlags & 0x802` (stage-2 pause gate `2`, and the
`00479cf0` command-drop gate `0x800`).

### Port-only admission limits

The native predicate is applied, but the person must also have an ordinary owner
that can resume afterwards (`scatterOwner`, `app/live-command.ts`). A selected
person is skipped when any of these hold:

- not Blue, dead, ghost, or `inside` a building/vehicle record;
- browser adapters: `flight` (airborne/impulse), `fight` (melee), `casting`, `lift`,
  `entry` (building entry), `builder` (construction), `work`, `tree`, `harvest`,
  `delivery` (gathering/assigned work), `vault`, `attackReservation`;
- a registered route record that is not the person's own native record, or a
  legacy walk (`path`/registered route) with no native record;
- native record not class 1, or native state outside `[1, 10, 17, 19, 43]`, so for
  example panic 26/31, casting 22, conversion 23, tornado 24, transport rest 30,
  route recovery 33, fight recovery 36, special battle 39 and celebration 41;
- pending G (`guardInputPending`), nonzero work group (`workFlags`), airborne
  `flags2 & 0x80000`, or ghost `flags4 & 0x800`;
- any queued/immediate order model outside `[3, 7, 16, 18, 22, 27, 28, 30]`, for
  example construction 6, building entry/training 8/10, building attack
  11/15/19/21, preaching 17/31/32 and vault 33.

Natively all of these except vehicle, building occupancy and fighting 25/29 would
scatter.

`D` (no modifier, no repeat) now issues scatter from the page keyboard handler,
behind the existing ready/menu/cheats/popup/selector/editable/input-mask gates
and a stale-world check. It is no longer a camera alias; arrow keys and keypad 6
still pan right. W/A/S/Q/E remain port aliases (original A/S actions are not
implemented here). Selection is retained; a new click order replaces the scatter.

Tests: `tests/player-scatter.test.mjs`, `tests/game-preferences-navigation.test.mjs`.
