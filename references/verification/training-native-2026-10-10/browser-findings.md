# Controlled training-entry browser-model comparison

## Useful result

The initial captured native fixture and browser replay agree on the mapped
person/building records, IDs, cell chains, shared command8 with eight references,
terrain/walk masks, route pools, RNG states and stated Temple geometry. This is
an imported controlled fixture, not ordinary browser UI or original pixels.

Against final terrain-bound native attempt08, baseline main's first per-person control
change occurs on turn2/person1832: after motion, native retained counter is9,
while the real browser route adapter changes it to world turn2. The observer
records the exact before/after write in `app/live-pathfinding.ts::stepLiveRoute`.
The first position difference is turn4/person1833 native y14925/browser14926.

Native successful admissions were:

- 33:1832
- 40:1833
- 43:1834
- 46:1835
- 48:1837

The main browser-model caller produces34,40,42,44,48 for the same IDs.
Both reach an entering counter of five (including admitted residents), at most
four outside substate-5 followers, and five final residents. Both happen
to make only single admissions on each admitting turn in this exact fixture.
This does not establish a one-person semaphore. Native overflow queue is
1839→1836→1838; main browser queue is1838→1839→1836.

Moving only browser entry clocks after people leaves its observed admissions and
positions unchanged. This does not erase the scheduler difference: browser
building-before-people is retained in the primary run, and full native building
processing remains different from the replay's selected entry-clock consumer.

## Existing rejected counter guard

The clean existing candidate `bd420fd252182e8e28fdeb03a6577f844a04a746` was replayed
without production edits against the identical initial snapshot. It eliminates
all captured person-counter differences; its per-person control projection
matches until a turn26 speed difference. It admits at33,40,43,44,48. The fourth
admission still differs from native46; overflow queue matches native.

The guard remains rejected for shipping because its earlier Mission2 battle
regression is not addressed by this diagnostic. No full check, build or gameplay
regression was rerun, and there is no new proposed production patch here.

## Next concrete composition boundary

In the guarded replay comparison, on turn25 the original creates two marching formations:

- native1831 corresponds to browser1840 (allocation ordinal1)
- native1830 corresponds to browser1841 (allocation ordinal2)

Guarded replay leader/member geometry agrees at creation, but original timers are49 and33;
browser creates both timers as0. Retained `decomp/generated/00500a30.c`, case1,
shows original class10/model1 initialization advances game RNG and stores
`(random & 31) + 32`. `app/live-movement.ts::join` instead constructs a literal
`timer:0` without an RNG draw. The guarded replay first observed game-RNG difference is turn25;
on turn26 person1834 speed is native70/browser86. This is a direct source-bound
omitted constructor owner, not a timing guess or capacity rule.

The original end-turn tribe-list producer `004ecac0.c`, case10/model1, rebuilds
formation lists by prepending during primary traversal. Captured native list is
[1831,1830], whereas browser `unshift` leaves [1841,1840]. After mapping IDs by
actual allocation-return ordinal, these are opposite processing orders. That
must remain separate from merely renumbering objects; it can change later RNG
assignment and person speeds. A repair needs source-backed initialization AND
list lifecycle, then existing gameplay/regression acceptance.

No such repair has been implemented by this worker.

## Other explicit differences

- `syncLivePersonCells` removes the imported Temple from its person-only cell
  registry on the first visit. Native building flags2 remains131136; browser
  admission flags2 becomes64. Initial records matched before this actual caller
  mutation. Collision uses a separate browser building lookup.
- Native outer object scheduling stamps each record after its controller.
  This focused browser replay excludes its separate animation/stamp phase;
  raw stamp differs on turn2 (native1/browser0). It is reported separately from
  the first movement/control divergence and is not called a product defect.
- Person health, ambient work, the wider native building body, unrelated
  global/world processors and rendering are outside this browser replay.
- The native unit pool/class counters are captured, but the browser uses
  `nextId++` for later groups. New formation IDs are explicitly mapped by
  allocation ordinal. There is no claim of full allocator parity.
- Training is disabled throughout, so completion/conversion/exit timing is
  not measured. Admission, concurrent approach, residents and visible crossing
  are distinct. No visual-crossing claim is possible from these traces.

## Initial terrain qualification (resolved by final attempt08)

The native owner's observation-only attempt07 retained the same trajectory as06
but found a non-idle omitted terrain-update queue of49 cells from Temple setup.
Therefore06 is a selected-scheduler-phase comparison pending terrain binding,
not complete ordinary-native execution. This qualification applies to all
admission/position results above. Direct source observations of the route-counter
write and omitted formation initializer remain valid. The parent authorized the
native owner to inspect/run the real terrain prerequisite; the resolution is recorded below.

## Artifacts and verification

- `primary-attempt06/`: baseline48-turn replay, initial validation, source hashes,
  per-phase/per-person/turn snapshots and actual admission calls.
- `native-clock-control-attempt06/`: explicitly relocated entry-clock control.
- `guard-primary-attempt06-v2/`: untouched rejected guard candidate replay.
- `initial-rejected-attempt02/`: fail-closed validation of empty command queues;
  no simulation ran from that invalid native setup.
- `guard-primary-attempt06/`: loader stopped before simulation because the
  guarded source did not contain the unguarded exact observation anchor. The
  second attempt added a separate observation-only guarded anchor; it did not
  change the guard condition or any simulation expression.
- `observe-loader.mjs`, `field-map.mjs`, `replay.mjs`, `compare.mjs`: reusable
  ignored diagnostics. Production TypeScript is imported directly; observer
  replacements require unique exact text and retain original/observed hashes.
- Node24.19.0. Focused runs complete in approximately1–2 seconds each. No native
  EXE was executed by this browser worker; no browser/render/heavy test was run.

The worktree was clean at start and after diagnostics; all writes are confined to
this ignored browser directory. These checks are diagnostic evidence, not full
`npm run check`, build, rendered acceptance or hardware performance gates.

## Final terrain-bound comparison (attempt08)

The final native owner executed real `0044df40` and original lighting/globe
consumers without replaced leaves. Its person visits/admissions/timeline are
identical to06/07; the native owner retains the canonical trajectory hash.

`final-main-attempt08/` and `final-guard-attempt08/` supersede the provisional06
runs as final comparison artifacts. They import the actual pending49-cell terrain
queue, dirty map and counters; execute real browser `processTerrain` late in each
turn; and retain texture notifications as explicit output-only consumers. All48
pre/post terrain projections match original flags, heights, building handles,
terrain categories, cliffs, shadows and territory bytes. Both drain the queue on
turn1, with49 surface and49 globe notifications in the browser. No raster/pixel
or renderer equivalence is claimed. Admission schedules, first counter/position
and formation findings above are unchanged. The terrain qualification is now
resolved for this fixture's measured terrain data; full ordinary native-world
composition remains outside this bounded diagnostic.

Exact RNG arithmetic is retained in `portable-review/formation-rng.json`:
browser turn25 RNG768717543 → original initializer draw556953681/timer49 →
original initializer draw1585955873/timer33. That final state equals original
turn25. This calculation evaluates the retained source formula; it is not an
extra original-executable run.

## Formation lifetime and repair-review requirements (no code change)

1. Creation: `004ed8a0` prepends the authentic allocated-unit list and invokes
   class10/model1 initialization. `00500a30` sets state1, immediately prepends the
   tribe formation list, consumes exactly one game-RNG draw, and initializes the
   timer. `005018c0` subsequently sets the person model, destination, offsets,
   speed and members. Multiple creations in the same person phase can therefore
   be found in newest-first order by later recruitment in that same phase.
2. End turn: `004ecac0` first clears tribe lists, traverses the primary allocated
   list, and prepends eligible class10/model1 records. That rebuild changes the
   formation traversal order for the following turn. A blanket `array.reverse()`
   each turn would alternate an already-rebuilt list and is not an implementation
   of this source lifecycle. Numeric-ID sorting would also rely on unproved pool
   reuse assumptions; preserve a source-bound allocation/list order instead.
3. Next consumer: `004ec6f0` traverses tribes0–3 and each rebuilt formation list
   before incrementing/processing people. `00501000` removes invalid/arrived
   members, restores their movement with game-RNG speed draws, changes shapes
   and timers, consumes pose RNG when appropriate, and sets steering/speeds.
   Thus two otherwise identical groups visited in opposite order can assign
   different random speeds to individual people. The guard replay's turn26
   person1834 difference occurs at this next consumer.
4. Removal: the formation controller calls original `update_after_unit_alloc`
   when count becomes0, including the count<2 teardown. Original object lists,
   class/dead flags and deferred freeing are separate lifetimes; the native
   driver executes the primary/deferred-free phases. Browser immediately marks
   the group class0 and filters it after its formation pass. Exact removal-body
   byte semantics are not newly recovered here; a production repair must retain
   or verify this boundary rather than infer that dropping an array entry fully
   reproduces native retirement/reuse.
5. Checkpoints: current `game-store.ts` clones the world graph with
   `structuredClone`, preserving marching array order and RNG; its migration only
   retags existing formations for the legacy tribe change. A new ordering owner
   must round-trip stable order and member identities. Restoring an already
   created group must not rerun the constructor, reconsume its RNG or reset its
   timer. Old checkpoints must have an explicit source-supported policy rather
   than invented creation ages or silent array reversal.

Existing `tests/formation-phase.test.mjs` covers tribe traversal and next-turn
steering but supplies the input group order. `tests/marching-formations.test.mjs`
and its native checker supply the allocator with `timer:0`; they do not prove
real class10 initialization. `tests/live-movement.test.mjs` covers ordinary
marching interruption/death/arrival and cadence. Those tests should remain, with
new source-bound creation/rebuild/retirement and checkpoint continuity evidence.
The Mission2 battle regression, nontraining group movement, human and shared-AI
training and original capacity5/queue/conversion lifecycle remain required before
any production integration. Timer/RNG alone or array reversal is not approved.

Review clarification: these creation-geometry and first-RNG-divergence claims concern the guarded replay. Main already diverges in RNG on turn 20 and formation geometry on turn 25. The frozen archive preserves the pre-review report; this published report supplies that qualification.

Review clarification: the entering counter is not an outside-person count. It reaches five when one person is already inside on turn 35. The maximum outside substate-5 count is four in all three controlled traces. The frozen archive retains the older imprecise wording; use these measured definitions.
