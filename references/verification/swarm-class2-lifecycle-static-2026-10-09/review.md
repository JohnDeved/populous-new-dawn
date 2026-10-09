# Class-2 lifecycle decision review

ACCEPT the bounded source findings and finite implementation HOLD. No correction required. This is a static research verdict, not implementation readiness or runtime validation.

Reviewed immutable inputs under `populous-recovery-20261009/work/orchestration/swarm-class2-lifecycle-static-20261009-01/`:

- `decision.md`: SHA-256 `4a6280a094aa5e3342405da018b2ababaa9963f5d368000697e2cf16d4de5b45`
- `source-bindings-and-readback.json`: SHA-256 `6c5cee5304d4cde029944b9a69ca72fc82362b6135c1c4c997677c435d6d59a4`
- `type-initializer-bindings.json`: SHA-256 `56749f22b214f3bfaab4ea2c1c654efde6521955a4a4acdec6e2b79599cf96cf`

The accepted integration/controller findings carry forward unchanged. This review checks only the supplementary lifecycle closure and its stated limits.

## Direct findings

1. Authored loading (`00484a10`), ordinary construction (`004b8470`), and upgrade replacement (`004050c0`) supply the metadata consumed by the common class-2 initializer `00403610`. That path inserts and immediately relocates the class-2 object. Construction explicitly initializes before returning; upgrade allocates and initializes the replacement before retiring the old object. The deferred, no-metadata path remains distinct.
2. The added dispatch sources accurately resolve overloaded old export names: `004ed580` dispatches class 2 to `00402ec0`, whose model cases invoke `00403610`. Model 18, case `0x11`, applies neutral ownership and object `0x9a` after common initialization. This type dispatcher is distinct from the state dispatcher `004ed640`.
3. `004edcf0` removes cell membership, sets class zero and the deleted flag, unlinks the allocated list, prepends the retired list, and installs counter 3. The existing loop decrements that counter and returns the object to the free pool at zero. The allocator preserves the raw unit index. These are three counter decrements, without a claim of three guaranteed elapsed world turns.
4. A class-2-only chain preserves acquisition order but does not close later target lookup. Native Swarm retains a raw 16-bit index and can observe a reused slot of another class during its lifetime. Logical building IDs and local generations do not reproduce those semantics. A separate building allocator would also omit cross-class competition for primary slots.
5. Neutral Vault reward completion enters native class-2 state 5. The retained class-2 update dispatcher calls `00407060`, which keeps the building until its gated sinking path reaches height below -799 and retires it. The port's Vault morph completion does not implement that simulation lifecycle. `shrine.active` cannot substitute for this retirement event.
6. The M3 Vault/trigger comparison correctly retains their common coarse cell `(113,62)`. Distinct native identity and model geometry do not establish a cell mismatch or rendering defect.

## Remaining contract

Runtime remains HOLD pending faithful shared primary-slot identity/allocation/retirement behavior and the missing Vault state-5 lifecycle. Save state must preserve the relevant registry, chains, free/retired state, and live Swarm target/history together. No local-generation compromise, legacy-save migration policy, or inferred startup replay is accepted. This review does not request whole-allocator reconstruction or expand into the separate passive-resident prerequisite.

Any future implementation must cover allocation, relocation, upgrade replacement, retirement/reuse, neutral Vaults, raw-index lookup, and save/load as one coherent identity contract. The proposed future regression cases are requirements, not executed evidence.

## Independent verification

All 32 source bindings match both explicit main `d6cf109474379172728a3ccebf46ef72a15f3a58` and the stationary files. The two appended initializer sources also match that main. All 13 bound readback artifacts match their declared hashes and sizes. Independently compared 695 decoded byte lines, totaling 2,197 bytes, against the PE-mapped bytes of the canonical EXE; no mismatches. The EXE SHA-256 remains `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. Static byte correspondence does not claim execution or complete allocator reconstruction. The tracked checkout was clean.

No app changes, tests, browser, native execution, emulation, Ghidra, or dependency actions were performed for this review.
