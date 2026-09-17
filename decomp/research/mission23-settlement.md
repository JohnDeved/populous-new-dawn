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

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission23-settlement.py \
  /path/to/d3dpoptb.exe
```

The non-recording check hashes the executable and Mission 23 inputs, executes
native initialization and producer code, and verifies task fields and RNG. It
supplies only the authored Shaman base cell, six available Braves, and, for the
post-Tower boundary, one completed Tower plus building availability.

## Live integration and boundary

Mission 23 reuses the existing browser producer and construction task. The
portable regression proves the three requests on native turns, ordinary worker
assignment and Tower completion, and exact checkpoint continuation through turn
1000. The rendered browser check covers the same completed enemy Towers through
the shipped Mission 23 path.

The integration stops after each tribe's first Tower. A controlled native rerun
chooses a Hut for Red and Green but a model-13 Boat Hut for Yellow. Model-13 AI
construction is not yet bound, so allowing the browser's current generic Hut
fallback would be incorrect.

Natural school construction and specialist training are not established: all
authored school targets are zero. No nonzero attack is proved reachable from this
slice. The earliest static candidate is Green script word 1060 on turn 1405, but
it requires more than five Warriors and more than five Firewarriors plus census
and mana gates. Later housing/Boat Hut production, training reachability, attacks,
combat, and natural outcome remain separate work. No parity ledger status changed.
