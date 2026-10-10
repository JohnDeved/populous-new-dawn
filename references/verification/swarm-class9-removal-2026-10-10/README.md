# Class-9 removal before replacement allocation

**Result:** `004ba410` reaches the already proved primary retirement helper at
`004ba57e → 004edcf0`. The input record is unlinked, made class zero/deleted and
queued pending with counter 3; its physical slot is **not immediately returned
to a free pool**. The subsequent placement request cannot simply reuse the
cancelled plan's slot as a consequence of this removal. Pending processing and
free-list history still determine reuse.

This conclusion binds the selected input record's retirement transition. It
does not certify all preceding callback effects or complete incoming shared
state. In particular, model10-specific `0042cfc0` remains uninspected, and the
previous pre-request state's initializer effects remain a separate boundary.

The one accepted window `[004ba410,004ba590)` has 384 bytes. The selected body
is complete through return `004ba58c` (381 bytes), followed by three `INT3`
bytes. All local branches remain inside the selected body. Input and GNU
objdump identities were checked before and after a single CPU4-bounded data-only
read. No original code, child decoder, game/save operation, browser or test ran.

## Availability and actual caller boundary

Actual main at lookup was `721c3b08950fee0e19e4117bc7c516fe73d773c8`.
Its indexed source search found `004ef180` and `004a9030` callsites, without a
selected `004ba410` body. `004ba590` is a retained next entry and was used only
as a cap; completeness follows from the actual return. Existing unbuilt-plan
proofs supply removal behavior and do not replace this body.

For the already bound ordinary mode-2 plan request, pre-request `004ba7a0`
changes eligible linked states and calls `004b9190` mode3. That mode re-resolves
the live terrain handle and calls `004ef180`, whose **actual-class 9** branch
reaches this function. `004ba410` itself does not add input class, deleted, HP,
tribe or double-removal checks. The separate `004a9030` call is availability
context, not an audited second user route.

## Complete local order and guards

1. Call retained `004b9fc0(input, localPoint)` at `004ba420`. Convert its two
   coordinate words to their high bytes and the standard masked terrain cell.
   Clear terrain flags bit `0x4000` at this exterior cell. For non-model10
   plans, the retained helper computes the shape exterior from +`0x68` and
   shape byte +`0x9b`; model10 uses its existing terrain/query branch.
2. Independently derive a terrain cell from the input's position words
   +`0x3d`/+`0x3f`. Read cell+8 low ten bits and resolve a nonzero index through
   `00890390`. Reject a deleted or class-zero occupant. This is a new live
   lookup, not reuse of an earlier caller pointer. No tribe, generation,
   model or equality-to-input guard is added.
3. Inspect the resolved occupant's actual class. For class 2, call
   `004ba4d9 → 00408d00(occupant,inputByteAtA0)`. Retained `00408d00` is
   call-free: if its char argument is not -1, write it to occupant+`0xaf`.
   Then record whether that occupant's model byte +`0x2b` is 10.
4. For a class-9 occupant instead, read its word +`0x92`. If nonzero,
   **sign-extend the word**, resolve through `00890390`, and record whether
   that linked record's model byte +`0x2b` is 10. This inner lookup has no
   deleted/class/tribe/positive-range check and no ten-bit mask. Other outer
   occupant classes do not take either branch. Do not normalize this to the
   earlier unsigned ten-bit lookup or add a class-2 filter to the linked record.
5. If input byte +`0x9e` is 10 and the preceding model10 result is false, call
   `004ba538 → 0042cfc0` with the input position's two masked high bytes packed
   into the low word. The pushed dword's upper word is adjacent local data,
   not freshly zeroed; the absent callee's consumed width is not established.
   This is the only newly named missing selected body in this function.
6. Recompute the exterior point with a second `004b9fc0` call at `004ba546`.
   It is not replaced by the first result: earlier callbacks/terrain changes
   precede this query. Mask the two high coordinate bytes and call
   `004ba575 → 00493770(&input[0x66], coarseCellDword)`. The retained helper
   consumes its second argument as a `ushort`, so its adjacent upper-word
   stack contents are not part of that helper's cell key.
7. Unconditionally on the normal returning path, call
   `004ba57e → 004edcf0(input)`, then return. There is no allocator or
   pending-free countdown invocation in this selected body.

## Resource cleanup is a distinct owner

Retained `00493770` is call-free construction-resource cache cleanup. It uses
the signed byte referenced by input+`0x66` as the first cache index, compares
its active flag and masked cell key, then falls back to an ordered scan of 120
24-byte records at `0093a7a0`. Do not add a range check absent from that body.
If no match exists it returns without changing the index byte.

On a match it writes the input index byte to -1, updates that cache record's
flags/counts and shared resource tuning counters, and unlinks its candidate
nodes through their `+6/+10` links, clearing their active flags. These links
are not the unit record's `+0/+4` allocation links or `+0x20/+0x22` cell links.
Existing resource-search research already identifies this cache family;
retained `00493fa0` supplies its separate candidate storage at `0093b2e0`.
This packet reuses that owner attribution, not a new native resource test.
It does not equate pointer-based candidate cleanup with returning a unit slot,
or claim arbitrary malformed pointers cannot alias other memory.

`00408d00` and the ordinary `004b9fc0` path are similarly bounded retained
support: the former owns one occupant byte, the latter supplies coordinates.
The absent model10 `0042cfc0` effect remains explicit. A non-model10 input skips
that branch; this does not prove the earlier linked-state callbacks harmless.

## Exact delayed-retirement consequence

The accepted `004edcf0` body supplies the final ownership transition:

- If cell-membership flag `0x20000` is set, splice the input's actual position
  cell chain using its previous/next indices, then clear that flag.
- Set class +`0x2a` to zero and deleted bit 1. Remove the record from the
  allocated list and prepend it to pending-free (`00890328`).
- Set byte counter +`0x2e` to 3. Preserve its physical ID +`0x24`. Neither free
  head nor allocation counts are released by this direct pending transition.
- Preserve the helper's already accepted conditional auxiliary cleanup tail;
  this pass adds no general double-retirement guard.

The separately accepted scheduler block saves each pending next pointer,
decrements its byte counter and only on zero clears deleted, calls `00401b40`
and decrements the relevant counts. `00401b40` prepends the slot to the pool
selected by unsigned physical ID below or above `0x280`. Counter 3 means three
pending-processing opportunities, not three extra walltime turns. A retirement
earlier in a visit may encounter the pending loop during that visit.

Thus, on the supported normally returning pre-request path, class-9
cancellation makes its slot unavailable to the immediately following new plan
request. It does not free a slot merely because the old plan stopped being
live. If that later request fails, this caller contains no restoration of the
old record or its earlier linked-state/resource/terrain effects. An unrelated
callback's unproved behavior is not inferred to create or consume another slot.

| Owner boundary | Now proved | Remaining limit |
| --- | --- | --- |
| `004ba410` direct body | Exterior-cell flag clear, actual occupant/linked-model checks, cache cleanup, then primary retirement. | Input validity is assumed; actual-class and signed-linked-handle behavior must survive. |
| `004edcf0` and accepted pending chain | Immediate unlink/class-zero/deleted, counter3 pending, conditional later free-pool prepend with unchanged physical ID. | Surrounding pending opportunities and shared allocation history determine eventual slot choice. |
| `00493770` | Separate resource-cache index, candidate-link and counter cleanup from retained call-free body. | No unit-ID allocator equivalence or malformed-pointer safety claim. |
| Model10 `0042cfc0` | Conditional edge and exact pre-retirement order. | Body/side effects still absent; no child decode. |
| Earlier linked-state initialization | Happens before this removal and the new request. | Actual-class/previous-state effects remain separate; this packet does not close them. |

## Stop

The previously missing normal class-9 removal body is closed. It reuses the
proved primary retirement/pending/free semantics rather than requiring another
allocator framework. The real request stream must still account for these
pre-request effects, possible allocation failure and supported initial history.
A supplied-state caller test can now distinguish cancellation-to-pending from
immediate reuse. It cannot establish that the browser's current arrays carry
native identities or that old checkpoints contain missing history.

No runtime implementation, complete shared owner, native save-format promise,
new Swarm candidate admission or ordinary gameplay proof follows.
