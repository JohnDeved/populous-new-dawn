# Bounded observer purity inventory and correction

Status: source/design only. The failed f957ea23 attempt is preserved and invalid
as a behavioral witness. No replacement simulation is authorized or has run.

## Direct and transitive snapshot helpers

1. `ownerRow`: reads the supplied unit, retained ownership references, registry,
   task assignment, flags and command pool. `currentPersonOrder` reads immediate
   command first, then indexed queue; it does not write pool/person. `pick`, array
   mapping/filtering, and `structuredClone` allocate detached output records.
2. `lists`: builds new cell/output arrays and calls `collectDefenseTargets` with
   cap10/radius7. The collector only appends to its local people/building arrays.
   Its `spiralCell` calculates coordinates; `spyDisguisedFrom` reads model/tribe/
   disguise. `objectsInCell` follows supplied heads/map/next pointers without
   writing them. These functions do not mutate their supplied records.
3. `computerResponseWorld`: allocates a new cell map/arrays, creates projected
   person/building records, and reorders only those new arrays. Its `defensePerson`
   picks an existing owner. `combatPerson` uses pure coordinate arithmetic and
   reads existing owner/reservation fields; absent reservation returns a new
   object. Native model/tribe helpers are table/index lookups. `buildingPose` and
   `buildingObject`/`buildingModel` only read fields and rule tables.
   `buildingPosition`/`shape` read shape/origin tables and return new coordinates;
   unknown shapes throw. `objectsInCell` is the read-only generator above. The
   returned `terrainFlags` closure reads a flag and is not called by this snapshot.
   No call to `nativePosition` is present in this adapter/helper chain.
4. The deleted optional `computerAttackTargetsRemain` read was different: its
   `within` calls `nativePosition`, which unconditionally calls `syncNativeTerrain`.
   If versions differ, synchronization can change heights, queues, walk masks,
   landVersion and height-notification consumers, including object flags/routes.
   This is an established mutator-capable path, not the proved cause of the failed
   run's serialization mismatch. No field-level data survived that old mismatch.
5. Built-in cloning/serialization/hashing, primitive extraction and assertions
   produce observations, not simulation inputs. Hash equality remains the strict
   before/after gate. A serialized-byte mismatch alone is not labeled a proved
   semantic difference; preserved buffers permit later read-only diagnosis.

Reviewed source: `app/computer-runtime.ts:1192`, `app/live-combat.ts:32`,
`app/person-orders.ts:63`, `app/computer-defense.ts:68`, `app/object-cells.ts:63`,
`app/native-math.ts:51`, `app/computer-selection.ts:5`, `app/building-shapes.ts:27,119,441,470`,
`app/world-terrain-runtime.ts:59,242`. Production is unchanged from main4754e12d.
This inventory is a bounded current-source audit, not a promise that future helpers
are pure or a native world-composition acceptance.

## Minimal correction

- Remove the optional distance-world query and its otherwise-unused runtime export.
  Actual production `targetsRemain` inputs/results remain captured only when the
  real controller calls that callback, exactly once. No substitute active query.
- Copy the world once for each observation. Run owner/list/defense projections on
  that detached graph; preserve alias relationships within it for owner identity.
  Keep both the live-world and detached-input full before/after equality guards.
  Candidate lists remain labeled, and no native admission fields are synthesized.
- On the first equality rejection, preserve the exact already-created before/after
  V8 buffers locally before asserting. No field exemptions, normalization, generic
  diff framework, or raw snapshot publication. Read-only diagnosis can deserialize
  those buffers to identify exact fields. Stop immediately after the rejection.
  Guards run in `finally`, including when a helper throws; the helper's exception
  name/message/stack is recorded before guard rejection so it is not silently lost.
- Bound each serialized world to16MiB, one diagnostic pair to32MiB, JSONL to32MiB,
  and summary to1MiB (also its stdout copy). The observer's primary outputs are at
  most66MiB; reserve a further2MiB for outer command receipt/stderr/source metadata.
  TMP/compile caches are separate task-local runtime scratch. Exceeding a bound is
  a stopped/failed observation, never permission to truncate an accepted snapshot.
- Preserve the old `run.*` files. Any separately admitted future run uses fresh
  `revised-run.*` output paths and its own outer receipt/TMP/cache; old evidence is
  never overwritten. The original world/turn/time/visit bounds do not increase.

## Proposed cheap controlled regression

`purity.test.mjs` invokes no `createWorld`, tick, scheduler, runtime module or
gameplay loop. It creates one small plain fixture with retained aliasing, immediate/
queued command records, a stale native owner shadowed by fight motion, a dead and
missing task member, a hostile cell-chain person and a building. It imports only
the already-audited pure collector/cell/order/building/model helpers. The exact
combat-person and private defense-adapter source regions are type-stripped with
Node's built-in stripper and compiled with those explicit helpers; no replacement
adapter algorithm is invented. The snapshot helper region is source-extracted
directly from this observer, avoiding execution of its live-world entry point.

Four assertions cover: unchanged live/detached graphs with correct owner/order/list
observations and no optional query; an intentionally throwing, mutating detached helper
rejected with preserved exact buffers; a captured live terrain mutation rejected
with no terrain exemption; and an oversized input rejected before querying.
The test keeps diagnostic buffers in a local test Map and compares the precise
injected field through Node deserialization. It writes no world snapshots to disk.

Proposed command, only after independent design acceptance and coordinator approval:
`taskset -c 4 timeout --signal=TERM --kill-after=2s 20s node --test
qa/issue248-scheduled-trace-20261010/purity.test.mjs`.

One bounded invocation, retained stdout/stderr/exit/source hashes; no dependency
move/copy/install, browser, native code, mission world or simulation retry. A pass
would establish this controlled observer regression, not native parity or actual
scheduled-gameplay reachability. A failure remains failed and requires diagnosis.
