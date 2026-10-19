# Live combat query index: ownership and evidence

Issue [#656](https://github.com/JohnDeved/populous-new-dawn/issues/656), under
[#648](https://github.com/JohnDeved/populous-new-dawn/issues/648). Source base:
`55770f1a03478883e8d0b00a1fd518e222782c3b`. This is separate from capacity/current-save
policy (#653) and renderer projection (#652).

## Existing path and bounded change

`scene.ts` → `game-clock.ts` → `world-turn.ts:tick/stepTurn` →
`live-building-combat.ts:startLiveCombatResponse` → `live-combat.ts:combatWorld`.
The native-derived selector in `combat-targets.ts` already visits local cells.
The old live adapter scanned all N people for every scanner S, then every fight,
resolved fight members through `units.find`, and reconstructed native-first ties.
This is a source-level O(SN) contribution, not a measured speedup or capacity claim.

One synchronous logical turn now owns a disposable query session in a WeakMap.
The first eligible query lazily builds wrapped 128×128 buckets, an ID lookup and
roster ranks. Later queries gather local owners, sort by roster rank, and project
current HP, tribe, flags, reservations and fight membership. Native chains are read
at query time. Browser x/z remain authoritative even when the native owner is
unregistered, detached or not yet published. Dead units remain in the ID lookup
until roster compaction; ordinary person candidates still require HP > 0.

Ordering remains: native chain first within each cell, remaining people in roster
order, then fights in insertion order. Response-sharing peers use roster order,
not native chain or bucket insertion order. Target rules, the 64-candidate budget,
scan cadence, distance ties, RNG and orders are unchanged.

The index is never attached to World or serialized. A current checkpoint rebuilt
as an ordinary World obtains a fresh session on its next turn. No old-save decoder
or compatibility branch is introduced. Outside an owned session the original
exhaustive path stays fresh for commands, public mutable fixtures and tooling.

## Mutation inventory

All following browser-position publications now notify the index immediately,
not just at turn end. Native position writes themselves do not publish a combat
position. Existing Object.assign evaluation/write order is retained; direct x/z
writes retain their original order and notify only afterward.

- `world-turn.ts`: ordinary path step and builder retreat.
- `live-people.ts`: terrain/death placement, encounter building move (either actor),
  melee approach, physics publication and ground movement.
- `live-vehicles.ts`: voluntary exit and every seated passenger, not only driver.
- `live-building-entry.ts`: building-exit placement.
- `live-building-combat.ts`: area-attack movement callback.
- `live-resting.ts`, `live-worship.ts`, `tornado-runtime.ts`, `armageddon.ts`:
  ordinary resting, shrine placement, spell physics and arena placement.
- `spell-effects-runtime.ts`: Shaman Teleport.
- `combat-runtime.ts`: battle relocation, encounter-to-group ID/center transition,
  changed center and post-fight recenter. Current fight fields are not cached.

`world-state.ts:addUnit` appends to an already-built unit index in O(1). Preacher,
Convert Wild, startup conversion and Hypnotise replace an earlier roster slot and
pop the temporary append; their explicit invalidation catches this same-length,
same-array mutation. Hypnotise and Swamp ghost removals explicitly invalidate too:
a later birth could restore the old roster length before the next query. Append
precondition mismatch also invalidates conservatively. Compaction and Armageddon
reset replace the array and rebuild the affected index before the next query. Both
ordinary fight creation sites publish an O(1) append, retaining insertion rank and
current cell without rebuilding existing fights. Append precondition mismatch
invalidates conservatively; filtering/reset still use the identity/length boundary. There are no other production
same-length roster replacements in this base.

## Callbacks, custom records and teardown

The retained scope is the synchronous, engine-owned turn body operating on ordinary
plain-data World state from `createWorldState`/`createWorld`, internal factories and
current-format checkpoint loading. Nested records such as casting, campaign AI,
orders and effects are simulation data, not a supported extension callback API.
External callers must not insert accessors, Proxies, custom iterators or replaced
ECMAScript intrinsics into that owned simulation body. The internal
`withLiveCombatQueries` helper is not a public fixture compatibility wrapper and
does not perform recurring descriptor/array audits of ordinary engine data. The
first candidate added such guards and an internal-wrapper accessor promise beyond
the pre-existing public contract; that extra promise was removed after measured
maintenance costs rejected the candidate. Actual public standalone queries and
commands remain exhaustive, including side-effectful projection getters, and do
not rely on the owned-turn contract. New records within a turn come from
controlled factories and the mutation publishers above. This is an execution/input
contract, not a save-version fallback or a recursively audited whole-world graph.

Observer getter/invocation and the complete optional metrics.steps read/write
run with retention suspended. These callbacks can query/reenter the engine or
mutate retained aliases before returning, so nested ticks also remain exhaustive
for the full callback scope. Finally restores a fresh outer session, never the
old possibly stale view, including when the callback throws. Ordinary
in-engine callbacks are synchronous game-owned closures and use the publishers
listed above. Nested owned visits share the session; outer try/finally destroys
it on success or throw. A caught partial Object.assign failure invalidates first,
then rethrows the original error. No cached turn ID is used as a freshness claim.

## Correctness evidence

- `tests/helpers/exhaustive-live-combat.mjs` freezes the pre-change exhaustive
  adapter and independent wrapped-range predicate, before implementation.
- `tests/live-combat-index.test.mjs` compares projected records, owner identity,
  cell ordering and selector results across seams, ranges, mixed registration,
  distant/dead fight members, stable ties and >64 candidates. Query → mutation →
  query covers births, death, roster removal, fight IDs/relocation, actual Boat and
  Balloon multi-passenger publishers, Hypnotise and Preacher replacement, nested
  sessions, observer/metrics getter reentrancy, thrown ticks, public standalone
  projection-owner getters, ordinary encounter/split publication and remove-then-birth sequences that restore the original roster length.
- `tests/live-combat-index-replay.test.mjs` runs independent indexed/exhaustive
  module graphs. It compares all enumerable world fields, typed values, collection
  order, symbol fields and object/backing-buffer aliases after each turn, including
  current checkpoint reloads. The graph encoder has independent self-tests for
  shared/overlapping typed views, byte offsets and collection extension properties.
  Workloads cover Missions 1/5/22 and a hostile front that must move, create fights
  and cause actual damage. Source transformation affects only the test subprocess,
  never production or shared dependencies.
- Existing combat/native-capture, conversion, transport and clock regressions
  remain required. Planning reports the new index/helper/test files as unmapped;
  explicitly review them, rather than treating an empty mapping as acceptance.

These are correctness evidence, not hardware performance or full campaign parity.
Raw command/source receipts belong in ignored work directories and the linked PR.
No parity scope or fixture recording changes are requested.

## Rejected first candidate

The first eligible 200-follower diagnostic rejected candidate
`c7f1c9bf32e8b615480d47d0246cc2c88c5b995b`: moving hostile fronts took 2.413×
baseline total time across five predetermined pairs. Distributed no-match (1.014×)
and dense adverse (0.994×) cases were mixed, not convincing gains. Source correctness
acceptance is separate from this failed performance gate. All attempts, all samples,
late-phase drift and exact runtime/source identities are retained in the
[PR result](https://github.com/JohnDeved/populous-new-dawn/pull/657#issuecomment-6277718093).

Accounting found 74,821 full record descriptor checks, 22,097 array checks and
204 whole fight builds in the hostile run. These counts are not causal profiling,
but identify avoidable maintenance in the owned plain-data scope. The next candidate
removes those audits and publishes incremental fight creation. It is unmeasured
until fresh source review and the same complete paired protocol pass. No timing
cost is moved outside `advanceGame`, and the rejected samples are not rerun unchanged.

## Controlled end-to-end benchmark protocol

First compare the actual baseline and candidate, under the same runtime/CPU,
locked dependencies, inputs, seeds, source fingerprints and serialized foreground
lane. Include 200 followers, then 1k/5k/10k after the scalable-capacity changes are
integrated into both comparison variants. Do not bypass an exhausted order/effect
pool and call partial simulation a pass. A pre-capacity diagnostic is explicitly
limited to its attainable active workload.

Use three deterministic workloads: distributed no-match scans, moving hostile
fronts with real damage, and dense-cell adverse cases. Issue multiple destinations,
retain full gameplay cadence, and verify active movement, scans, fights and damage.
Keep campaign workloads beside stress fixtures. Compare exact per-turn semantic
state/RNG/orders/cell chains and current-save continuation before interpreting time.

For each scenario/tier, separately record startup/setup and repeated whole-tick
samples, not just selector inner loops. Account for all eligibility/session work,
unit/fight bucket construction, ID/rank maps, append/move updates, conversion and
array invalidation/rebuilds, local gather/sort/projection, native-chain ordering,
allocations/GC and disposal. Record global/local candidate visits, actual scanners,
movers, births/removals, fights and index-maintenance counts through test-only
instrumentation applied symmetrically. Instrumented accounting and uninstrumented
timing must be separate runs, with source identities retained.

After warmup, alternate baseline/candidate order over at least five paired runs;
retain per-tick samples and report p50/p95/p99, worst tick, total wall time, memory
and observed GC limitations. A smaller combat bucket alone is not an improvement.
The fixed map can make neighborhoods dense, so no universal linear-complexity or
speedup claim follows from the algorithm. Setup/maintenance costs may dominate
small populations. Unrelated remaining per-building/idle-hut/full-roster work is
not removed here. Follow with separately reserved browser-frame measurements on
matched renderer/resolution/hardware; cloud CPU or software-GPU results are not
owner-hardware FPS. Standard check/build and independent review gate integration.
