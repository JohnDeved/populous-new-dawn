# Swarm prerequisite: authored bootstrap tail

The concrete `00484a10` tail is now bound: `0048506f` calls `004edf50`.
That body already exists as `FUN_004edf50` in the retained exports. The earlier
Swarm mapping's unbound symbol was a correspondence gap, not an unavailable body.
This finite pass establishes the linked class-2 deactivation boundary and its
current port owner. It does not implement Swarm pursuit or a shared allocator.

Assessment base remains `f9675f56c597ec83adf02f28e9801bfc6bbd0490`.
Research branch before this pass: `7b69161f736e5b20ede2f59e73ff2119e2abb746`.
The earlier immutable mapping at `7b3f4b775` and retirement packet at `d2606766`
remain historical evidence. The accompanying [manifest](manifest.json) binds the exact source,
canonical input, decoder, commands and output bytes.

## Reconciliation with existing work

`decomp/research/hut-smoke-initial-phase.md` already identifies `004edf50` as
head-link deactivation and `004ed580` as the initializer that sets the active
flag. Its native probe deliberately intercepts other-class allocation and
initializers; it does not establish a complete initialization stream.
`mission5-boat-reward-initialization.md` already resolves normal allocation's
`004ed8a0 → 004ed580` call from assembly and separates the allocated physical
record from the linked reward template. Those accepted interpretations are
reused here. This pass adds the exact caller binding, the class-2 membership
consequence, the physical traversal/link order and the current Swarm owner gap.
It does not repeat their native probes or extend their execution claims.

## Actual order and identity

1. `00484a10` reads authored records in file order, allocates eligible records
   through `004ed8a0`, applies `00485b00` postprocessing, then puts the one-based
   authored ordinal at record `+0x08`. This is distinct from physical ID `+0x24`.
2. `004851e0`, called at `00485050`, resolves each of the ten class-6/model-6
   links by finding that authored ordinal in the allocation list and replacing
   the link with the found physical ID. An unresolved link becomes zero.
3. The loop `00485055–00485068` clears temporary `+0x08` values through the
   allocation list. It does not change physical IDs or rebuild cell links.
4. `0048506a` calls retained `004866a0`. Its trigger/scenery path can allocate a
   separate neutral class-2/model-18 Vault, then retire the scenery record.
5. `0048506f` calls `004edf50`, before the caller's subsequent `0x40000000`
   flag pass. No `004ee300` list reconstruction is present in this selected tail.

`004edf50` walks fixed unit storage in ascending addresses, stride `0xb3`,
between globals `00890378` and `00890384`. Retained `004ed820` binds these to
`008e04db` and `00937a98`: physical records 1 through 1999, with end exclusive,
using the fixed-index setup in `004ed880`. The interval includes the secondary
records 1840–1999: `004ed820` places the split at `00930ab8`, as already recorded
in `hut-smoke-secondary-owner.md`. This is not allocation-list order or the
browser Building array. For each class-6/model-6 record it visits ten ushort
links at `+0x72` in ascending slot order. Nonzero links index `00890390` directly.
The body assumes valid resolved links; it adds no null, class-zero or deleted
guard after lookup.

## Linked class-2 operation

| Gate or operation | Exact effect |
| --- | --- |
| Target `+0x10 & 0x20000000` | Required; cleared before later work. A repeated link normally does no work after the first clearing, unless a called operation changes the flag again. |
| Target `+0x0c & 0x20000` | If set, splice the target out of its actual XY cell using `+0x20/+0x22`, repair head/neighbors, then clear membership. The target's own old link words are not zeroed. |
| Target `+0x0c & 0x04000000` | Conditional sunlight cleanup through retained `00401140`; this edits light/terrain state. |
| Target `+0x0c & 0x100000` clear | Write state `+0x2c = 0`, then dispatch the class initializer. The class-2 table entry calls `004030c0` at `004ee09d`. Because state is zero, its state-minus-one switch takes no case; its remaining paths can retire referenced helper records at `+0x84/+0x92`. |
| Target still class 2 | Call `00403860` at `004ee0f8`, regardless of the preceding state-init guard. This is building cleanup, not the `00403820 → 004edcf0` retirement wrapper. |
| After cleanup | Call `0044fad0` for the target's actual XY cell, then continue to the next link. |

The selected routine directly writes neither the target's physical ID nor class
zero/deleted, and does not splice that target into pending-free or a free pool.
Its class-2 cleanup handles footprint/territory state, occupants and referenced
helpers. Thus inactive/unlinked storage must remain a distinct lifecycle state
from the accepted retirement operation. This is not a guarantee for malformed
self-aliases in helper fields or every class-specific transitive callback; no
such synthetic alias is projected into the port.

The newly inspected immediate helper `0044fad0` traverses remaining cell members
to derive terrain flag bits `0x2` and `0x80000` from scenery descriptors. It does
not write cell head/link fields, target identity, class or allocation-list links.
When the latter terrain bit changes, it calls retained `00422a60`, which updates
terrain lookup bitmaps using retained `00422bd0`. This helper does not reinsert
the deactivated building. The terrain predicates themselves are not new parity
claims.

For Swarm, acquisition cannot discover a record absent from the cell chain.
Raw-ID history and pursuit resolution are a separate owner: deactivation does
not itself erase those IDs or perform the retirement predicate's class-zero/
deleted transition. Adding an `active` predicate to raw pursuit is not justified
by this bootstrap finding.

## Current port correspondence and checkpoint requirement

At the assessed base, `createWorld` constructs `linkedObjectIds` from authored
head links. Vehicle creation uses it for `active`; selected effect/tree paths
also consume it. The ordinary class-2 branch at `world-initialization.ts:124–146`
does not consult it: it calls `addBuilding` for every non-neutral class-2 record.
`addBuilding` allocates a terrain handle, positions/grounds the building and
appends it. No field records this original linked deactivation or physical-ID
lookup/cell-membership history. The later `syncLandscapeObjects` produces
footprint/terrain data, not the missing ordered native class-2 query chain.

Neutral Vault identity remains absent: the ordinary class-2 branch skips owner
255; the shrine path only borrows a nearby model-18 angle and allocates a separate
browser shrine ID at the trigger position. The newly bound tail does not make
that shrine a native building body. The previously proved class-9 plan to new
class-2 allocation and replacement-on-upgrade identities also remain separate.

A faithful owner must distinguish authored ordinal, physical allocation ID,
browser entity ID and ten-bit terrain handle; preserve ordered physical links
from the trigger mapping; retain allocated-but-unlinked/deactivated objects;
and separately represent retirement/pending/free status. The typed browser
checkpoint can preserve declared World data, but it cannot recover this missing
history from current arrays. Save restoration remains unproved here; no legacy
save migration or compatibility reconstruction is proposed.

## Authored Mission 1–3 consequence check

The [read-only inventory](early-level-inventory.json) parses the existing committed
level JSON literals, without importing game code or running the asset importer.
It covers 44/81/109 objects, 3/3/2 class-6/model-6 heads and all 30/30/20 link
slots for Missions 1/2/3 respectively. None targets a class-2 record. All nonzero
links resolve within the authored range. Exact zero slots, duplicate words,
target classes/models/owners and all authored class-2 records are retained.
Therefore this particular linked-building deactivation omission has no authored
M1–3 instance in the committed data. The separate neutral Vault omission remains.
Native active/membership/state-init flags are runtime state absent from these
decoded records; their actual values are not inferred. Embedded DAT/HDR hashes
are retained declared provenance, not a fresh comparison with original files.
This is neither a physical-ID reconstruction nor ordinary gameplay proof.

## Smallest next finite boundary

The bootstrap tail no longer needs a missing-body investigation. The remaining
bootstrap composition owner is earlier than this tail: the actual fresh-level
caller must establish the initial physical-record/free-pool and cell-head state
before `00484a10`, including allocations made by reachable class/model
initializers. Fixed-index setup and the allocator/list-reconstruction bodies are
already retained, but this pass does not bind that caller or a complete shared
allocation stream. Consequently it supplies no exact Mission-specific initial
ID sequence or first-target prediction.

The remaining
original restoration boundary is whether and how the save writer preserves the
physical unit storage and how the actual Load path rebuilds pointer/index lists.
The named next source entry is `004f0bd0`, reached by the retained scheduler's
write-save call at `004ec9fa`, paired with `game-store.ts`'s typed World save/Load
replacement. First bind the writer's exact saved fields and its counterpart Load
caller; do not infer restoration from `004ee300`'s mere existence or from other
mass-world callers. No code implementation or full allocator pass follows from
this document. The already proved allocation/insertion/relocation/retirement
bodies and current lifetime gaps stay explicit.

## Verification limits

Canonical EXE SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
and GNU objdump 2.44 SHA256
`96afb8521834982d0e711b5d6e9785252bf82129fb0106b93a6bd54d83fae11f` were verified
before and after bounded data-only decoding on CPU 4. All four decoder commands
exited 0 with empty stderr. No original instructions were executed.

The first caller window ended with a partial instruction at `0048509f`; it was
retained as an exploratory slice and is not treated as complete code. The exact
caller slice ends at `00485074`, immediately after the bound call. `004edf50`
returns at `004ee155`; `004ee158–004ee183` is its eleven-entry dispatch table,
not linear instructions. `0044fad0` returns at `0044fbcb`; later bytes are padding.
Complete local branch/return coverage is claimed only for these two bodies,
not the caller, terrain/class callback graph, full loader or native save format.

This source-only result adds no browser witness, runtime tests, native execution,
allocation-stream equivalence, cadence/raster proof or Swarm gameplay parity.

Independent bootstrap review SHA256:
`e890e164b5261a150230ca7f2be7de52805385396f903415cb4a1c230c29b319`.
The corrected local findings hash is
`a8f25fcf4138d37be1e6cee5d543dc0f189326d021ee290ccad2d976a012fcb6`.
The manifest preserves the original draft/range correction and all decoder
receipts by hash. No binary, original level file or raw profile is published.
