# Swarm prerequisite: actual startup owners of fixed unit identity

The retained range/lookup and physical-index producers have concrete original
callers: startup `004a4f70` calls `004ed820` at `004a5125`, then `004ed880` at
`004a512a`. Main entry `004a4450` reaches that startup routine at `004a457a` on
its normal initialization path. This closes the missing actual-call ownership
for the two retained bodies; it does not compose later level allocations or
native Save restoration.

Port assessment remains main `f9675f56c597ec83adf02f28e9801bfc6bbd0490`.
Research head before this pass is `78ec485a615c5f497c8fb973dc32a587ced739ce`.
The prior fresh-reset packet remains immutable at `8311fa150` and the authored
tail/inventory packet at `00e5a1e5`. No runtime code is changed.

## Existing evidence and exact new binding

The secondary-owner research already proves `004ed820`, `004ed880` and
`004ee300`, including their physical ranges and pointer/index fields. Its
original probe invokes those helpers explicitly; it is not the native startup
caller proof. The loading-art report independently names `004a4f70` as startup
and binds its earlier resource-array load at `004a501d`. Those findings are
reused, with no repeat native probe or resource success claim.

A bounded data-only scan of the verified canonical `.text` section found two
direct `E8` byte candidates for exactly `004ed820` and `004ed880`. Candidates
alone are not instruction proof. Decoding from the already identified startup
entry validates both as aligned calls on the actual instruction path. No
indirect-call exhaustiveness is claimed.

| Site | Concrete operation |
| --- | --- |
| `004a457a` | Main entry calls startup `004a4f70`. Its following loop path is retained in `004a4450.c`. |
| `004a5120` | Calls `0042c170`, which counts descriptor entries until a flag terminator. It does not clear unit records. |
| `004a5125` | Calls `004ed820`: establish physical storage range globals and ID lookup. |
| `004a512a` | Calls `004ed880`: write physical ID `+0x24` for all 2000 records. |
| `004a512f` | Calls retained `0042c150`, the tribe-number initializer; no intervening unit allocation call is present in this local block. |
| `004a5134` | Calls retained `004ee300` to rebuild lists from the then-current class/deleted state. |

The `0042c170` inspection prevents another name/order inference. Its actual body
clears a count at `00895d9e`, scans descriptor records at `005a8ab8` with stride
`0x34` until flag bit 2 at `+0x2c`, and returns at `0042c19b`. It writes no unit
class/index/link field or pool head. The exploratory receipt name
`decode-record-clear.json` records the hypothesis being checked, not its result.

## Call guards and local completeness

The main prefix contains the actual registry/setup gates. When the call at
`004a4551` returns 1, the branch `004a4556–004a4565` skips startup and exits
through cleanup; the other branch reaches `004a457a`. The retained pseudocode
names that callee `create_mutex`, but this pass does not infer the cause of its
return value. Earlier initialization failures can also prevent that
path. The retained main body, not a claim that every process launch succeeds,
places its ordinary loop after startup returns.

Within the complete local `004a4f70` body, the conditional branches before the
unit calls rejoin before `004a5125`; there is no direct branch skipping one of
the two setup calls on a normally returning path. The routine has its local
return at `004a5300`. It makes many other calls, including imported/indirect
resource/system calls whose failure, nonreturn or exceptional behavior is not
audited here. The full local instruction body is not a proof of all transitive
callbacks, successful resources, or whole-game startup execution.

The source is decoded in contiguous slices `004a4f70..004a5160` and
`004a5160..004a5310`; code ends at `004a5301` exclusive and the remainder is
padding. The main-entry slice is `004a4450..004a4586` only. Its branches outside
the slice are retained as limits; no complete main-loop assembly claim is made.

## Identity fields and the composed boundary

At the return from the two setup calls:

- `004ed820` establishes fixed scan `008e04db..00937a98`, primary range
  `008e04db..00930ab8`, and secondary range `00930ab8..00937a98`, all using
  `0xb3`-byte records. It populates the 2000-entry physical lookup starting at
  `00890390`, then makes lookup index zero null.
- `004ed880` writes record `+0x24 = 0..1999` across storage starting at
  `008e0428`. It is a concrete ID producer, not authored record ordinal assignment.
- The following `004ee300` applies its already proved class/deleted predicates
  and reverse-physical-traversal list prepends. This pass does not assert that
  all records are class zero at this **startup** rebuild, because neither of
  these two setup helpers clears class and the other preceding callbacks were
  not composed.

The separately accepted fresh-level `0042b258 → 004eef50 → 004ee300` path does
clear class/deleted before rebuilding and preserves these IDs. The actual
startup producer and the actual reset consumer are now both identified. This
does not certify every intervening writer, every possible reset entry path or
the allocation state at the later `00484a10` call. The prior conditional
reset-return free order is therefore retained at its precise boundary, not
promoted to a Mission-specific native-ID sequence.

## Remaining finite ownership work

The native range/index bodies and their actual startup caller are no longer
missing producers. The remaining source composition boundary is the particular
path from the known reset return through `0042b230`'s intervening initializers
and `load_objs_1` into `00484a10`, and later model initializers that can allocate
additional records. Select a specific consumer/field there if exact allocation
choices are needed; do not launch a general replay from this report.

Current port ownership is still the substantive gap: `createWorldState` starts
browser `nextId = 1` and person-oriented empty cells, while `addBuilding` owns a
terrain handle and the neutral model-18 body is omitted. No record owner yet
preserves native class-2 lifetimes, plan/replacement aliases, shared raw-ID reuse
or cell-list history. The typed World checkpoint cannot recover fields that
were never recorded. Native Save/Load record restoration remains a separate
unbound consumer, not evidence supplied by startup list reconstruction.

## Verification limits

All four decoder commands used the existing GNU objdump 2.44 with SHA256
`96afb8521834982d0e711b5d6e9785252bf82129fb0106b93a6bd54d83fae11f` and canonical
EXE SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`,
verified before and after short CPU-4 data-only reads. All commands exited zero
with empty stderr. The direct-call candidate scan read only the same verified
bytes. No original instruction, native probe, browser, importer or test ran.

This is static call ownership and field correspondence. It adds no ordinary
gameplay witness, allocation-stream parity, native timing/raster proof, runtime
implementation or issue closure.

The [manifest](manifest.json) retains exact commands, hashes, direct-call
candidates and source bindings. Independent source review SHA256:
`5744b30fa4bbeca37d005e2b204fe89b635846573815f55bf38e1ea31e516bee`.
Accepted findings SHA256:
`f0333fd79eed79c57df639c8cf2b025c53b2aab2c5be643ac0fc8ec03ffc80da`.
The [fresh-reset report](https://github.com/JohnDeved/populous-new-dawn/blob/8311fa1508ac6c85f4b8852dac48a54aa5336039/references/verification/swarm-class2-fresh-reset-static-2026-10-10/README.md) remains immutable.
Only source text is published; no executable, level assets, binary archive or
raw profile is included.
