# Hut smoke secondary allocation phase

This is the remaining child-puff question under issue 73, after the corrected
[attachment selector](hut-occupancy-smoke.md#attachment-selector-correction-2026-10-03)
landed. It adds no runtime, asset or parity-ledger change. The question is whether
full-hut puffs can use an existing browser counter without fabricating the
original allocation phase or presentation RNG order.

## Producer and exact eligibility

The retained [0050c260](../generated/0050c260.c) processor and original instructions
`0050c27c..0050c2ee` establish the complete model-74 child producer:

1. Read the **root effect's** byte at `+0x2e`; proceed only when `counter & 7 == 0`.
2. Advance the cosmetic RNG at `0089bc72` exactly once. Only low-five-bit results
   **0 or 1** continue. This is an eligible-visit draw, not a wall-clock frequency.
3. Call the native capacity precheck `004edae0(7,75)`, then secondary allocator
   `004edbd0(7,75,root.tribe,&root.position)`.
4. If allocation succeeds, set the child's byte `+0x2d` to 1.

The gate's model-specific reserve is also significant. Before allocation,
model 74 permits secondary allocation count `<=150`; model 75 permits `<=140`.
The comparison is inclusive and the allocator can still fail for an empty pool.
For an eligible root the cosmetic draw occurs **before** either capacity/pool
failure. Counting just living hut puffs cannot reproduce this shared-pool gate.

`0050c150` initializes model 75 with lifetime 16 and animation descriptor 40,
starting at HFX1385. It initially copies the supplied parent position and, if its
cell identifies a building, resolves that building's corrected socket. This
reuses the existing partial-smoke atlas, not new artwork or a guessed trajectory.
The placement probe covers that initializer/socket composition separately.

The child flag changes expiry ownership. On its sixteenth processor visit, the
child calls removal `004ef180`; it does not enter the hidden/restart cycle of a
retained partial root. In particular, even a hidden child does not consume the
partial-root restart RNG. Full roots retain lifetime -1.

## Phase ownership and traversal order

[0040c4e0](../generated/0040c4e0.c) creates both occupancy root variants with
**secondary** allocator `004edbd0`, the same allocator used for children.
The earlier note correctly identified dependence on the class-7 allocation
stream but did not spell out this primary/secondary distinction:

- [Primary allocator 004ed8a0](../generated/004ed8a0.c) copies class-7 seed byte
  `0096eac8` (`start_24[14]`) to object `+0x2e`, then increments the seed modulo
  256. The class-7 descriptor's relevant byte is `0x28`, which lacks bit `0x10`.
- [Secondary allocator 004edbd0](../generated/004edbd0.c) copies that same seed
  and **does not increment it**. Neither creating a smoke root nor creating its
  child advances the shared class-7 allocation seed.
- The secondary list is prepend-on-allocation. The original
  [004ec6f0](../generated/004ec6f0.c) loop at `004ec924..004ec942` captures each
  object's next pointer, increments that object's counter, then dispatches it.
  Thus a newly prepended child is absent from the current traversal. It begins
  processing at the next traversal with inherited counter plus one.
- A root allocated before the secondary traversal, including from the earlier
  ordinary building pass, is already in the list when its head is sampled. Its
  first eligible processor visit is `8 - (initialCounter & 7)`, from 1 through 8.
  This is a source-derived visitation statement, not a newly executed full turn.

The phase cannot be obtained from a hut's building counter, world turn, render
frame, occupancy count, or an arbitrary per-hut offset. Multiple roots can copy
the same seed, and their later first eligible world turn depends on allocation
and traversal timing. The LIFO secondary order also determines the order of
cosmetic RNG draws among roots already eligible on the same visit.

## Current adapter gap and bounded next step

At base `a4aff01ffb9b53599aee48277a38e67669399108`:

- `app/world-effects.ts::effect` explicitly labels `world.effectCounter` as a
  browser allocation adapter with complete native class-7 ownership pending.
  It increments for selected generic effects, not the entire native primary
  allocation stream. It excludes the existing secondary destination marker.
- `app/scene-entities.ts::updateHutOccupancySmoke` creates roots in per-building
  render state. That state has no native allocation counter or shared secondary
  list, and normal frame reconciliation traverses `world.buildings` order.
- `app/hut-occupancy-smoke.ts` intentionally implements root lifecycle only.
  Scene reconstruction initializes roots from current occupancy; it does not
  restore native effect allocation history.

Therefore simply adding an eight-turn RNG branch to the current helper would
invent initial phase, cross-hut draw order and shared capacity behavior. Nor is
copying `world.effectCounter` sufficient evidence of original-equivalent phase.
No runtime patch is proposed as already safe on the basis of this research.

The next implementation prerequisite is a deliberately owned presentation
allocation adapter: audit native primary class-7 producers reachable in the
bounded settlement scenario, map their ordering to existing effect creation,
and prove the shared seed from ordinary mission initialization through real
root allocation. The secondary presentation owner must separately retain root
phase, reverse-allocation visit order, allocation failure, and child lifetime.
Checkpoint/reconstruction and frame-rate-independent visits need an explicit
contract; they cannot be inferred from current scene state. This does not
require altering gameplay RNG or adding invented smoke density.

## Reproducible bounded evidence

Run:

```sh
source /workspace/shared/populous-prerequisites/env.sh
python -B scripts/check-native-hut-smoke-puffs.py "$POPULOUS_EXE"
```

The new checker is limited to the producer, native primary/secondary allocation,
model-specific precheck, real smoke initializer and the isolated secondary-list
traversal slice. It sweeps every byte phase and all 32 low-bit RNG outcomes,
all 256 allocator seeds, precheck boundaries, empty-pool behavior, child expiry,
and first-eligible-visit offsets.

On 2026-10-03, the unchanged checker passed with Unicorn 2.1.4 / Capstone
5.0.7: **8,192 producer cases**, **256 allocator seed cases**, **332 capacity
prechecks**, first-eligible offsets `[8,7,6,5,4,3,2,1]`, exact secondary-list
ordering and sixteen-visit child expiry. Exit code was 0. The tested script's
SHA256 was `456c50c798ce23b20e71fff2a54ac4354cf8a5637804014273e63cab5f42fdb9`;
raw command output and source/input fingerprints are retained under
`work/orchestration/hut-smoke-puff-phase/`. There was one run and no native retry.

The executable is pinned through `native_cpu` to SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The existing Ghidra 12.1.3 exports are checked against `decomp/exports.json`;
new static disassembly uses Capstone on the same verified PE bytes. No Ghidra
project was opened or modified for this research.

Supplied inputs are bounded unit pools, seed values, tribe and coordinates.
Class initialization is routed to real `0050c150` for smoke and skipped during
the generic allocator sweep. Class/list transitions, animation assignment and
final removal are intercepted; the final position leaf copies the original
computed coordinates. The bounded list dispatcher routes its supplied smoke
objects to the real `0050c260` processor. No part of the surrounding world loop
runs, and no Windows EXE, installer or Wine process is launched.

This checker establishes the listed native semantics, not equivalence with a
browser implementation, original terrain/raster output, a whole-game allocation
trace or hardware performance. The existing corrected root-placement proof and
paired browser screenshots remain separate evidence.
