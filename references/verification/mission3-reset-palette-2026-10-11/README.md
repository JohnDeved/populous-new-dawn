# Original reset and palette-copy prefix: conditional result accepted

The actual `0042b590` caller prefix passed from entry through its projected reset, genuine palette copy and original `XOR EBX,EBX`, stopping at `0042b5a3` before sunlight initialization. One admitted run committed **14,461 original instructions** and passed all **33 predeclared memory observations**, plus the exact CPU, stack and unknown-output contract.

This closes a real intervening setup step without inventing the previous palette's contents. It does not run the object constructor or establish the class1 counter before conversion.

## Exact input and projection contract

The original startup resource array contains a `*PALETTE` descriptor at `005a3590`: allocation size `0x400`, pointer destination `0087eff8`. The generic loader writes its allocation result indirectly through that descriptor. The diagnostic conditions a successful, live allocation and maps one explicitly renamed, disjoint 1,024-byte block. All its contents remain unknown; no palette asset is guessed from the selected mission.

Original `004a2920` copies the 64 bytes at allocation+`0x1c0` into `00899f8d..00899fcd` using all 16 genuine REP MOVSD iterations. Unknown source masks propagate into the destination. Other aliases remain unknown. Flags derived from the abstract address are tainted; the actual caller's `XOR EBX,EBX` then replaces the meaningful arithmetic flags. The abstract pointer's scope expires at the stop, so it cannot silently authorize later relocated arithmetic or pointer comparisons.

The three previously reviewed camera floating-point omissions remain explicit and unchanged. The result still assumes their normal, fault-free return. Omitted words, uncertain CPU values and skipped-call stack footprints remain unknown. No additional presentation function is omitted; notably, palette consumers can affect RNG and are not declared irrelevant.

## Frozen evidence and review

- Canonical EXE SHA256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Prefix driver SHA256: `8c79bb31264c233a6878136539f20339952b5085a200cd95b006e658048a8915`.
- Projected-reset dependency: `9a0a81d78c68376191c065096ada7b9658f3ac22b0391d3b76445570909588ed`.
- Guarded base: `2b4594cf3d212d0f5aeb73f837037ff4653f468769b22d3f3acf6c018c74a46f`.
- Source head at run: `fed2c30bc1890d7cf52b8991535f37d4102e433d`, tracked tree clean.
- Result SHA256: `2bb2f8d7bd4a3054df601e117d25d3ab176958d77545800908feabf1dc5a61f2`.

Before execution, 57 author and six independent synthetic tests passed, including overlap, partial knowledge, faults, unknown consumption and scope rejection. Independent static preparation matched exactly. The single admitted run exited 0 in approximately 1.92 seconds; this is a receipt, not a performance claim.

Independent post-run review reconstructed all 39 read masks and checked 57,508 committed byte-write masks. All 16 copy iterations read and wrote unknown data. The complete 1,024-byte source block, 64-byte cache and unbound aliases remain unknown; the scoped pointer expires; all claimed final fields and CPU/stack outcomes pass. Three explicit camera omissions remain recorded. No sunlight, allocator, constructor, postpass or gameplay ran.

The archive contains frozen source dependencies, tests, source/input identities, approval and process receipts, raw/compressed result, static contracts and independent verifiers/reports. It excludes the original executable and complete original assets. The manifest binds every member.

## Next finite dependency and limits

The next actual call is `0042b5a3 → 00401040 → 00401790`, which initializes sunlight using integer trigonometric tables and a small integer square-root helper. Its exact table provenance and required instruction semantics must be bound. The square-root helper occupies a small CSEG window; only a separately reviewed exact window could be admitted, never blanket CSEG execution.

This research has not changed product code or merged to main. Unrelated workflow/tooling work may advance main independently. The rejected training candidates remain rejected, and issue29 stays open. Only research structural/diff checks apply here; no product check/build/browser acceptance or deployment is claimed.
