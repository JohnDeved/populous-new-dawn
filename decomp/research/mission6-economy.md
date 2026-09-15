# Mission 6 autonomous construction

## Native contract

The hash-verified release executable schedules ordinary computer production before
task dispatch. Matak produces on turn 60 and Chumara on turn 61. From the imported
Mission 6 state, `004e5580` allocates the first free task with type 0, model 4,
exact-location flag 0, phase 0, and the tribe Shaman cell as its initial origin.
Allocation does not consume RNG.

On its first dispatch, `004c6da0` uses AI flag `0x20` to decide whether to replace
that origin with the coordinate latch. Matak's turn-zero `1069(208,128)` sets the
flag and latch, so its spiral center becomes `0x80d0`. Chumara's marker latch uses
flag `0x40`, so its center remains the Shaman cell `0xd094`. Attribute 30 is one for
both tribes: phase 0 consumes two RNG values before searching, first for spiral
rotation and then for tower orientation. The task searches up to 2,000 cells in
groups of 40, inserts a valid plan, selects exactly two eligible Braves, and emits
shared person command 6.

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission6-economy.py /path/to/d3dpoptb.exe
```

The probe executes the native producer and phase-0 handler. It stubs the previously
established available-person count to six and intercepts site search only; person
eligibility, terrain acceptance, plan insertion, worker movement, timber, and
completion are browser evidence.

## Live integration and boundary

`stepComputerTasks` now preserves those schedules, per-tribe queues, center choice,
RNG order, bounded spiral search, model-4 validity, two-Brave selection, command 6,
and the existing timber/construction lifecycle. The Mission 6 portable regression
and continuous Mission 4→5→6 browser check prove both tribes independently assign
workers, survive checkpoint restoration, and complete their first Guard Tower.

Explicit `BUILD_AT`/1082 occurs later (Chumara turn 501 and gated Matak turn 55).
Housing expansion, training, ordinary 1059 attacks, and command 1093 remain outside
this slice. No parity ledger status was changed for the research or integration.
