# Mission 3 pool/terrain prerequisite: original result accepted

## Result

One independently admitted original-code run passed the bounded pool/free-list and terrain-reset prerequisite. It committed **1,507,177 original instructions** with prior writable pool/terrain bytes marked unknown, used no game/API stubs or fabricated returns, and never invoked an allocator, object constructor, postpass, gameplay turn or x87 instruction.

- Active low free list: IDs639 through1 (639 nodes).
- Active high free list: IDs1839 through640 (1,200 nodes).
- Secondary free list: IDs1999 through1840 (160 nodes).
- All2,000 ID fields were initialized; slot0 remained excluded from active-list claims.
- All262,144 terrain bytes were independently checked known and zero after the original clear.
- **The class1 allocation seed remained unknown.** This is not the complete Mission3 initialization or a training-entry fix.

The run executes original004ed820 and004ed880, then004eef50 including004ee300, followed by original terrain-clear instruction0042b27f. The conditional fixture supplies only declared stack/return/DF and source-bound terrain-clear register values, plus hash-bound balance descriptor loading. Unknown bits can be copied or masked but cannot silently decide branch/address behavior. The original reset-before-clear order is preserved.

## Review and retained evidence

Canonical executable SHA256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Frozen driver SHA256: `2b4594cf3d212d0f5aeb73f837037ff4653f468769b22d3f3acf6c018c74a46f`.
Source head at run: `ce246c5b86fc6a9f22c11f58439511f08deef037`, tracked tree clean.
Result SHA256: `ea4ff6e02cdb05095d3bbbaff1b9f53d0eacc444a309a21e6ffda7c53db99b2f`.
Process exit0; elapsed122.925 seconds is a receipt, not a performance comparison.

Before execution, independent review accepted this exact pool-only scope after25 author and5 independent synthetic tests and46 canonical source assertions. After execution, independent review streamed all **1,445,992 memory events**:277,829 reads and1,168,163 committed byte-write events. It reconstructed read-known masks from declared supplies and preceding committed writes; checked every event against its phase window; and verified exact list topology, IDs/classes/retirement bits and complete terrain coverage. No original rerun was needed.

The adjacent archive includes the source, approval/release receipts, tests, setup audit, raw result, independently verified compressed full memory trace, source exports and their identities. It excludes the original executable and full original assets. `manifest.json` binds every archive member. The194,256,084-byte JSONL is retained losslessly as `harness-repair/pool-run01/memory-events.jsonl.gz`.

## Mode-input closure from the same pass

The accepted static mode proof binds the successful New Game tutorial-flag clear and ordinary globe dispatch under current interface10. Interface2 is queued only after the selected level loader returns. A different menu-level picker is a distinct route and cannot supply this proof.

Land flag `0089c661 & 0x08` still depends on prior lobby/cleanup history. Two possible values preserve52 DIRECT person request positions but change six Braves' models and RNG paths. Neither direct count nor that conditional route proves the complete allocation seed. The archive contains the full static mode report and2,121-assertion reproduction.

## Next exact boundary

The pool/terrain result removes a requirement for arbitrary prior object/terrain snapshots from this prerequisite. Remaining constructor setup, assets, mode history and broader reset still require proof.

Reset calls globe-camera helper0042cfd0 through0041ce00. Its x87 outputs and input control state are unbound. The next source-only question is whether the written camera fields or register effects can be consumed by the admitted object-initialization path. A reviewed, explicit presentation-only omission might be justified by that proof; no such omission is accepted here. Otherwise the actual consumed floating-point state must be bound. No known-failing reset is rerun merely to hit that boundary.

Main and rejected product candidates are unchanged. Full product check/build/browser/parity gates were not run for this research-only publication; no merge or deployment is claimed. Issue29 remains open.
