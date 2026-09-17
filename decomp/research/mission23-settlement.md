# Mission 23 first enemy settlements

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

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission23-settlement.py \
  /path/to/d3dpoptb.exe
```

The non-recording check hashes the executable and Mission 23 inputs, executes
native initialization and producer code, and verifies task fields and RNG. It
supplies only the authored Shaman base cell and six available Braves for the
first requests. The post-Tower cases supply one completed Tower and building
availability, then execute `004f6020` against a distinct current-base sentinel.

## Live integration and boundary

Mission 23 reuses the existing browser producer and construction task. The
portable regression proves both native-cadence request cycles, ordinary worker
assignment and completion, and exact checkpoint continuation through turn 1500.
The second cycle completes Green and Red Huts plus Yellow's Boat House while
preserving all three Towers. The rendered browser check covers the same six
completed buildings through the shipped Mission 23 path.

The shared model-13 construction path needs no Mission-specific shoreline rule.
The complete native `0044ee50` comparison covers shore masks without intercepted
decision helpers. Mission 23's ordinary search accepts Yellow's Boat House at
cell `0x46ca`, orientation 1, after 127 candidates; shared validity returns true
with zero feedback flags. Its dock cells are land with non-land within radius 2.

The browser deliberately stops once each tribe has its first post-Tower task,
plan, or building. If that object is lost, a later producer cadence may retry;
this is a bounded integration guard, not a claimed native one-shot latch.

Natural school construction and specialist training are not established: all
authored school targets are zero. No nonzero attack is proved reachable from this
slice. The earliest static candidate is Green script word 1060 on turn 1405, but
it requires more than five Warriors and more than five Firewarriors plus census
and mana gates. Recurrent housing, Boat production and transport, training
reachability, attacks, combat, and natural outcome remain separate work. No
parity ledger status changed.
