# Ordinary Mission 1 Hut dismantling acceptance

Refs #25. QA coverage of existing gameplay; no runtime fix or new parity credit.
Ordinary01 is retained as a failed browser episode below.

## Source and staffing boundary

Base: `1a9314fc0a047f9f1effba6826ccfd46e07ad39c` (PR294 merged). The previous
product base was `ec0316dc8555c547a9762e314c2c74ef92ead0a2`; PR294 adds the
maintained typed checkpoint observer without changing gameplay.

`mission1Huts()` resolves the two authored Blue model1 Huts (DAT indexes41/42)
by native anchor and angle, then records their actual live IDs. DAT indexes are
never used as runtime IDs. The ordinary opening can already have generated and
admitted residents: the composed opening at turn380 resolves live Huts36/37 with
one resident each, IDs1186/1188. Those numbers are evidence from that run, not
inputs to the proposed browser episode.

The smallest viable method is to reuse one naturally singly staffed Hut. Require
a healthy, complete, unburned, non-upgrading level1 Blue Hut and one living Brave
in its exact physical slot with a valid retained resident record, no incoming
workers/queue/builders, no carried cargo and no concurrent timber work. Clear
selection through the public control before pointer dwell. Recheck readiness at
the actual Dismantle click. A later population arrival invalidates readiness.

This freezes one method. If neither authored Hut becomes eligible within the
declared readiness budget, stop with the observed roster. Public housing command8
or moving existing occupants out would be separate setup work requiring its own
composed test before browser use. Do not add residents, delete residents, suppress
population or silently substitute a different method.

## Finite public episode proposed for independent review

1. Start Mission1 through shipped controls. Prewarm observer imports, public
   settings/save/load controls and the maintained input geometry helpers before
   work starts. Wait for the real opening and camera/input readiness. Resolve
   authored Hut identities and one eligible resident dynamically.
2. Use maintained minimap/pointer inputs to view that Hut. Clear selection and
   let the actual pointer dwell open its inspection panel. Click the shipped
   **Dismantle hut** control. A synchronous before/after event observation must
   show the retained resident object become the registered `entry.person`, one
   referenced command10 targeting that Hut, and activity `0x8000`. Do not use the
   generic command10 dispatch helper's immediate-order oracle.
3. Observe every actual fixed turn synchronously. Keep scalar status and only
   meaningful transfer/drop/ownership events; cap retained events at64. Track
   each epoch's contiguous first/last/count of every fixed-turn visit separately
   from that event cap; a skipped turn or overflow is terminal. Poll that
   lightweight status, never a full World or full-history record. The first
   transfer removes100 of the Hut's300 native timber units. Use public Pause,
   then Game settings immediately. Require100 or200 units still remaining at
   the paused Save click; completion before pause is a failed checkpoint episode.
4. Reuse `armTempleCheckpoint({kind, store, button, snapshot})` unchanged from
   PR294, supplying `hutDismantleSnapshot`. Its historical Temple name imposes no
   model5 restriction. Require the trusted Save click's synchronous publication,
   committed IndexedDB full typed digest equality, and a valid partial-work
   snapshot. Keep the captured World private inside the accepted helper.
5. Click public Load in the same session. Compare its synchronous replacement
   against Save's `expectedLoadDigest()` (the production migration of a private
   clone), before the actual Page body auto-resumes. Require matching target,
   worker, command references, remaining timber, cargo and individual loose-log
   IDs. Before clicking Load, arm the maintained `armBuildingSceneStart` boundary
   from `mission3-building-lifecycle.mjs`; attach the new epoch synchronously at
   Scene start before its first RAF, with no host-roundtrip gap. Do not carry old
   Scene identity claims across replacement. No fresh-page continuation/profile
   is needed.
6. Let normal play finish. Move the pointer away using real input. Require target
   disappearance, the same surviving Brave, released entry/order/work/occupancy,
   cleared footprint and target panel/record/latch/reservation, closed menu, and
   exactly300 recovered native units. In one synchronous browser task, reject
   any earlier observer/checkpoint/start error or overflow, validate the unchanged
   full completion predicate, retain that snapshot and turn, and detach the
   dismantle-specific turn observer. Only then serialize the result and await the
   terminal screenshot. Close every remaining owned resource on success or
   failure and retain the first failure plus cleanup results.

Proposed browser admission budgets:360seconds overall,30seconds after normal
opening for staffing/panel readiness,120seconds per natural work segment,
10seconds for committed readback,15seconds for public Load, and20seconds for final
cleanup. These bound resource use; work counters32–63 do not guarantee wall time.
The maintained-harness scenario is now `scripts/local-render/mission1-hut-dismantle.mjs`.
It declares one attempt,360seconds inner,400seconds outer and15seconds termination
grace. Exact changed-wrapper review and parent resource admission remain
prerequisites to another launch.

The next proposed attempt uses fresh output
`work/orchestration/mission1-hut-dismantle-ordinary-02` and private profile
`work/local-render-profiles/mission1-hut-dismantle-ordinary-02`. The original
ordinary01 profile and committed Save remain untouched. Port4373 is within the
harness's supported range; its earlier `ss` netlink permission denial is retained
without retry. The parent owns an authorized owned-server bind/fetch/close
preflight and the final CPUs5–7 lane binding. Canonical installed dependencies
remain stationary (device27,
inode538212); this worktree only holds a symlink to that directory.

The wrapper prewarms imports and public settings controls before work. The
browser-local witness executes the same portable plain-data contracts on every
actual fixed-turn callback, forwards the original receiver/arguments, tracks
contiguous epoch visits and retains at most64 meaningful events. Host polling
reads scalar status only. It records `hut-partial-work.png` before its host state
assertion. The terminal snapshot is validated and detached synchronously first;
`hut-terminal.png` then precedes the repeated host assertion on that frozen
snapshot, keeping the camera view where possible.
Failures retain the original error, a bounded terminal screenshot attempt and
owned-resource cleanup evidence, including synchronous input and Scene-start
facts even when a host operation throws before its normal result readback.

## Exact resource and caller contracts

`hutDismantleSnapshot()` reads existing owners without creating admission, damage
or person records. `hutResidentIdentity()` retains a private resident reference
solely to prove the synchronous owner handoff. Neither writes gameplay state.

The ledger counts remaining plan timber plus the worker's net cargo plus newly
created, individually identified model11 loose logs. It rejects baseline timber
loss, unrelated harvesting/delivery/cargo, reservations, burning, damaged workers,
extra staff, retained orders and missing/duplicate recovered logs. Each actual
turn must be observed. A work-phase transfer changes remaining/cargo by100 with
no new log; a separate drop changes cargo by-100 and allocates exactly one log.
Baseline scenery may grow; it may never shrink between adjacent observations.

Building health legally follows dismantle progress on the following building
visit (`building-runtime.ts`), so per-turn health is compared to the preceding
progress instead of requiring170 throughout. Target damage/burn fields still
must remain clear. `world.wood` is the displayed scenery total, recomputed before
the later unit work (`world-turn.ts`); it is diagnostic only and contributes no
recovery credit. The composed result is100 carried +200 in two dropped logs,
not an asserted three-log bank credit.

Actual callers: `building-panels.ts` Dismantle listener →
`live-building-entry.ts` resident reassignment/order10 → `building-dismantle.ts`
work phases → `timber.ts` transfer/drop → ordinary world cleanup. Retained native
producers00497a30/00498140/004a7860/004ba2c0/004d58c0 remain historical component
evidence only. This work neither executes native tools nor reconstructs missing
original-game history.

## Verification and explicit limitations

`tests/mission1-hut-dismantle.test.mjs` composes the authored M1 opening and natural
resident with the real pointer-dwell caller, shipped Dismantle listener, fixed-turn
work, actual store Save/Load, unchanged PR294 observer and exact Page Load body.
It verifies the full typed production-migrated Load digest, then completes work
and checks300-unit recovery and cleanup. Failure-first mutations cover extra
residents/workers, damage, unrelated timber work, missing original/recovered
timber, wrong scenery model, retained order/panel/menu/reservation.

The Node fixture supplies DOM/projection/frame deltas, a click token, a store
World binding, pause state, and a presentation cleanup adapter. Its Save returns
false without IndexedDB, which is asserted explicitly. This is model-composed
caller coverage, not committed Save, trusted browser input, actual rendering,
ordinary completion, performance, or native acceptance.
No application source, checkpoint helper, parity manifest or generated asset is
changed. Full check/build and native execution are not run. Browser admission is
separate from this bounded source-preparation authorization.

`tests/mission1-hut-dismantle-witness.test.mjs` additionally executes the exact
Page Load body, actual store replacement and `GameScene.start` with a distinct
Scene receiver, fresh `ObjectPanels` and real presentation binding. The maintained
start hook attaches the second epoch before its first supplied RAF; real
`advanceGame` then drives multiple fixed turns per callback without losing any
visit. It verifies migrated object/order identities, typed boundary equality,
event-cap independence, observer-error continuation, skipped/duplicate rejection,
partial input installation cleanup and foreign-owner preservation. Constructor,
WebGL/DOM, event trust, disposal and RAF scheduling remain supplied test boundaries;
this is not an ordinary browser Scene-installation receipt. Seven combined cases
pass in `wrapper-caller-02.json`, with all tested inputs held unchanged.

All attempts are retained under `work/orchestration/mission1-hut-dismantle/`:
caller01 rejected adding a Brave to a naturally occupied Hut; caller02 failed an
unnecessary preliminary occupant-control setup before dwell; caller03 exposed the
following-visit health contract; caller04 rejected an incorrect unchanged-global-
wood assumption. Caller05 passed the finite model sequence; caller06 additionally
passed the maintained typed observer and actual Page Load body. The initial
receipt-output preflight failure is separately retained under
`work/mission1-hut-dismantle/receipt-preflight-01.txt`. These are QA preparation
failures, not evidence of a product defect. Final committed-source receipts and
review status belong in the PR.

`wrapper-caller-01.json` is retained as invalidated: the new supplied renderer
lacked a DOMRect method, and the test author completed that fixture correction
while the attempt was finishing. The subsequent `wrapper-caller-02.json` passed
with no source drift. The exact preparation source83a42674 received independent
ACCEPT; the wrapper successor requires its own exact review and quality binding.

## Ordinary01 failure and bounded observation repair

The independently accepted wrapper `aef6c7ca` ran once under the parent's exact
admission. `work/orchestration/mission1-hut-dismantle-ordinary-01/` retains the
terminal failed receipt, raw episode JSON, partial/terminal screenshots and
original profile. Actual Save325 contained200 remaining units and log1190;
its committed typed digest matched, and public Load matched the expected
production-migrated digest before the new Scene's first frame. Transfers occurred
at311,374,441 and entry/order release at442. The full snapshot at445 had target
gone, worker1186 alive with100 carried and logs1190/1191 totaling200, with cleanup
complete. This is observed evidence within a failed episode, not an acceptance.

Observation continued while awaiting the screenshot. By close456, the last100
had become log1192, consistent with the existing native resting path. The
still-attached dismantle observer rejected a drop because its unchanged oracle
requires a prior command10. The actual failing adjacent pair and callback were
not retained; the failing visit is bounded only to446–456.
`live-resting.ts` and `person-idle.ts` establish the distinct resting caller,
not a permanent command10 or registered-owner guarantee after completion.

The repair adds a narrow synchronous `finish()` at the existing epoch close
boundary. Early completion, ownership loss, prior observation/checkpoint/start
errors and overflow cannot yield a successful finish. Successful close caches
the exact terminal snapshot and visits; later cleanup cannot replace them with
resting state. The driver still performs the same public inputs and full
completion assertions. The composed regression continues real `advanceGame`
after detaching until the same worker's native resting drops the final cargo,
checks continued original callbacks and frozen evidence, and proves that the
command10 drop assertion remains strict. Its exact drop turn is Node fixture
evidence and does not identify the missing ordinary01 visit. A fresh ordinary02,
with the same360/400/15 bounds and one attempt, requires exact review and admission.
