# Mission 3 Swarm building feasibility: failed model trace, accepted partial observations

The single bounded trace **FAILED** at turn 5864 when the original Shaman reached
zero HP. It nevertheless retained eight qualified Temple occupancy/stock/range
samples. Independent review accepts those partial findings; it does not turn the
run into a pass or establish an ordinary Swarm building encounter. Issue #61 remains open.

The unchanged [trace source](../../../qa/mission3-swarm/building-feasibility.mjs)
ran at clean `8cff0e24fdb4277268eaadb7c6ba1e9e3ea59b6a`, based on main
`d6cf109474379172728a3ccebf46ef72a15f3a58`. The command was
`timeout 90s taskset -c 4 node qa/mission3-swarm/building-feasibility.mjs`.
It ran from 10:08:51.985 to 10:09:03.336 UTC on 2026-10-09, exited 1, and
retained 337 sample rows among 345 JSONL records. It hit neither the 90-second
timeout nor the 16 MiB output cap. Source and all 33 input hashes were unchanged.

## Useful retained boundaries

- Turn 372: the model accepts command 33 to Vault 92 for selected Blue Shaman 46
  at 100 HP. Its readiness is false and input mask is 64. Prior ordinary05 had
  public Skip and mask 0; matching its command turn does not replay that UI episode.
- Turn 1403: Temple knowledge and one Swarm charge; the fixed staging move is
  accepted. Turn 1452: the strict native arrival transition completes at
  `(-31.7109375,-116.4140625)` with Shaman HP 100.
- Yellow Temple 1022 completes at retained turn 2098. At turns **2121, 2122,
  2124, 2125, 2128, 2175, 2176 and 2240**, admission class 2/model 5/tribe 2
  contains physical slot 0 = person 2631. The living 50 HP Brave's `entry.person`
  has matching ID, class 1/model 2/tribe 2 and building 1022. At every retained
  qualified sample, the Shaman has HP 100 and two charges. The range to the single
  diagnostic impact `(-43,-107)` is 5952, distance 3763, margin 2189 native units.
  The Temple slot is empty again in the retained turn-2252 sample.
- First retained Shaman damage is turn 5245; final samples show HP 0.25 at 5862
  and HP 0 at 5864. The trace lacks a complete attacker history and names no killer.

## Limits and next source prerequisite

No player Swarm was cast. These are eight retained model observations, not a
continuous browser interval, selected native target, pursuit, insect entry,
ejection or sufficient-lifetime proof. Every actual port class-2 prefix is empty
and `predictedTarget` stays null. The port lacks the required mixed-class list
ownership, and its building roster omits the separately represented neutral Vault.
Building origins, entrances and footprints cannot replace native list membership.

Fourteen distinct Yellow resident/building pairs have real physical slots and
living `Unit.inside` links but no `entry.person` or `native` owner. These are port
residents, not empty Huts; they do not qualify as fully owned native-person targets.
The actual removal context falls back to constructing person defaults, which
does not preserve the prior native state, flags or command queue. Resolve that
ownership/lifetime contract and class-2 membership/order before further integration.
A longer wait, relaxed predicate or repeated route would not resolve those gaps.

No new browser/native execution, checkpoint, rendered pixels, audio, performance
or parity credit accompanies this closeout. Raw logs, archives and private profiles
are not published. [summary.json](summary.json) retains exact artifact hashes,
all eight qualified rows, the first ownerless Hut records and review references.

## Independent review pins

- Source ACCEPT: `/tmp/issue61-building-feasibility-8cff0e2-review-20261009.md`,
  SHA256 `9b299af5b78bc3e4afcb6c9fb43f499fd4488304a68855a942e71710aefab401`.
- Result: accepted partial observations with the run remaining FAILED:
  `/tmp/issue61-building-feasibility-01-result-review-20261009.md`,
  SHA256 `7130da09055c1c86bfa08a94ab73acbd4f13651abe1262970344c97c449cfff1`.
- Independent extracted facts:
  `/tmp/issue61-building-feasibility-01-independent-facts.json`,
  SHA256 `faedd44f2a562e9d3c8e2b6f5116611831ebb9eace68117696c1549634315ad2`.

These paths identify local retained review inputs; the committed summary preserves
their bounded conclusions and hashes without representing the paths as hosted artifacts.
