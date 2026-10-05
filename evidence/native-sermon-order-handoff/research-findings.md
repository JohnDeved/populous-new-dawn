# Native sermon supersession and worship controls

## Result and decision

This finite set proves an original-code path from an acquired sermon listener to release, same-visit automatic attack-order creation, then selection of the former preacher as combat target after both a worship order (27) and a normal move order (3). It also proves that a genuinely native-created converted model-2 Brave, preserving its conversion flags, can accept command 27, arrive through native motion/routes, and count as one Blue worshipper. The ordinary non-sermon Preacher worship control also succeeds.

These are native executable witnesses in a supplied flat world, not an original Mission 3 playthrough. They do not identify the campaign killer, prove a completed fight, establish tactical safety, or justify an application change. Nothing in application, campaign, QA, fixtures, Git index or refs was changed. Main remained clean at `3b899125cc8cedef938823718ad5d44f49957b66`.

## Identity, scope and reproducibility

- Original executable SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. The PE was mapped only inside Unicorn; it was never OS-executed.
- Restored environment: `../prerequisites/env.sh`. Every native run was pinned to CPU 4 and individually bounded by `timeout 60s`. No tools were installed, no project dependency trees moved or accessed, and no Ghidra project or browser was used.
- `receipt.json` contains the exact final commands, start/end time, process exits, tool/input and source hashes, output hashes and source-stability verification. `address-map.json` binds the finite routine map to retained export hashes. `manifest.json` seals the retained probes, receipts, results, analysis and prior attempts.
- Final raw files: `final-handoff.json`, `final-converted.json`, `final-ordinary.json`; each has its own stderr. `verify-results.py` independently checks the claims and emits `verified-summary.json`.
- Reuse: PE/constants and animation projection from the existing native guard lifecycle fixture; native startup `0042c210`, shipped MWSEARCH.DAT, and worship-slot initializer `00429ad0`. Existing component evidence remains in `scripts/check-native-person-worship.py`, `check-native-worship-place.py`, `check-native-worship-admission.py`, `check-native-melee-engagement.py`, `check-native-followers.py`, and retained sermon/victim exports. Those scripts were inspected, not rerun or recorded.

The only intercepted final leaves are `0047a550` selection UI, `0048a050` sound and `00436330` command acknowledgement. Original command allocation/preparation/attachment/removal, acquisition scan, victim validation, class/state initialization, routes/physics, combat eligibility and scans, worship body/place search, trigger lookup and admission execute. Conversion additionally executes original object allocation, person construction, deletion and tribe-list rebuild.

Supplied world: Preacher id1 at native (4224,4224), Yellow Brave id2 at (4480,4224), optional Yellow Brave id3 at (4224,4480); flat zero-height/category-0 cells and all-walkable mask; no buildings, Shaman, computer spell controller or wider campaign. Initial actors are constructed fixture records (state19, native models/physics, health/life1000), not actors recovered from an original save. LevelFlags2=0x50000 suppresses formation/footprint world effects inherited from the reviewed fixture. Decorative head id100 at (5632,4096), mode0 trigger, required1/target40. That synthetic id100 is unrelated to Mission3 runtime id101. Sprite frame counts and balance values are from the shipped files. Native per-person/sermon calls and counter inputs are scheduled by the fixture; no full uninterrupted world-scheduler claim is made. Native renderer, wall clock and animation stepping between every supplied visit are outside scope.

## Finite producer/cancel/consumer map

1. Entry exercised: complete simulation packet consumer `00444f60(tribe, packet)`, with normal replacement-slot packet byte 0x57 and retain-selection bit0x20000. Commands17/3 encode the packed ground coordinate; command27 uses the head ID in the upper word of packet+4, not packet+8. The native frontend/C1 input caller before this packet entry was not executed.
2. Packet path: `00435780` stages; `00435c40` clears selected actors' orders via `004364d0`; `00435cb0` allocates/prepares/attaches the new shared command via `00438730` and `00436d00`; `00436ff0` clears staging. `00444f60` resets movement and invokes native state initialization, which adopts the new command through `00432260` / `00432df0`.
3. Sermon: `00432590` dispatches command17 to `0043a4d0`. The actual `0043abf0` acquisition scan finds one/two fixture Braves on command visit4; state initialization `004d8300` creates state23, timer and listener flags, and the scan installs workTarget/owner+0x89=id1. This is not a prewritten state23 fixture. Initial listener timer was produced natively.
4. Supersession: after the complete worship27 or move3 packet, the preacher owns the new command. Every listener record is byte-field unchanged in our snapshots: Yellow tribe2, state23, owner1, +0x10 bit0x80 and +0x0c bit0x200000 remain. The retained order17's reference count is zero. No `0043aec0` release-scan call occurs in these packet executions.
5. Each listener's own next full class dispatch `004ed700` runs complete `004d32b0`. Its state23 case calls `004d83b0` (return address004d3808), which rejects the preacher's now-current non-sermon command and returns default state10. Common transition calls `004ed640` / `004d2740`; `004a3940` (return004d2845) clears work ownership. Listener flags clear, owner becomes0, tribe remains Yellow. With two listeners, id3 remains listening until its own visit, after id2 has been released.
6. In that same full visit, common combat tail `004d4690` (return004d3b44) evaluates `0051ff60` range5 and `004d44e0` eligibility1. `0051e5e0` calls complete `0051eab0` (result2), allocates command21 with flags0x20, and attaches it as immediate order through `00436d00` (return0051e6d5); `00520480` runs its sharing consumer. This goes beyond mere release.
7. On the following listener visit, preparation adopts command21 and `00432590` dispatches `0051a2a0`. Listener id2 selects preacher id1 as both target+0x72 and workTarget+0x89, then `0051e150` requests `004ed8a0(10,9,255, preacher.position)`. The probe stops before that allocation at return0051e180. All four one/two-listener × worship/move cases reach this identical honest boundary. No encounter allocation stub or fight/damage/kill result is supplied. For two listeners, the first following visit stops there, so second-listener completed targeting is not claimed.

`0043aec0` is a distinct native release scan used by the sermon body at its own release stages. The newly saved `0043abf0.asm` includes that adjacent routine; it does not establish a pre-packet UI cleanup. Retained exports `0043a4d0.c`, `004d83b0.c`, `004d2740.c`, `00444f60.c`, `004d4690.c`, `004d44e0.c`, `0051e5e0.c`, `0051a2a0.c` and `0051e150.c` support the caller map. `004d23d0.asm` is a Capstone disassembly of the verified mapped PE, not a new Ghidra export or recovered source.

## Converted Brave and ordinary controls

`final-converted.json` starts the same real command17 acquisition, then schedules the original sermon command body and `004d83b0` listener body until native timer expiry/RNG permits conversion. No conversion timer, probability or force flag is changed. Saved `unforcedInputs` assert both force gates are off. Conversion occurs on supplied visit1328.

The real allocator `004ed8a0` and constructor dispatch `004ed580` / `004d23d0` / `004d5920` allocate Blue model2 person id640 from supplied finite linked free records. Original code generates life975, movement, and replacement flags. The old Yellow person becomes class0/deleted. Original conversion effect allocation and original deletion run too. This is real native replacement, not assigning two conversion flag bits to a synthetic Brave.

Native tribe-list rebuild `004ecac0` then registers the replacement into Blue's command roster. The fixture deselects the preacher and selects the new Brave; complete `00444f60` accepts command27 targeting synthetic scenery id100. Twenty complete native person visits, with native motion/route/worship/place consumers, reach admission `004fb270`, which counts [1,0,0,0]. Flags4 remain exactly0x20840100 and flags3 exactly0x01040104 through admission, including conversion bits0x40000 and0x1000000. No flag clearing or eligibility override was used. This does not prove an original UI click selection or a natural world scheduler history.

`final-ordinary.json` issues command27 to the non-sermon synthetic Preacher and reaches the same admission count after30 native person visits. Thus this fixture does not merely fail all worship paths. Both controls stop after first admission; the complete work/reward/erosion effect is not rerun. Existing worship components retain that separate scope.

## Mission3 authored record to observed runtime shrine

`mission3-head-binding.json` hashes the private levl2003.dat and relevant current/QA source bytes. It maps by unique position, class/model, linked reward, and constructor behavior, not numeric identity alone:

- Authored index101 is class6/model6 at unsigned native (256,34048), signed y=-31488, browser(-7,115). Settings: mode0/range1/required1/target40/remaining1. Link token104 resolves authored index103.
- Authored index102 is decorative class5/model9 at exactly the same position, heading1536. It is distinct from the trigger and from the port's assigned shrine ID.
- Authored index103 is class7/model23 Erosion effect at native(63744,35072), browser(-15,111).
- `world-initialization.ts` resolves `candidate.index+1`, recognizes class7/model23 as erosionEffect, supplies the effect target and native worship fields, and assigns the shrine `w.nextId++`. It does not assign `id=authoredIndex`.
- The actual QA snapshot `m3-milestone-conversion.json` at turn8282 contains the unique runtime erosionEffect shrine id101 at(-7,115), active, remaining1, zero work/uses/followers. The relevant constructor, coordinate mapping, worship and level bytes match between pinned main and QA checkout. Later supplied campaign facts describe the same runtime shrine. No assumption is made that original-game IDs equal either authored indices or port IDs.

This confirms mode0 is an ordinary one-follower head; it does not require the Preacher specifically. The converted-Brave native witness supports eligibility of that type with its conversion flags. It does not show that the campaign Brave3298 has already reached/admitted to that particular shrine.

## Port correspondence and unresolved boundaries

Current port source has explicit immediate release in `appendLiveOrders` (live-movement.ts:322) and `cancelLiveOrder` (:427). The worship UI path in live-command.ts creates a head order, then `release`/`releaseTasks` calls cancellation before `startLiveOrder`; the state23 world-turn branch runs `stepLiveConversionVictim` then continues. `cancelConversionVictim` clears ownership and listener flags. These are source observations, not new live QA or proof of the entire port/native UI call chain.

The native witness begins at the simulation packet consumer. It therefore leaves the precise frontend/C1→packet caller cleanup and its comparison with the port's shipped UI as the missing boundary before labeling the immediate-release difference a runtime defect. It also leaves actual full-world interleaving and exact combat timing unproved. Do not change cancellation timing from this packet-only comparison without that closure/review.

The actual campaign observation remains: Blue Preacher3181 had converted a different Yellow listener, Yellow52 was still a listener, worship was accepted, and Preacher3181 later appeared in melee and disappeared. The fatal interval and exact killer were not captured. This research supports a possible original released-listener combat path; it cannot attribute that campaign death to Yellow52, Erosion, any spell, retaliation, or the port. Move orders can also release the listeners into this native attack-order path, so the control is not evidence that moving is tactically safe.

No application correction, parity credit, PR220 expansion, QA run, replay, campaign intervention or further open-ended native work is proposed by this deliverable. The finite native inquiry ends here for independent review.

## Retained bring-up attempts

Prior probes/results remain separately named. Attempt01 handoff used the wrong head packet field and did not advance sermon approach. Attempt02 corrected that but temporarily supplied00508f70 under a mistaken presentation label; its interpretation is invalid for gameplay, and that intercept was removed before attempt03 and all final results. Attempt04 extends to the explicit encounter-allocation boundary.

Conversion attempts01/02 retained a too-short observation window (and attempt01 a wrong unused low-pool pointer); neither proves inability to convert. Attempt03 detected only the low pool, missed the real high-pool replacement at1328, and continued the deleted actor, so its continuation is invalid. Attempt04 correctly stops on the native replacement. Attempt05 tried input before the required native tribe roster rebuild; it is a fixture boundary, not converted-person rejection. Attempt06 adds the real rebuild and succeeds. Final runs additionally assert unforced inputs and use target40 for the synthetic head. Only the final sealed results and verifier support the claims above.
