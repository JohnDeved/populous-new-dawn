# Browser occupant and cell-head identity domain

## Observed ordinary Mission7 failure

The fresh PR429 route at runtime d20c5e81 (equivalent to player's dcc4d6f6)
failed at turn30528 with `Unsupported computer training selection`. The verified
30417 checkpoint plus the recorded public30467 Warrior attack reproduces it.
That checkpoint SHA256 is
`f221289f30f2887925a59cbc7dd15ee34cb8920a9a50fbe07875fea67c3669c6`.
It is already corrupted and must not be repaired by editing gameplay fields.

Replaying the unchanged ordinary battle from the preserved19667 input traces
Brave33332: born27830, housed in hut156 at27890, outside again28848, then
incorrectly marked inside by a later occupancy-indicator update at30050 while
its native person remains outside resting. The stale admission slot survives
because `short(33332)` is negative and cannot match the full browser handle.
The later training selection legitimately finds the idle person, then the
browser's contradictory inside field triggers the explicit guard.

Source-bound diagnostic receipts are retained under
`work/orchestration/m7-settlement/repro-training-failure.json` and
`trace-occupancy.json`. Their failures are expected observations of the original
bug, not successful acceptance. Ordinary replay resumes from clean19667 or a
fresh world, never from the corrupted30417 or partially failed30528 state.

## Native source and live representation boundary

The retained executable reference SHA256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Static exports00407490 and00409ed0 really compare a signed occupant-slot word
with the person's unsigned native pool index. The native bounded pool is not the
browser's monotonically increasing object handle domain. Native training
004c8490 phase4 uses selector flags6 and then the selected person's existing
state owner; it does not justify filtering out a valid selected Brave.

`OccupancyWorld.occupantId` is a narrow representation adapter at the two slot
comparisons. Without it, the retained native signed-word behavior is unchanged.
The live building-entry context supplies identity decoding because its stored
slots and person Map already hold full browser handles. No modulo aliasing,
ID recycling, selection filtering, forced ejection or catch-and-continue is used.

A boundary fixture then exposed the next truncation at65536: live object-cell
heads were Uint16Array even though object Maps and next/previous links used full
handles. The pure object-cell interface accepts native Uint16 fixtures or live
Float64 heads. Live allocation uses Float64 so every safe-integer browser handle
remains exact, including values beyond32 bits. Coordinate/displacement arithmetic
and cell traversal order are unchanged.

Legacy checkpoint migration copies intact Uint16 heads to Float64 without
rebuilding or reordering cell chains. Structured cloning and IndexedDB retain
the typed array and shared object references. This cannot recover a legacy chain
that an old runtime had already truncated, and does not claim to repair such
saves. Native fixture storage remains Uint16; this is a browser representation
repair, not a claim that the original executable used wide cell heads.

## Regression scope

`tests/occupant-handle-domain.test.mjs` supplies allocation-boundary IDs, then
uses actual public hut entry, exit, school entry and checkpoint continuation.
It covers32767/32768/65535/65536, exact distinct33332/98868 occupant slots,
native default signed comparison, same-cell/cross-cell linked order, full cell
handles through2^32, and intact legacy migration without reordered identity.
These controlled boundaries supplement, rather than replace, the ordinary M7
battle requalification. Full runtime gates and new-source route receipts must
be recorded after this repair; earlier d20c5e81 acceptance is historical only.
