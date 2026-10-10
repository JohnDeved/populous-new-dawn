# Swarm class-2 lifecycle ownership prerequisite

Source-only mapping for issue #61 at main
`f9675f56c597ec83adf02f28e9801bfc6bbd0490`. **The prerequisite is not closed.**
The exact missing port producer is a persistent class-2 identity and cell-list
lifecycle, including ordinary buildings and neutral Vault bodies. The current
terrain handle, browser Building object and lazy occupancy record do not supply
that history. Two replacement boundaries and an unretained class-2 removal body
prevent treating a new list adapter as an established implementation contract.

This extends the accepted [Swarm controller contract][controller] and
[integration review][review] at `74b74346f2d67e94aed013fc9e1960e20ef36ceb`;
those documents are not in this main tree. Their insertion, relocation and
queue-preserving ejection conclusions are reused, not re-proved by a new run.
The adjacent [source bindings](swarm-class2-lifecycle-bindings.json) distinguish
unchanged owners from later source changes and bind the inspected files.

## Proven native ownership and ordering

Retained Ghidra C is pseudocode, not compilable original source. The 19 selected
exports match `decomp/exports.json`, whose executable identity is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No executable, archive, native probe or decoder was opened or run for this note.

| Owner/field | Source-backed contract | Port consequence |
| --- | --- | --- |
| Object identity | `004ed880` initializes physical `+0x24` indices; `004ed8a0` takes a free record, clears it while preserving that index, then assigns class/model/tribe/position. Allocation-list links differ from cell links. | Browser IDs, authored record indices and terrain handles cannot be equated with native object identity. Reuse is observable to remembered-ID consumers. |
| Cell membership | `00403610:19–28` saves aligned anchors and inserts the actual supplied position. `004ee470` prepends to the 512-unit cell: `+0x20` next, `+0x22` previous, cell head, flags2 `0x20000`. | Record insertion at the real class-2 allocation opportunity, before subsequent geometry relocation; never insert a class-9 plan as class 2. |
| Relocation | `00403d50` derives model origin from anchor `+0x7a/+0x7c`, object `+0x33` and rotation `+0x26`; `004ee580` splices only across XY cell boundaries and always copies position. `00403280:17–25` consumes pending geometry flag `0x8000000`. | Same-cell and height-only changes retain order. Footprints and inside/outside points do not define membership. |
| Removal mechanics | `004ee4f0` splices neighbors/head and clears membership, retaining the removed record's own links. | A reusable mechanism exists; its correct class-2 invocation boundary still needs the missing lifetime producer below. |
| Class-2 allocation from plan | `004b8470:303–331` allocates a separate class-2 object and stores its index in the existing plan's `+0x92`; initialization is explicitly staged. | Plan identity and allocated building identity are distinct even when the port exposes one Building. |
| Hut upgrade | `004050c0:57–85` allocates the successor class-2 building first. Only successful allocation then cleans up and retires the old object. | Upgrade is replacement with new insertion order and identity, not only movement or model mutation. Failure retains the old object. |
| Neutral Vault | `00402ec0:95–109` runs building initialization for model 18, then forces tribe `0xff`. `004866a0:44–60` can also allocate a model-18 Vault during level postprocessing. | Neutral Vaults remain class-2 candidates; the separate trigger/reward object is not their identity. |
| Authored startup | `00484a10:180–255` walks file records, allocates eligible objects, writes authored ordinal to `+8`, then performs trigger and Vault postprocessing. | Authored ordinal `+8` is distinct from physical ID `+0x24`. Final arrays do not recover all allocation/postprocessing history. |
| Deferred reuse | `004ee300` rebuilds primary free/allocated/pending-free lists from physical records and class/deleted state. `004ec6f0:130–143` counts down pending frees before returning them to a free list. | Immediate browser handle reuse is not proof of native reuse timing or free-list choice. The class-2 retirement transaction remains unbound. |

The accepted Swarm acquisition predicate is first class-2 object of another tribe
in the retained cell chain, absent from ten remembered IDs. There is no occupancy,
completion, model, HP or extra deleted-bit filter at acquisition. Later pursuit
resolves the stored ID and checks zero/deleted/class-zero only; it does not repeat
the class-2 or tribe predicate. See the accepted controller's address-level
citations. A generation guard, nearest-object choice, occupied-only roster or
automatic purge of remembered IDs would add unproved behavior.

## Current producers and their exact gaps

All paths below refer to the pinned main. These are current owners, not a proposal
to rewrite the entire building representation.

| Event | Current owner | Missing correspondence |
| --- | --- | --- |
| Authored ordinary building | `world-initialization.ts:124–146` → `construction-runtime.ts:addBuilding:224–271` | Allocates one browser Building, converts its supplied position to model origin, then appends it. No class-2 identity or initial insertion/relocation sequence is retained. |
| Player/AI plan | `live-command.ts:355–358`; `computer-runtime.ts:959–977` → `addBuilding(..., {plan:true})` | A plan is already in `buildings`, but is class 9. Array presence is insufficient admission. |
| Actual construction allocation | `construction-runtime.ts:345–354` | Clears `preparation`, chooses object and relocates the same browser Building in place. Native separate plan/building identities and allocation failure semantics are not represented by that transition. |
| Hut upgrade | `world-turn.ts:1233–1248` | Changes object/level/position/progress on the same ID. A future cell owner must distinguish native replacement from ordinary same-lifetime relocation. |
| Geometry | `building-shapes.ts:118–136`; the construction/upgrade callers above | `buildingPosition` provides the correct model-origin calculation. It does not preserve previous membership or insertion order. `building-runtime.ts:114` foundation-only writes do not justify reinsertion. |
| Damage/collapse/dismantle | `building-runtime.ts:149,191,240–243,283–295`; `live-building-entry.ts:576–579`; `live-building-combat.ts:746–749` | Multiple paths mark HP zero. Final cleanup/filter is `world-turn.ts:1733–1742,1763`. HP zero and end-of-turn filtering have not been proved identical to native class-2 unlink timing. |
| Plan cancellation | `construction-runtime.ts:337–343`; `computer-runtime.ts:878–886` | Removing an unallocated class-9 plan must not fabricate class-2 retirement. |
| World replacement | `armageddon.ts:114–122`; `game-store.ts:442–452` | Bulk clearing or replacing a world must retire its registry ownership. This alone proves no native per-object order. |
| Neutral Vault bootstrap/lifetime | `world-initialization.ts:124,341–358`; `vault.ts:209–217,235–237` | Owner-255 class-2 records are skipped. A nearby authored Vault supplies only angle to a shrine at the class-6 trigger position with a new browser ID and visual model 154. Open/close morph and trigger activity do not establish native building-body retirement. |

`buildingId` (`construction-runtime.ts:211–222`) is explicitly a ten-bit terrain
handle adapter. After `nextId` reaches 1024 it scans unused handles downward,
considering current object arrays but not historical Swarm target/history slots.
An apparent old-ID match can therefore be a different browser allocation. Neither
blind reuse nor inventing generation-based rejection has native justification.

`BuildingAdmission` is a lazy physical-occupancy owner
(`live-building-entry.ts:233–264`), not a cell-lifecycle owner. `Building`
(`world-types.ts:213–252`) has no cell links or independent native identity.
`syncLandscapeObjects` (`world-terrain-runtime.ts:126–168`) owns footprints,
terrain handles and shadows. Vaults explicitly remain outside that registry
(`vault-geometry.ts:30–45`). None can substitute for native cell-list history.

The existing `object-cells.ts` mechanics remain reusable. However,
`syncLivePersonCells` (`live-people.ts:317–350`) removes every registered object
that is not the current person-map record. The existing World list cannot simply
receive buildings. A separate class-2 projection can preserve relative class-2
order because other classes' insertions/removals do not reorder those members;
that is a mathematical design option, not proof that its events or IDs exist.
It also does not solve later pursuit resolving an ID reused by another class.

## Required saved state, without inventing lost history

The browser store already clones the complete World and uses IndexedDB
(`game-store.ts:414–444`). Maps, typed arrays and shared references need no separate
JSON approximation. `migrateCheckpoint:139–285` currently supplies no class-2
history; `createWorldState:128` creates only the existing person-oriented cells.
Restart/startMission reconstruct startup, whereas Load restores an existing
world. They must not be treated as the same producer.

Any future reviewed owner would need to preserve at least:

- Class-2 lifetime identity, current native ID/lookup binding, separate browser
  terrain handle and authored-source identity where present; explicit aliases
  for plan allocation, upgrade replacement and Vault body versus trigger.
- Current class/model/tribe, deleted/liveness state, actual position cell and
  membership flag, cell heads and ordered links (or an exactly equivalent
  ordered representation). Anchor/rotation/object and pending relocation state
  must retain their existing owners without resetting list order on Load.
- The identity allocator's live, retired and reusable state, including any
  required delay/free-list ordering, **if** native remembered-ID reuse is claimed.
  A monotonic adapter ID can be an implementation policy, but is not native
  physical-ID equivalence.
- Swarm's own stored target ID, ten history words, cast origin, phase/substage,
  lifetime and child ownership when pursuit is implemented. Registry restoration
  must not clear or rebind those fields merely to make targets valid.
- A versioned completeness distinction for legacy checkpoints. Existing saves
  have neither class-2 list order nor the omitted Vault/body/replacement history.
  Sorting IDs or replaying current arrays cannot certify that missing history.

This is a necessary-state inventory, not a claim about the native save-file
format or an approved legacy migration. An internal lifetime token may prevent
port ownership mistakes; it must not silently change the native raw-ID predicate.

## Exact stop boundary and next evidence

1. **Port producer absent:** bind actual class-2 allocation, relocation,
   replacement, retirement and restoration, including Vault bodies. Keep it
   independent of person reconciliation and terrain-handle aliases. The caller
   table above is finite; an arbitrary `buildings` snapshot is not that producer.
2. **Class-2 lifetime source incomplete:** retained `004ef180:25–27` dispatches
   class 2 to **`00403820`**, whose body is absent from the selected main export
   manifest. `00403860` proves occupant/terrain/associated-object cleanup, but
   does not itself unlink the building or define the deferred-free transaction.
   Upgrade and Vault terminal callers then invoke `update_after_unit_alloc`;
   that named body is not retained either. `004edcf0`, identified as deletion
   in existing research, is also absent from this export manifest. Do not import
   another class's destructor as proof. A later separately authorized retained
   source recovery must bind these exact producers before claiming reuse timing.
3. **Bootstrap/legacy order incomplete:** the retained loader proves authored
   allocation before Vault postprocessing, but current aliases omit some of
   those records and its `load_level_init_units` tail is not bound here. No
   current save can supply history it never recorded. Define a supported
   initialization/continuation boundary before claiming exact first-target order.

The accepted ejection queue/returned-person mapping is unchanged and is not a
new blocker. PR284's successful-Hut passive storage and the earlier ground-Swarm
episode do not close building allocation history, Vault identity or class-2
retirement. No runtime implementation, class-2 compatibility rewrite, browser
encounter, tests, native execution, parity increase or issue closure is delivered.
Verification here is source/hash/link inspection only.

[controller]: https://github.com/JohnDeved/populous-new-dawn/blob/74b74346f2d67e94aed013fc9e1960e20ef36ceb/decomp/research/swarm-building-pursuit.md
[review]: https://github.com/JohnDeved/populous-new-dawn/blob/74b74346f2d67e94aed013fc9e1960e20ef36ceb/references/verification/swarm-building-static-2026-10-09/integration-review.md
