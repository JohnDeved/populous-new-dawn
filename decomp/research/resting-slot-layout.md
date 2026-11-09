# Contiguous resting-slot geometry

## Finding

The Mission 18 Armageddon battle on `622ef4cf6e9d917876213246fb1a2de2bb95c9a9`
failed during turn 44529 when `idleSlotPosition` looked up Red Brave 16567's
shape 1, slot 4 (`anchorFlags = 0x14`). This is a reachable native ownership
combination, not evidence that the saved person or its slot should be discarded.
The JavaScript shape arrays incorrectly ended at their population.

## Native contract

Existing reviewed exports, checked against original executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`:

- `decomp/generated/0042c210.c`: startup stores shapes 1 through 8 contiguously
  from `0x895efd`, each with a zero center plus its population's points. Shape
  starts in four-byte point units are `[0, 2, 5, 9, 14, 20, 27, 35]`; the backing
  storage contains 44 initialized points. The default pointer aliases shape 6.
- `decomp/generated/004d5650.c`: position lookup chooses the shape pointer, then
  adds four times the low-nibble slot. It does not clamp to population. Therefore
  shape 1/slot 4 aliases shape 2/slot 2, offset `(0, -80)`. At packed cell 1538,
  its destination is `(768, 1712)`.
- `decomp/generated/004d56f0.c`: compaction decrements every later byte when a
  slot entry is zero, including later zero entries. Those underflow to 255;
  subsequent iterations observe the mutated bytes. A solitary owner of slot 5
  becomes shape 1/slot 4. Replacing this with idealized dense numbering changes
  the original algorithm.
- `decomp/generated/004d5120.c`: slot allocation considers indices 1 through 6.
  With supported ownership, compaction retains that six-slot domain. Shape
  views only need to expose the six ownership indices plus their own initialized
  ring; no uninitialized or unrelated storage is fabricated.

The repair preserves the existing 44-point calculations and exposes slices of
that same contiguous geometry. Extra view entries refer to the initialized next
ring. Search, ownership, native byte compaction, RNG, turn ordering, and position
lookup remain unchanged. No index clamp, zero fallback, catch-and-continue, or
checkpoint-state repair is involved.

## Actual public-path evidence

The supplied campaign continuation used the shipped clock and unchanged public
commands. The accepted arena checkpoint at turn 44403 had Blue 74, Red 118,
Yellow 6. The ordinary battle eliminated Yellow at turn 44501.

The original partial terminal is preserved separately from complete checkpoints:
compressed SHA-256
`f1122e198d5ab5bc63a12c0253ef4f6747b574ba38196a17a4bcfeefdb97e85f`.
A clean-base replay of 44403 through 44528 passed full-world checkpoint-twin,
cell-chain, native-person, and ordinary-displacement guards. Advancing the next
frame reproduced both the exception and byte-identical partial turn 44529.

A second unchanged-source diagnostic traced Brave 16567's ordinary ownership:
`0x05` at turns 44524/44526, `0x65` at 44527, then `0x14` at 44528. At 44527
it was the sole remaining nonzero-slot owner of cell 1538; the other relevant
owners had zero slot flags. The next rebuild therefore counted one person and
changed its slot 5 to slot 4 exactly as the native algorithm specifies. That
trace finished byte-identical to the recovered complete 44528 checkpoint.

Raw evidence is retained under the player's `work/orchestration/m18-attrition-route/`:
`arena-resolved.json` (original failure), `recover-complete-arena-frame.json`
(recovery/reproduction), and `trace-resting-16567.json` (ownership provenance).
Diagnostic replays do not replace campaign history or rescue earlier casualties.

## Regression and evidence boundaries

`tests/resting-slot-layout.test.mjs` covers all adjacent-ring aliases within the
six-slot domain, the exact `0x14` destination, sparse native compaction, and the
state-19 destination/validity consumer using the actual failure's relevant fields.
The existing group-resting tests retain settlement, departure, lifecycle and
refresh-rate coverage. Actual checkpoint replay remains separate from these
supplied component fixtures.

`scripts/check-native-resting-slots.py` now compares all readable six-slot views
and permits the native reachable slot/population combinations in validity cases.
This correction expands the old probe's invalid assumption; no native executable
execution or emulation was performed for this repair. Static original-code evidence,
JavaScript regressions, and public-path replay are distinct claims. No new whole-game
native parity, GPU/hardware performance, or completed Mission 18 outcome is claimed.
