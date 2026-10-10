# Independent result verdict: revised issue 248 scheduled trace

Verdict: **ACCEPT the completed, fully guarded prefix as bounded port evidence. Overall run remains FAILED at the fourth phase16 entry; native invariant/admission/parity remains BLOCKED.** No new simulation or guard change is needed for the limited diagnostic answered by this prefix.

## Accepted prefix and exact boundary

The exact reviewed head `485ed5c3aeae59ae2756685786555c2bbfc75d13` ran once under its separate admission. The foreground receipt records `2026-10-10T07:27:35.725737+00:00` to `2026-10-10T07:28:00.733818+00:00`, exit1. The exception occurred well before the unchanged time/turn caps.

The authored default-seed world started with both opponents active. Chumara's first allocation occurred at turn6475, task index2, with requested4, quotas `[0,80,30,0,0,0]`, target12858 and entity291.

Four complete events were emitted, each with before-controller, after-controller, after-dispatch and after-turn snapshots. The source emits each event only after all its snapshots pass both strict live-world and detached-input equality guards. No failed snapshot is included in these events. Therefore the later guard rejection does not invalidate their narrower preceding observations:

- Dispatch at7637, completed-turn snapshot7638: original phase15 controller returns `{kind:attack,target:12858,replace:true}` and enters phase16. After actual order application, registered Warrior members377/378/540 have command19, payload12858; registered Preacher455 has command17. The mixed dispatch is established for this port scenario.
- Visit7640, completed-turn snapshot7641: actual activeMembers returns4; entity291 resolves to target13372, direct=false, contained=false. The controller updates target12858→13372 and returns an attack with replacement. It does not consume targetsRemain because the target moved.
- Visit7643, completed-turn snapshot7644: activeMembers4 and the same resolved entity target13372; actual targetsRemain(13372) returnsfalse. The controller returns another attack with replacement.
- Visit7646, completed-turn snapshot7647: the same actual input/results and replacement attack repeat.

Retries stay0 throughout every stage of those events; damage remains0. No controller `random` callback is called, and world randomState is equal immediately before/after each controller. Production action application and later tick work do change randomState. Do not describe this as a globally RNG-free sequence.

The latter two visits provide a natural port discriminator for the live-entity reissue branch: the registered Preacher has command17 while the three Warriors have command19 with the task payload; the derived old all19 predicate isfalse, and the actually consumed combined callback isfalse. This supports the observed repeated attack actions. It is not evidence of the no-entity empty-target retry branch or a native invariant violation.

The fourth phase16 entry at7649 fails during the before-controller snapshot. The stack identifies `snapshot`'s detached-input guard and the wrapper's pre-controller snapshot call. The controller is never delegated for that fourth visit. The live-world guard completed successfully before the detached guard rejected. No fourth event was emitted. The final result remains stopReason=exception, mixedDispatch=true, accepted phase16Visits=3.

## Native and composition limits

For all retained member rows, nativeFlags7f isnull and registered computerAssignment is0. Registered-assigned and known-ordinary-assigned sets are empty despite task.members containing four IDs. Empty assigned-state23 candidate lists do not prove native prelude exclusion because the port/native ownership projection is unbound. No raw task.mode/elapsed substitution for native route/visit cadence is accepted.

The direct registered collector and detached defense projection each return four hostile people and no buildings at the captured positions, with explicit ordered IDs. This is a supplied-world port fact, not proof of native complete live cell composition or per-visit ordinary-member tally. Native task+0x26 routing, visit-counter+0x08, selector/prelude behavior and other previously uncomposed conditions remain unresolved. The source packet's nullable task+0x23 projection is not an assertion that raw mode has no separate static mapping.

Thus the diagnostic goal can use the accepted prefix without another mission run. It establishes mixed dispatch and the port's repeated live-entity reissue behavior, while retaining the missing native witness. It does not authorize a runtime patch, mark issue248 complete, establish Mission1–3 impact, claim ordinary browser parity or grant gameplay/parity credit.

## Rejected detached snapshot and identity caveat

The captured detached buffers are1,458,021 and1,459,082 bytes. SHA-256s:

- Before: `60a05b5d0f7d88ebd13f50bb67bd036557cef29bd213c101bf215195cf9c3786`.
- After: `b0ab9ed3bf01c42e6478bfb675e6f19829aece01bcce95db832388c02f7d5905`.

Independent Node24 data-only deserialization confirms `isDeepStrictEqual=true`. A paired object-identity bijection traversal visited3,357 object pairs and checked ordered Map/Set edges, own-key order and typed-view visible bytes. It found no ordinary object-reference/key/order/value discrepancy. However,26 typed views have22 layout differences, and reconstructed backing associations differ at `world.footprints.positions` and `world.footprints.totals`. Therefore deep equality alone does not establish every identity relationship.

The exact local Nodev24.19.0 builtin source explains the capture limitation: DefaultSerializer treats ArrayBuffer views as host objects and writes type, visible byte length and bytes; DefaultDeserializer constructs aligned views over the serialized input buffer or copies them into an aligned allocation. Original view backing identity/offset/overlap is not fully reconstructed by these buffers. Deserialized backing differences cannot be promoted to proof of a live-world semantic mutation, and matching visible data cannot be promoted to complete semantic/topological purity either. The exact cause of the original serialization-byte difference remains unresolved.

Read-only independent analysis is retained at `/workspace/scratch/69fd8163d94e/issue248-revised-buffer-independent-review.json`; exact builtin serializer/deserializer source evidence is at `/workspace/scratch/69fd8163d94e/issue248-node-v8-serializer-source-review.json` (complete builtin source SHA-256 `ed24392fbc14a67d065dedb839b975719c262f03a3b2bcf2c6aeb278a05e700d`). No game code or simulation was run for this analysis. The strict guard remains rejected; no deep-equality replacement, field exemption, normalization or new mission run is approved.

## Verified source, receipts and cleanup

Under `/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-packet-20261010`, independently verified:

- `revised-command-receipt.json`: `78bdc4e24f5d946fd377f4a94037a271b1b63c1933deea3c2282ba0611700183`.
- `revised-run.jsonl`: `dc7508cc7a271ec3fa57e90fcc3644b3225f66fd9a23ce696fed779b900de774`.
- `revised-run.summary.json`: `f19b50b52f4bb7b62f4528db4a1a97b74488fe0529094cd1b1b04b2125538d41`.
- `revised-stdout.log`: `a38cc7e289c76e81eea106b89526ae2d72f401b08176961ea41ac09c18bb7fbe` (same parsed result; one additional newline).
- `revised-stderr.log`: `f47fff90f918b08d92170c0be85ea8f248e0795b4265a4168bc91e110ff24e30`.
- `revised-admission-source.json`: `d9dde5cf3b19837e7980ea895fe7729695faa5393a75514a62469d81b40d7065`.

All13 sequence numbers are contiguous. Four accepted events contain all four snapshots. Parsed summary, final JSONL result and stdout agree. All recorded source/package/QA inputs and all333 production app hashes match. The terminal receipt records a clean tracked worktree, no app diff, unchanged input hashes and dependency identity27:538212. Its same-foreground child wait returned; the inspected command/observer launches no browser, server or detached worker. This supports resource release. No reviewer rerun, session polling, process cleanup or production changes occurred.

Compact publication may include the exact source/input hashes, failed overall outcome, guarded prefix turns and limited actual callback/action/RNG facts above. Raw serialized worlds and complete cell histories remain local. The publication projection must preserve the native unknowns and the distinction between an accepted prefix and a failed overall run.
