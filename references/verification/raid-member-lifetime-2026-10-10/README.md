# Raid member admission and controller lifetime

Refs #248. Compact projection of the independently accepted static extension to the [combined phase16 diagnostic](../../../decomp/research/raid-phase16-target-persistence.md). This establishes the missing phase3 admission operation and matched-owner release boundary. It does not approve a runtime byte-write patch or claim gameplay/parity credit.

## Accepted finite contract

Ordinary `004cb400` completes phase3 quota/fallback selection, requires task cursor `+0x25 == 7` and nonzero selected WORD `+0x0c`, then scans the entire tribe person chain. At `004cb7d0–004cb807`, **every person currently in state14** receives `004f2440(person, slot+1)`. It does not filter by returned selection IDs, model, old assignment, deletion flag or old special bit. A foreign assignment is overwritten. A selected person whose state transition was blocked is excluded unless actually state14. Zero selected count takes phase23 without admission, even if unrelated state14 people exist.

The [registered membership writer](https://github.com/JohnDeved/populous-new-dawn/blob/4754e12d3590bde18656416514871b033de164be/decomp/generated/004f2440.c) clears person `+0x7f` bit0 and writes the owner's low byte to `+0xaf`; owner0 additionally clears person DWORD `+0x14` mask0x2000. Admission ORs mask0x2000 only when task `+0x31` bit0 is set. With that task bit clear, an already-set person mask remains set. Task `+0x31` bit1 can change the resulting phase from4 to7. Its native allocator producer is the pair of per-tribe script bytes consumed at `004e6398–004e63dd`; no matching current-port field is invented here.

Selection-lock release through `004f6440` does not clear assignment. Initial ordinary phase15 dispatch `004ce0a0` consumes prior assignment; it does not directly create it. Phase16 consumes the same assignment before its separate flag/model maintenance. Explicit state33/model5/model7/special-branch release sites remain meaningful, including assignment clearing after a member has already contributed to that visit's tally.

Phase23 calls `004f2520(tribe, slot+1)` at `004cca6b–004ccaae` before task cleanup/freeing. The [registered release helper](https://github.com/JohnDeved/populous-new-dawn/blob/4754e12d3590bde18656416514871b033de164be/decomp/generated/004f2520.c) scans the full tribe chain and clears only matching assignment, `+0x7f` bit0 and person mask0x2000. People reassigned to another owner remain unchanged. Native staging-return orders do not themselves release assignment.

At inspected source `4754e12d3590bde18656416514871b033de164be`, the port accumulates returned IDs in `task.members` and turns select actions into state14, but omits the subsequent completion scan/write. Phase23 and direct retirement paths clear array/task state without corresponding matched-person-field release. Adding the byte write to each selection action would be too early, miss additional state14 people and mishandle the final fallback action batch. This is a proved source mismatch independent of the later diagnostic zeros; it is not proof of duplicate recruitment or an ordinary Mission1–3 symptom.

## Five runtime gates remain unresolved

1. Native task `+0x31` producer and phase behavior lack a retained port representation.
2. Clearing `+0x7f` bit0 does not establish unknown upper bits. An absent optional byte cannot become a fabricated zero.
3. Person fields, `task.members`, reassignment and every retirement exit must agree. Existing phase6 tests deliberately use the array as supplied admission.
4. Fresh person replacement can lose assignment; retained registered-owner transfer is a distinct, narrower case. A stale `u.native` or presentation-selected person is not necessarily authoritative.
5. New checkpoint structured-clone continuity does not solve legacy checkpoints containing zero-valued raid owners. No native save-serializer equivalence was recovered.

The accepted next step is a small supplied-input regression through `withCampaignTribe`/`stepComputerTasks`, including final action ordering, an extra same-tribe state14 person, non-state14/other-tribe controls, registered-versus-stale owners and matched retirement. Known7f bytes and an already-set person0x2000 bit permit bounded assertions without inventing task flags. This projection contains no regression code or execution result.

Historical phase6 fixtures at turns8370/8417 retain members386/415/445/398 with four raw assignment zeros; their linked hashes and controls remain unchanged. The later diagnostic remains overall **FAILED**: accepted evidence ends with dispatch7637 and guarded visits7640/7643/7646, members377/378/540/455. Neither those zeros nor the newly identified writer proves a native admitted tally. Existing route/counter/prelude, world-list and transitive cleanup boundaries, Mission1–3 uncertainty and publication/PR292 reuse holds remain in force.

## Audit and validation

The [manifest](provenance.json) pins the accepted report, provenance, inventory, [unchanged independent verdict](independent-review.md), canonical EXE/tool identities, immutable source/fixture references and one small instruction excerpt. Existing sources and large native ranges are referenced by link/hash instead of duplicated. No raw worlds, storage/profile dumps, game binaries or archives are included.

The accepted source review reproduced46 reads, checked26 export hashes,10 reused inputs and48 inventory entries. Publication checks cover JSON, copied verdict/source hashes, exact excerpt selection, relative links and `git diff --check`. Runtime, native, browser and regression tests are not run; code/build/TypeScript gates are not applicable to this source-only projection.
