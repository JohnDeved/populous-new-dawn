# Mission 11 first autonomous settlement action

## Native contract

The first Mission 11 autonomous construction request belongs to Matak, tribe 3,
on host turn 60. `004615f0` schedules production when
`(turn + signed tribe + 1) & 63 == 0`; Chumara's first producer opportunity is
turn 61.

The raw Mission 11 header selects `cpscr022.dat` for Matak. Its turn-zero branch
sets coordinate latch `(120,216)`, packed as `0xd878`, enables ordinary computer
work, sets the active construction-task limit to four, and sets the housing target
to 20. The raw level supplies six Matak Braves and a Shaman at native
`(0x7700,0xcf00)`, coarse cell `0xce76`.

With that state, empty initial building/task lists, and Mission 11's model-4
availability, native `004e5580` returns one and allocates:

`flags=1, type=0, requested model=4, origin=0xce76, exact=0, phase=0`.

Model 4 is the Guard Tower. Allocation consumes no RNG. Existing reviewed
`004c6da0` evidence establishes that AI flag `0x20` replaces this non-exact
model-4 task's origin with coordinate latch `0xd878` for site search and dispatch.
This is a script coordinate latch, not a level-header marker.

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission11-settlement.py \
  /path/to/d3dpoptb.exe
```

The probe hashes and reads the executable, Mission 11 header, level, and both
enemy scripts directly. It executes native turn-zero PopScript and native
`004e5580`, then asserts the task record and unchanged RNG. Only the
`004f67b0` available-Brave leaf is intercepted, returning six from the supplied
raw level records; the interpreter, command handlers, producer, allocation, and
task writer execute natively.

## Live integration and boundary

Mission 11 now reuses `produceMissionBuilding`, `requestConstruction`, and
`stepComputerConstruction`. The portable regression proves both tribes request
their first Guard Towers on the native cadence, assign two Braves, and retain their
complete AI-task, worker, building-order, movement-route, and RNG state across
checkpoint migration. A restored run matches the original uninterrupted world. The
shipped Mission 10-to-11 browser check proves the same checkpoint state and both
tribes' completed, rendered Guard Towers without injecting Mission 11 entities or AI
state. Each tribe's first successful request sets a durable producer latch, so tower
loss does not create a replacement; later ordinary housing and school choices remain
outside this slice.

The first later explicit Matak `BUILD_AT` is outside this slice. It occurs in
`cpscr022` words `478..<706` on turn 253; words `617..<621` issue opcode
`1082(120,166)`. Later Mission 11 production profiles, scripted construction,
attacks, objectives, victory, and natural completion remain deferred. No parity
ledger status was changed.
