# Source-only model feasibility proposal

Base: main `d6cf109474379172728a3ccebf46ef72a15f3a58`. Not executed. No product files change.

One `createWorld(3)`, at most 6,000 total `tick(1/12)` turns. At turn 256 use the
established selected-Shaman Vault command; once Temple knowledge is earned, issue
only PR281's fixed staging move and require its native arrival/idle transition.
Observe through the same global cap. No casts, alternate routes, state/stock/HP/
occupancy assignments, input-mask clearing, seed sweeps, browser or native runs.
Command APIs are model-level actions. Input-mask state is retained as observed;
their acceptance does not prove browser input eligibility or Skip/readiness.

Retain JSON lines through the existing command-receipt runner. Each categorical
health/stock/range/occupancy transition and each 64-turn sample includes actual
geometry, admissions, six physical slots and live unit/person cross-checks.
The single prospective impact is PR281 ordinary05's actual snapped `(-43,-107)`;
its real target was Brave 53. No building acquisition is inferred from that run.
Range uses the shipped pure range/terrain/distance leaves without synchronizing
or mutating the observed World. It is diagnostic, not a screen pick or cast.

The expected scan lists `spiralCell(originCell,index,0)` for indices 0..166, without
an extra center visit, and reads actual port `objectCells` chains in that order.
It applies only class 2, other tribe and empty initial history. No occupancy,
model, completion, HP or diplomacy filter is added. A port class-2 prefix is
retained, but predicted target is always null: the port has no class-2 list
producer, and `syncLivePersonCells` removes non-person entries. Building model
origins, entrances, footprint registrations
and admission records remain separate facts, never substitute memberships.
The joint observation means only an occupied enemy exists while the arrived
Shaman has charged Swarm and range to the fixed diagnostic origin. It does not
mean that building is selected or reachable before the 200-visit lifetime ends.

Static input: stationary `work/orchestration/swarm-building-static-20261009-01/`
`findings.md`, SHA256 `6b5a4811593aca3b9c1090f427c94a604c0cd236dc316f6b2c33a05a388eb87c`;
`manifest.json`, SHA256 `a09a9ac4b78af79dfdd84f839ba036786bbb1ff957e9c518cc3aa44a30226b99`.
Independent static acceptance and this script's source review are prerequisites.

Proposed execution, only after coordinator admission in the stationary dependency
lane: existing `scripts/orchestration/command-receipt.mjs`, fresh output
`work/orchestration/issue61-building-feasibility-01/receipt.json`, command
`timeout 90s taskset -c 4 node qa/mission3-swarm/building-feasibility.mjs`.
No dependencies may be copied, linked or installed. Runner exit zero means only
the bounded trace completed; `jointSamples=0` is a retained feasibility miss.
Timeout/failure leaves the raw emitted prefix in the runner's artifact logs.

Freeze inputs: both new proposal files, the two static inputs above, and existing
`scripts/local-render/mission3-swarm.mjs`, `mission1-vault-arrival.mjs`,
`scripts/mission3-natural-preacher-scenario.mjs`, `scripts/orchestration/command-receipt.mjs`.
The exact clean Git head binds all imported application/JSON source, especially
`app/model.ts`, `world-initialization.ts`, `world-state.ts`, `live-command.ts`,
`selection-runtime.ts`, `building-shapes.ts`, `live-building-entry.ts`,
`building-occupants.ts`, `computer-runtime.ts`, `native-math.ts`, `native-terrain.ts`,
`object-cells.ts`, `person-orders.ts`, `person-idle.ts`, `spell-casting.ts`,
`world-types.ts`, `level-three.ts`, `original-rules.json` and `original-shapes.json`.

No checkpoint is created. PR281 ordinary05 had null checkpoint at start and end;
its owned profile is not a resumable save. Future public Save/Load would require
its own reviewed target summary, typed committed readback and harness cleanup;
changed application bytes require a fresh profile. No runtime/browser proposal
is admitted by this model-planning document.
