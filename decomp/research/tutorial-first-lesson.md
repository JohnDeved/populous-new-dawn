# Tutorial first lesson

## Native boundary

The retained [Tutorial entry note](tutorial-entry.md) proves the Tutorial control loads
level 79, `LEVL2079`, and `CPATR057`/`CPSCR057` through a fresh initializer rather
than campaign profile 79. CPSCR057 starts all 64 variables at zero; variable 9 is
the opening lesson stage.

The original stage sequence is:

1. Stage 0 emits type-1 message 17, calls command 1143 with value 2, marks the
   message through 1187, and sets stage 1.
2. Stage 1 emits World View message 137, marks it through 1187, and sets stage 2.
3. Every 63 turns at offset 3, opcode 1139 samples whether native `draw_mode` is 2.
   Its result flows through variables 8 and 7; variable 53 retains the preceding
   overview sample on that branch.
4. Stage 2 advances only after the sampled mode is no longer 2. It emits message
   135 (edge scrolling and cursor-key rotation), marks it through 1187, and sets
   stage 3.

The ordinary native overview owner at `00418890` leaves World View through process
command `0x15`; the authored message names right-click or Return. The browser's
existing Enter-to-overview action is therefore the bounded live input owner. No
script variable needs to be injected.

Opcode 1143 value 2 selects UI record type `0x28` and calls `0044bb60`; reviewed
export [00492d20.c](../generated/00492d20.c) preserves the three-way UI-record
selection. The browser has no separate equivalent record, so this presentation-only
call is a bounded no-op while the original messages remain live.

## Fresh state, restart, and limits

A fresh start or restart rebuilds level 79/script 57 with stage 0 and World View
mode 2. A future Tutorial checkpoint would need to retain the simulation turn,
variables 7/8/9/53, and overview mode/transition. The delivered opening slice instead
disables Tutorial checkpoint saving so it cannot overwrite the campaign checkpoint.

Later Tutorial trigger heads, lessons, original completion presentation, raw Windows
input production, and the exact Escape/menu callback remain unported. The original
completion script eventually uses opcode 1170's forced-win flag after its final head
condition; that does not make the opening slice a complete Tutorial.

## Provenance

- EXE SHA256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
- LEVL2079 DAT/HDR: `22bd7ec9...1068d8` / `58a80720...40f641`
- CPATR057/CPSCR057: `6f17daf7...5d52c7` / `cdb5d7ab...d3603`
- LANG00: `e826c478...06f7d`
- Ghidra 12.1.3 export command:
  `python3 scripts/decomp.py export 00492d20 --output <ignored-task-dir>`

The Ghidra pseudocode is byte-linked evidence, not recovered source. File I/O,
presentation/audio, raw OS input, full Tutorial scripting, and original save/result
serialization were not executed.
