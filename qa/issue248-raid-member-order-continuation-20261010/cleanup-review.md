# Issue248 ordinary attack-order cleanup: independent static review

Verdict: **ACCEPT the finite retention contract** in `issue248-raid-order-cleanup-static-20261010/findings.md`, SHA256 `c2baca97c15acd3fb42df93de7144934f8b058709e5bdf7ef89a981e11934ccb`. Provenance SHA256 `f9110218b42d11dd4d820ee4f0ad772e9e3d83fa3aae5eee18413d14e7093620`; inventory SHA256 `6135192e5872d87eab1c75f395e8f893ffe52b954cf8c08d319c329ff4c838ec`.

Independently reproduced all five exact git exports and blob IDs from source `4754e12d3590bde18656416514871b033de164be`, verified each filename/hash mapping in the pinned export registry, and checked the seven inventory entries. Registry SHA256 is `51e55c295a9956e89be85c98df835f1da141e3e10cb6b16435f55423ff5b26db`. Independently checked the canonical EXE size2275840 and SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

The review additionally read actual instructions from that EXE using data-only objdump for the five function bodies: `00436ca0–00436cf1`, `004364d0–004366a1`, `004da1d0–004da234`, `0051ff40–0051ff57`, and `00501be0–00501bff`. No native execution/emulation, port execution or runtime change occurred.

## Exact supported closure

The supplied person P has one uncancelled queued model19 order in slot0, immediate0, other slots0, state10/substate1, assignment3, and +0x76 bit0x20 clear. Order references1 and associated object0, a nonempty pool, distinct/nonoverlapping valid records, and the stated valid +0x89 target are prerequisites. This is a supplied source case, not a captured campaign world.

`00436ca0` first writes cursor0, then calls `004364d0(P,0)` with the queued order still present. The caller passes P to `004da1d0` at00436509 and consumes its result at00436511–13. The predicate reads state, immediate/queued order, cancellation bit, model19/21 and substate1; it has no stores or callees and returns true here.

The target branch loads P+0x89 through the object table, checks deletion/class, and passes that distinct target to `0051ff40` at0043653f. The leaf clears target+0x10 mask0x100000 and decrements nonzero target byte+0x31. It returns directly, without allocation, deletion or another call. Target state does not alias P's membership fields.

Model19 skips both model7 and model30 branches, including their specialty/RNG effects. References decrement1 to0; the pool count decrements once. Associated object0 bypasses `004ef180`. The queued slot and command status become0. `00501be0(P)` is called at00436692, but bit0x20 clear bypasses its only mutation/call, so `004d4f40` is not executed. The outer loop sees no more orders, then clears P+0x0c mask0x08000000 and P+0x10 mask0x200.

No executed instruction or callee destroys/replaces P or changes P+0xaf, P+0x7f, P+0x14, class/model/tribe or state/substate. The same result preserves a supplied foreign assignment byte. The closure thus retains the original person and computer membership while separately releasing the order and target reservation. No unresolved executed leaf remains under these conditions.

## Consequence and stop

Cancellation alone is not membership retirement for this ordinary case. A port continuation must preserve the authoritative person ownership rather than infer a new assignment from task.members or treat clearing an attack order as permission to release membership. The existing source-backed discard/reconcile/fresh-create boundary can now be tested against this exact retention contract.

The separately reviewed port case must guard the native-case prerequisites, bind the actual cancellation/reconciliation/recreation callers, and check retained/foreign controls. A successful response attachment is necessary before claiming a replacement becomes authoritative. Check assignment and array agreement before recruitment and after the supplied structured-clone readback, while keeping that mechanical clone check separate from proof of original save serialization or a complete response allocator.

No general cancellation contract is inferred for other order sets, live associated objects, +0x76 bit0x20, aliased targets, or uncomposed cleanup branches. General task+0x31, partial7f, other owner-discard paths, array/reassignment and legacy-save boundaries remain as previously recorded. This verdict does not authorize production edits or establish Mission1–3 impact. The parent-authorized single port continuation run remains contingent on independent acceptance of its exact test source.
