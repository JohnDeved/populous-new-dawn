# G producer prerequisites and current controller handoff

Read-only extension on `3b899125cc8cedef938823718ad5d44f49957b66`.
The [accepted lifecycle/distance packet](findings.md) remains frozen separately.
This addendum closes finite producer questions; it adds no runtime implementation,
ordinary gameplay witness or physical Guard/animation continuity claim.

## Native producer: 20 cases / 43 stages

[probe-guard-producer.py](probe-guard-producer.py) uses the unchanged baseline
loader/table harness and verifies its full output hash before the extension.
[producer-attempt-01.json](producer-attempt-01.json) retains complete person/queue
snapshots, selected pool records, whole-pool hashes, changed record indexes, and
native allocation/prepare/clear/attach/removal call order. The first run passed.

- Two selected followers receive **one** allocated command30, references2 and
  active1. Each native preparation increments the tribe guard count. Repeated G
  allocates one replacement shared by both, releasing the old references/counts;
  a later G with only the first selected replaces only its reference. The second
  follower keeps its older order and target.
- No selected non-Shaman (including Shaman-only selection) clears both already
  adopted state10/status30 followers, with two cancellation-anchor calls and the
  final shared reference/active count released. The same input before adoption,
  while the two people remain state19, preserves their queued command30.
- With only slot799 free, native G allocates it once for three followers,
  references3, then wraps allocation cursor to1.
- **Pool exhaustion is not an atomic refusal.** With all nonzero records held and
  no old queues to release, each selected follower retries allocation, receives0,
  then native clear/attach still runs. Both actual command slots remain0, but
  record0 acquires references2 and the native active count becomes800. This is
  observed original sentinel accounting, not evidence of a usable guard command.
- With three selected followers owning old slots1/2/3 while the pool is full,
  allocation initially fails. Clearing follower1 frees slot1, followed by attach0.
  Follower2 retries and allocates slot1 as command30; follower3 reuses it. Final
  slots are `[0,1,1]`, command30 references2, record0 references1, active798. A future
  port must explicitly decide and test its resource-exhaustion policy; it cannot
  claim that preserving the old queue or silently omitting record0 matches native.
- Supplied selected roster entries with dead bit1, protected bit0x100000,
  airborne bit0x80000, ghost flag, class0, training state21, or another model7
  person still receive an order. The producer tests selection and excludes the
  **exact tribe Shaman pointer**, rather than checking model7 or `canOrder`.
  These adversarial fixtures establish raw branch semantics, not ordinary UI
  reachability. They do not prove every malformed entry is validated later.
- Vehicle-passenger ordering matters. With both followers selected in one supplied
  Boat, retain1 queues one shared order for both. With retain0, the first follower's
  passenger deselection clears the second's selection **before the roster loop
  reaches it**; only the first gets command30. This branch executes original
  passenger traversal and must not be replaced with a precomputed selected list
  that ignores mutations made during traversal.
- An absent current tribe Shaman pointer prevents both issuance and cancellation.
  A stale non-null pointer with dead/class0/vehicle-contained Shaman still produces
  target73; native configuration then saves it and the guard consumer completes
  and releases it. Replacing the tribe Shaman pointer with74 does not rebind an
  existing saved target73: old-target loss finishes that guard, while a new explicit
  G targets74. This differs from the legacy boolean's current-Shaman lookup.

All producer and queue routines execute. Only the baseline destination-planning,
selection UI refresh and voice leaves remain supplied. The multi-person roster,
held pool references, vehicle passenger array and stale states are explicit input
fixtures. No multi-person motion or normal-play stale/dead selection is claimed.

## Real keyboard caller and existing port option

[probe-guard-key-mode.py](probe-guard-key-mode.py) executes the native global reset,
G action caller and real command82 consumer in two modes. Results:

1. Fresh setting flags0 → native `0042bfa0` ORs0x10040 → `004999d0` returns1 →
   `004aab80(0xc1,0,0)` emits `[tribe0,0x82,1]`. Supplying that captured final argument
   as packet+4, native `0043e8e0` dispatches G with retain1 and keeps selection.
2. Initial setting bit0x100000 survives the same reset; helper returns0 and G emits
   `[0,0x82,0]`, which produces command30 and clears selection on dispatch.

The [helper bytes](004999d0.asm) read only setting0x895da8 bit0x100000. Its argument
is ignored; this is not a Ctrl/Alt key modifier. The reset **preserves** an existing
user override rather than forcing retain1. Palette/globe/auxiliary reset and
outgoing emission are supplied leaves; the emitted-argument→packet transfer is an
explicit fixture boundary. Native input polling and the intervening packet queue
are not executed.

The current [public keyboard handler](../../../app/page.tsx#L391) directly calls
`guardShaman(world)`. Searches of the settings UI, game-store, World fields and
command inputs found no exposed counterpart of this retain-selection option.
[playerOrderInput](../../../app/person-orders.ts#L346) already documents default
keep-selection semantics. The bounded new public G adapter should therefore use
**default retain1**; no new setting is implied. Retain0 remains native evidence and
a reusable producer test, not a claim that the current UI exposes that option.

## Current controller routing: what is supported and what is missing

This is a source audit, not executed browser-controller evidence. The authoritative
person must be resolved before mutation; `Unit` can have overlapping aliases.
The common authoritative-person lookup order is `flight`, then `fight.motion`,
then `native`/`entry.person`/`builder.person`. This is not the full world dispatch
order: `world-turn` has earlier native44/24 and other state branches. Its actual
controller order must govern handoff. `selectionPeople` may supply only a projection
for a unit without an active record; it is not an allocation adapter.

- **Ordinary on-foot native state17/19 or supported order state10.** This is the
  smallest source-supported handoff. Keeping `u.native` and attaching command30
  makes the world-turn `activeOrder` branch choose `stepLiveMovement`; that calls
  `stepLivePhysics` → `preparePersonTurn` → `initializeLivePerson` → `startLiveOrders`.
  The same person then reaches the existing command30 processor/setters. This
  requires no conflicting earlier work/entry/fight/flight branch. Do not send the
  new queue through `stepLiveResting`: it unconditionally changes state10 back to17
  after preparation under its old empty-queue assumption. The actual ordinary
  Mission10 witness is still required to verify routing, phase and visible result.
- **Fight motion.** `world-turn` visits `stepLiveMeleeMotion` before ordinary order
  processing. Its `stepLivePhysics` consumes bit16 on that exact motion record;
  the captured fighting-state path calls `adoptLiveOrders` when state becomes10,
  and `stepLiveMeleeMotion` clears the fight alias after leaving25/29. This is a
  useful existing identity/queue bridge, not proof of the whole G interruption.
  The outer world loop continues after that controller, so first guard dispatch
  timing and fight/group cleanup require a targeted handoff case. Legacy fights
  with no `motion` have no such existing preparation path.
- **Flight/impulse.** `stepLiveImpulse` processes `u.flight` and reaches native
  preparation, but the world loop continues before ordinary command dispatch.
  On landing it removes the flight alias; it does not universally adopt a distinct
  flight record into `u.native`. The producer must preserve/establish the same
  queued person as the later owner without discarding airborne physics. Existing
  `(fighting || recovering) && state10` adoption is not a general flight handoff.
  Protected bit0x100000 can also defer preparation. A focused airborne/landing
  alias test is required; clearing `u.flight` or calling blanket `release()` is
  not justified by the G producer proof.
- **Building entry/training.** `entry.person` has real preparation and initializer
  support. However, occupied state21 returns before preparation, so merely adding
  bit16 cannot adopt a new order there. Other entry states call `stepLiveOrderQueue`
  with a handler keyed by the current order that dispatches non10 orders to
  `stepTrainingPerson`, not `stepShamanGuard`. Existing entry/work branches can
  therefore swallow command30. Preserve the record while explicitly handing off
  occupancy/registration/training queue and routing. `initializeBuildingPerson`
  and `startLiveOrders` contain useful pieces; retaining entry until native exit
  work is done and avoiding later `cancelBuildingEntry` clearing the new order are
  required. No safe whole entry handoff is established here.
- **Builder task.** `processBuilderWork` owns `builder.person`, may remove the same
  record from `u.native`/cells, forcibly writes state10, and continues builder
  task logic. It does not run `preparePersonTurn`. Simply aliasing that person into
  `u.native` can let builder work reclaim it next turn. Preserve identity/cargo,
  unregister the old building slot and end the legacy task before its next visit,
  then adopt the native order exactly once. `finishQueuedConstruction` is not a
  drop-in G cleanup: it requires current model6 and sets the shared order's cancel
  flag. `release()` also clears the queue/aliases and would erase the new command.
  A targeted construction→G ownership test remains necessary.
- **Vehicle passenger.** Besides the proved selection side effect, current
  `stepLiveMovement` skips person preparation when a vehicle is present, and
  non-driver passengers return early. State30 transport-rest dispatch also runs
  before normal orders. Actual passenger G adoption therefore needs its own
  preparation/routing test. This is separate from the already proved requirement
  to finish a guard when its **target Shaman** enters a vehicle.
- **Legacy-only record or saved `guard` boolean.** A projection is not a native
  owner. New allocation, legacy task/path cleanup and saved-state policy must be
  explicit. Neither a new command nor a migration can reconstruct old target
  identity, reference ownership or historical phase from that boolean. A legacy
  save must not silently acquire a claim of original Guard phase parity.

Source links: [world-turn](../../../app/world-turn.ts#L1230),
[stepLivePhysics](../../../app/live-people.ts#L881),
[stepLiveImpulse](../../../app/live-people.ts#L996),
[initializeLivePerson](../../../app/live-people.ts#L436),
[stepLiveMovement](../../../app/live-movement.ts#L750),
[adoptLiveOrders](../../../app/live-movement.ts#L225),
[stepLiveResting](../../../app/live-resting.ts#L114),
[stepBuildingEntry](../../../app/live-building-entry.ts#L446),
[builder processing](../../../app/live-construction-runtime.ts#L69),
[finishQueuedConstruction](../../../app/construction-runtime.ts#L288).

## Concrete next implementation boundary

Keep a small G-specific producer over existing pool/configuration/adoption/cleanup
primitives. Use default retain1 at the public key binding, native raw producer
semantics over the verified ordinary roster, and an explicit resource-exhaustion
policy. Reuse command30 consumption with the bounded target-vehicle and signed
operand corrections. Resolve ordinary idle/native routing first; every supported
active controller needs an explicit tested identity/queue/work handoff before
claiming it works there. Native acceptance of an adversarial selected record does
not authorize passing invalid port projections to arbitrary initializers.

The finite native questions above are now answered. The remaining work is concrete
port integration and controller tests, followed by ordinary acquisition/UI evidence;
it is not another general native-physics investigation. AI marker guard and a
generic animation renderer rewrite remain outside this adapter.

## Frozen receipts

- Producer probe: `24921a87e6e42340434a1b79ddc88a7823437ea940711dab4ff1ea54911e3340`.
- Producer result: `92153069ba20138e60280cb639cfc2f794d1ed4532e7234dbaa79e39843bc922`.
- Key-mode probe: `ead992a61285f60faa20b53c27c549a74a0e742aa665f6be39d1feb159e1bfea`.
- Key-mode result: `d4462509561db958ad03b884430e50b3b81d623693804bde7a8a71b3078324ff`.
- [producer-receipt.json](producer-receipt.json) and
  [key-mode-receipt.json](key-mode-receipt.json) record exact commands, exit0,
  pinned source/input hashes and source-audit hashes. Each probe uses timeout60s,
  CPU4 and the existing Python/Unicorn environment. No builds/browser/OS game run.
