# Mission 22 class-6/model-3 and model-5 rewards

## Packet-cited headings

- `decomp/research/mission13-balloon.md#Native identity and production`
- `engineering/single-player-feasibility.md#3.2 Missions 14–25: authored scenarios and concrete dependencies`
- `decomp/research/vehicle-destruction.md#Destruction and passengers`

Bounded question: prove Mission 22 triggers 159 and 139, their recipient and ownership order, and whether either reward activates or allocates the authored Boat/Balloon. This is native evidence only; no browser integration or parity claim follows.

## Provenance and prerequisites

- Base commit: `fa3587c0fbb26ba4e38b19656966897ad633f93a`.
- Executable: `work/orchestration/ceo-release/native-run/d3dpoptb.exe`, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Mission 22: `levl2022.dat` `97fcbf41e1f13d53491fdbfbe8b5950fd94f3301c51c6f61b4725eb0aab30321`; `levl2022.hdr` `f3d38acb58ab080e7e18b707d6a9aa1a387d4783de1b3236a4bbbba52d5d4245`.
- Scripts: `cpscr064.dat` `741f7a2aa5bdb82f993b0e4cd9692b6b8bf6b4f5b188cb206a1fa9e15565e26c`; `cpscr065.dat` `dc498e6c0077ee0d15980d60d264a363082d16692a880f8a5f835216cfd01d11`; `cpscr066.dat` `5373a2d3cb4b965be69a665fa4695da0f351e9db6b6702c38bcf09edb24e0d5a`.
- Language: `language/lang00.dat` `e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d`.
- Runtime: `.tools/decomp/oracle/bin/python` 3.9.6, Unicorn 2.1.4, Capstone 5.0.7.
- Reused reviewed exports: `00485b00`, `004fb270`, `004faaf0`, `004fa8f0`, `004facf0`, `004657d0`, and `00466920`. No Ghidra project was opened and no new export was needed for the decision.

## Exact authored topology

| trigger | linked source | source payload | amount | actual consumer |
| --- | --- | --- | ---: | --- |
| 159, class 6/model 6, Blue, `(55,-131)` | slot 0 → one-based 1 / object 0 | neutral class 6/model 2, tag `(6,3)`, grant mode 3 | 1,000,000 | delayed mana to the eligible local person's tribe |
| 139, class 6/model 6, Blue, `(-25,-57)` | slot 0 → one-based 3 / object 2 | neutral class 6/model 2, tag `(6,5)`, grant mode 3 | 600,000 | delayed mana to the eligible local person's tribe |

Each source has exactly one trigger reference in the complete level scan. The apparent payload “models” 3 and 5 are tags loaded to clone `+0x74`; for reward class 6, `004facf0` passes the independent dword amount at `+0x70` to `0041a500`. It does not allocate class 4 and does not use the tag as a Boat/Balloon model.

The authored vehicles are separate records:

- object 1: class 4/model 3 Balloon, owner 2, `(-83,-65)`;
- object 132: class 4/model 1 Boat, owner 1, `(31.4453125,-31.4453125)`.

Neither is linked from trigger 159 or 139.

## Native order, recipient, ownership, and latches

Observed by executing the verified bytes:

1. With the mode-3 completion predicate held true, `004fb270` installs short `+0x9e = 51`, decrements it to 50 on that visit, and allocates the reward on the 51st qualifying visit. The probe forces that predicate; natural worship cadence through all 51 visits remains a live integration check.
2. Allocation requests class 6/model 2, owner 255, at the source position; `004ede10` copies the source; `004ed700` is called immediately. Source then head are retired. Deletion order is `[1,160]` for trigger 159 and `[3,140]` for trigger 139.
3. The head's remaining-use byte `+0x6b` changes 1→0 and work `+0x96` clears. Because the unique source and head are deleted, this is the one-shot replay latch.
4. The clone stays owner 255. `004facf0` selects the first eligible person in its cell and writes that person's tribe to recipient `+0x7e`; Blue and tribe-2 supplied cases selected 0 and 2 respectively. It writes timer `+0x7a = 82` and presentation phase `+0x7f = 1` after the cue request.
5. The 82nd countdown visit calls `0041a500(recipient, amount)`. Native cases changed pending mana `tribe +0x951` from 123 to 1,000,123 and 600,123. The clone is then deleted.
6. Byte-verified `0041a500` adds the amount at `0x89db19 + tribe*0xc65` (`tribe +0x951`) and normally writes 1000 to `tribe +0xa05`. `004facf0` immediately clears that same word after the call, so its externally persistent value is zero. The relevant checkpoint state before payout is therefore the pending clone (class/model, amount, recipient, timer, phase) plus the still-live head delay/use/work state; after payout it is pending mana plus absence of clone/source/head.

Vehicle ownership is independent. A focused execution of `004657d0` boarded a Blue first passenger into a supplied empty owner-1 Boat: return 1, vehicle owner 1→0, passenger count 0→1, slot 0 became the person, and the person's vehicle link became the Boat. The routine assigns vehicle `+0x2f` from the boarding person's real tribe after slot insertion. Worship does not perform this transfer.

## Authored vehicle lifetime

The browser's 5,000-turn value is native behavior, not an imported-data default that should be discarded. Exact Mission 22 initialization cases for object 1 Balloon and object 132 Boat executed `00463ba0`; both copied the shipped model descriptor's signed word `5000` to vehicle `+0x98`. The level records contain no lifetime override. Descriptor addresses are `005a797d` for model 3 and `005a794f` for model 1.

`00463cb0`, called unconditionally at the end of every class-4 controller pass by `00463780`, treats `+0x98` as life/destruction countdown:

- every nonzero value is decremented first, independent of occupancy, damage, owner, and state;
- when the decremented value remains positive, nonzero speed `+0x5f` **or** passenger count `+0x9e` refreshes it to the descriptor's 5000;
- when an empty stationary vehicle reaches 1→0 on that pass, model 1 enters Boat destruction state 5 and model 3 enters Balloon destruction state 6.

The exact authored-record probes observed 5000 immediately after `00463ba0`, 4999 after the first empty pass, and the appropriate state 5/6 transition on pass 5000. A passenger case and a nonzero-speed case each refreshed positive life 4999→5000. Therefore these initially empty, stationary authored vehicles do **not** remain indefinitely while waiting for discovery; absent movement/boarding they age into destruction after 5000 vehicle passes. Reviewed `00463780` then removes the Boat after its terrain-dependent sinking/immediate branch and removes the Balloon after it rises above height 1023. Removal is downstream of the 5000th pass, not necessarily on the same visible frame.

Damage is a separate subtraction from the same `+0x98` word. It can hasten a negative or 1→0 boundary, while a later occupied/moving positive pass restores life to 5000. Native has one unusual exact-zero edge: damage that writes exactly zero outside `00463cb0` leaves the zero sentinel unchanged on later passes instead of entering destruction. That edge does not apply to the ordinary authored countdown because `00463cb0` performs the 1→0 transition itself.

## Reachable trigger 141, its stone scenery, and model 92

Trigger 141 is the Blue class-6/model-6 head at `(-15,-39)`. Its only link is slot 0 → one-based 163 / object 162, class 7/model 92, owner Blue, at `(-17,-39)`. Object 162 has exactly one trigger reference.

The complete level scan also finds object 142, neutral class 5/model 9, at the trigger's exact `(-15,-39)` position. This is the visible stone object. During post-load processing, byte-verified `004851e0` matches that class/model and same tile, then calls `004fbd20(trigger141, object142, 0, 1)`. This is the exact initial-head linkage; it is not a script or resource-grant call.

`004fbd20` is 0x220 bytes (SHA-256 `c48f459fda1a82d75a7cf4bbf3561decf9d1b4bbfe9a1a14a8d2ec24a617e341`). Its complete direct-call set is only `004a66c0`, `0040cb90`, `0040cbb0`, and `0040cbf0`. `004a66c0` changes the scenery object's selected render object/morph; the three `0040cb*` leaves only change that object's animation byte/flags. There is no call to a mana, spell-stock, availability, campaign-command, transport, or audio routine.

Direct execution with the authored trigger/scenery arguments confirms the two relevant branches:

- Initial post-load `(trigger141, object142, 0, 1)` sets scenery presentation mode `+0x97 = 1`, requests object group/index `(4,8)` through `004a66c0`, then sets animation `+0x70 = 1` through `0040cb90`.
- Worship completion `(trigger141, object142, 1, 0)` sets scenery presentation mode `+0x97 = 1`, then sets animation `+0x70 = 0x31` and its animation flags through `0040cbb0`. It does not select a new render object on this branch.

The initial render helper needs the normally loaded `OBJS0` morph table. The probe supplies only its selected morph byte (sentinel `0x2a`) so the helper can execute; consequently that one final `+0x3b` morph value is supplied presentation data, not a claimed game-asset value. All control flow, object selection, animation writes, and the absence of gameplay/global writes are original bytes.

For both branches, a Unicorn all-memory-write trace found non-stack writes only inside object 142. Before each call, the probe seeded all four tribes' retained/pending/available/aggregate/rate/release mana fields, all 88 spell-progress dwords, all four spell availability/disabled masks, all 88 stock bytes, and level/land/load/mana/game/campaign flags. Every sentinel remained byte-identical. Neither `004fbd20` nor any subordinate made an audio call. This proves `004fbd20` cannot supply the zero-mana bootstrap; its effect is only the stone's object/animation transition.

With the completion predicate held true, the same mode-3 schedule applies: the head installs delay 51, reaches 50 on that visit, then completes on the 51st qualifying visit. Native event order is:

1. allocate class 7/model 92, owner Blue;
2. copy object 162 into the clone;
3. request immediate processing;
4. delete source one-based 163;
5. delete head one-based 142.

The head's remaining byte changes 1→0 and work clears. The clone is not deleted.

Model 92 has no hidden reward body. `00509c10` first applies the ordinary class-7 baseline in `0050bcd0`: terrain insertion/grounding, state 0, object `(0,0)`, physics 10, indefinite `+0x6c = -1`, default flags, and scale 256. Its model-specific initializer leaf `00479cd0` is exactly one byte, `c3` (`RET`). State 0 has no matching case in processor `0050a750`, so subsequent visits return without mutation or deletion. Direct execution left the clone and player state unchanged.

Sentinel-backed completion checks found no change to mana, spell availability/progress/stocks, or global/campaign flags. There was no class-4 allocation, vehicle owner/position mutation, person relocation, or transport link. Because the source is replaced by an equivalent inert clone at its authored position, the net model-92 count remains one while the worship head disappears.

There is no model-92-specific sound or presentation call. The generic baseline selects object `(0,0)`; exact rendering of that generic object was not replayed. Trigger 141's visible class-5/model-9 stone helper contains no audio, but the full trigger controller's generic completion-cue behavior remains unproved because the probe supplies the audio leaves.

## Implementation decision

Do **not** implement `(6,3)` as Balloon activation or `(6,5)` as Boat activation (or vice versa). Both are delayed mana gifts: trigger 159 gives 1,000,000 and trigger 139 gives 600,000 to the eligible worshipper's tribe. Preserve neutral clone ownership, local-person recipient selection, the completion-qualified 51-visit head delay, 82-visit reward delay, and one-shot deletion order.

No gift supplies the boarding/travel/disembarkation sequence. The live browser route verifies the authored Red Boat is reachable first, then carries the Shaman to the 600,000-mana head and the terrain needed to reach and claim the authored Yellow Balloon. The Balloon reaches the northern 1,000,000-mana head and returns through ordinary controls. This is browser integration evidence, not a native route-timing replay.

Trigger 141 must not be used as a mana, spell, stock, transport, flag, or relocation bootstrap. `004fbd20` definitively cannot restore mana or spells: it writes only object 142's render/animation fields and has no gameplay/audio callees. The smallest faithful implementation is a one-shot reachable worship head that transitions its colocated stone from animation 1 to completion animation `0x31`, consumes the head/source identities, and preserves one inert class-7/model-92 token only if the live object/script layer observes it. The actual native bootstrap lies outside `004fbd20` and outside trigger 141's linked payload; the implementation must find a different authored/script route or explicitly address the browser reachability mismatch instead of inventing a reward here.

## Probe, supplied/intercepted leaves, and limits

Command:

```sh
.tools/decomp/oracle/bin/python \
  scripts/check-native-mission22-gifts.py \
  work/orchestration/ceo-release/native-run/d3dpoptb.exe \
  --output work/orchestration/mission22/native/results.json
```

Result: `PASS: Mission 22 mana rewards verified; trigger 141 replaces its source with an inert model-92 clone`.

Native bodies executed: `00485b00`, `004851e0`'s byte-verified linkage (inspected), `004fb270`, `004fbd20` and all four of its subordinate bodies, `004facf0`, `0041a500`, `004657d0` ownership/slot logic, vehicle initializer `00463ba0`, 5,000-pass life consumer `00463cb0`, model-92 leaf `00479cd0`, and state-0 dispatch through `0050a750`. The probe supplies allocation storage (`004ed8a0`), byte-copy behavior (`004ede10`), the unique-reference result (`004fc290`, after a complete raw-level scan), person cell membership/eligibility (`004f62c0`), deletion bookkeeping (`004ef180`), one selected `OBJS0` morph byte needed by the presentation helper, and vehicle terrain/list initialization leaves `00464ae0`/`004ee470`/`0044e940`. Vehicle destruction cleanup and state initialization are supplied at `004ed6f0`/`004ed640` after recording the requested state. It suppresses gift audio/presentation (`0048a050`, `00481550`) and boarding animation/state presentation (`004d4040`, `004d8250`, plus the local animation block). `004ed700` call order is recorded; the relevant consumer is then replayed directly. Trigger 141/model 92 never reaches the suppressed gift-audio branch. These intercepts do not prove exact asset morph, terrain reachability, save-file serialization, end-to-end scheduler timing, or the final terrain-dependent vehicle removal frame; reviewed `00463780` establishes the latter controller paths.

`0041a500` has no checked-in pseudocode export. `results.json` retains its exact 56 bytes, SHA-256 `d339d2cd858b92ef166cef59957f0e0cfe97f6aacf19c40851db3d477cce2aa1`, and Capstone disassembly. That byte evidence suffices for the implementation decision; a serialized Ghidra export is optional durable review material, not a research blocker.

## Durable handoff

- This note is linked from `decomp/README.md` and the campaign evidence list in `engineering/project-map.json`.
- `scripts/check-native-mission22-gifts.py` is the reusable non-recording check.
- A reviewed `0041a500` export remains optional because the retained bytes and disassembly already decide this slice.
- The browser now binds trigger 141 as a resource-neutral one-shot, both mana heads to the delayed lifecycle, and both authored vehicles to ordinary first-passenger ownership, travel, landing, and checkpoint paths. Exact stone presentation, AI, objective, outcome, and native route timing remain open.
