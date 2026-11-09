# Original Game options: bounded keyboard adapter

Static audit of the hash-pinned supplied `D3DPopTB.exe` using GNU objdump 2.44.
No original executable, native routine, emulator, or popup probe was executed.
Original source checkout: `fbba0a924ccaade080bfd7ec1ed2259aec98f824` (clean).
Input/source hashes and raw disassembly are retained in this directory.

The raw commands were:

```
objdump -d -Mintel --start-address=0x4c4e00 --stop-address=0x4c4f40 EXE
objdump -d -Mintel --start-address=0x4999a0 --stop-address=0x499aa0 EXE
```

Both completed exit 0. `EXE` is the executable identified by `input-hashes.txt`.
Reuse `../options-menu-static/` for descriptors, native layout, text formats,
font state, and menu dispatch; the new disassembly supplies only getter/setter bits.

## Five rows

Game is menu 13/state 0. Each row is one centered `%s : <%s>` string, style 2,
with x=320 at reference 640x480. Native fixed-point truncation gives y=139,169,
199,229,259. Frontend FEFT33WE/FEHI33WE and in-game F00T9 remain separate skins.
In-game ordinary text alpha is 2/3, focus/highlight is 1. The selected Game
category is the noninteractive low-state heading.

| Row | Descriptor / language ID | Getter / setter | Word 00895da8 semantics |
| --- | --- | --- | --- |
| Tooltips | 005d8f74 / 417 | 004c4e00 / 004c4e20 | 0x40000 set=Scrolling (433), clear=Expanded (432) |
| Rotation | 005d90a0 / 425 | 004c4e40 / 004c4e60 | 0x200000 set=Control Cursor (427), clear=Cursor (426) |
| Flip Rotation | 005d9190 / 428 | 004c4e80 / 004c4ea0 | 0x80000 set=Yes (235), clear=No (236) |
| Stay Selected | 005d91c8 / 429 | 004c4ec0 / 004c4ee0 | 0x100000 clear=On (233), set=Off (234), intentionally inverted |
| Autocast Spell | 005d9200 / 430 | 004c4f00 / 004c4f20 | 0x20000 set=On (233), clear=Off (234) |

Type 10 increments/wraps the initialized value index and calls descriptor+0x38.
Type 11 flips boolean 0/1 and calls descriptor+0x34. This supports one centered
cycling button per supported row rather than an invented checkbox column.

## Existing camera contract and live bridge

Retained `decomp/generated/004ae200.c` and `scripts/check-native-navigation.py`
already specify the command behavior used by `app/camera-input.ts`:

- Rotation swaps commands 3/4 with 5/6. Ctrl performs the same swap; both cancel.
- Flip Rotation reverses rotation outputs 0x10/0x20 after the swap.
- Overview converts rotation to sideways outputs before Flip is consulted.
- Fixed aliases 199..202 bypass Rotation/Ctrl swap but still honor Flip when turning.
- Shift accelerates pan only. Edge scrolling and pointer drag retain separate paths.

The live `navigationButtons` caller now passes the two browser preferences to
that existing helper. It retains all previous input-mask, overview-transition,
modal, edge, drag-button and duplicate-direction behavior. The existing native
comparison script was inspected, not executed for this slice; do not describe
portable caller tests as a new native CPU pass.

## Browser integration and limits

`app/game-preferences.ts` stores only Rotation and Flip in a versioned independent
browser record. Reads never overwrite unsupported/corrupt data; explicit valid
changes write. Storage failures preserve session behavior and display a notice.
Cursor/No defaults preserve prior browser behavior. Original installed defaults
and native persistence have not been proved.

Page owns current choices and a current-value ref. Existing scenes receive changes
without recreation. New scenes receive the ref immediately after construction,
before start, including asynchronous imports. Preferences never enter simulation,
profile, or checkpoint schemas. Stable row IDs retain DOM button identity when
labels change. Both skins and frontend shadow inputs use the same current row text.
Compatibility help describes the active arrow/Delete mapping and keyboard-only Flip.

Tooltips, Stay Selected and Autocast Spell display `<Unavailable>` as an explicit
browser adaptation. They are not controls. Getter/setter bits alone do not prove
scrolling-tooltip timing/layout, exact selection consumers, or casting behavior.
Those consumers, native defaults/persistence, and full native runtime/frame
comparison remain separate bounded research. No gameplay, spell, AI, or campaign
rules are changed here.
