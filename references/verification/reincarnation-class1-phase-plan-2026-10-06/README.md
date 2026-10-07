# Smallest class1 seed and visit-preservation proposal

**Source-only; no implementation or execution.** Keep the phase5 proposal at
`5732cc32` and prerequisite note at`58c5afd6` unchanged. Sources remain main
`1c7e6b05687aca14d9350e17c7ae14dc6c68bb97`; exact hashes are in the manifest.

Choose **a mechanically bounded fresh Missions1–3 subset**, not a general
primary pool. One shared class1 seed must cover every supported tribe/model
allocation in that subset; one per-person counter must survive its live owner
handoffs. Unsupported histories must become explicitly unverified before their
side effects. This enables exact seed/counter comparisons against the recovered
allocation event stream; it does not by itself establish complete original
startup, person processing, resource admission or mixed-class world equality.

The other choices are: (2) an exact all-funnel owner, deferred because native
class1 also includes non-Unit Angel records and uncomposed later producers;
(3) stop at a named unmatched creation/visit owner if the bounded acceptance
below cannot be met. Do not add a private returning-Shaman seed or infer one
from world turn, current population or mixed-class nextId.

## Original ownership reused

`0042bfe7..0042bffe` clears12 class-seed bytes from`0096eac1`. Successful primary
`004ed8a0` copies class1 byte`0096eac2` to object`+2e` at`004eda23/29`, then
increments the shared byte modulo256 at`004eda35` because class1 descriptor
`080800` lacks the no-increment bit10. Failed admission does not advance it.
Retirement and release never rewind it. The secondary allocator copies without
advancing; it is not a primary allocation event.

The recovered algorithm needs no new native sweep. Reuse the accepted reset,
creation and allocation-failure receipts. The missing piece is application
ownership and complete event provenance, not a new capacity model.

## Authored startup order: concrete static result

`authored-order.json` compares all2,00055-byte records in each hash-verified
canonical early-level file with the corresponding generated app object array.
No app module was imported. All direct class1 records match in record order,
model and owner. Every owner passes the ordinary signed-owner filter with the
respective tribe count; wild owner255 is signed−1. No model8 is authored here.

| Mission | Direct class1 count / next seed from reset0 | Shaman allocation ordinals |
| --- | --- | --- |
| 1 |12 |blue6, red7 |
| 2 |27 |Dakini16, blue18 |
| 3 |52 |blue32, Chumara33 |

`world-initialization.ts:113..149` iterates the original array without sorting;
`initializeLevelStart` runs only afterward, at489. Its existing`people.findIndex`
at`level-start-runtime.ts:89` already gives those Shaman ordinals. Reuse this
order: record every admitted person at construction, then let startup read that
assigned value. Do not increment the shared seed again for startup adoption,
command18 attachment, selection, site creation or an animation visit.

These counts establish **direct authored contribution**, not every initializer
callback's seed cost. The old class7 initial-phase proof explicitly supplies
other class initialization/post-processing. Before claiming a complete native
initial seed, the finite early-level creator inventory must establish that no
other reachable load callback adds class1 records. The loader post-processing
export`00485b00` has no direct class1 allocation, but that fact alone is not a
proof of all initialization callees. Stop and name any unmatched nested creator;
do not silently promote12/27/52 to an executed full-load result.

## Every current creation funnel and the subset decision

All browser Unit creation currently goes through`world-state.ts:addUnit`. A
new browser identity is not automatically a new native class1 allocation.
Use explicit creation provenance at the caller; lazy`createLivePerson` is
adoption and must not consume the shared seed.

| Actual funnel | Source ownership and proposed treatment |
| --- | --- |
| `world-initialization.ts:149` | Ordinary admitted authored class1 records in native record order. Included. Preserve signed-owner/filter rules; do not count an excluded original record. |
| `world-turn.ts:1202` | Hut birth, original`00404c80` primary class1/model2. Included on actual successful creation. |
| `live-building-entry.ts:642` | Training replacement, original`00405b80`; each successful trainee/remainder is a new primary allocation. Included. Source occupants survive until the full batch succeeds. A later failure deletes successful replacements but does not rewind their consumed seed values. |
| `level-start-runtime.ts:180` | Startup conversion through`004d7fd0`: successful new brave, conversion flash, then removal of old Wildman. Included as one new primary admission, never reuse. The accepted level-start producer trace already establishes that ordering. |
| `spell-effects-runtime.ts:892` | Convert Wild replacement uses that same recovered conversion owner. Included for ordinary nonghost targets and matched success path. |
| `live-movement.ts:534` | Ordinary nonghost preacher conversion, original`004d83b0:295`: allocate new class1/model before retiring victim. Included only for this source-mapped branch. Ghost-victim shortcuts must invalidate before claiming the same event. |
| `world-turn.ts:1792` | Returning Shaman through`004da0f0`. Included only on actual person success; model9/root/child allocations do not advance class1. Existing native three controls establish success/failure distinctions. |
| `spell-effects-runtime.ts:116` | Hypnotise/reversion replacement. Native reversion`004d92b0` really allocates a new class1 record and copies retained life/cargo; it does not reuse the old seed. Initial Hypnotise and its ghost/removal exceptions are not completely mapped in this packet. Invalidate the bounded history before either path; do not inherit a source counter. |
| `spell-effects-runtime.ts:993` | Ghost Army: a class1-producing native effect, with a current browser create/evict adapter. Invalidate before this producer until its admission/eviction order is matched. |
| `armageddon.ts:73,76` | Whole-roster rebuilding maps to later primary creators such as`00477890/00478990`, but existing Mission17 proof covers acquisition/cast, not all rebuilt person admissions. Invalidate before rebuilding. |
| `world-effects.ts:createAngel` | **Not an addUnit call.** Original`00512240` later creates class1/model8; the app keeps the Angel in Effects. Invalidate before the Angel producer. Counting only Units would miss this shared-seed owner. |

Known native class1 creators without a matching ordinary early browser funnel,
including scripted Shaman placement`00514240` and other model8 creation
`004dd700`, are outside this subset. Encountering an unclassified creator must
invalidate exact-history eligibility. This is not a claim that the list exhausts
all original gameplay or later missions.

## Minimal application state and admission seam

Propose one small `app/class1-phase.ts` module, one optional world phase record,
and one optional Unit phase record. Conceptually the world stores the next seed
and whether its history is still within the declared subset; a Unit stores its
current byte and the logical visit/birth boundary that owns it. Native person
aliases project that one phase; they do not each allocate or own a new seed.
Names/types should stay small and need no free lists, object arena or generic
allocator registry.

- Initialize the world seed0 only for a fresh, eligible early-level creation.
  Tag all included admitted authored people before startup. Preserve all owners,
  including wild people; do not make this a blue-only or Shaman-only counter.
- At a matched successful primary creation, assign current seed to the Unit,
  increment shared seed modulo256 exactly once, then initialize/adopt its actual
  person. Do not increment for initializer callbacks, failure, model change in
  place, reuse of a browser adapter or removal. Failed nullable admission returns
  without an event; a later deletion of a successfully allocated replacement is
  not a failed admission and cannot refund its phase.
- All callers without a recognized provenance must invalidate the bounded world
  before mutation. The existing game can continue through its legacy adapter,
  but that history cannot later be called native-exact. Do not change product
  controls or add a user-facing gate for this internal evidence boundary.
- The existing addUnit/effect adapters still do not model native capacity. This
  slice is conditional on matching successful admission events; it cannot turn
  callback-controlled failure tests into live shared-pool exhaustion proof.

Exact seed state is useful independently of allocation failure policy, but it
must be labelled conditional until the shared admission owner is recovered.

## Visit preservation: exact files and writes

Use one small class1 visit helper at **existing visit boundaries**, with a
per-record last-visit marker to prevent alias/nested-callback double increments.
Keep the same state/physics functions and their order. Do not replace the mixed
world scheduler. The main person pass must account for tracked ordinary Units
even before they have a native adapter; a later lazy handoff must copy the
retained phase instead of reconstructing elapsed history.

| Current write/view | Proposed bounded treatment |
| --- | --- |
| `live-people.ts:170` | createLivePerson adopts the Unit's retained byte. Missing history keeps the explicit legacy branch; no seed increment. |
| `live-resting.ts:120` | Replace world-turn overwrite with the existing visit's assigned byte. State10→17 handoff must not erase a newly allocated seed. |
| `live-pathfinding.ts:382` | Route-only adapter copies its Unit's current visit phase. Route advancement after physics does not claim another primary visit. |
| `live-construction-runtime.ts:81` | Builder handoff similarly copies the Unit's current phase; preserving native→builder→native must not reset it to turn. |
| `level-start-runtime.ts:89,141,286..287` | Assigned authored byte replaces findIndex reconstruction. Startup/site counter is a mirror of its one person visit, not a second increment owner; preserve command18's completed-turn exclusion. |
| `live-people.ts:900,1119` | Existing physics and ordinary state visits acquire the one current phase instead of separately incrementing the alias. |
| `live-building-entry.ts:454,466` | Occupied/entry branches acquire one phase per actual visit; preserve their mutually exclusive paths. |
| `live-resting.ts:130` | Later idle visit acquires the same class1 phase once. |
| `live-movement.ts:547` | Conversion victim visit acquires one phase. Its replacement starts a new allocation identity/byte. |
| `live-building-combat.ts:406` | Building-order visitor acquires one phase, including when delegated from another current-turn adapter. |
| `live-combat.ts:208,306`; `live-building-combat.ts:217` | For tracked people, scanner gates read the person's phase, not a substituted world.turn. These are value projections/read gates, not additional seed writes. |
| `spell-effects-runtime.ts:123,180` | Hypnotise shadow counter is a separate legacy adapter in an invalidating path; do not call it an independent native allocation phase. |

The complete source scan also finds building/effect/formation/camera counters;
those are different classes and are not part of this change. Global health
regeneration and logical-animation stamps stay global owners, not class1 bytes.

`world-turn.ts` needs a small phase-entry/eligibility call for ordinary Units,
plus the corresponding startup and earlier battle-delegation sites. The helper
must return whether a primary visit is eligible, not merely hide a duplicate
counter write while letting a new body process too early. Known allocations made
inside the original primary traversal are first eligible on the following turn.
In particular, a startup/Convert Wild replacement can occupy an existing browser
array slot before today's later person pass; native prepending does **not** give
that replacement a same-turn visit. Keep that newborn deferral explicit. Authored
load records already exist before the first traversal. A creator with ambiguous
pre-primary versus in-primary timing invalidates the subset until resolved.

This is the key acceptance constraint: a last-world-turn guard alone is
insufficient. It must preserve allocation-time eligibility, one actual visit and
alias handoff. Do not move all world objects into a new scheduler to achieve it.
If a current adapter cannot identify those boundaries, report that owner as the
stop rather than manufacturing a visit count.

## Checkpoint and migration boundary

Fresh tracked checkpoints retain world next seed, each Unit phase and each
active alias through the existing structured-clone/IndexedDB path in
`game-store.ts`. Loading must neither allocate people again nor add a visit.
Same-turn presentation or alias reconstruction must also leave the byte alone.

Legacy saves lack the successful-allocation history. Keep their existing byte
values as legacy state; do not infer a seed from living people, nextId, startup
ordinals or world.turn and do not replay startup/conversion. Missing, inconsistent
or invalidated phase metadata cannot acquire exact-history status merely by
loading it. A fresh eligible start is the supported way to obtain a complete
tracked prefix. This is an internal compatibility policy, not a new user flow.

## Bounded acceptance and feasible next slice

Prepare a source-reviewed implementation only after this proposal is accepted.
The minimum acceptance should cover:

1. Static3-level authored order/data comparison retained here, then the actual
   createWorld admission stream: no doubled startup count, correct per-person
   bytes and startup Shaman ordinals. Keep the direct-contribution/full-loader
   distinction until all included initialization callbacks are accounted for.
2. One finite shared event sequence exercising successful included replacements,
   a failed admission, a successful-then-retired training prefix and byte wrap.
   Reuse accepted native allocator/control receipts; no owner/capacity matrix.
   Tests must invoke the actual admission helper used by the live funnels.
3. Focused actual handoffs: returning state10→resting, route-only→native,
   native→builder→native, startup mirror, entry/physics delegation, no same-turn
   visit for a primary-born replacement, and exactly one increment with multiple
   aliases. Keep wrong world-turn resets as failure-first witnesses.
4. Fresh Save/Load preserves the next seed/phase/eligibility; legacy or unsupported
   creator histories remain unverified. The same RNG words, identities and other
   person fields must survive the counter-only operations unchanged.

The feasible next parity slice is therefore **shared class1 phase accounting
for a source-mapped successful early admission stream and its existing person
visit/handoff boundaries**. It is not full person initialization, Angel/Hypnotise/
Ghost Army/Armageddon parity, native capacity/reuse or full-world scheduling.
Native`004e0270` follower-facing is still absent from the live Shaman path;
fixing its input counter does not implement that consumer. The final birth-burst
port remains separately reviewed after this prerequisite's exact scope is known.

There is no irreducible mystery in the class1 reset/copy/increment algorithm.
The remaining concrete source/acceptance stops are unmatched nested startup
class1 admissions, unclassified replacement semantics, and an existing live
owner whose first/duplicate visit cannot be assigned without changing unrelated
scheduling. Stop at any of those instead of expanding into a general allocator.
