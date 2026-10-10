# Existing-record effects before the new plan request

**Result:** the complete `004ba7a0` body is a state-changing pre-request step.
It enumerates footprint cells, resolves existing handles, changes eligible
linked records to state `0x23`, and invokes `004b9190` mode 3 before the caller
requests a new class-9 slot. **Neither resolved target nor linked record is
checked for class 9 or class 1.** Mode 3 re-resolves the terrain handle and
removes according to its actual class. A Building-array projection would lose
that alias-sensitive boundary.

The selected body is `[004ba7a0,004ba93e)`: 414 bytes, one return at `004ba93d`,
all local branches complete. The accepted 528-byte window also contains two
`INT3` bytes and an incidental neighbor starting `004ba940`; none of that
neighbor's behavior is interpreted. One bounded objdump command read the
canonical executable as data, with full input/tool hashes checked before and
after. No child decoding, original execution, game/save operation, runtime
change, test or browser run occurred.

## Consumed caller order

The retained `004b9190` mode-2 path, entered after the previously bound command
`0x0e` validator, performs these steps in order:

1. Set up local position from the command cell and call
   `004ba7a0(cell, model, effectiveRotation, tribe, 1)`.
2. After it returns, derive the footprint start and push the class-9 creation
   context. Set the allocation flag and call `004ed8a0(9,1,tribe,position)`.
3. On failure, suppress the later success footprint path. The earlier
   pre-request effects have already happened; this caller contains no rollback
   for them. On nonnull return, clear the model's pending bit and invoke the
   separate success-side `004ba9b0` and `004e3300` callbacks before footprint
   writes.

The pre-request body itself has no call to `004ed8a0`, direct pool-head/count
write, physical-ID assignment or direct cell-list splice. That is not a claim
that its delegated state/removal calls leave those owners unchanged. In
particular, the allocation request is downstream of possible removal dispatch.
A failed new request cannot be described as a transaction with no prior effects.

The separate retained command `0x69` calls this body with the final byte zero.
Its UI/queue reachability is outside this packet; it supplies context for the
body's two explicit selector branches, not a second ordinary-route proof.

## Exact direct-body contract

The five input arguments are cell, model, rotation, tribe and an override byte.
The body sign-extends the model low byte to index `005a7228 + model*76`, reads
its object word, sign-extends the rotation low byte, then sign-extends the
selected object shape-index byte. It does not add bounds checks for those
indices. Object stride is 54; shape stride is 48. The input cell's low two
bytes are separately reduced by the shape's x/y offset bytes, with byte wrap.

Let F be the stack pointer after the `0x32c` local allocation and four register
pushes. The body passes its local entry array at F+`0x1c` and count at F+`0x18`:

- If the final argument's low byte is nonzero, `004ba822 → 004b9ef0` enumerates
  every nonzero shape-mask entry.
- Otherwise `004ba829 → 004b9d50` enumerates only entries whose mask bit 1 is set.
- Both retained helpers select `shapes_mem + (shapeIndex & 0xffff)`, whereas
  this caller used the sign-extended shape byte for its own descriptor access.
  Both helpers are call-free and write the caller-supplied local array
  and count. Each entry is eight bytes: terrain-cell pointer, coarse coordinate
  word and mask byte. They preserve row-major shape order with coordinates
  advancing by two. No deduplication or extra array-capacity check is added.
- The pushed coordinate dword comes from F+`0x10`; only its low word was
  initialized as a coordinate. These helpers consume a `ushort`, so do not
  reinterpret the other two local bytes as a normalized argument.

The body then visits the returned entries in order:

1. Read the terrain cell live and require flags bit `0x400` (`cell+1 & 4`).
   Read the word at cell+8 and mask it to the low ten bits. Zero skips. A nonzero
   index resolves through `00890390`; deleted flag bit 1 at record+`0x0c` or
   class zero at +`0x2a` skips. **No class-9/model check is performed.** There is
   no separately introduced pointer-null or generation check.
2. Require the target's tribe byte +`0x2f` to equal the input tribe low byte,
   unless the final argument byte is nonzero. The real mode-2 caller supplies
   1, so that path permits a different tribe. Require target word +`0x92` to
   be zero. No HP, active-bit, construction-state or completion test is added.
3. Walk exactly 20 consecutive words at target+`0x6a`, increasing by two.
   Each nonzero **full 16-bit** handle is resolved through the same lookup;
   deleted or class-zero records are skipped. There is no ten-bit mask on this
   second lookup and no class-1, tribe or generation filter.
4. If the resolved linked record does not have flags2 bit `0x100000`
   (`record+0x0e & 0x10`), copy its state byte +`0x2c` to +`0x7d`, call
   `004ed6f0` (retained empty function), write state `0x23` to +`0x2c`, then call
   `004ed640`, the retained dispatcher for the record's actual class. The
   pointer list is not cleared directly by this body. Callback effects occur
   before the next handle is read.
5. After all 20 entries, copy the enumerated coordinate word into the low half
   of a local dword that initially held the original full cell argument. Its
   high half remains that original argument's high half. Call
   `004ba916 → 004b9190(cellDword,0,0,originalTribeDword,3)`. This is a real
   mode-3 removal request, not another mode-2 allocation. Continue to the next
   enumerated entry, whose live terrain flags and handle are read afresh.

There is no success/failure return consumed from the two enumeration helpers,
state dispatcher or mode-3 call. The selected body returns without a defined
boolean admission result. Subsequent duplicate footprint references are not
explicitly deduplicated; earlier terrain/removal effects can change whether a
later entry qualifies.

## Retained removal boundary and owned fields

Retained `004b9190` mode 3 reads the current terrain low-ten-bit handle again.
It does not reuse the pointer resolved earlier in `004ba7a0` or repeat that
body's deleted/class checks. It reads this newly resolved record's coarse
footprint origin at +`0x68` and shape byte +`0x9b`, then calls `004ef180`.
Thus state-initializer effects between the first lookup and this lookup cannot
be silently ignored.

`004ef180` dispatches by the record's actual class. Its class-9 branch calls
**`004ba410`, absent from the selected manifest/body set**. Its class-2 branch
calls the already proved `00403820` immediate retirement path. These are
conditional dispatch facts, not evidence that a consistent fresh placement
actually supplies a class-2 alias here. No class-9 pending/free behavior is
invented from the class-2 result, and missing source is not proof of no retirement.

After the removal call returns, mode 3's retained footprint loop performs
three writes only for mask-bit-1 cells: it clears the low ten bits of the
terrain handle, clears the low ownership nibble, and clears flags `0x4400`
while setting `0x10`. The diagnostic
tribe flags cleared in the common `004b9190` prefix are also real writes.
The selected pre-request body does not choose a new slot itself; the caller
continues to that request only after this entire sequence returns.

For ordinary linked people, the retained `004d2740` class-1 state initializer
has additional common previous-state handling and a state-`0x23` case that
sets timer +`0x70` to `0x18`, clears +`0x5f`, and calls `004d3ff0` and
`004eee50`. This packet does not classify those transitive effects. The generic
`004ed640` edge must still retain actual-class dispatch for other aliases.

| Boundary | Proven direct ownership or order | Remaining limit |
| --- | --- | --- |
| `004b9ef0` / `004b9d50` | Call-free footprint enumeration into this caller's local buffer; row-major order, different mask admission. | No world or pool mutation in these retained bodies; no invented dedup/capacity guard. |
| `004ba7a0` target resolution | Live cell flag/low-ten-bit handle, deleted/class-zero rejection, tribe-or-override and +`0x92==0` guards. | No class-9 filter; exact current occupant matters. |
| Twenty linked handles | Full 16-bit lookup, deleted/class-zero checks; direct +`0x7d`/state writes before each actual-class initializer. | No class-1 filter. State-initializer transitive lifetime/allocation effects remain separate. |
| `004b9190` mode 3 → `004ef180` | Re-resolves current terrain handle; removes by actual class before footprint clearing. | Class-9 removal leaf `004ba410` remains absent. Class-2 retirement proof cannot substitute for it. |
| Caller mode 2 → `004ed8a0` | New class-9 slot choice happens after all preceding effects, even if allocation later fails. | Supported incoming state and earlier predicate effects remain; no rollback is proved. |
| Success callbacks | `004ba9b0` and `004e3300` occur only after a nonnull new record. | Their continuing state/request effects remain unclassified. |

## Finite consumed contract and stop

The pre-request local body and its retained footprint/removal call order are
closed. The next direct lifetime leaf for the normal class-9 overlap case is
`004ba410`; the state-initializer side effects are a distinct boundary, dependent
on actual linked record classes and previous states. Neither was decoded here.

A supplied-state real caller test could now assert that pre-request record and
footprint effects happen before a failed new allocation. It would still be a
controlled caller test until the removal/initializer behavior and incoming shared
owner are supported. An empty eligible-overlap list avoids these particular
callbacks for that invocation but cannot establish the earlier allocation
history. Unknown validator predicates, special command transport and old-checkpoint
history remain separate. No complete placement-to-construction implementation,
synthetic native ID assignment or Swarm candidate admission is proposed.
