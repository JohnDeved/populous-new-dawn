# Native default input-binding atlas

Static, read-only decode of every default key/mouse binding in the original
`d3dpoptb.exe` (SHA-256 `3a5065c7…dfbe4f`, pinned in `decomp/tools.json`) and the
`process_cmd` case each bound action reaches. The executable is read as data; it
is never executed or emulated. Regenerate and compare before replacing:

```sh
python3 -B scripts/native-input-bindings.py "$POPULOUS_EXE" > /tmp/bindings.json
python3 -B scripts/native-input-bindings.py "$POPULOUS_EXE" --markdown > /tmp/bindings.md
diff /tmp/bindings.json decomp/research/native-input-bindings/bindings.json
# Quick lookups during research (key label, key code or action):
python3 -B scripts/native-input-bindings.py "$POPULOUS_EXE" --markdown --key d --key 0x96
```

- [bindings.md](bindings.md): one row per default record (188), with the decoded chord,
  event, action, predicate, gate flags, resolved case and a short pseudocode excerpt.
- [bindings.json](bindings.json): the same data plus the source/dispatch provenance.

Portable regression: `node --test tests/native-input-bindings.test.mjs` (synthetic bytes
only; no original input).

## Recovered structure

- **Defaults.** `004f1820` pushes `005d5de8` and calls the binding constructor
  `00489300` (`004f1868`; byte-verified). It then optionally loads saved `key_def.dat`
  overrides, which this atlas does not read.
- **12-byte record.** Byte 0 is the key; a zero key terminates the table. Bytes 1–4 hold the
  action. Byte 5 holds the flags: `0x08` = DirectInput scancode, `0x10` = character translated
  by `00401a90`, `0x02` = continuous/held list at `+0x400`, `0x01` = press, `0x04` = release.
  Byte 6 is the modifier mask, byte 7 the gate flags, and bytes 8–11 the predicate.
- **Mouse pseudo-keys.** The DirectInput mouse producer
  (`original-startup-movies/input-player/mouse-producer.asm`) emits `0xf0` for left,
  `0xf1` for right and `0xf2` for buttons 2/3.
- **Modifiers.** `004a9d90` collapses Shift (`2a`/`36`) to 1, Ctrl (`1d`/`9d`) to 2 and
  Alt (`38`/`b8`) to 4. It passes event 1 on press and 4 on release. Matcher `00489470`
  requires `mask & 7` and ignores `(mask >> 3) & 7`; bit `0x40` accepts any modifiers.
  It walks each key's records in table order and returns the first one whose event,
  modifiers, gate and predicate pass.
- **Dispatch.** `process_cmd` (`004aab80`) has two byte-indexed switches.
  - Stage 1 handles actions `0x0d`–`0xce`: index `004ad740`, jump `004ad5c4`.
  - Its default (`004aabd1`) clears edi and enters stage 2 at `004abbe2`. Stage 2 handles
    actions `0x0f`–`0xc6` (index `004ad8dc`, jump `004ad814`) and runs only while byte
    `0089c661 & 2` is clear.
  - A stage-1 case that jumps straight to `004abbe2` exits with edi = 1, so it is a no-op
    there.
  - Continuous camera actions `0x01`–`0x06` and `0xc7`–`0xca` are not dispatched by
    `process_cmd`.
- **Shadowed records.** Three default records can never match because an earlier record
  with the same key, event, modifiers and gate has no predicate:
  - Ctrl+F6 → `0x3a`
  - Ctrl+F7 → `0x3b`
  - table Enter → `0x9c`

  The modal paths in `004a9d90` (for example the `0089bb81` dialog states) bypass this
  table; their Enter handling is separate.

## Original bindings that answer open browser issues

| Original input | Action → recovered case | Browser today (main `532cd9ef`) | Issue |
| --- | --- | --- | --- |
| Period | `0x5d`: if the player's Shaman exists, queue chunk `0x16` with Shaman cell + tribe angle | no binding | #1006 |
| H | `0x96`: queue chunk `0x16` with tribe `+0x911`/`+0x913` + tribe angle | selects the Shaman | #1006 |
| Shift+Enter, Ctrl+Enter | `0xc5` (separate case from plain Enter `0x15`) | same as Enter | #1006 |
| D | `0xc0`: `set_tribe_command(tribe, 0x7e, 0, 0)` | camera pan right (port alias) | #1004 |
| Shift+1…6 | `0x84`–`0x89`: `FUN_0047c350(slot, 0, 0, 0)` | spells | #1005 |
| 1…6 (Ctrl ignored, predicate `004fee90`) | `0x8a`–`0x8f`: `FUN_0047c350(slot, 1, 0, ctrlUp)` | spells | #1005 |
| Alt+1…6 (Ctrl ignored, predicate `004fee90`) | `0x90`–`0x95`: `FUN_0047c350(slot, 1, 1, ctrlUp)` | none (Alt rejected) | #1005 |
| Shift+Backspace | `0x98`: `FUN_0047c350(0, 1, 0, 0)` | none | #1005 |
| G | `0xc1`: `set_tribe_command(tribe, 0x82, FUN_004999d0(0))` | guard Shaman | #1010 (meaning of command `0x82` not established) |
| B | `0xbf`: `set_tribe_command(tribe, 0x7c, 0, 0)` + message | open buildings tab | — |
| Ctrl+left release | `0x7f` (Spy/queued order family) | see #1007/#1008 | #1007/#1008 |
| Shift+right release | `0x79`, `0x7a` (predicates `004ff2d0`/`004ff360`), `0xb3` | see #1011 | #1003/#1011 |
| F, W, A, S, Q, E camera aliases | no default original binding for F/W/Q/E; original A → `0xa0`/`0xa1`/`0xa2` flags, S → `0x63` | browser camera/focus | port additions |

`ctrlUp` is 0 while either Ctrl key is held. The case reads the key-down/key-up arrays
`00984591`/`00984691` at Ctrl scancodes `1d`/`9d`, which `004a9d90` maintains.

`+0x911` is the reincarnation-site cell centre:
- `00477890` allocates each tribe's starting people at `+0x911`.
- `004da0f0(7, tribe, +0x911, 0)` creates the site object at `+0x89d`.
- `00419810` re-derives `+0x911` from that object's position (`+0x3d`), snapped to the
  cell centre.
- `00475a70` uses `+0x911` instead of the Shaman position when the Shaman is absent.

## Limits

- **Defaults only.** Saved `key_def.dat` overrides, predicate semantics, gate-flag
  meanings beyond the matcher tests (bit 0 checks a per-player mask while `0089c661 & 8`;
  bit 1 requires `0089c662 & 0x80`) and downstream command behavior are not established.
- **Character labels.** Character keys are labelled by their ASCII code; runtime
  translation through `00401a90` depends on the keyboard layout.
- **Pseudocode excerpts.** These come from the retained Ghidra 12.1.3 export
  (`decomp/generated/004aab80.c`, hash recorded in `bindings.json`). They are inferred
  pseudocode, not recovered source.
- **Chunk `0x16`.** Its consumer, which owns the resulting camera motion, is not identified
  here.
- **Evidence type.** This is static evidence. It is not an original-game execution,
  browser acceptance or parity claim.
