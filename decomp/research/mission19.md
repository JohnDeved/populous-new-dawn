# Mission 19 native findings

## Selection, status, and Shield (packet-cited prior evidence)

The packet's cited Mission 16 section establishes only the neighboring model-20/Shield selection status and that `00515180` is the next class-11 effect handler, Teleport. It does not establish Mission 19 behavior. Indexed findings and `decomp/exports.json` had no Mission 19 note or `00515180` export, so the exports below fill a real gap.

The packet's supplied filename is wrong: `levels/levl2003.hdr` is Mission 3 (`[3,12,12,5,…]`). The supplied, byte-matching Mission 19 input is `levels/levl2019.hdr`, whose bytes 88 onward are `[3,31,41,64,5,2,5,8,13]`. SHA-256: DAT `33892de2c0fa0efa7c0cbb2ffcc86ffe6bb3b5afbf7f298cd28cb3a7d6fe0359`; HDR `72c4982a400702b8e6b05afd2257cb2453a4f3113d493d744db5352925e1661a`; scripts 31/41 `5e2ca219…e2a5` / `e0b7ae11…7703`. Executable: `work/orchestration/ceo-release/native-run/d3dpoptb.exe`, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, matching `decomp/tools.json`.

## Bank-d authored sky inputs

Landscape bank 13 selects the authored `d` sky set. The native palette, backdrop,
low cloud, and high cloud inputs have SHA-256 `baadb5c8…967a4f`,
`0972127c…e6b81`, `853e3098…a62489`, and `26fbee4d…2a05`; the focused native
check verifies those complete hashes and the three tracked imported PNGs.

## Teleport model 21

The authored Teleport chain is trigger index 208 -> one-based 210 -> gift index 209, payload `[11,21,3,1]`. Firestorm is trigger 69 -> gift 67/model 8. Object 97 is a **trigger**, not its reward; it links gift 121/model 16 (Volcano). All are ordinary class-6/model-6 trigger -> class-6/model-2 gift chains, so the existing worship/delayed stock lifecycle applies unchanged. No Mission 19-specific reward consumer exists.

The model-21 executable descriptor is: mode 2, mana cost 999999, cursor 57, icons 371/389/407, flags `0x801f`, normal/alternate range 65536/7168, normal/alternate stock limit 4/0, charge rate 120. `004c24f0` applies the generic player gate (valid model, cursor not blocked, live usable Shaman, no cast cooldown/busy state, toroidal range). Only model 12 has an added terrain/vehicle restriction; model 21 accepts ground or water and targets a position, not a person. A rejected validation never enters allocation and therefore spends no stock. For an accepted stock-funded cast, `004f4de0` decrements the model-21 stock before class-11 allocation; allocator failure does not refund it.

`0050a750` dispatches class-11/model-21 to state/effect 72 and `00515180`. Exact effect behavior:

- Each visit increments signed short `+0x6c`. Visit 1 requests class-7/model-72 at the target.
- Relocation happens at visit 8 when target height `z > 819`, visit 9 when `z > 615`, visit 10 when `z > 411`, visit 11 when `z > 207`, or visit 12 when `z >= 0`. The focused native probe verifies every strict boundary. A missing tribe Shaman terminates the cast at the firing visit.
- Before moving, it creates 81 class-7/model-3 effects in a 9x9 loop around the Shaman, consuming two native RNG advances per effect and sampling terrain height.
- It detaches the Shaman from a vehicle (occupancy, slot, flags, and vehicle update) or Hut. A target cell flagged as a building is adjusted through `004044b0`. It writes the adjusted destination, snaps X/Y to cell centers `(coord & 0xfe00)+0x100`, clears the movement nibble, selects the person's normal next state (state 39 for a Shaman under special level flag 2), and runs normal state/motion/position-array reinitialization.
- It ORs Shaman flags with `0x1080`. If the destination cell has a class-4 vehicle, it boards only an empty vehicle or one having any same-tribe occupant; an enemy-only occupied vehicle is ignored. Finally `004edcf0` retires the cast object.

Static pseudocode proves the field writes and call order, not the audiovisual implementation or the semantics inside intercepted/shared helpers. A mid-effect checkpoint must retain the class-11 target, `+0x6c` phase, owner, simulation turn/RNG, Shaman/container state, and ordinary spell stock; an already completed move needs no new Teleport-only latch.

## Blue-Chumara relationship and Mission 19 objective ownership

There is **no native generic Blue-Chumara combat alliance in this single-player mission**. Single-player setup writes team bytes `008956b7..ba = [1,1,1,1]` (`004a4f70`, `00458790`, `0040ec80`). During level load, `00516eb0` treats team value 1 specially: it clears all four bits and sets only the tribe's self bit at alliance bytes `009608b6..b9`. The only exact mutators are `00516d70`/`00516e10`; neither script 31 nor 41 invokes them. Consequently Blue (0) and Chumara (2) remain hostile to generic combat/target searches. “Ally” is narrative/objective ownership, not a reason to set `world.outcome.alliances[0/2]`. Product acceptance that requires a mutual combat alliance would deliberately differ from this executable.

Red/Dakini script 31 owns all three one-shot distress messages in its 64-turn branch (for tribe 1, `(turn + 1) & 63 == 0`):

- message 127 when latch variable 16 is zero and native internal 1178 (`tribe 1 +0xa23`, an unsigned counter whose producer/name remains unresolved) is greater than 2;
- message 128 when latch 15 is zero, internal 1178 is greater than 25, then after command 1136 tribe-2 building-model-8 count is below 1 and Dakini population exceeds 30;
- message 129 when latch 14 is zero, Chumara population is below 15, and tribe-2 building-model-3 and model-8 counts are both below 1.

Each uses positioned-message command 1177 `(message,72,30,850)`, command 1180, then sets its latch. Thus warnings belong to the hostile Dakini script, not the Chumara script or generic outcome processor.

Script 31 also owns ally loss: once Chumara population (`internal:4`) is below 1 and variable 13 is zero, opcode 1169 calls `0049a1f0`, ORing player tribe flag `0x20000`, then latches variable 13. Script 41/Chumara owns success: once Dakini population (`internal:3`) is below 1 and variable 5 is zero, opcode 1170 calls `0049a1c0`, ORing player flag `0x40000`, then latches variable 5. Generic `00418e30`, first eligible at turn 32 and every 16 turns, gives forced loss `0x20000` priority, otherwise lets forced win `0x40000` bypass the still-living Chumara opponent. It sets world loss `0x04000000` or victory `0x02000000` through the existing result owner. Simultaneous Dakini/Chumara extinction therefore loses.

Checkpoint state specific to this objective is only warning latches 14/15/16 and outcome latches 13 (Red) / 5 (Chumara), plus the ordinary script state, populations/building counts, turn, and result flags. A browser adapter that does not persist the native script VM must persist equivalent one-shot warning/result latches explicitly.

## Commands, results, intercepted leaves, and limits

- `python3 scripts/decomp.py export 00515180 …` and subsequent bounded exports: **passed**, exit 0, Ghidra 12.1.3/Temurin 21. Export wrapper verified loaded section bytes against `decomp/sections.tsv`. Key SHA-256: `00515180.c` `3ba14a37…37efb`; `0049a1c0.c` `78a74676…b4b37`; `0049a1f0.c` `337ed3cd…b4b37`; `00516d70.c` `aa9ff6ab…151a`; `00516e10.c` `34917dff…94f7`; `00516eb0.c` `a5fcb573…51aa`.
- `.tools/decomp/oracle/bin/python …/probe_mission19.py … --output …/probe-result.json`: **passed**, exit 0; verifies supplied hashes, header, object links/messages, and full script AST. Structural parser only; it does not execute AI/combat.
- `.tools/decomp/oracle/bin/python …/probe_teleport.py EXE …/teleport-probe-result.json`: **passed**, exit 0; original `00515180` executes. Only allocator `004ed8a0` and cast retirement `004edcf0` are intercepted; Shaman is intentionally absent to isolate visit/height boundaries.
- `.tools/decomp/oracle/bin/python scripts/check-native-spell-casting.py EXE`: **passed**, exit 0; 2,048 player validations and 1,024 payment/stock cases among its complete suites. Its documented allocation, initializer, cursor/bridge/notification/defence leaves are supplied.
- `.tools/decomp/oracle/bin/python scripts/check-native-outcomes.py EXE`: **passed**, exit 0; 2,071 complete `00418e30` calls. Camera, cleanup, input, reveal, completion/network, person-state, and damage consumers are intercepted as documented by that check.

No full native Mission 19 playthrough, renderer/audio comparison, late AI behavior, or live browser integration is claimed. Community symbol names remain hypotheses. Existing exports do **not** prove a producer or browser-event mapping for internal 1178 / tribe-relative `+0xa23`. The existing reference report has no direct reference to the exact tribe-0 address `0089dbeb`; it finds only `004a3960` referencing sibling-family address `0089dbe7` (`+0xa1f`). The sole exported caller, `004d5cf0`, passes an object's `+0xb0` tribe and the object to `004a3960`, but the callee is not exported, so neither a write to `+0xa23` nor an update rule follows. The address/type, thresholds, cadence, and script owner are exact, but messages 127 and 128 cannot be made normally reachable from an existing browser event/state without guessing. Of the three warnings, only message 129 is presently backed by mapped population/building state.

## Durable handoff and smallest implementation step

After parent review, promote `00515180`, `0049a1c0`, `0049a1f0`, `00516d70`, `00516e10`, and `00516eb0` to `decomp/generated/` plus `decomp/exports.json`; consolidate this note as `decomp/research/mission19.md`; combine the two scratch probes into `scripts/check-native-mission19.py`. No further Ghidra exports are needed.

Smallest native-supported implementation: add Mission 19 objective state at the campaign/script adapter (message 129's one-shot warning latch; Chumara-empty forced loss; Dakini-empty forced win with loss priority) **without** changing generic alliance masks. Defer normal reachability for messages 127/128, or exercise them only with explicitly supplied internal-1178 test state, until the producer is recovered. Then add model-21 at the existing spell target/effect boundary using generic validation/payment and the recovered relocation timer/container/state/RNG behavior. Reuse ordinary worship and structured-clone owners for all three gifts.
