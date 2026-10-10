# Connected Swarm identity decision after plan-removal closure

**Decision: no current ordinary port caller can yet consume an exact shared
physical owner without supplying allocation history the World never recorded.**
The smallest useful future consumer remains public `placeBuilding` → real
worker/tick → `prepareBuildingSite`. Its success/failure transaction is now
better specified, but that is not permission to initialize a slot ledger from
Buildings, browser IDs, authored ordinals or a late checkpoint.

This updates the accepted connected integration design once, after publishing
the constructor, class-9 initialization, admission, pre-request and retirement
closures. It changes no runtime, executes no tests, and proposes no new decoder.
Assessment base is main `721c3b08950fee0e19e4117bc7c516fe73d773c8`.

## What the completed source chain supplies

| Event | Concrete consumed contract now available |
| --- | --- |
| Plan admission | Command `0x0e` packed model/rotation/cell and tribe reach the complete `004b9a20` gate; only its nonzero low byte enters mode2. Same-cell callbacks after primary rejection remain ordered. Predicate side effects are not silently assumed pure. |
| Before plan allocation | `004ba7a0` enumerates current footprint cells and resolves actual occupants/linked handles without class9/person filters. Eligible linked states change, then mode3 re-resolves/removes by actual class. These effects precede the new request, with no rollback if it fails. |
| Class-9 initialization | An admitted slot is inserted at its supplied position, receives context/state, then relocates to the shape center before outer activation finishes. Physical ID, terrain handle and browser reference are separate concepts. |
| Class-9 cancellation | `004ba410` ends at the proved `004edcf0` transition: immediate unlink/class-zero/deleted and counter3 pending. It does not make the cancelled slot immediately free for the next request. Later pending traversal and pool prepend control reuse. |
| Plan → class-2 body | Retained `004b8470` and the accepted activation callsite require a distinct body on successful allocation. Failure preserves the plan and omits success-only body/progress/foundation/object-family changes. The post-attempt worker loop still runs on failure. |
| Ordinary new body constructor | Under pinned descriptor/config defaults, new Hut1/Camp7/Temple5 skip the specific nested class6/model9 gate; models2/3 alone enable it. That child therefore is not a universal blocker for the first Hut1 test. Native Vault18's zero gate does not imply a player-placement route. |
| Save/Load | Modern typed graph preservation can preserve a maintained owner and aliases. It cannot invent missing earlier slot/current-occupant history. Native binary save compatibility is not required here. |

The first two events also show why an admission boolean plus a newly assigned
Building ID is insufficient: earlier callbacks can change live identity state,
and a removed plan remains allocated in pending storage while the next request
chooses a different available slot or fails.

## Current real consumer and new radius owner

At this main revision, `construction-runtime.ts`, `live-command.ts`,
`world-state.ts`, `live-construction-runtime.ts`, the real
`building-preparation.test.mjs` caller tests and `level-start-fixture.mjs` are
byte-identical to the earlier `3b13a7ff` assessment. `prepareBuildingSite` still
has no shared-owner rejection result and uses the existing Building object for
the preparation/body transition. The fixture reaches the real opening via ticks;
it contains no proved native physical-slot state.

The two changed compared files are accounted for. `world-initialization.ts`
now initializes early AI radius state and rebuilds construction membership;
`game-store.ts` adds the corresponding bounded old-radius compatibility case.
`campaign-runtime.ts` explicitly projects the tribe `+0x885/+8` radius list from
maintained active Buildings and retains object references. That source-backed
consumer does not establish the global allocated/pending/free lists, the actual
XY cell chains, physical slot IDs or cross-class raw-ID occupants. Reusing it as
Swarm's identity owner would expand its contract.

## Remaining blockers that can change identity or alias observations

1. **Supported incoming shared request state.** The reset/index/allocate/retire/
   pending/free mechanisms are source-proved, but no ordinary World carries their
   real shared input stream through authored initialization and intervening
   person/effect/scenery/construction requests. Constructor nesting and request
   failures change counts, free-head choice and raw IDs. The current browser
   counter and final arrays cannot establish which slot was available when the
   real `prepareBuildingSite` request occurred. A fresh Mission1 fixture is not
   automatically an exact native starting state merely because its public
   opening completed.
2. **Real separate lifetimes and membership ownership.** The port still needs
   actual class9-plan/class2-body aliases, replacement-before-retirement ordering,
   neutral Vault body identity, position/cell insertion and removal order, and
   pending/current-occupant history on the same shared owner. The existing single
   Building identity and per-tribe radius membership do not supply these. These
   distinctions alter first-candidate order and whether a pursued raw ID resolves
   to deleted storage or a later occupant of another class.
3. **Effects on the selected request stream, scoped to reachable cases.** For a
   claimed public placement path, unknown predicate side effects and success
   callbacks cannot be assumed harmless. For overlap cases, actual-class/previous-
   state initialization still runs before removal and the new request. Model10
   `0042cfc0` is a conditional residual, not a prerequisite for a deliberately
   non-model10 first slice. Likewise class6/model9 child behavior matters at the
   proven models2/3 gate, not at a new Hut1 birth. A supplied no-overlap condition
   legitimately skips those overlap callbacks for one invocation; it does not
   reconstruct all earlier requests.
4. **Continuation provenance.** New checkpoints can preserve a truthful maintained
   owner; old ones without it remain unsupported for exact identity continuation.
   Rebuilding a plausible ledger at Load would change raw-ID tie/alias outcomes.
   This is missing semantic history, not an unimplemented native binary codec.

These are connected ownership requirements, not a demand to prove every renderer
or UI helper. No extra predicate or model10 decoder chain is selected here.

## Smallest valid test boundary and stopping condition

The existing real caller test remains useful after an independently supported
incoming owner is available. It should exercise new Hut1 admission, one rejected
class-2 request and a later admitted request, preserving failure-side worker
updates, distinct plan/body identity and actual initial cell events. A separate
controlled overlap case can prove cancellation-to-pending before the next request,
including allocation failure without restoring the old plan. Observations must
come from the real consumer and maintained graph.

An explicitly supplied native-consistent state can support controlled caller
proof; it cannot be advertised as the native physical IDs reached by ordinary
M1–3 play. Implementing a detached allocator or injecting a synthetic ledger into
`createStartedWorld` solely to pass that test would not close the integration.

The blocking component is now the **connected initial/request-stream producer
and event owner**, not the already closed class9 initializer or removal body.
The exact code boundary to return to is `createWorld`/its authored producers and
the requests reaching `prepareBuildingSite`; it needs a supported provenance
contract before assigning slots. No new runtime component, Swarm admission or
further decoder is proposed by this decision.

## Sources

- [Constructor request gate](https://github.com/JohnDeved/populous-new-dawn/blob/25d318a7c1ff65a93af77378eb76d8305d210d78/references/verification/swarm-class2-constructor-request-2026-10-10/README.md)
- [Class9 initializer](https://github.com/JohnDeved/populous-new-dawn/blob/021520a3f54235134d7ef5c157429f4f1784ca6b/references/verification/swarm-class9-plan-initializer-2026-10-10/README.md)
- [Admission validator](https://github.com/JohnDeved/populous-new-dawn/blob/a9dad1d488f636434bef060bd5c8811605a7388c/references/verification/swarm-plan-admission-validator-2026-10-10/README.md)
- [Pre-request actual-class effects](https://github.com/JohnDeved/populous-new-dawn/blob/016b2f0850f2047a5b6b0a05d914f6a7be664c7e/references/verification/swarm-plan-pre-request-2026-10-10/README.md)
- [Class9 deferred retirement](https://github.com/JohnDeved/populous-new-dawn/blob/d9c5d4043ee62c000d32cc2d91ed554714f194cf/references/verification/swarm-class9-removal-2026-10-10/README.md)
