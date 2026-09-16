# Mission 14 linked rewards and generic Angel of Death spell

## Packet-cited headings

- `engineering/single-player-feasibility.md#3.2 Missions 14–25: authored scenarios and concrete dependencies`
- `decomp/research/mission5-angel.md#Observed native facts`

Bounded assignment: resolve Mission 14 worship triggers 48 and 55, then distinguish the ordinary spell-model-13 path from Mission 5's authored Angel objects. This work is evidence only. It does not establish browser integration or authorize parity changes.

## Provenance and prerequisites

- Base commit: `97510bdab487260df02bfd1b8f7957c23bc4a907`.
- Supplied archive: `work/orchestration/ceo-release/inputs/PopulousTB-Setup.zip`, SHA-256 `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
- Verified executable: `work/orchestration/ceo-release/native-run/d3dpoptb.exe`, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`, matching `decomp/tools.json`.
- Mission 14 inputs were already extracted and readable; no recovery was needed: `levl2014.dat` `bf8c5dc2f80dcb30dfc4de7764c6883ba007aa410ee674a95f452c3927e4bdcc`, `levl2014.hdr` `eae951d3dc6e6d2ef664a767fa01395968cec5f322ff8de53554e9548bc1ea19`, `cpscr037.dat` `429888ab958bfae4c7a1a41cf81d1b43471e9e583212591a782acf533d654ff9`, `cpscr038.dat` `7f4204ca82f4767f878b45411bc3617e0a38fd72f5a5e70637791c09b26cf68a`, `cpscr039.dat` `838e04374a28e2f64ee96176c1313c6bf28dee6dc2c0ac2698b88e96e629793d`, and `constant.dat` `e905e513c798171d5540082565b8addc9f54e5851006b56e8d1976687ba42f24`.
- Reused topic evidence: `decomp/research/mission5-angel.md`, SHA-256 `cac00ea9d0d15b0496bfae885cd9aea0eac782ac3afd18f59679d2d2ca0c21e4`.
- Probe environment: repository `.tools/decomp/oracle/bin/python` 3.9.6, Unicorn 2.1.4, Capstone 5.0.7. Checked-in pseudocode was exported with Ghidra 12.1.3. No Ghidra project was opened and no new export was needed.

## Mission 14 authored topology

The raw level records use one-based linked indices; the probe reports zero-based source indices for execution order.

| head | head position | slot → source | authored template | native purpose |
| --- | --- | --- | --- | --- |
| 48 | `(-111,-9)` | 1 → one-based 48/index 47 | class 6/model 2, owner 255, `(-113,-11)`, settings `[11,13,3,1]` | delayed generic spell-13 gift to Blue |
| 48 | same | 2 → one-based 3/index 2 | class 7/model 31, owner 0, `(-111,-13)` | decoration |
| 55 | `(-61,-53)` | 0 → one-based 55/index 54 | class 6/model 2, owner 255, `(-65,-53)`, settings `[11,14,3,1]` | delayed Earthquake gift to Blue |
| 55 | same | 2 → one-based 54/index 53 | class 6/model 2, owner 255, `(-57,-53)`, settings `[11,12,3,1]` | delayed Bridge gift to Blue |
| 55 | same | 3 → one-based 51/index 50 | class 7/model 17, owner 0, center | decoration |
| 55 | same | 5 → one-based 53/index 52 | class 7/model 17, owner 0, left | decoration |
| 55 | same | 6 → one-based 52/index 51 | class 7/model 17, owner 0, right | decoration |

Every linked template above has exactly one reference among Mission 14 trigger links. Thus the supplied `FUN_004fc290` result of "not shared" is consistent with the complete raw-level scan.

## Completion traversal, allocation, deletion, and reset

Native `FUN_004fb270` (`0x004fb270`) walks nonzero links in increasing slot order, clones **all** of them through the normal allocator/template-copy path, performs their first processing visit, deletes each source template, then deletes the worship head.

- Trigger 48 clone/source order: zero-based `[47, 2]`; deletion order is one-based `[48, 3, 49]` (both links, then head 49).
- Trigger 55 clone/source order: zero-based `[54, 53, 50, 52, 51]`; deletion order is one-based `[55, 54, 51, 53, 52, 56]` (all links, then head 56).
- The gift clones retain template owner 255, but native first processing resolves recipient `+0x2f` to Blue/0. Each becomes class 6/model 2 with reward class/model `(11,13)`, `(11,14)`, or `(11,12)`, timer `+0x96 = 82`, phase `+0x2c = 6`, grant mode `+0x98 = 3`.
- Decorations retain owner 0.
- Completion changes remaining `+0x6b` from 1 to 0 and clears work bytes `+0x96/+0x97`. The enabled bit remains set in the observed head snapshot, but the head is deleted. There is no cooldown or reusable trigger state.
- Stock is unchanged during head completion. The delayed gift is awarded on the cloned reward object's 82nd `FUN_004facf0` (`0x004facf0`) visit.

## Gift stock representation and caps

The byte at `0x96071e + tribe*0x38 + spellModel` stores current shots in the low nibble and cumulative gifts in the high nibble. The delayed grant increments the low nibble only below the current runtime cap and independently increments the high nibble up to 15.

| model | runtime cap | representative native transitions |
| --- | ---: | --- |
| 12 Bridge | 4 | `0x00→0x11`, `0x03→0x14`, `0x04→0x14`, `0xff→0xff` |
| 13 Angel | 1 | `0x00→0x11`, `0x01→0x11`, `0xff→0xff` |
| 14 Earthquake | 2 | `0x00→0x11`, `0x01→0x12`, `0x02→0x12`, `0xff→0xff` |

The timer experiment observed zero before visit 82 and `0x11` immediately after it for all three models.

## Generic spell-model-13 validation and consumption

Runtime constants after applying `constant.dat`: mode 1, cost 510000, flags `0x47f`, normal range 3072, alternate range 7168, shot types `[2,1]`, effects `[19,0,0,0,0]`, normal cap 1, alternate cap 0, charge rate 300.

`FUN_004c24f0` (`0x004c24f0`) accepts both ordinary ground and water cells for spell 13. The terrain rejection branch exercised by Bridge/model 12 does not apply. The probe returned 1 for an in-range ground target and 1 for an in-range water target, `-2` for out of range, and `-1` for a missing shaman. This is a normal cell-target spell: no enemy or person target is required. Cursor/cooldown/dead/busy-shaman and override behavior remain the generic rules already covered by the spell-casting oracle; this probe did not repeat every generic gate.

`FUN_004f4de0` (`0x004f4de0`) consumes one low-nibble shot **before** allocation. Starting from the gifted `0x11`, both success and a supplied allocator failure leave `0x10`: the gift counter is preserved and there is no allocation-failure refund.

Successful cast allocation is class 11/model 13, owner Blue/0, at the target cell center `[8448,8448,0]` for packed cell `0x2020`. `FUN_004c14c0` (`0x004c14c0`) initializes phase 3, retains the exact target and owner, and requests cast cue `0x81` (129, model 13 plus `0x74`).

## Generic Angel allocation, team, position, and audio chain

After six native `FUN_004c1d10` (`0x004c1d10`) visits, the class-11 cast object allocates a class 8/model 1 projectile owner Blue/0 at the shaman's `[16384,16384,320]`, then raises its launch point to `[16384,16384,416]` (`+96`) and aims at `[8448,8448,0]`.

The checked-in `FUN_004dd700` movement export establishes up to 20 movement steps at 70 native units per visit with arrival when each coordinate is within 108; the probe did not run that transit loop. On impact, the native chain demonstrated:

1. class 7/model 19 effect, owner Blue/0, exact cast target;
2. `FUN_00512240` (`0x00512240`) creates class 7/model 72 presentation, same owner/position, and requests cue `0xd9` (217);
3. after the presentation disappears, it creates class 1/model 8 Angel payload at the same owner/position and removes the model-19 effect.

`FUN_004db980` (`0x004db980`) then creates class 6/model 8 attachment for the Angel and requests cue `0xdb` (219). It can request cue `0xdc` in a controller phase; death uses cue `0xb2` and a 16-tick shrink/cleanup sequence. The latter three observations are from existing checked-in exports, not replayed audio output.

## Lifetime, movement, height, and persisted mutable state

- `LIFE_AOD` at `0x005a7200` is 10000.
- `AOD_DURATION` at `0x005aa5a4` is 2500; `FUN_004d2740` state 28 writes lifetime `+0x97 = 2500`.
- Runtime person constants are state 28, physics 19, base speed 140, running speed 140, vertical limit 256.
- Initialization writes movement speed `+0x5f = 140 + RNG % 35`, hence 140–174 before an optional flag-based doubling. The controller later varies movement for chase/strike, so a single fixed Angel flight-step constant is not native-general.
- The class-1 payload begins at the cast target and terrain height. The projectile begins `+96` above the shaman. The Angel controller's initial phase clamps to terrain and adds 100; chase desired height is target `z + target.mid2`; its strike transition uses own `z + 800`. A fixed `+640` spawn/flight height is not the general native rule.
- Checkpoint-visible mutable state needed to resume this path includes team/owner `+0x2f`, phase/state `+0x2c/+0x2d`, current position `+0x3d..+0x41`, destination `+0x4f/+0x53/+0x6a`, movement `+0x57/+0x5f/+0x67/+0x68`, health `+0x6e`, target index `+0x72`, attachment `+0x89`, and remaining lifetime `+0x97`, plus spell stock/gift nibbles and any pending delayed-reward timer.

The browser checkpoint store serializes the whole `World`, so integrated shot/gift arrays and `effects[].angel` state are structurally eligible to persist. This research did not execute the browser checkpoint path, and it did not recover the original executable's save-file serializer. Therefore persistence is an integration requirement, not native save-equivalence proof.

The current browser integration consumes the linked spell-reward templates in authored order but does not clone the class-7 decoration templates. Those visual clones remain deferred; they are not part of the claimed Mission 14 reward delivery.

## Distinction from Mission 5

Mission 5's authored head index 97 clones a class 7/model 91 statue and class 7/model 88 remote marker. Those clones are inert in combat. The direct native activation boundary from that authored Mission 5 pair to class 1/model 8 remains unresolved, including its exact initial `+0x97`/parameter.

Mission 14 instead awards ordinary model-13 spell stock, whose generic native chain is now directly demonstrated: delayed class 6/model 2 gift → class 11/model 13 cast → class 8/model 1 projectile → class 7/model 19 effect → class 7/model 72 presentation → class 1/model 8 Angel. Mission 5's unresolved authored activation must not be used to block or redefine this ordinary casting path.

## Native leaves and integration limits

Supplied/intercepted leaves:

- supplied by the probe: level record/state setup, normal constants/tables, shaman/cell inputs, terrain heights, RNG value, disappearance of the presentation, and one deliberate allocation failure;
- intercepted: `0x004ed8a0` allocation, `0x004ef180/0x004edcf0` deletion, `0x004ede10` template copy, `0x004ed700` cloned-object first processing, `0x004fbd20` worship presentation, `0x004fc290` shared-reference result, `0x0048a050` audio playback, `0x004ed6f0` unit cleanup, and `0x004ed640` shaman state initialization;
- executed natively: `0x00485b00`, `0x004fb270`, `0x004facf0`, `0x004c24f0`, `0x004f4de0`, `0x004c14c0`, `0x004c1d10`, and `0x00512240`, including their tested branches and field writes.

The shared-reference return was supplied only after a complete raw Mission 14 topology scan established reference count 1 for every target. Allocation/deletion/audio calls are observable leaves rather than live engine subsystems. Projectile transit, Angel AI combat, renderer/audio playback, native original-save round-trip, and browser UI/checkpoint reachability are not proved by this probe.

Relevant checked-in exports and SHA-256:

- `00485b00.c` `346a7d08813529a5f716e7641c6580c30b8853070e6c3759b64e8e1ecd899099`
- `004fb270.c` `3a61b62275e618be994161ba1ba94fa6b46beab22d3348c483072afc411b1a2a`
- `004facf0.c` `5ed48fef08d978405d68eec4b3ee11624297907696e9132edcaeda873e131070`
- `004c24f0.c` `b71840e9d8b55f19e82e8a45eff2dea5377481649ff0daea8197905c2f22450c`
- `004f4de0.c` `a212fc9426b0e9579f832eef64017f4b9ca5273b45c0590202ed3cc49f3fae11`
- `004c14c0.c` `4d6389740f08a00ed06a7336d9df2ddd9aaeb5dd39652fb6a39dcfebcf62bc3d`
- `004c1d10.c` `ccd1d1551580f657f57e4d8570f1616f72b55517b3f8be17b06447abd6fdecea`
- `00512240.c` `71711c35ca937b0540917de1ab09eb0c8b0342679e394ec4cdae843a4ef83ed1`
- `004ed8a0.c` `0a3e6654f1c046935bf0a75e32d8691f641fa13fad6c82dc06f3783ba520e5c9`
- `004db980.c` `0a52d96fd944ba136499b973aad85f8aa18f8ce626c8a9119d8c2a0e6769de4b`
- `004dd700.c` `b7f5602df7c71d344f2a05df9cc21942198b881195871ea22f17bd1080f308b6`
- `004d2740.c` `02dd6d6bcdebfd1fbb5065c50af5e8f40d33140676e99c316ceb3ebe85835747`
- `004d32b0.c` `1302bb34e80166d86f96cdf418987ba54a6362f4742760082c656c80b8f96fce`
- `004e0a30.c` `fd50c0bca8d26916f07497d74f418f441a0be685e982814d5321759341703560`

## Probe and durable handoff

Command, non-recording:

```sh
.tools/decomp/oracle/bin/python work/orchestration/mission14-linked-angel/native/probe_mission14_rewards.py work/orchestration/ceo-release/native-run/d3dpoptb.exe --output work/orchestration/mission14-linked-angel/native/probe-result.json
```

Result: passed, exit 0, `PASS: Mission 14 linked rewards, stock caps, generic model-13 cast and Angel allocation`.

- Probe: `probe_mission14_rewards.py`, SHA-256 `9bb37cf0d0d415a928bd4910cdfd4d4eedff8cbb2c9c3b77f28afb5d4dbd94d8`.
- Structured result: `probe-result.json`, SHA-256 `cf27c051c58cfecaa3d7718672b145ed0cc10f7806e680e963f2a5aed8a9013f`.
- Proposed reviewed destinations: `scripts/check-native-mission14-rewards.py` for the probe and `decomp/research/mission14-linked-angel.md` for this note, indexed from `decomp/README.md` and `engineering/project-map.json`. No new Ghidra export is required.

Next implementation step: keep linked-slot ordering and clone every linked reward/decoration; award Blue's Angel/Bridge/Earthquake stock after the 82-visit delayed object with native caps/gift accounting; feed Angel stock through the ordinary cell-target spell pipeline with pre-allocation consumption; persist pending reward and mutable Angel state; and verify worship, HUD/cast, combat, audio, and checkpoint resume through the shipped Mission 14 path. Keep Mission 5's authored activation as a separate unresolved question.
