# Final reincarnated-Shaman burst: historical evidence (#30)

## Reconciliation on 2026-10-19

The original source-only assessment below records inspected main `1c7e6b05`
on 2026-10-06. Its proposed proof stages are historical, not instructions to
repeat work already accepted. The static packet is preserved unchanged; later
results remain at their exact evidence commits rather than being copied here.

- **Creation:** the [fixed success result](https://github.com/JohnDeved/populous-new-dawn/blob/72a18e461a9c3ffaf71815e5a22afb77f549d7dc/references/verification/reincarnation-phase5-success-2026-10-06/attempt-01/README.md)
  and [independent ACCEPT](https://github.com/JohnDeved/populous-new-dawn/blob/72a18e461a9c3ffaf71815e5a22afb77f549d7dc/references/verification/reincarnation-phase5-success-2026-10-06/attempt-01/result-review.md)
  bind executed source `dbec147f4aae79a40a917b195f7d8d3b58d63bf8`.
  One supplied phase5 call made 34 successful allocations and consumed 98
  gameplay / 32 cosmetic advances, including the person's two gameplay draws.
- **Allocation controls:** the [three results](https://github.com/JohnDeved/populous-new-dawn/blob/06345b16e8bbc4bba01ce1e49ded79d9b8291940/references/verification/reincarnation-phase5-controls-2026-10-06/results-01/README.md)
  and [independent ACCEPT](https://github.com/JohnDeved/populous-new-dawn/blob/06345b16e8bbc4bba01ce1e49ded79d9b8291940/references/verification/reincarnation-phase5-controls-2026-10-06/results-01/result-review.md)
  bind source `b970c05e933ab286e888e717773297f72fa5e3c1`: person failure
  with low-pool burst success, person success with burst failure, and both
  exhausted. These were single calls, not a later retry or capacity restoration.
- **Scheduling:** the [eleven-call result](https://github.com/JohnDeved/populous-new-dawn/blob/5732cc327cadde206d00f92a58291ef5f5040208/references/verification/reincarnation-scheduled-burst-observer-2026-10-06/attempt-02/README.md)
  and [independent ACCEPT](https://github.com/JohnDeved/populous-new-dawn/blob/5732cc327cadde206d00f92a58291ef5f5040208/references/verification/reincarnation-scheduled-burst-observer-2026-10-06/attempt-02/result-review.json)
  bind source `b48519e0bf7a39bd9ea7b401e01e3fbe731441c9`. Creation occurs
  on call 6, first birth visits on 7, root retirement on 8, root free on 10,
  and root-handle reuse on 11. All 32 birth children retire by call 11, but
  their free completion is beyond the stop. The older wave remains alive.
  The [failed/inconclusive first attempt](https://github.com/JohnDeved/populous-new-dawn/blob/b48519e0bf7a39bd9ea7b401e01e3fbe731441c9/references/verification/reincarnation-scheduled-burst-2026-10-06/attempt-01/README.md)
  remains preserved; the later pass does not reclassify it.

These are accepted supplied-state original-component results, not complete
mission/death history or application equality. Body, pools, terrain, tribe and
RNG context were supplied; the scheduling result also supplies later ordinary
Shaman and outside-world/presentation consumers. The linked reviews retain
the exact limits and raw receipts. No native or browser execution was repeated
for this reconciliation, and no gameplay repair or parity claim is added.

The [2026-10-11 issue correction](https://github.com/JohnDeved/populous-new-dawn/issues/30#issuecomment-6110102097)
identifies the remaining boundary as shared allocator/visit ownership and live
composition, **not missing initializer bytes**. The full end-exclusive ranges
`004d23d0..004d2717` and `004d5920..004d5b5c` are retained in the
[phase5 preparation packet](https://github.com/JohnDeved/populous-new-dawn/blob/dbec147f4aae79a40a917b195f7d8d3b58d63bf8/references/verification/reincarnation-phase5-preparation-2026-10-06/native-boundaries.txt).

Source inspection at main `eb69ebd3c9ccef7c7739d61bc7f8eaa2c162fc44`
still finds the spawn edge calling `addUnit` without model9 in
`app/world-turn.ts`; `app/world-state.ts:addUnit` creates `native: null`, and
`app/live-people.ts:createLivePerson` derives its counter from `(w.turn - 1) & 255`,
not the supplied shared class1 allocation seed. Native mixed person/wave visits
are not established by the separate live passes. Copying observed counters,
flags or object IDs would not resolve those owners. The [later live proposal](https://github.com/JohnDeved/populous-new-dawn/blob/5732cc327cadde206d00f92a58291ef5f5040208/references/verification/reincarnation-phase5-live-proposal-2026-10-06/README.md)
is a historical proposal with these limits, not accepted runtime implementation.
An ordinary public-input, elapsed-clock Mission2 witness remains separate from
the fixed-step diagnostic described below. Issue #30 is not completed here.

## Original source-only assessment (2026-10-06)

The following assessment and proof plan are retained as written at that time.

## Finding and bound

At inspected main `1c7e6b05687aca14d9350e17c7ae14dc6c68bb97`, ordinary
reincarnation creates the new Shaman without the original final class7/model9
burst. This is one actionable composition gap in the shared Missions1–3 path.
It is distinct from the accepted mode2 site wave, grounded spirit correction,
and startup Wildman conversion. **This assessment authorizes no runtime repair
and claims no new executed native, gameplay, raster or parity evidence.**

The [static packet](../../references/verification/reincarnation-final-burst-2026-10-06/README.md)
retains exact EXE bytes/disassembly, source hashes and reproduction. Only PE file
reading and disassembly ran. No original instructions, application, npm command,
browser, Ghidra, aggregate/build or shared-resource job ran.

## Reconcile accepted work before extending it

- [PR203](https://github.com/JohnDeved/populous-new-dawn/pull/203), reviewed head
  `8fe6631979f81dd462c6fa10468fca98d3b82361`, merged at
  `dcfb0dc2afe3e2501f964b109933e43d8bdbd451`. Current `world-turn.ts` still
  calls `createReincarnationWave` at remaining6; its separate newest-first effect
  owner, mode2 consumers and checkpoint fields survive. Reuse the corrected
  [wave evidence](reincarnation-site-wave.md), including its superseded-search
  warning and the accepted five wave visits before the first spawn request.
- [PR212](https://github.com/JohnDeved/populous-new-dawn/pull/212), reviewed head
  `c5a5042fa4db91ba782a889dc4c4c309462726e1`, merged at
  `596475b6839c948604897f8b68ff89c6290cf39d`. The current caller still samples
  `nativePosition(w, visual).h` only for processed phase1. Reuse its
  [ground evidence](shaman-death-vfx.md#phase1-ground); do not repeat that proof.
- [Issue30](https://github.com/JohnDeved/populous-new-dawn/issues/30) owns this
  death/spawn presentation seam and remains broader than it. Existing body,
  frozen rise, hidden wait and [cadence](shaman-death-cadence.md) stay accepted.
- [Issue73](https://github.com/JohnDeved/populous-new-dawn/issues/73) owns Hut
  smoke. Its latest comment correctly records merged PR173, including children
  and the shared secondary owner. The relevant intersection is only primary
  class7 counter/RNG/resource ordering; this assessment changes no smoke files,
  counters, secondary capacity, legacy bootstrap or allocation ownership.

Old browser observations establish their exact accepted sources, not fresh
current-main execution. This assessment verifies current source presence only.

## Original caller and the missing live edge

The retained death evidence traces `004d5cf0` ordinary eligible death →
class10/model12 allocation → `00500a30` / `00502910` initialization →
`00500e20` / `00500ec0` → `005029d0`. Existing probes establish body/spirit
phases and the phase4 wave but replace the final `004da0f0` leaf: the old
lifecycle checker fabricates a successful person; the corrected wave checker
returns zero. Neither composes real final person allocation with its companion.

New static observations from the pinned EXE:

1. `00502d7e..00502e32` enters phase5. Shaman classifier7 copies saved tribe
   site XYZ, avoids allocation if the tribe already has a Shaman, otherwise calls
   `004da0f0(7, owner, site, 0)` at `00502e28`. Unlike the earlier phase4 wave
   branch, this Shaman path has no surviving-population test here. That is not
   permission to change browser death/defeat eligibility: native defeat cleanup
   is a separate owner, as the accepted height note explains.
2. `004da0f0..004da16d` writes its linked person-initialization arguments, sets
   the allocation-argument flag, calls `004ed8a0(1, model, owner, point)` at
   `004da150`, retains that result, and then calls
   `004ed8a0(7, 9, owner, point)` at `004da160` without testing the person
   result. It returns the **person**, not the effect.
3. Indexed `004ed8a0`/`004ed580` and `00509c10` dispatch class7/model9 through
   the effect preinitializer `0050bcd0` to `0050ccd0`. The preinitializer first
   clamps the saved site's height to current terrain; the default burst then
   adds90 native height and makes32 model3 allocation attempts. Record saved
   site, current ground, root and child heights separately. Only successful children
   receive the producer's lifetime/speed/direction writes and its three gameplay
   RNG draws. The real model3 initializer `0050bf60` separately consumes cosmetic
   RNG; that initializer was supplied in the old isolated effect9 probe.
4. On a nonzero person result, `00502e36..00502e60` plays cue107 for the local
   Shaman, clears person+0x5d and deletes model12. On zero, `00502e34` returns
   without deleting or leaving phase5. Thus failed person allocation retries on
   later eligible visits, potentially making another companion request. A failed
   model9 or failed individual child is not retried by that same burst invocation.
   The earlier phase4 mode2 wave remains a separate one-shot opportunity.

`004ed8a0` prepends successful records; `004ec6f0` caches the current next
pointer before processing. This supports a next-turn first scheduled visit for
the newly created person/root/children. Their actual composed ordering and
allocation/free-list effects must still be executed before implementation.

The current live chain is `game-store.ts:startMission` →
`world-initialization.ts:createWorld` / authored startup → normal combat and
death collection in `world-turn.ts` → `stepReincarnation` → spawn branch.
That branch calls `world-state.ts:addUnit`, cue107, optional selection, and body
expiry. `addUnit` only creates/pushes a Unit. There is no model9 request or
spark producer on this edge; the normal effect loop already ran earlier that
turn. This omission follows directly from the complete branch and callee.

## Reuse without conflating startup behavior

`level-start-runtime.ts:stoneBurst`, `levelStartBurstParticle`,
`createSpellTrail`, `stepSpellTrail`, existing sprite assets and the effect
traversal are candidate reusable parts, not accepted complete final-spawn proof.
The five original effect9 producer cases in `check-native-level-start.py` cover
160 supplied child records and producer RNG, with allocation/registration leaves
intercepted. Reuse those cases rather than describing them as full allocation.

Mode1 startup conversion uses `004d7fd0`: replacement Brave, neutral linked
model58, owner model58 and conversion sound. Mode2 wave affects eligible enemy
followers and does not convert Wildmen. Final `004da0f0` requests a person and
model9. These are three different producers. Never attach model9 to every
`addUnit`, count an unconditional33 successful class7 allocations, or transplant
startup conversion/stone behavior into all Shaman allocation paths.

## Minimum next proof, then one ordinary witness

The next authorized phase should be an evidence-only probe, with its result
independently reviewed before any runtime change. The first executable freeze
is **one fixed phase5 success case**, not the complete matrix below:

1. Supply one phase5 model12 body, one declared low/high free-list state with
   enough capacity for success, fixed owner/site/terrain and both RNG seeds.
   Execute `005029d0` → real `004da0f0` → real `004ed8a0` with the actual
   class1 initializer and class7/model9/model3 initializers. Keep person
   registration, tribe Shaman-handle ownership, allocator argument-stack
   top/flag consumption, list insertion and body retirement visible. Record
   the successful person's native initialization and both RNG owners;96 burst
   producer draws are not the complete caller's RNG cost. Supply only identified
   rendering/audio/world leaves. Load original constants/search/animation inputs
   as required and guard every configured constant and mapped read-only region
   across setup and each call; avoid the former oversized reset. End at this
   one controller-call return. First scheduled visits, lifetime, capacity reuse,
   four-owner coverage and a browser comparison are not this first result.
2. Freeze a separate later creation/failure stage before covering all four
   owners/local audio, saved-site versus raised current ground,
   existing Shaman, and genuine free-list exhaustion: person failure while an
   effect slot exists; person success with root failure; root success with zero,
   partial and all32 children. Record requested and successful allocations,
   exact positions, class counters, both RNG streams, person result, body state,
   sound, root/child lifetime and links. Restore capacity only on the next visit
   to distinguish person retry from root/child and phase4-wave no-retry behavior.
3. Separately freeze the temporal stage: continue the real outer traversal from
   the accepted phase4 boundary through
   wave visit5, phase5 creation, first new-object visits and complete burst
   cleanup. This establishes ordering relative to the still-live mode2 wave.
   Snapshot the allocator immediately before the first final spawn request;
   do not invent a whole-game capacity model from an isolated case.
4. Only after those stages, compare with the actual browser world-turn caller.
   Current `addUnit` creates `native: null`; retain that initializer difference
   rather than silently supplying a native person to isolate pixels. The
   unchanged source has no final-burst producer, while existing body, wave and
   height behavior remain separately supported. Do not synthesize new HP,
   actors or timers to count as ordinary gameplay acceptance.

`check-browser-reincarnation-wave.mjs` is reusable only as a **fixed-step rendered
diagnostic**: it directly calls `command`/`tick`, writes `world.speed = 0`, and
calls `scene.animate` with supplied times. Its optional injected target/Swamp
section is excluded from this task. A bounded before/candidate adaptation can
observe body/site/wave/new-Shaman IDs, both RNGs, spawn-frame spark contribution,
checkpoint continuation and cleanup; it is not ordinary elapsed-time acceptance.

A separate later ordinary Mission2 witness must enter through shipped mission,
Skip/H and public pointer attack controls, let the existing elapsed-time game
clock advance, and reach combat death/reincarnation with surviving followers.
It must avoid direct `tick`/`command`, speed0 clock substitution, supplied
`scene.animate` times, injected targets/Swamps, or supplied HP/actors/timers.
Record the same identities and visible final burst, and exercise public
Save/Load and pause without replay. The accepted command-adapter evidence
supports route feasibility, not an already-proved public-pointer/natural-clock
witness. If that route encounters a blocker, report it instead of relabeling
the diagnostic. Add portable Missions1/3 caller coverage; expand ordinary
mission coverage only if the composition exposes a mission-specific branch.
No repeat of PR212's Land Bridge/phase1 height journey is needed.

Stop this source-only phase after the indexed assessment and retained static
packet. Do not implement before the final-person/companion boundary is proved;
if it needs wider primary scheduling/capacity work, report the exact missing
owner and retain this burst as a separate bounded task. No global allocator,
modernization, combat/point-order (#243), Hut-smoke, outcome, startup conversion,
assets, deployment, fixture recording or parity-ledger change is in scope.
