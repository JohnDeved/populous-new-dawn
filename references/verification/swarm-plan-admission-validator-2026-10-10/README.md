# Ordinary placement command admission

**Result:** `004b9a20` is a complete admission coordinator, returning low byte
0 or 1 before the retained command handler requests the class-9 plan. It does
not directly allocate, retire, assign a physical ID, or write a world field.
Its decisions and delegated side effects depend on five helper targets; three
of those selected bodies remain absent. They must not be assumed pure from
their role in validation.

The bounded window `[004b9a20,004b9cc0)` contains the complete 661-byte body
through return `004b9cb4`, with a second return at `004b9caa` and 11 trailing
`INT3` bytes. All local branches are inside the selected body. One canonical
data-only objdump command was run; no child disassembly, original execution,
browser or tests were performed. Input/tool pre/post hashes and exact command
are retained in the receipt.

## Availability and existing-proof boundary

Actual remote main at lookup was
`e17e8e06cf3ecde6adc503153e527d7a5674e7fc`. Its decomp/reference/script/app
address search found only the `0043e8e0` caller reference, with no validator
file or selected manifest entry. The existing `check-native-building-plan.py`
explicitly supplies successful validity leaves while testing preview geometry;
`check-native-unbuilt-plan.py` supplies validity/allocation/initialization
leaves. Neither is evidence for this validator's body. Eleven pinned current
source/proof files match the research checkout byte-for-byte. This availability
check concerns the named indexed sources, not inaccessible canonical bytes or
an exhaustive claim about every historical archive.

## Real consumed command and exact arguments

Retained `004aab80` cases `0x77/0x78` contain the ordinary placement emission.
That route is conditional on the actual minimap-valid bit, selected building
kind and its special-path guards. In the ordinary non-special branch it emits
tribe command `0x0e` with packed model/rotation and the cell. The alternative
`0x69` route through `004ba6b0`, other UI errors and queue transport are not
newly proved here.

Retained `0043e8e0` case `0x0e` is the finite consumed-command boundary:

- Command dword `+4` supplies the low building-model byte and next rotation byte.
- Command dword `+8` supplies the cell; the validator copies its low word into
  local coarse-coordinate bytes.
- Tribe comes from the caller tribe record's byte `+0xc22`.
- The validator receives these four arguments and the handler tests its low
  return byte. Only nonzero enters retained `004b9190(..., mode=2)`, whose known
  class-9/model-1 request and creation context precede the newly bound
  [plan initializer][plan]. This packet does not numerically rebind the command
  queue writer or claim the complete dispatcher common tail.

Do not normalize unspecified argument bits. The validator initially puts only
the tribe byte in BL before pushing EBX to `0041b4c0`; the upper 24 bits are not
zeroed by this body. Later it sign-extends BL for the tribe index. Model and
rotation selection read only their low bytes, but the model argument is also
pushed onward at its original full width. The function returns **AL** 0/1;
it does not normalize all of EAX.

## Source order and short-circuit contract

1. Initialize a local valid byte to 1, an exterior-check flag to 1 and a
   secondary-admission accumulator to zero. Call `0041b4c0` with the tribe
   argument. A zero AL sets valid to zero and reaches the rejection return
   without reading a shape or scanning cells.
2. On admission, use signed tribe index times `0xc65`; derive one byte equal to
   whether tribe byte `+0xc1f` is 1. Set a query argument to the wrapping dword
   `005aa4e4 + 1`. Models 4, 10 and 11 preset the secondary accumulator to 1.
   Model 10 additionally forces the rotation byte to zero and disables the
   final exterior check. No additional model/rotation/tribe bounds check is
   invented.
3. Select the descriptor object word at `005a7228 + model*76`, then the signed
   shape-index byte for that object and rotation. Use shape byte dimensions,
   subtract its byte x/y offsets from the input coarse coordinates, and scan
   its row-major mask. Coordinates advance by 2 with byte wrapping. The outer
   and inner loop conditions check valid before the next cell.
4. For mask bit 1, call `0044ee50` and store AL directly into valid. Its logical
   low-width arguments are tribe-record pointer, current coarse cell, mask
   byte with low three bits cleared, building model, zero and the derived
   tribe-byte equality flag. The actual sixth pushed dword also contains the
   pre-call valid byte and start-coordinate bytes; only its low byte is consumed
   by the retained callee's char argument. Current-cell dword pushes include
   the local column index in their upper word; they are not freshly zero-
   extended 16-bit values. The mask changes AL before pushing EAX; here the
   preceding dimension/column loads keep its upper bytes zero. Preserve these
   widths when comparing original caller arguments.
5. Still in that cell, if the secondary accumulator is zero, call `0044eca0`
   with current cell, signed tribe and `005aa4e4 + 1`, retaining the full EAX
   result. For model 13 only, a still-zero result triggers one second call with
   `005aa4e4 + 3`. Once the accumulator is nonzero, later cells skip these calls.
   **These calls can still occur after `0044ee50` made valid zero in this cell.**
6. Independently test mask bit 4 and call `0044fa50` for that cell. Nonzero AL
   clears valid. This also still occurs after the current cell's bit-1 failure.
   Then advance the local mask/column/coordinate state. Rejection prevents the
   next cell's callbacks, not the remaining callbacks already selected in the
   current cell.
7. When the exterior flag is enabled and both valid and the secondary
   accumulator are nonzero, derive the exterior point from the masked coarse
   footprint start plus signed shape offsets times 64. Call `00518200(point,0)`;
   nonzero AL clears valid. Model 10 bypasses this exterior call.
8. Return AL 1 only when valid and the secondary accumulator are both nonzero;
   otherwise return AL 0. The caller's class-9 request therefore remains gated
   on the complete result, even though some helper side effects occur before
   the final rejection.

## Compact dependency table

| Boundary | Proved effect and classification | Allocation/request consequence or limit |
| --- | --- | --- |
| `004b9a20` direct body | Stack-local geometry, loop state and boolean admission. No direct world/pool/ID write or allocator call. | Its result controls whether `004b9190` mode 2 runs. This is real request admission, not physical-slot selection. Delegated effects prevent a blanket purity claim. |
| `00518200` | Retained call-free collision/terrain query; direct reads and local variables only. | Pure query in the retained body. It rejects the exterior point through AL; no direct identity or pool effect. |
| `0044ee50` | Retained per-cell admission body writes diagnostic bits to tribe `+0x93d` and calls its own helpers. | It is not globally read-only. This pass preserves its known flag writes without claiming all transitive effects are allocation-free or decoding those children. |
| `0041b4c0`, `0044eca0`, `0044fa50` | Missing selected bodies; exact call arguments/order and return consumption are now bound. | They can admit/suppress the subsequent request by their returns. Their other effects are unknown; neither a pool write nor purity is proved here. `0041b4c0` is the earliest unresolved admission gate. |
| `004b9190` mode 2 → `004ed8a0` | Retained direct class-9/model-1 allocation request with context, followed by success-only registration and footprint writes. | This is the actual new identity request. The accepted allocator owns head/count/record changes; the accepted class-9 constructor owns initial insertion and state-1 relocation. |
| Pre-request `004ba7a0` | Missing selected body called inside mode 2 before the context and allocator call. | This is the immediate unbound opportunity to change the pool, existing occupants or request order before the known class-9 allocation. No such mutation is asserted without its body. A supplied valid boolean does not close this edge. |
| Success-side `004ba9b0`, `004e3300` | Missing selected bodies after a nonnull plan allocation. | They occur after this slot choice, but their possible later requests/lifetime effects remain unproved. They cannot be dropped from a claimed complete continuing World. |

This table separates observable admission from pool mutation. The selected
validator contains no evidence of an additional direct allocation request. It
also cannot certify that every absent predicate is harmless to shared state.
For the intended supplied-state `prepareBuildingSite` slice, an admission test
could use controlled helper answers to verify caller order and rejection, but
that would remain caller proof. A complete placement-to-construction episode
still needs the actual request feeder's side effects and a supported incoming
owner, rather than a reconstructed Building-array ledger.

## Stop

The command `0x0e` validator body and its precise request gate are closed. No
missing child was decoded. The three admission bodies above, pre-request
`004ba7a0`, success-side registration bodies, queue transport and supported
incoming pool/history remain explicit. The earliest unknown admission function
and the immediate pre-allocation state boundary are different questions; neither
requires an all-class rewrite or native binary-save compatibility claim.

No runtime implementation, new Swarm candidate admission, complete initial
history or ordinary browser proof follows from this source checkpoint.

[plan]: https://github.com/JohnDeved/populous-new-dawn/blob/021520a3f54235134d7ef5c157429f4f1784ca6b/references/verification/swarm-class9-plan-initializer-2026-10-10/README.md
