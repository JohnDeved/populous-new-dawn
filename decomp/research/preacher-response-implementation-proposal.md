# Issue243: bounded producer repair and validation proposal

Proposal only, following the [accepted supplied-state result](../../references/verification/preacher-response-trigger-2026-10-06/README.md).
No application patch or additional execution is authorized by this document.
The immutable native execution identity remains `dd6e4202`; the first observed
omission is established, while ordinary acquisition and lifecycle acceptance remain
open. Do not attribute earlier Mission3 deaths to it.

## Smallest first runtime change

Keep `startPreacherResponse`'s existing primary detection and command21
allocation/preparation/attachment/sharing path intact. A generic miss alone does
**not** authorize32: it can miss native primary4/7 threats. After that miss:

1. Require source model4 and the inverse of recovered004df140: do not start32
   for state10/33 with an active, noncancelled current17/31/32, substate>1 and
   speed0. Immediate-order precedence remains `currentPersonOrder`; do not fall
   back past a cancelled immediate order. Require the live source's actual speed,
   rather than defaulting a missing field to stationary.
2. Require a separate exact native-primary miss at the original primary center and
   radii. Its candidates are class1/model4-or7, raw+0x9d zero, outside flag0x800000
   clear, state-flags0x400 clear, life>0, flags2 bit0x10000 clear, no vehicle,
   no invisibility, and source→candidate enemy/disguise eligibility. It must not
   reject a candidate merely because its cell is water or its state is23: those
   are extra generic filters absent from0051f030 primary. Read the actual owned
   fields; unknown registration/record data cannot silently mean a native miss.
   If generic detection misses but this native predicate hits, return no new32.
   That is an explicitly unrepaired primary-response omission, not permission to
   create32 or quietly replace the existing21 path.
3. Search the native secondary square: aligned source center, radius arguments2,2,
   3×3 whole wrapped cells in row/column order. The branch needs only existence
   of a qualifying candidate, not its identity. An ordered movement range1
   currently limits `combatWorld` to one cell. Retain the primary world's existing
   range; after its miss, reuse it if range>=3 or build the secondary view with
   range3. Do not accidentally restrict the secondary scan to the primary range or
   expand the existing primary decision through a larger object view.
4. Add small Preacher-specific predicates/traversal beside the existing
   combat predicates, reusing cell iteration and disguise/alliance primitives.
   Candidate: class1, model neither4 nor7, non-wild tribe, raw+0x9d word0, state
   other than23. Directed eligibility is candidate→Preacher: source life>0,
   source flags2 bit0x10000 clear and flags4 bit0x1000 clear, different/non-wild
   tribes, **candidate's** alliance mask, both disguise checks and the existing
   directed model restrictions. Do not substitute `eligibleCombatPerson` with
   swapped arguments: it adds inside/state/vehicle/group filters absent here.
   Bind the candidate's actual owned `workFlags` word explicitly; the current
   `combatPerson.group` derives from `u.fight?.group` and is not a substitute
   for every native+0x9d value. Avoid changing generic combat eligibility.
5. Allocate one record only after detection. Failure returns no installed ID and
   adds no order, flags2, path, membership or ownership changes; retain the
   dispatcher's already-required pending-scan consumption. Success prepares
   **model32 / flags32 / raw current XY**, sets source flags2 bit16 and attaches
   slot−1 through the existing reference-counted helper. Preserve all queued orders.
   Do not invoke `peers` or `shareCombatOrder` for this branch.
6. Return the installed order ID to the existing live wrapper. Its API already
   reports allocation identity; copying native AL0 would wrongly prevent adoption.
   Tests retain the native AL0 observation separately and compare installed state.

Command32 is a point payload. `prepareCellOrder` currently accepts10/11/19/21
and treats payload words as packed cells; widening that union would be wrong.
The narrow preparation prerequisite is to reuse `prepareMovementOrder`'s point
body with an explicit model3-or32 argument/default3, or an equally small shared
point helper preserving all existing3 callers. Relevant native descriptor bits
match (model3 flags0x4524039, model32 flags0x820081): point bit1 set,
coast exemption0x10000 clear, building correction0x20000
set, and object conversion0x80000 clear for both3 and32. Preserve unchanged-record
flag behavior and real coast/building callbacks. Existing movement-preparation
evidence supports this common body; the accepted32 row proves dry raw-XY output.
Do not add terrain normalization directly inside the response producer.

This intentionally preserves current primary21 behavior, not a claim that its
generic scanner equals all of0051f030. Fight objects, game-flag/model interactions,
primary group/state differences and the native friendly-listener rescue fallback
remain separate producer boundaries. The secondary helper must not silently add
  those behaviors or claim whole0051e7b0 parity. The intersection of a generic miss
and a recovered native-primary miss is deliberate conservative32 admission; it
retains existing false-positive21 outcomes until their own scoped repair. Likewise, existing `combatWorld`
live-person filtering is not evidence for arbitrary dead raw cell-chain entries.

The admitted no-miss equivalence is source-bound: every native-primary candidate
must have coherent live/native position, health, tribe/flags/group/vehicle fields,
be on a nonwater scanned cell and not be state23. Under those conditions the other
generic filters accept a native-primary candidate. The exact veto removes reliance
on the water/state assumptions when deciding new32 admission. Neither primary
predicate excludes airborne flag0x400 by itself; do not add that extra filter.

Do not fix cell-order machinery in this slice. The current adapter passes a linear
cell index to `objectsInCell`, whose decoder expects packed cell coordinates; its
fallback still returns every row member. Existential detection/veto can preserve
the branch decision, but this is not evidence for native first-object ordering.
No new target ID is stored by command32, and the source's XY remains its payload.

## Initiating-person adoption contract

`startLiveCombatResponse` currently populates its adoption list only when `peers()`
is evaluated by sharing. Initialize that list with the initiating `{unit,person}`
before allocation; preserve the current lazy peer-list population for the21 path.
On a successful32 ID, run the existing initiator adoption once: cancel resting
ownership if applicable, clear the previous live path, clear harvest/target,
install the same person record and register it. Do not create another person,
clear the queued command, share the order or run startup/sermon inside this wrapper.

Retained person: preserve registry identity and membership0x20000; no duplicate
insertion or chain reorder. Fresh person: retain `createLivePerson`'s selected
record, adopt it only after successful allocation and register exactly once.
Allocation failure must not adopt/register/cancel paths even for the fresh case.
The accepted native case covers retained ownership only. Fresh-person/path tests
are explicit port integration regressions, not borrowed original-history evidence.

## Minimal before/after checks and evidence reuse

First preserve the accepted native/old-port files untouched. A new candidate-only
replay of that exact positive fixture should change the production result from
false/no allocation to installed32 with the accepted person/pool/queue/RNG state;
the public wrapper may correctly return true. Do not edit the historical runner's
expected-failure assertions or rerun its original instructions to obtain this row.

One later, separately predeclared native packet needs only four controls:

| Control | Expected boundary | Existing evidence versus new work |
| --- | --- | --- |
| Stationary sermon | Source active17/state10/substate3/speed0, assignment64 clear, same Brave: predicate true, no secondary call, no32 | Predicate bytes are known; one new native call proves this branch dynamically. Portable tables can additionally cover31/32, speed!=0, substate<=1, cancellation and immediate precedence from the static predicate. |
| Reverse alliance | Original positive case, only enemy tribe1's alliance bit0 set: secondary fails, no allocation | Accepted positive supplies the zero-mask comparison; one new native call proves candidate→source direction. Preserve source-only-alliance as a portable source-backed control, not an unobserved native claim. |
| Allocation exhaustion | Original positive encounter, all allocatable pool references occupied: scan succeeds but allocator returns0; full state/pool unchanged | Reuse existing allocator/order evidence and snapshot design, but one new native call is needed to claim32-branch exhaustion. Preserve every full-pool byte and both returns. |
| Primary21 with sharing | Source movement3, enemy model4, plus one eligible friendly model4 peer: primary AL2, secondary absent, command21 shared with correct references | Existing sharing/attachment evidence is reusable; one new full producer call must execute real00520480 and both real attachments. Predeclare the third person's fields/chain and the expanded code/read/write allowlist. |

Those are four fixed cases, not a randomized sweep or permission to execute.
Freeze their raw supplies, exact call graphs, fingerprints and finite launch
limits before review; reuse the existing supervisor. Do not run primary21 under
the old no-sharing allowlist or silently add callees after a failure.

Portable candidate checks also cover no enemy, adjacent/diagonal secondary cells
versus the outer boundary, exact registration and queue ownership, and retained
versus fresh initiator success/exhaustion. Add two explicit primary-veto fixtures:
an idle state17/range3 source on dry XY2100,2100, a hostile model4 at adjacent
XY2300,2100 in water category1, and a Brave in the source's dry cell; separately,
a valid hostile model4/7 in state23 with state-flags0x400 clear alongside a
qualifying Brave. The adjacent-water example requires range3; a dry-source
movement3/range1 primary scans only its own cell and is not that counterexample. The
generic miss must not allow32; the unrepaired21 omission remains visible. These
are source-backed controls, not claims of ordinary reachability or new native
execution. In particular, ordinary conversion-victim eligibility requires model
flag32, absent for models4/7, so the state23 case is a supplied source-domain
boundary. Source-backed field tables cover the
secondary exclusions without adding another native case batch. The21 writer and
peer outcomes must remain identical before/after in its declared control. A
representative response workload can check the added secondary-view cost later;
no performance result is inferred here. Standard check/build and affected quality
checks remain requirements for any eventual runtime candidate.

## Explicit prerequisite to ordinary acceptance

The known odd-command32 expiry discrepancy is still present: current
`stepPreachingOrder` checks its expiry outside the even acquisition gate. Accepted
native consumer evidence already shows odd counter17/timer32→33 returns0 with no
release, whereas the port currently completes/releases. Reuse that frozen row and
its even companion in a separate, reviewed consumer repair/replay; do not hide the
change inside the producer patch or call an injected32 row ordinary acceptance.

Before closing issue243, the normally produced immediate32 must pass real startup
to commandStatus32/substate5, listener acquisition/termination, correct even/odd
expiry, reference removal and restoration of the preserved queued command. Check
interruption and checkpoint continuation through the same owned record. The
accepted original response run stopped before every one of those consumers.
Existing order/startup/sermon evidence can be reused only at its supplied/intercepted
boundaries; a composed native-history claim needs a separately bounded proof.

Finally reuse ordinary Mission3 Temple unlock/build/training and issued movement
controls to observe the first actual automatic32 without actor/order injection.
Require exact32, rendered behavior and relevant Save/Load/interruption evidence.
Do not reuse an assertion accepting17/31/32 as proof of production. Until that
consumer prerequisite and ordinary path are validated, the producer delivery is
partial issue243 progress, not completed ordinary parity.
