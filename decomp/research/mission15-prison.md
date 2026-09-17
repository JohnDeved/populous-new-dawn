# Mission 15 Prison native findings

## Packet scope and provenance

Bounded question: Mission 15 class-2/model-19 Prison initialization, captive Blue Shaman, follower attack/destruction/release, timer `1200(450)`, command 1223, and expiry versus rescue. Later Mission 15 AI was not inspected. Existing indexed exports/findings were checked before export; the Prison-specific predicate, timer setters/query, state-42 initializer, command-1064 scheduler, and Prison removal routine were absent as reviewed exports.

Research base was commit `5f5b829a6b7db17799840dcf29892a7c9cbb6933`. User-supplied executable `d3dpoptb.exe` SHA-256 is `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. Inputs: `levl2015.dat` `abbb134fe40b142b0946b49f72fea829b30ca2a535daad4b23f962158547fdcf`, `levl2015.hdr` `049c95ca300efa49f47f58f4fe517d51a1732fbf6e1abec1f54d68a71cc8aafe`, `cpscr075.dat` `c9c1f0c79da1bbb6153f1ca76103a9eb4723e5d740a3db8cc1f302ebb6fb217a`. The supplying setup archive is `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.

## Authored initialization and captive state

- Level object 168 is class 2/model 19/owner 2 at native `(29696,4608)`, browser `(108,-26)`. Object 169 is Blue class 1/model 7/owner 0 at `(29952,4864)`, browser `(109,-27)`. Marker 8 is packed cell `0x1274`, the Prison/Shaman cell.
- Real completed-building initializer `004030c0` leaves the Prison class/model/state/substate `[2,19,2,0]`, owner 2, stage 4, building flags `0x8`, damage 0, occupants 0, and anchor unchanged. The probe's adjacent sentinel remained byte-identical.
- `00419880` detects an adjacent model-19 building, saves the Shaman's previous state, enters state 42, sets tribe flag `0x10000`, and reveals the site. `004e2770` initializes state 42: substate 0; flags2 becomes original OR `0x40310200` then loses `0x4000` when related to a Prison; flags4 becomes `(original & 0xfffefff8)|0x184`; `+0x89` receives current-cell building id 168; `+0x72` receives Prison cell `0x1274`. Class/model/owner and exact position are unchanged. `004e2fe0` is a captive hold/wander controller, not normal availability.
- Model 19 is tracked specially by tribe-list rebuild `004ecac0`: active model-19 objects set global pointer `0x008922e8` and are excluded from ordinary building lists/counts. `00499960` returns only whether that pointer is non-null. Script command 1223 (`0048cc60`, case `0xc3`) stores this boolean; it is not a generic building-count result.

## Attack, destruction, and release

- Person building-target phases `0051a2a0:0x34/0x35` route to a random unoccupied point within model-19 radius 360, face the target, and call `00409140` each active visit. Ordinary followers are eligible. Per-visit native damage is `personBuildingDamage[model] >> 2`: Brave 7, Warrior 12, Preacher 7, Spy 7, Firewarrior 16, Shaman 10, model 8 = 31. The probe executed a real Brave strike and observed damage `0 -> 7` and attacker tribe 0.
- `004092a0` decays nonzero damage by 1 every four simulation turns. At model-19 threshold 22000 it ensures a plan and applies `-100` plan work. Model-19 building life is zero, so the plan reaches removal; generic smoke/debris run and a stage-positive building uses generic cue `0x34`. `00403860` dispatches model 19 to `0040c3a0`; no additional Prison-specific audio was found.
- `0040c3a0` walks the Prison footprint and releases matching class-1/state-10 attackers whose target model is 19 and target id (`+0x89`) is the destroyed Prison: route is released, previous state becomes 10, state becomes 41, and flags4 bit `0x80` clears. Probe-supplied footprint enumeration observed exactly this while class/model/owner/position stayed unchanged.
- Prison deletion makes `0x008922e8` null on the next tribe-list rebuild. On the next `00419880`, the Shaman is routed from her unchanged position toward tribe site `+0x911`; if not init-locked she leaves state 42 for state 39 when `level_flags&2` and model 7, otherwise the model-7 descriptor's normal next state 10. Release is not a teleport.

## Timer, cadence, rescue, and forced expiry

- Script word 52 is `DO 1200(field6)` and field 6 is literal 450. Command 1200 calls `004a5d20(DAT_0089d161*450,1)`. At the native 12 Hz simulation rate this stores `[remaining=5400, flags=3, decrement=1]` at `0x0096a85c/60/64`. `004a5d40` decrements once per unpaused simulation turn and clamps at zero; `004a5ec0` returns 1 iff active and zero. The probe observed remaining 1 after 5399 ticks and expiry after tick 5400.
- Both tribes 1 and 2 run script 75 and reset the same global timer to the same value during opening. `EVERY` is `(15 & (turn + signedTribe + offset)) == 0`. Expiry offset 34 polls at `turn%16=12` for tribe 2 and 13 for tribe 1. Rescue offset 0 polls at 14 and 15 respectively. Thus each instance polls every 16 turns; the combined expiry polls occur on two consecutive turns and the rescue polls on the next two.
- Rescue starts with script variable 10 = 1. Command 1223 overwrites it with global-Prison existence. When it becomes 0, command 1201 performs `004a5d20(0,0)`, `004a5eb0`, `004a5ee0`: storage becomes `[0,0,0]`, query becomes false, then command 1093 receives `[2,3,4,7]`. Destruction must clear/rebuild the global pointer before a rescue poll. Cancellation cannot undo an expiry branch that already fired.
- Expiry requires variable 10 == 1, internal 1157 (Blue Shaman model-7 count) == 1, and timer query == 1. It runs command 1112, sets attribute/internal 1019 to 100, then command 1064 with resolved arguments `[spell 3 Lightning, marker 8, target tribe 0]`; an optional flyby follows. `00492b40 -> 004f6a10` queues tribe substructure type 14 for that cast.
- Command 1112 is only player-input lock: it sets level flag `0x20000000` and input mask `0x80`. The flyby is presentation. Neither kills the Shaman, and command 1169 is not in this branch. Existing reviewed `00511f70` proves the actual failure mechanism: non-player Lightning while the global Prison exists has a special path for the player Shaman in state 42. It clears flags2 `0x00100000`, forces state 3/init, and calls `004da0d0` with the enemy caster tribe; normal Shaman damage/death/defeat handling owns the loss.

The smallest native-supported browser path is therefore: on the first successful expired poll, latch the branch/input lock and enqueue enemy Lightning at marker 8; make Lightning apply the captive-state special case and let normal Shaman defeat finish the mission. A later rescue/cancel must not reverse the latched expiry. Setting a 1169 tribe flag is unsupported; declaring immediate defeat at the timer poll is a looser shortcut than native scheduling.

## Probe, intercepted leaves, and exports

Run (non-recording):

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission15-prison.py work/orchestration/ceo-release/native-run/d3dpoptb.exe
```

Result: PASS, exit 0, Python 3.9.6 / Unicorn 2.1.4 / Capstone 5.0.7. Tracked checker SHA-256 `cff7303765d454219c42b4902f92aa7625e40f7af05c6e4c4b7be9f0eef61ffe`; scratch `result.json` SHA-256 `d5e569d519a6f31785c6410d1e1578463b00046eadd7cbe89d63fe0c7388503a`.

The probe executes native initializer, strike, captive initializer, Prison release, predicate, and timer routines. Supplied inputs are the validated authored objects/cell record, a single Prison footprint cell, its attacker-list head, and adjacent-Prison result. Intercepted leaves are `00493770`, `0040afd0`, `00403a00` (presentation/registration), `00445750` (animation), `0040a3f0` (adjacency), `00407150` (relation), `004b9ef0` (footprint), and state/motion leaves `00436ca0`, `004ed6f0`, `004ed640`. Full arguments and observations are in `result.json`.

New reviewed exports are indexed in `decomp/exports.json`: `0040c3a0`, `00492b40`, `00499960`, `004a5d20`, `004a5eb0`, `004a5ec0`, `004a5ee0`, `004e2770`, `004f6a10`. Existing reviewed evidence was reused for `004030c0`, `00403860`, `00409140`, `004092a0`, `00419880`, `0048cc60`, `004ecac0`, `004e2fe0`, `00511f70`, and `0051a2a0`; notably `00511f70.c` hashes `6ed4f8a803b5589b4ebc798d347040e1422d9485540383eec8889a4f02ad741c`.

Serialized export commands were:

```sh
python3 scripts/decomp.py export 00499960 --output work/orchestration/mission15-prison/native
python3 scripts/decomp.py export 0040c3a0 004e2770 --output work/orchestration/mission15-prison/native
python3 scripts/decomp.py export 004a5d20 004a5eb0 004a5ec0 004a5ee0 00492b40 --output work/orchestration/mission15-prison/native
python3 scripts/decomp.py export 004f6a10 --output work/orchestration/mission15-prison/native
```

All headless processes exited; no Ghidra/analyzeHeadless process or workflow lock remains.

## Limitations and durable handoff

This is routine-level emulation plus static script/export evidence, not a recorded full native playthrough. Presentation/registration and generic state-machine leaves are explicitly intercepted. The probe establishes Prison-specific ownership and preserves named neighboring fields, but does not emulate plan allocation, terrain routing, audiovisual playback, the queued Lightning's delay, or downstream generic Shaman-defeat UI. The native evidence does not justify a new special Prison sound or a 1169 outcome.

The browser implementation binds model 19 and the captive Shaman to existing building combat/checkpoint owners, preserves command 1223's global-existence semantics, and routes expiry through existing spell-3 scheduling plus the state-42 Lightning consequence.
