# Player scatter (D) and person state 43

Issue [#1004](https://github.com/JohnDeved/populous-new-dawn/issues/1004), base
`532cd9efb13acf0a36f2b9774c8892b18f918be6`. Static, read-only evidence from the
original `d3dpoptb.exe` (SHA-256 `3a5065c7…dfbe4f`, see `decomp/tools.json`):
retained Ghidra 12.1.3 exports plus capstone 5.0.7 disassembly of the same bytes.
No original execution, probe, fixture recording or parity claim.

## Native chain

- **Binding.** Default record `005d61fc`: char `d`, press, no modifiers, no predicate,
  gate 0 -> action `0xc0` (the binding atlas, `scripts/native-input-bindings.py` on
  the `feat/native-input-binding-atlas` branch). Shift/Ctrl/Alt+D do not match it.
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

Port-only admission limits: the native predicate is applied, but the person must
also have an ordinary owner that can resume afterwards. Skipped selected people:
airborne/impulse, melee, casting, building entry/occupancy, construction, gathering
(`work`/`tree`/`harvest`/`delivery`), vault, attack reservation, ghost, pending G,
native work groups, preaching/building-attack orders, and legacy walks without a
native owner. Natively these (except vehicle/building/fight) would scatter.

`D` (no modifier, no repeat) now issues scatter from the page keyboard handler,
behind the existing ready/menu/cheats/popup/selector/editable/input-mask gates
and a stale-world check. It is no longer a camera alias; arrow keys and keypad 6
still pan right. W/A/S/Q/E remain port aliases (original A/S actions are not
implemented here). Selection is retained; a new click order replaces the scatter.

Tests: `tests/player-scatter.test.mjs`, `tests/game-preferences-navigation.test.mjs`.
