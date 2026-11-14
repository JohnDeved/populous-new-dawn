# Player patrol: Ctrl+Alt routes and N queued-action exit (#1003)

This note is static research done on 14 November 2026, based on main `c3947518`. The
original `d3dpoptb.exe` (SHA-256 `3a5065c7…dfbe4f`) was read as data only. Capstone
5.0.7 was used for disassembly in a private venv. The note also reuses retained
Ghidra 12.1.3 pseudocode and the default-binding atlas at
`origin/feat/native-input-binding-atlas:decomp/research/native-input-bindings/` (PR #1030, head
`0504f8e6`). It does not record an original-game run, a browser change, or a parity
claim. It supersedes the unmerged #1003 checkpoint notes `f71c961b`, `6f70961d`,
`77f3aff6`, `71723eb1` and `b1e1d3b5`.

Byte witness: `python3 -I decomp/research/player-patrol/verify.py "$POPULOUS_EXE"`.
The witness checks the executable hash and 18 cited ranges against retained SHA-256
values (exit 0 = `passed`). `--dump` prints hex and disassembly when Capstone is available.

## Findings

**P1. Input chord.** Default records are 12 bytes:
`key, action u32, flags, modifier mask, gate, predicate u32`.

| Record | Bytes | Meaning |
| --- | --- | --- |
| `005d6544`/`005d652c` | `38 bd … 09 40 00`, `b8 bd … 09 40 00` | Left/Right Alt press, any modifiers → action `0xbd`: `0098e908 \|= 0x800` (`004abb6f`) |
| `005d6550`/`005d6538` | `38 be … 0c 40 00`, `b8 be … 0c 40 00` | Alt release → `0xbe`: clear `0x800` (`004abb78`) |
| `005d6568` | `f0 7f 00 00 00 0c 2a 00 80 f4 4f 00` | **left-button release** (`0xf0`, flags `0x0c`), mask `0x2a` = Ctrl required, Shift/Alt ignored → action `0x7f`, predicate `004ff480` |
| `005d655c` | `f0 7e … 0c 28 00 80 f4 4f 00` | same without Ctrl → action `0x7e` (final click) |
| `005d6484` | `f0 6f … 09 2a 00 20 ef 4f 00` | Ctrl press (Shift/Alt ignored) → `0x6f` selection press |

- **Mode gate.** Predicate `004ff480` passes only in interaction mode `0089c6e7 == 12`
  with `0089c6e8 == 0` (followers selected, no drag sub-mode), or in mode 16.
- **Earlier records do not take Ctrl+Alt+left release in mode 12.** Their predicates
  reject mode 12, or their masks reject the chord:
  - `005d628c`/`005d6298` (`0x6a`/`0x6b`): mode 13 only.
  - `005d6490` (`0x71`): modes 9/15 only.
  - `005d62a4` (`0x6d`): mode 13 only.
  - `005d646c` (`0x76`): exact mask 0, so Ctrl+Alt cannot match.
  - `005d649c`–`005d64b4` (`0x77`/`0x78`): exact masks `0`/`2`/`4` and mode 7.
- **The command fires on release.** Ctrl and Alt are read at the release event:
  - Ctrl through the held-key arrays `009845ae/009846ae` and `0098462e/0098472e`.
  - Alt through state bit `0x800`.
- **Releasing Ctrl or Alt does not finalize anything.** The default table has no
  Ctrl-key record, and the Alt records only toggle bit `0x800`.

**P2. Context and model.**
- **Context flags.** `00437078..004370fd` (byte-verified) sets context `0x100000`
  when Shift (`0x400`) is held, or when Alt (`0x800`) and either Ctrl key are held.
  Only Alt plus Ctrl also adds `0x1000`. It then calls `004b98f0(cell, tribe, 1)`
  and adds `0x800000` if the call succeeds.
- **Model choice.** `00437750` picks model **11** (`0x0b`) from `0x1000` only after
  higher-priority contexts fail:
  - Own Shaman with `0x100000` gives model 30. Ctrl+Alt over the player's own Shaman
    therefore gives **Shaman guard**, not patrol.
  - Then come enemy (28), tree (7/13), vehicle (22), Spy (16), sabotage (34),
    plan/building (6/8/10/19/15).
- **Invalid points are ignored.** `004380f0` case `0xb` clears the "context valid"
  byte `00895e9b` unless both `0x1000` and `0x800000` are present. `004aa8b0` then
  issues nothing (only `0047a550`). An invalid Ctrl+Alt point is ignored. It does
  **not** fall back to a move.
- **Point predicate `004b98f0` (byte-verified).** The point is valid only when all
  of the following hold:
  - `00518200(cell point, 0)` returns 0 (strict resting-cell test, no coast
    allowance; browser `restingCellCollision(..., false) === 0`).
  - The cell has no building (`cell+8 & 0x3ff`).
  - No class-5 scenery object other than type `0x11` is in the cell list. The object
    at `008922d8` is skipped.
  - With the flag argument set to 1, a class-10/type-16 marker object does not
    invalidate.

**P3. Command packet.**
- **Arguments.** Action `0x7f` (`004acf85`, byte-verified) calls
  `004aa8b0(1, keep, shift)`:
  - `keep = 004999d0()` is 1 while `level_flags 00895da8 & 0x100000` is clear, and
    is inverted while Alt (`0x800`) is held.
  - `shift = (0098e908 & 0x400) != 0`.
- **Staged and final families.** The planning count is `n = tribe+0x8c0`. With
  `n < 7`, `004aa8b0` issues the **staged** tribe command `0x37+n`. At `n >= 7`, or
  for action `0x7e` (no Ctrl), it issues the **final** command `0x57+n`. The packet
  is `(model 11 | first << 16, cell | 0x20000·keep | 0x40000·shift)`.
- **Extents (`first`).** `004382c8` (byte-verified) builds `first` from the per-slot
  UI table `00895df6 + n*16 + 0x0e/0x0f`:
  - Only the drag sub-mode `0089c6e8 == 2` writes these extents (`004ad9a0`). They are
    clamped to the model-11 descriptor bytes min `02` and max `06` (`005a7eb3/4`).
  - `0047a6a2` zeroes the whole table (`rep stosd`, 0x20 dwords) on that UI path.
- **Staging.** A staged packet also calls `004358f0`, which advances the tribe
  planning count `+0x8bf` (capped at 8) and the cursor `+0x8c0`, and re-runs the `00437010(1)` context pass.

**P4. Consumer `00444f60` (tribe-command consumer `0043e8e0`).**
- **Writing the record.**
  - The 0x37/0x57 family writes planning record `tribe+0x8c1+n*10` through `00435780`.
    For model 11 (descriptor flag `0x800`): `a = cell`, `b = byteswap(first)`
    (extents).
  - Order flags: `0x80` when staged, `0x40` when Shift. The `0089bc7e` branch is
    separate.
  - For `n == 0`, `00435c40` clears every selected person's queue. `00435cb0` then
    appends one shared order record to each selected, eligible person at that
    person's first free circular slot.
- **Restart.** Every 0x37/0x57 packet restarts each selected person that is not in
  state `0x19`/`0x1d` and has no `+0xc & 0x100000`, using the model's `next_state`.
  The first route segment therefore starts immediately.
- **Finalization and deselection.** The final family calls `00436ff0`, which zeroes
  the planning buffer `tribe+0x8bf..+0x910` (0x52 bytes). It deselects unless `keep`. Slot 7
  (`0x3e`) always deselects. Tribe command `0x1e` (right-click release `0x83` in mode 12/16) also
  finalizes and deselects. Deselecting does **not** clear person queues.
- **Route capacity.** At most 8 route points: 8 person slots and 8 planning slots.
  The 8th Ctrl+Alt click is already final and deselects.

**P5. Route storage and patrol conversion.**
- **Storage.**
  - Route points live in each person's 8 command slots (`person+0x8b`, cursor
    `+0xa6`).
  - The slots reference shared 10-byte records in the 800-record pool at `00938830`.
  - There is no separate per-tribe route store.
  - Per tribe there is only the planning count/cursor/buffer (`tribe+0x8bf..`).
- **Conversion.** `0043b010` is called only from attach `00436d00` (`00436d4f`) and
  is already ported as `normalizePersonRoute`. When the first run of consecutive
  model 11/25 slots has two or more entries (empty slots allowed in between), it:
  - rewrites every model 11 in that run to model **25**, with `a=(cell&0xfe)<<8`,
    `b=cell&0xfe00` (the extents are dropped);
  - sets person `+0xc |= 0x10`.
- **Records are shared.** The rewrite is visible to every person that references
  the same record.
- **A single Ctrl+Alt point stays model 11.** Model 11 is an area guard that never
  completes, so one point is a guard post, not a patrol.
- **Example.** Ctrl+Alt A, Ctrl B (move), Ctrl+Alt C gives `[11,3,11]`. This is not
  converted, because the route run stops at the move.

**P6. Loop.**
- **Descriptors.** Model 25 descriptor flags are `0x044480b9` (bit `0x8000` =
  repeat). Model 11 flags are `0x044418a0` (bytes at `005a7fe6`/`005a7eb2`).
- **Completion.** Model 25 completes through the movement body (`0x4336c0`) and
  resets the timer of any class-10/type-16 marker in the target cell.
- **Advancing (`004366b0`, ported as `advancePersonOrder`).** With repeat set, the
  completed slot is kept. The scan wraps from `cursor+1` and selects only the next
  slot with the **same model**. It removes cancelled slots (`flags&1`) and skips any
  other queued action without removing it.
- **Result.** The route repeats indefinitely. Actions queued after it wait, so
  `[25,25,3]` loops between slots 0 and 1. Actions queued **before** the route run
  normally first (`[3,25,25]` moves, then patrols).

**P7. N stops the patrol and runs queued actions.**
- **Bindings.**
  - `005d6208` = `6e 62 00 00 00 11 00 00 …`: char `n`, press, exact mask 0
    (Shift/Ctrl/Alt+N do not match), gate 0, no predicate → action `0x62`.
  - `004abf0f` sends tribe command `0x68` for the player tribe.
  - The earlier record `005d60f4` (`n` → `0x9d`, the Escape action) wins only while
    `0089c661 & 0x80000000` (predicate `004ff450`, a modal state).
  - Action `0x62` is in the stage-2 `process_cmd` switch. Stage 2 is skipped while
    `0089c661 & 2` (atlas).
- **Consumer.** `0043e8e0` case `0x68` (`00440c16`) calls `0043d6e0(tribe)`. This is
  its only caller, and the function is byte-verified. For **every person in the
  tribe list `tribe+0x881`**, with **no selection test**:
  1. The person must be in state `0x0a` (10), and the current slot `commands[cursor]`
     must be model 11 or 25.
  2. Scan slots from `cursor` up to 7, **without wrapping**. Skip empty slots,
     cancelled slots (`flags&1`) and model 11/25 slots. Stop at the first other
     queued command.
  3. If one is found:
     - call `004364d0(person, s)` (remove slot) for `s = 0 … found-1`;
     - set `cursor = found`;
     - call `00432df0(person)` (start the current order), then `004d4f40(person)`.
       `004d4f40` advances the global RNG once, draws the speed and sets the
       animation.
  4. If no later queued action exists, nothing changes: **N does not stop a patrol
     that has nothing queued after it**.
- **Who is affected.** Fighting people (state ≠ 10) are untouched by N. Single-point
  model-11 guards with a later queued action are exited the same way. The function
  returns the number of people switched.
- **Not affected.**
  - Patrol slots after the found action survive.
  - The tribe planning buffer and the selection are unchanged.

**P8. Cancellation, replacement and persistence.**
- **Replacement.** A new ordinary command (final family at `n == 0`) or a new
  staged sequence (slot 0) clears the selected people's queues and replaces the
  patrol.
- **Cancellation.** Right-click (`0x83` → tribe command `0x1e`) only deselects and
  finalizes planning. Patrols continue.
- **Combat, death, removal.** These use the existing generic queue and reference
  cleanup (`004364d0`/`00436ca0`). No patrol-specific path exists.
- **Persistence.** Patrol state is ordinary order and person data: the records, the
  slots, the cursor, `+0xc & 0x10`, and the tribe planning count. There is no
  additional patrol store.

## Browser comparison (main `c3947518`)

- **Context.** `app/command-context.ts` already maps context `4096` (named
  `Flatten`) to model 11, and has `FlattenValid = 8388608`. These are native
  `0x1000`/`0x800000`, the Ctrl+Alt patrol context, not Flatten. However:
  - `liveCommandContext` (`app/live-command.ts`) never sets them;
  - model 11 is not validated by the P2 point predicate;
  - `Force` (`0x100000`) is not set for Ctrl+Alt or for Shift.
- **Staging.** `command()` stages only models 3/27/28/queued buildings/trees with
  Ctrl. Model 11 never reaches `appendLivePlayerOrders`.
- **Already ported.**
  - `playerOrderInput` (`app/person-orders.ts`) matches P3/P4: staged when Ctrl and
    `cursor<7`, Shift flag `0x40`, deselect when `cursor===7 || (!staged && alt)`.
  - Model 11 has no descriptor flag `0x2000`, so it is stageable.
  - Already ported: `normalizePersonRoute` (`0043b010`), `advancePersonOrder`
    (`004366b0`, repeat), `removePersonOrder` (`004364d0`), `prepareCellOrder`
    (model 11), `stepGuardOrder` (model 11 body, `app/live-building-combat.ts`), and
    the model-25 `case 25` in `app/person-order-update.ts`.
- **Live gap observed with a scratch probe (not committed).** The probe used
  `createWorld(1)` and two blue braves at turn 24. It sent two staged model-11
  packets (`writePersonOrder(order,11,0,cell,0x80)`) through
  `appendLivePlayerOrders(..., replace = i===0)`.
  - The queue became `[25,25]` with `flags2&16`, state 10, and the brave walked to
    point 1.
  - On arrival (turn 59) it fell to state 19/17/19. `commandCursor` stayed 0 and it
    never cycled during 2,400 turns.
  - Cause: `app/world-turn.ts:1639` sends people to `stepLiveMovement` only for
    current models `[3,6,7,16,22,27,30,33]`, so models 25 and 11 for ordinary
    followers never reach `stepLiveOrderQueue`.
  - Also, `stepLiveOrderQueue` (`app/live-movement.ts:1076`) supplies
    `cellObjects: unsupported`, which the model-25 completion path calls.
- **No N binding.** Neither `app/page.tsx` nor `app/scene-input-runtime.ts` binds N.

## Implementation plan (single #1003 writer; rebase after #1031/#1032/#1033/#1019, which edit the same keyboard files)

1. **Context and input** (`app/command-context.ts`, `app/live-command.ts`):
   - Rename `Flatten`/`FlattenValid` to native-meaning names (patrol/guard-marker
     context).
   - In `liveCommandContext`, take the modifiers: set `0x1000|0x100000` for
     Ctrl+Alt, and `0x100000` for Shift.
   - Set `0x800000` via a ported `004b98f0` point predicate. This should be a new
     pure helper next to `moveCommandAllowed`, reusing `restingCellCollision(...,
     false)`, building ids and cell scenery.
   - Reject (no-op) model 11 without `0x800000`.
   - In `command()`, admit model 11 to the staged path. Write
     `writePersonOrder(order, 11, extents, cell, input.flags)` with extents 0/0
     (P3), and leave drag-sized extents as a follow-up.
2. **Live dispatch** (`app/world-turn.ts`, `app/live-movement.ts`):
   - Route current model 25 (and player-owned model 11, if not already owned by
     `stepLiveBuildingAttack`) through `stepLiveOrderQueue`, so that `case 25`
     completion and the repeat `advancePersonOrder` run.
   - Supply a real `cellObjects` for class-10/type-16 markers (empty when none).
   - Reuse the existing model-11 guard owner. Do not create a second one.
3. **N** (new `stopLivePatrols(w, tribe)` in `app/live-movement.ts` or
   `app/person-orders.ts`; keyboard in `app/page.tsx`/`app/scene-input-runtime.ts`):
   - Implement P7 exactly: all tribe people in state 10, a non-wrapping scan,
     removal of slots 0..found-1, then start the order and draw the speed with one
     RNG step.
   - Bind plain `n` (no modifiers), and do not bind it while a modal dialog owns N.
   - Keep G unchanged.
4. **Tests** (failure-first, new `tests/player-patrol.test.mjs`):
   - Ctrl+Alt staged clicks produce one shared record per click.
   - Two points convert to 25 and complete at least two full cycles (cursor
     0→1→0→1→0) on the shipped tick.
   - One point stays model 11.
   - Points: invalid (building, scenery, water) are ignored; own-Shaman gives
     model 30.
   - The 8th click finalizes and deselects. Alt on the final plain click deselects.
   - Ctrl queue then patrol, and patrol then Ctrl move.
   - N: switches every tribe patroller with a later action (selected or not),
     ignores state ≠ 10 and patrols with nothing queued, consumes exactly one RNG
     step per switched person, and leaves later patrol slots intact.
   - Right-click deselect keeps the patrol. A new plain command replaces it.
   - Death and removal release references.
   - Save/Load mid-cycle continues identically (structured-clone world; no
     `CHECKPOINT_VERSION` change unless new fields are added).
   - `tests/ground-waypoints.test.mjs`, `tests/shaman-guard-input.test.mjs` and the
     mission16/22 patrol tests must stay green.
5. **Rendered acceptance.** Use a trusted local browser run on Mission 1:
   - select braves;
   - hold Ctrl+Alt and click three terrain points;
   - capture frames showing at least two cycles;
   - add a Ctrl-click move, press N, and capture the move executing.
   This is a browser consistency claim, not native parity.

## Open questions

- **Extents table initial value.** `00895df6` is cleared by `0047a6a2`, but the
  condition for that path in `0047a550`, and the default before any drag, are not
  fully traced. The drag sub-mode `0089c6e8==2/4` UX is also not traced.
- **`0089c661` bits.** The meaning of `0089c661` bit 2 (stage-2 skip) and bit
  `0x80000000` (modal N=Escape) is unknown.
- **Class-10/type-16 marker.** Its owner (placement through the mode-7 type-`0x11`
  path at `004acbad`) and whether single-player levels create it are not
  established.
- **Saved bindings.** Saved `key_def.dat` overrides can change the physical chord.
  This note covers defaults only.
- **No native witness.** No original-game run was made, so cycle timing and
  combat-interrupt behavior come from code reading, not a recording.
