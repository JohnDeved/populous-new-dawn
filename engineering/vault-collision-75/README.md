# Issue 75: closed Vault collision and authorized entry

Base: `5282c4c57bdfd128741373be25f1b1faa8a66865`.
Refs #75. This does not close the report's unidentified-structure/rendered acceptance.
PRs #100 (Stone Head heading) and #282 (Vault outside geometry) are already merged.

## Evidence boundary

The retained Ghidra exports are static evidence, not an execution of the original.
Their manifest identifies executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
`native-contract.sha256` binds the consulted exports. No original execution,
golden regeneration, browser run or rendered before/after pair was performed.

- `00403a00`: physical building shape masks own flag `0x200`, ten-bit building
  owner, neutral tribe ownership and shade. All Vault frames 152–155 use shape59.
- `0043c7a0`: phase1 plans the outside point; phase4 clears `0x10007`, sets bit2
  and dispatches direct inside movement; phase7 clears that mask and dispatches
  direct outside movement; phase9 recovers first, outside-corrects and snaps the
  idle anchor for an occupied leave cell, then directly dispatches the unchanged
  leave point. Exact phase-entry tests retain one recovery RNG draw.
- `004e9dd0`: direct destination releases the route. Shared obstacle recovery may
  later replan; a permanent route-free assertion would be wrong.
- `00517f10`/`005178d0`: bit2 only permits the completed building named by
  workTarget. Ordinary closed approaches have no such permission.
- `0050b740`/`00416d70`: footprint lookup must resolve a neutral building;
  it shakes but takes no hostile blast building damage.

## Public caller witness and corrected setup

At the base, actual M3 Shaman46 starts after level start, receives ordinary move3
behind Vault92, then accepted command33. At turn622 it enters occupied shape59
cell during phase1 with closed frame154, despite the correct outside goal. The
nine expected cells have flag512/owner zero. This is a CPU live-path failure,
not an original-game or rendered comparison.

The first staging probe incorrectly required12 native units, and a second
used an ad hoc112 threshold. Both failed setup logs are retained alongside the
successful baseline diagnostic. The final witness uses `personReachedOrder`:
Shaman movement radius160 plus the point descriptor radius56. It does not reuse
Vault arrival's <=11 square as a generic movement completion assertion.

The repaired public M3 rear and side journeys reach prayer at turns679 and670,
with every sampled closed-approach position outside the registered mask. M1's
seam journey reaches prayer at turn928 after earning Landbridge and removing its
coast guard by ordinary commands/casts. The earlier missing-prerequisite and
combat-interruption failures are retained, not reclassified as product failures.

`tests/vault-collision.test.mjs` separates:
- ordinary movement, accepted Vault command, prayer, open entry, exit/departure;
- actual current-world in-session checkpoint Save/Load continuation;
- explicitly supplied inside impulse/recovery and zero-health boundaries.

Death retires the live person/cell/order; the test does not pretend the detached
JavaScript object receives a replacement-state initializer. Replacement while
alive clears access and recovers outside. No fresh-process Load proof is claimed.

## Newly occupied-cell consumer inventory

| Consumer | Treatment |
| --- | --- |
| Footprint registration/lifetime | Only modeled top-level Vaults join the existing incremental building map. Inactive reward triggers retain their visible body. Frames, movement, model0 and removal unregister/re-register through the existing owner. Hidden linkedShrine records do not reserve cells. Existing building iteration is unchanged; this is not a global allocation-order rewrite. |
| Collision, support height, route endpoints | Shared `liveBuildingShape`/`liveBuildingModel` resolves normal buildings first, then a modeled top-level Vault. Collision objects append neutral class2/state2 records; normal building/person ordering is otherwise unchanged. |
| Vault adjacent admission | Reads the actual packed cell owner, not an independent shape-distance fallback. A registered normal-building owner still wins. |
| Generic outside/resting/anchors | Movement, resting, builder-rest anchors, combat pursuit/vehicle departure, panic, AI cleanup and teleport resolve the same physical shape. Specific attack/construction/admission target lookups remain ordinary buildings. |
| Impulse/ground recovery | Model and inside/approach/outside callbacks resolve Vault bodies; missing-owner errors are retained for invalid cells, not silenced. |
| Blast | A neutral model18 record resolves footprint lookups and carries existing shake state into the existing renderer shake consumer. It is not inserted into invented mixed-class cell-chain slots. It receives no building damage or ordinary admission. |
| Placement | Removes the old duplicate placement-only Vault overlay. Uses the real mask, and supplies neutral descriptor18 for validity lookup. No new footprint dimensions or collision radius. |
| AI/combat/admission | Existing optional lookups safely reject a Vault as a tribe building, attack/sabotage target, training destination, occupant container or timber-requiring neighbor. AI marker-generated entry orders are rejected by ordinary target validation. No ordinary-building capability is added. |
| Terrain edits | Existing notifications safely mark occupied cells, while building-specific dirty/collapse callbacks remain guarded. Model18 special-ground settling/attachments are still not owned by the shrine adapter. This pre-existing limitation is not claimed fixed or silently replaced with hut destruction behavior. Mask removal clears its terrain-dirty bit through existing mode4. |
| Cleanup, UI/globe | Normal building destruction remains keyed to its own object. Body removal/model0 is covered by shared footprint cleanup. Tooltip/selection optional lookups remain safe. Globe does not invent a tribe icon for an unowned Vault. |

Packed owner IDs remain1..1023. Authored Vault trigger handles used by the current
adapter fit that domain. The new scalable general object allocator is not a
physical-building allocator: two supplied second-Vault fixtures now use explicitly
unique authored-style handle900, not nextId++. No allocator, linked-shrine ID,
save migration, alias or packed-domain expansion is introduced. Separate original
class2 physical-object identity is still an adapter limitation.

## Receipts

Raw success and failed-setup logs are retained outside Git in the portable
`vault-collision-evidence-20261019.tar.gz` bundle. Its SHA-256 is
`127bb54babe2bf9c540a24d8e53322df4a8628c3ed4b3afbffa4de5037e68843`. No raw logs are part of the publication branch. The2142 batch
passed existing admission and journey tests, but failed three new-fixture setup
assertions. The2143 run passed all10 new tests in3.09s after the explained setup
corrections. Its tracked-diff hash plus hashes for both untracked source/test files
are in the log. Later formatting and the second caller-fixture handle900 adjustment
require the final frozen candidate validation; these earlier receipts are not
claimed to cover unrun later changes. Typecheck, expanded focused regression and
independent review remain required before activation.

## Hosted integration diagnostic timing

The first full gate on `cfe8f508` exposed previous-port campaign turn pins,
not original-runtime goldens. Four initial observation pins are updated after
review: automatic Mission3 sermon starts 2540→2528 and 2500→2492, Mission6
marker Bridge completion 7306→8404, and first Mission6 raid 6767→7791. The
original failures and paired source-bound traces are retained outside Git.

The source-supported changes are distinct: Mission3 phase4 grants linked-body
access and dispatches direct movement before recovery, as `0043c7a0` specifies;
Mission6's real physical Vault mask changes a timber route cost from28 to30,
reorders two equal-cost choices and subsequently changes economy/RNG history.
Authored neutral class2/model18 bodies and their shrine adapters share the same
coarse anchors. These observations do not certify original whole-game timing.

Only these four previously measured port turns change here. Native counters,
actor identities, phase/order/reference checks, RNG/checkpoint twins and outcomes
are unchanged. Full affected journeys must still run: a later failure is a new
diagnostic frontier, not permission to replace additional constants or goldens.
