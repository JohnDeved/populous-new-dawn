# Mission 23 enemy settlements and housing growth

## Native contract

Mission 23's header selects `cpscr023.dat`, `cpscr024.dat`, and `cpscr018.dat`
for enemy tribes 1, 2, and 3. Each starts with six Braves, one Shaman, and no
buildings. Native turn-zero initialization gives all three a construction-task
limit of four, a housing target of 18, and zero school targets.

Shared scheduler `004615f0` calls ordinary producer `004e5580` when
`(turn + signed tribe + 1) & 63 == 0`. The first requests are therefore Green
on turn 60, Yellow on turn 61, and Red on turn 62:

| Tribe | Shaman cell | First task |
| --- | ---: | --- |
| 3 / Green | `0xa684` | type 0, model 4, exact 0, phase 0 |
| 2 / Yellow | `0x66ce` | type 0, model 4, exact 0, phase 0 |
| 1 / Red | `0x0a08` | type 0, model 4, exact 0, phase 0 |

Model 4 is the Guard Tower. Each allocation leaves RNG unchanged. AI flag
`0x20` makes the shared construction dispatcher use the tribe's authored
coordinate latch for its later site search: Red `0xfc40`, Yellow `0x44bc`, and
Green `0xa89a`.

After an accepted Tower establishes the tribe's current base, the next scheduler
visits request Green model-1 Hut on turn 124, Yellow model-13 Boat House on turn
125, and Red model-1 Hut on turn 126. Each task again has `flags=1`, type 0,
exact 0, phase 0, and unchanged allocation RNG. `004f6020` returns the current
base cell from `ai+0x36a`; it does not retain the initial Shaman cell. Yellow's
authored attribute 35 target of one selects model 13 before housing, while Red
and Green fall through to housing below their target of 18. Native has no
one-shot latch for this recurrent producer.

With those first two buildings supplied as complete, the third visits request
model-1 Huts for Green on turn 188, Yellow on turn 189, and Red on turn 190.
Each again uses the current base and has `flags=1`, type 0, exact 0, phase 0,
and unchanged allocation RNG. Yellow's native model count sees its one Boat
House, satisfies attribute 35, and falls through to housing. At native housing
capacity 18, the producer returns without a task or RNG change.

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission23-settlement.py \
  /path/to/d3dpoptb.exe
```

The non-recording check hashes the executable and Mission 23 inputs, executes
native initialization and producer code, and verifies all three request cycles,
the capacity stop, task fields, and RNG. It supplies the authored Shaman base
cell and six available Braves for the first requests. Later cases supply linked
completed-building records and execute native model/housing counts plus
`004f6020` against a distinct current-base sentinel.

## Live integration and boundary

Mission 23 reuses the existing browser producer, construction task, Hut
admission, and birth controller. A checkpoint before the third requests resumes
identically through turn 2713. The third cycle adds one Hut per tribe; ordinary
cadences then reach six completed Huts per tribe. The Tower plus those Huts give
live housing 19: the strict below-target check requests the final three-capacity
Hut from 16, then stops above the authored target 18. Yellow produces its first
natural new Brave on turn 967. At turn 2585 all construction tasks are idle, and
another 128 turns create no task or building. The rendered browser check covers
the same completed settlements and grown populations through the shipped
Mission 22 continuation.

The shared model-13 construction path needs no Mission-specific shoreline rule.
The complete native `0044ee50` comparison covers shore masks without intercepted
decision helpers. Mission 23's ordinary search accepts Yellow's Boat House at
cell `0x46ca`, orientation 1, after 127 candidates; shared validity returns true
with zero feedback flags. Its dock cells are land with non-land within radius 2.

Boat production was investigated but not invented. Native scheduler task `0x11`
only runs after a person already has a retained cross-water goal, and task `0x13`
only runs from an occupied vehicle. Neither staffs the first Boat House nor
authors that goal; a live turn-2500 Mission 23 state has a completed empty Yellow
Boat House with no vehicle task. That dependency remains open.

Natural school construction and specialist training are not established: all
authored school targets are zero. No nonzero attack is proved reachable from this
slice. The earliest static candidate is Green script word 1060 on turn 1405, but
it requires more than five Warriors and more than five Firewarriors plus census
and mana gates. Boat staffing/transport, training reachability, attacks, combat,
and natural outcome remain separate work. No parity ledger status changed.
