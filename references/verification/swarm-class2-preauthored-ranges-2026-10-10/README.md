# Pre-authored unit-state ranges and loader callsites

Reviewed source checkpoint for issue #61, assessed against main
`f9675f56c597ec83adf02f28e9801bfc6bbd0490`. This groups two independently
accepted static passes; it changes no runtime or parity status.

- **The remaining bulk-clear owner is bound.** `00493a40` is call-free through
  return `00493aef` and writes only `[0093a770,009556e0)`, above fixed unit
  storage. Its initial clear zeros the threshold operand, so local execution
  retains tuning values 1/3/2/1. It also initializes 120 auxiliary records.
- **The authored call and resource guards are exact.** `0042b3c8 → 00484a10`
  follows `0042b3b8 → 0040c670`; the previously unnamed palette target is
  `0042b3ae → 004b6320`. Resource children remain uninspected transitively.
- **The next view child has no direct unit-owner writes.** `00417270` returns
  at `00417300` after optional writes to a margin word and four rectangle
  words. Conditional `0041729c → 0044bb80` remains uninspected; using its
  result as a width deduction does not prove it is side-effect free.

The exact [range/caller findings](ranges-and-callers.md) are preserved from
source review `edcf64d8515937abc0ea501692d028bd926b88934d83e08e6fba4303643c86ea`.
That pass proposed the view child as its next boundary; the subsequently accepted
[view-child findings](view-child.md), review
`5d440e4a5bcc42df3683c773a27ad9cb459d47f9bfdde50d742fa680f318e7e5`, carry out
that one bounded lookup and stop at the residual edge. Both original findings
and their separate evidence identities remain intact in the [manifest](manifest.json).

Exactly three GNU objdump data-only commands were executed across the two
accepted scopes, on CPU 4 with short bounds and verified canonical/tool hashes.
No original instruction, browser, native probe or test was run. This supplies
neither complete pre-authored allocation history nor native Save restoration.
The next relevant ownership assessment is which IDs/allocation/cell state native
Save writes and Load restores or rebuilds. Persistent class-2/Vault port lifetimes
remain absent; no synthetic building-array identity projection is authorized.
