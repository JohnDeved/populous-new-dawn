# Quick camera shortcuts: period and H (#1006)

Static research, 2026-11-14. Original `d3dpoptb.exe` SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` (pinned in
`decomp/tools.json`) was read as data only; it was never executed. Function bodies
cite the retained Ghidra 12.1.3 exports in `decomp/generated/`; pseudocode types and
names are inferred, not recovered source.

## Default bindings

- `004f1820` passes the default record table `0x5d5de8` to the binding constructor
  `00489300` (call at `004f1868`), before loading the optional `key_def.dat`. The
  record format, modifier collapse (`004a9d90`), matcher (`00489470`) and the full
  decoded table are documented by the binding atlas in
  `decomp/research/native-input-bindings/README.md` (PR #1030). They are not
  duplicated here.
- Record `005d622c`: scancode `0x34` (DIK_PERIOD), press, modifier byte `0`, gate
  flags `0`, no predicate → action `0x5d`. Dispatched by `process_cmd` stage 1
  (case `004ab44b`).
- Record `005d63a0`: character `'h'`, press, modifier byte `0`, gate flags `1`, no
  predicate → action `0x96`. Dispatched by stage 2 (case `004ad0e0`), which runs only
  while `0089c661 & 2` is clear. Matcher gate bit 0 checks a per-player mask while
  `0089c661 & 8` is set.

Both records require an exact empty modifier set, so Shift/Ctrl/Alt variants do not
match. These are defaults only; a saved `key_def.dat` can replace them.

## Actions

`process_cmd` (`004aab80`, `decomp/generated/004aab80.c`):

- `0x5d`: reads `tribes_array[player].shaman`. Only when it is non-null does it
  queue rddata chunk `0x16` with the Shaman's cell (high-byte X/Y, `& 0xfefe`) and
  the tribe angle. This is the cell, not the exact position. There is no HOME fallback, selection change, or tribe command.
- `0x96`: queues the same chunk `0x16` from tribe fields `+0x911/+0x913`
  (high bytes, low bit cleared) and the tribe angle.

## Identity of tribe `+0x911`

- `00477890` allocates the level's initial people with `alloc_unit(1, …, tribe+0x911)`.
  It also creates the tribe's `+0x89d` site object with
  `FUN_004da0f0(7, tribe, tribe+0x911, 0)`.
- `00419810` copies the `+0x89d` object's position (`+0x3d`) into `+0x911`,
  snapping each axis to the cell centre (`& 0xfe00 | 0x100`).
- `00475a70` uses `+0x911/+0x915` instead of the Shaman position while
  `game_state+4` bit `0x20` is set. The meaning of that bit is not established here.

Together these are consistent with `+0x911` being the reincarnation-site cell centre.
This is inferred: `004da0f0`'s class-7 object identity is not exported. The browser
holds the same cell-centred value in `world.reincarnationSites[tribe]`.

## Browser mapping and limits

`app/quick-camera-shortcuts.ts` maps period to the live player Shaman and `h` to the
player reincarnation site. It uses the existing animated camera focus owner, and
both keys stay behind the Page keyboard gates. H no longer selects the Shaman.

Not recovered:

- The recovered chunk `0x16` consumer is described below. The browser now centers
  the Shaman target cell, retaining its existing current-angle animated focus.
  Shared native tribe-angle ownership and the meaning of the consumer's cleanup
  remain separate. The existing focus owner's `mode = null` reset cancels an
  armed spell or building placement; this patch does not change that behavior.
- The gates are not modelled. H's gate flag `1` (per-player mask while
  `0089c661 & 8`) and its stage-2 gate (`0089c661 & 2` clear) have unestablished
  meanings, so the browser applies only its own Page keyboard gates.
- When the native Shaman pointer clears (death or vehicle occupancy) is not proven.
  The browser treats a dead or ghost Shaman as absent.
- Shift+Return instant overview is documented in [instant-overview.md](instant-overview.md).


## Chunk 0x16 cell target (16 November 2026)

Read-only original-byte inspection reverified executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
GNU objdump disassembly and independent PE mapping resolve the consumer's
byte-indexed dispatch: byte `0043e2b4 + (0x16 - 5)` is 9, and jump-table entry
`0043e268 + 9 * 4` is `0043e041`. This is static evidence, not native execution.

At `0043e041..0043e079`, each packed coordinate byte is masked with `0xfe`,
incremented, then shifted left eight bits. Thus an original coordinate becomes
`(coordinate & 0xfe00) | 0x100`. The consumer emits cue 222 and passes the chunk's
angle to `00417ca0`; its immediate argument is false for command `0x16` (true
only for `0x4d`). With a changed target/angle, that path invokes the existing
smooth planner `00417d80`. An already-active identical target/angle skips
replanning, but still reaches cleanup. Independent byte review confirmed these
boundaries; the historical camera-motion harness remains separate execution
evidence and was not rerun for this change.

The bounded browser correction changes only Period's resolved target from the
exact live Shaman position to this native cell center. It does not introduce a
new camera owner or alter H, input gates, selection, commands, cue playback,
angle ownership or camera timing. Failure-first fixed-coordinate tests cover
cell edges and signed/wrapped seams; the actual Page-handler test uses an
off-center Shaman and retains the animated-focus call. These are source/handler
tests, not rendered-key evidence, native trajectory parity, or full #1006 closure.
