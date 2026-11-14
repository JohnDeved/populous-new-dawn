# Spell Ctrl casting and modified charging

Issue [#1008](https://github.com/JohnDeved/populous-new-dawn/issues/1008). Static,
read-only evidence from `d3dpoptb.exe` (2,275,840 bytes, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`), disassembled
with Capstone 5.0.7. Nothing was executed or emulated. It continues the source-only
checkpoint on `research/spell-live-wrapper-20261113` (`b33348e8`) and closes its
open emitter-to-consumer gate.

Reproduce with `python3 -B scripts/check-static-spell-modifiers.py <exe>`
(6 records, 82 instructions, 8 switch entries).

## Casting: records 0x6a/0x6b, not 0x77/0x78

Spell selection (`0049e5c0` → `004c30d0`/`004c30e0`) stores the model at `0089ce81` and
requests interaction mode `0xd`. Mode 7 and actions `0x77/0x78` are building placement
([placement controls](building-placement-controls.md)); they are not the spell family.

Mouse-left release records in mode `0xd`:

| Record | Modifiers | Action | Predicate |
| --- | --- | --- | --- |
| `005d628c` | exactly none | `0x6a` | `004fefe0`: mode `0xd`, target bit `0087cabc&1`, flag `0x20` clear, `004c24f0(...) > 0` |
| `005d6298` | exactly Ctrl | `0x6b` | `004fefe0` |
| `005d62a4` | any | `0x6d` | `004ff090`: same, but `004c24f0(...) == -2` (out of range) |

No other mouse-left release record accepts mode `0xd`, so Shift, Alt, Ctrl+Alt and
Ctrl+Shift releases on an in-range target dispatch nothing and leave the spell
selected. Modifiers are sampled at release.

Stage-2 `process_cmd` routes `0x6a`/`0x6b` to shared case `004ac172`. It rejects
`004c28a0(tribe, model) != 3` with message `0x24b`, and `00499ac0` failure, without
changing mode. Otherwise it emits the cast command (`0x4f`/`0x50`/`0x51`) through
`00479cf0`, plays sound `0x6a`, then `cmp ebx, 0x6b; je` (`004ac3ca`) skips
`0047a550(0, tribe)`. Only `0x6a` leaves spell mode. Retention depends on input
acceptance, not on the later cast outcome. There is no automatic repeat.

`0x6d` (`004ac45b`) is the out-of-range approach command `0x6e`; it retains when a
physical Ctrl key is down. The browser has no approach-and-cast path, so it still
rejects out-of-range targets. That is a separate gap.

`00437750` ranks contexts for ordinary orders in modes 0/`0xc`, through `0x7e/0x7f`
(predicate `004ff480`: mode `0xc` or `0x10`). It is not reached in spell mode `0xd`, so
Ctrl+Alt patrol points (#1003/#1041) and Ctrl spell retention do not compete.

## Charging: right-click producer `0049e650`

After gates (`0089d17c & 0x20` rejects; `004c2ca0` rejects descriptor mode 2 without
permission `0x100`), the callback checks:

1. **Ctrl** (`009845ae`/`009846ae` or `0098462e`/`0098472e`, scancodes `1d`/`9d`):
   emit `0x75(model, 0)`.
2. else **Shift** (`2a`/`36`): emit `0x74(model, paused)`, where
   `paused = (004c2ba0(player, model) == 0)`.
3. else, only if permanent bit `0096070a[player] & (1 << model)`: emit `0x56(model, paused)`.

Ctrl takes precedence over Shift, and Alt has no branch. Only the plain toggle requires
the permanent bit. When the clicked spell is currently paused, it also removes queued
messages of type `0xff01` (`00683b74` list, `00430fe0`). The browser does not port
that message cleanup.

## Emitter to consumer (closes the `b33348e8` gate)

- `00479cf0` writes the local player's slot `00897997 + player*15`: `+4` arg1, `+8` arg2,
  `+0xc` command. For commands above `0x52`, `cmp eax,0x46; ja 00479d2c` writes only if
  `+0xc` is empty. The first such command per tick wins. Demo/playback flag
  `0089c662 & 8` suppresses the write.
- `0043e320` copies that slot into the player's ring `008979d3 + player*0x5e2`.
- `0043e480` copies each ring entry into `0089d18c + player*15` (fields `+0/+4/+8/+0xc`).
- `0043e890` walks four tribes (`0089d1c8 + i*0xc65`) and calls
  `process_tribe_cmd(tribe, 0089d18c + i*15)` when `+0xc` is nonzero. The ordinary tick
  `004a573e` calls it after `0043e480` succeeds.
- `process_tribe_cmd` (`0043e8e0`) switches on `[rec+0xc] - 0xc` (`004423f0`/`004422c0`):
  `0x56` goes to `00440496`, `0x74` to `004411bf`, `0x75` to `00441222`.

## Consumer transitions

`owner = tribe+0xc22`. Paused mask `field10 = 0096071a + owner*56` uses bit `(m-1)`;
`004c2be0` clears it (charge) and `004c2c10` sets it (pause). Loops use the available
mask `0096070a + owner*56` bit `i` for `i = 0..31`. Machine code passes `(owner, i)`
to every helper; the omitted arguments in the Ghidra pseudocode are decompiler loss.

- `0x56`: arg nonzero charges the model, zero pauses it. Then clear `tribe+0x9e9` bit 0.
- `0x74`: apply the same polarity to every available `i`. Then clear bit 0.
- `0x75`, restore: if `tribe+0xc25 == model` and `+0x9e9` bit 0 is set, then for every
  available `i` charge if `+0x9e9` bit `i` is set, else pause. Clear bit 0 and set `+0xc25 = 0`.
- `0x75`, focus (otherwise): `+0x9e9 = 0`. For every available `i` that is charging, set
  bit `i` and pause it. Charge `model`, even if it is not available. Set `+0xc25 = model`
  and `+0x9e9 |= 1`.

Consequences:

- An earlier pause survives focus and restore.
- A plain or Shift toggle cancels the pending restore. The next Ctrl click focuses again.
- A Ctrl click on a different model re-snapshots the focused state, so restoring yields
  the first focus.
- Ctrl on gifted-only stock pauses every owned spell.

## Browser mapping

- `app/scene-input-runtime.ts` `pointerUp` passes only exact none/Ctrl to
  `cast(..., retain)` (`app/live-command.ts`). Placement keeps none/Ctrl/Alt.
- `app/spell-charging.ts` ports the producer and consumer. `chargeFocusMask`/`chargeFocusModel`
  on `ManaTribe` hold `+0x9e9`/`+0xc25` and are checkpointed with the World. The
  legacy `world.charging` Blast flag is resynchronized from paused bit 1.
- `app/page.tsx` spell cards forward right-click modifiers. macOS Ctrl+primary
  (`contextmenu`, button 0) selects the spell, like the modifier-blind left callback.

Limits:

- Commands apply immediately. The browser does not model the one-slot-per-tick drop.
- The `0xff01` message cleanup and the `0x6d` approach cast are not ported.
- This is static evidence plus browser tests, not an original-game execution.
