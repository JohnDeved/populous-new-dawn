# Early-level effect phase contribution

Issue 73 follow-on from [secondary puff phase](hut-smoke-secondary-phase.md).
The attachment and [partial-root allocation-turn repair](hut-smoke-first-visit.md)
remain unchanged. This prerequisite fixes the direct authored class-7 contribution
in Missions 1–3. It does **not** enable child puffs or claim a complete initial or
later native allocation stream.

## Failure-first original record witness

At base `734e496807020a8ab62bc5e981cfd00187f71719`, `createWorld(1..3)` sets
`effectCounter` to zero and never counts authored class-7 level records. In the
original loader [00484a10](../generated/00484a10.c), the record branch at
`00484edc..00485038` passes those records to the primary allocator. The later
head-link deactivation does not reverse their allocation:
[004edf50](../generated/004edf50.c) clears active flags/state, not the class seed.
The first initializer [004ed580](../generated/004ed580.c) sets the active flag.

The original reset instructions `0042bfe7..0042bffe` clear twelve bytes beginning
at `0096eac1`, covering the class-7 byte at `0096eac8`. This indexed clear is not
legibly represented in the older typed [0042bfa0](../generated/0042bfa0.c) export;
use the executed original instructions rather than inferring reset from that C.

`check-native-hut-smoke-initial-phase.py` runs this reset, the exact record
filter/allocation branch, and the real primary allocator. It scans all 2,000 raw
records in each of the three hash-verified level files:

- Mission 1: no direct authored class-7 allocation; contribution 0.
- Mission 2: record 61 (zero-based 60), model 24, owner 0; contribution 1.
- Mission 3: record 104 (zero-based 103), model 23, owner 0; contribution 1.

Four additional synthetic records prove the native signed-owner filter, model-83
exclusion, and model-81 owner remapping. Direct class-7 allocations execute the
original pool/list/counter instructions. Other-class allocation, all class/model
initializers and record post-processing are intercepted. The caller supplies the
free list and tribe count 4. Thus these results prove the **direct authored
contribution**, not that every initialization-time callback has been composed.
The probe does not launch Windows, Wine or the whole loader.

The first source-bound comparison failed with native contributions `[0,1,1]`
and browser phases `[0,0,0]`. The runtime correction increments the existing
adapter while reading eligible original class-7 records; it is not a hardcoded
per-mission offset. Its scope is the three audited early levels. It does not
activate the linked effects, allocate extra browser IDs, consume random values,
or directly mutate gameplay state. Later missions retain their existing adapter until
that loader composition is audited.

## Presentation ownership required before children

The seed correction is insufficient to enable child puffs safely. The startup
code explicitly counts effect 8, effect 7 and effect 9 plus its visual leaves,
but the existing helper proofs intercept allocation. A composed native witness
must still establish allocation order/capacity from initialization through the
ordinary settlement root, including other reachable producers. One missing
component must not become a claim of complete primary-stream equivalence.

The secondary owner must cover more than a per-building timer:

1. Keep one reverse-allocation-ordered secondary collection, distinct from the
   primary seed. Preserve counter bytes and newly-prepended-child deferral.
2. Account for shared secondary users. Already exported producers include model61
   destination markers (`004afff0`, `004aa8b0`, `004aab80`), model51 UI dust
   (`004708d0`, `00471c40`), and class10 helper records (`00504060`, `004b8f50`).
   This list is a source inventory, not a claim that all are active in every
   settlement. Counting just roots/puffs cannot enforce the native shared gate.
3. Process on fixed game turns, once per chronological visit, before rendering.
   Preserve the merged first-visit distinction: an earlier building/admission
   allocation is visited this turn; a child born in the traversal waits.
4. Specify checkpoint ownership explicitly. Current scene-owned roots are
   reconstructed from occupancy; they do not preserve phase, children or list
   order. `effectCounter` itself already survives the ordinary checkpoint store.
   A new secondary owner cannot silently infer its old history on reconstruction.
5. Specify the native draw/turn ordering explicitly.
   `animateLightning` in `scene-effects.ts` calls `lightningLines` with the same
   `world.cosmeticRandom` used by hut smoke. The latter function intentionally
   draws every rendered frame. Therefore merely moving child visits to fixed
   turns leaves their sampled RNG dependent on intervening lightning draws.
   This coupling also exists in the original: draw-polygons case 0x13 in
   `004673b0` calls `00475350`, which consumes the same `0089bc72` value as
   `0050c260`. Do not require frame-invariant puff identities or invent an
   independent smoke seed. Preserve the proved shared-RNG ordering while keeping
   lifetime/counter visits on game turns. Complete native outer scheduling is
   still a separate composition boundary.

No broad particle rewrite or fake periodic puff timer is part of this change.
The issue remains open for the complete primary stream and secondary ownership.

## Reproduction and retained evidence

From the repository with the original game next to its `levels` directory:

```sh
source /workspace/shared/populous-prerequisites/env.sh
python -B scripts/check-native-hut-smoke-initial-phase.py "$POPULOUS_EXE"
node --test tests/effect-initial-phase.test.mjs
```

The supplied executable SHA256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Each level SHA256 must match the imported runtime source identity. The native
probe reports 6,000 records, four filter cases and twelve reset bytes.

The focused runtime regressions cover fresh Mission 1–3 opening allocations,
pause, ordinary checkpoint/restart, and 30/60/120/144 Hz plus irregular elapsed
time. These establish adapter consistency, not a rendered-scene or original
whole-game timing claim. The render-only RNG boundary above is outside that
simulation-only schedule test.

New exports were generated by Ghidra 12.1.3 using the existing section-verified
project with `scripts/decomp.py export 004ed580 004edf50` (the same scoped run also
inspected `0044ddc0`, which only clears terrain buffers and is not a new evidence
dependency). The wrapper confirmed all files and project save. Raw export log,
source-bound native red/green receipts and final gates are retained under
`work/orchestration/secondary-hut-smoke/`. No assets or parity ledger are changed.
