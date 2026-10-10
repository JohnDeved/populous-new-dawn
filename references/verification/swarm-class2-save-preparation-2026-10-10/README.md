# Swarm prerequisite: Save preparation and restoration

The two actual preparation bodies are now separated. `00431970` directly
copies an auxiliary 32-slot snapshot into the requested state span and does not
touch live unit/cell owners. `004434e0` is a small wrapper whose three missing
children retain the representation uncertainty. This packet does not infer
unit-pointer relocation or unchanged serialization from their names.

Assessment base remains `f9675f56`; the research head is `26b67c98`. The
accepted prior packet at `ef04928a` binds the user-Save route through
`00426d70`, including `004434e0(1)`, `00431970()`, the request for
`[0089d178,0096eadc)`, then `004434e0(0)`. The approved two windows total 1,344
bytes. Only their actual selected bodies are interpreted: 57 bytes through
return `00443518`, and 109 bytes through return `004319dc`. Later neighboring
bodies in those capped outputs are excluded, including `004319e0`; they do not
supply an ordinary Load contract.

## `004434e0`: exact wrapper and remaining children

The function saves `ebx`, loads the low byte of its first argument into `bl`,
and zero-extends that byte into `eax` for its zero/nonzero test.

| Order/guard | Exact local operation |
| --- | --- |
| Argument low byte equals zero | `004434ed → 00462d70()`, then write dword `0096aa74 = 0096aaba` |
| At `004434fc`, current byte `0089c661` has bit `0x02` clear | Push `ebx`, call `00443506 → 0041b5c0`, remove four argument bytes |
| Always after that conditional path | Push `ebx`, call `0044350f → 00494930`, remove four argument bytes |
| End | Restore `ebx`, return at `00443518` |

The argument passed to the latter two callees has the requested flag in its low
byte. This wrapper does not normalize `ebx`'s upper 24 bits, so the uninspected
callees' full argument interpretation is not invented. In restore mode, the
land-flag test occurs after `00462d70`; no preservation assumption crosses that
call. Before the Save request, the known low byte is 1, so the first call and
pointer assignment are skipped. After the request it is 0, so they occur on a
normally returning path.

The only direct memory write beyond stack save/restore is the fixed pointer
assignment at `0096aa74`. That address is within the requested state block and
outside unit storage, cell/terrain, pool heads/counts, range globals and lookup.
All three callees are absent from selected generated sources and the export
manifest. No transitive no-mutation claim is made, and no child was decoded.

## `00431970`: bounded auxiliary snapshot

This complete function has no calls or indirect writes through loaded pointer
values. It walks exactly 32 source slots, with source base `00683b92` and stride
`0x2d`, and destination base `0096a1bf` and stride `0x18`. A source slot is copied
only when its byte `+0x20` is nonzero. The fixed correspondence is:

| Source offset and width | Destination offset |
| --- | --- |
| `+0x21`, dword | `+0x00` |
| `+0x00`, dword | `+0x04` |
| `+0x10,+0x12,+0x14,+0x16,+0x18,+0x1a`, words | `+0x08,+0x0a,+0x0c,+0x0e,+0x10,+0x12` |
| `+0x1e,+0x1f,+0x20`, bytes | `+0x14,+0x15,+0x16` |

The destination slot span is `[0096a1bf,0096a4bf)`. For an active slot, offsets
0 through 22 are written and byte `+0x17` is preserved. An inactive source slot
leaves its entire destination slot unchanged; this function performs no initial
clear. The reads fit within `[00683b92,0068412a)`, with the per-slot gaps implied
by the table. The copied source values' meanings are not assigned here.

The accepted `00430bb0` pre-authored reset already zeros the larger auxiliary
source region and this same destination region. That is a separate caller and
time boundary; its earlier clear is not assumed to run immediately before a
Save. This new body is an explicit example of information copied from outside
the main requested state span into it, so an address-only exclusion cannot
rule out encoded or derived information in a saved block.

Every destination address is above fixed unit-storage end `00937a98` and below
the state-request end `0096eadc`. Thus this call does not directly rewrite
physical unit IDs, per-unit class/lifetime/cell/list fields, terrain cell heads,
or external pool/count/range/lookup owners. It may preserve information related
to gameplay in these auxiliary slots; this packet proves the fixed copy rather
than a semantic interpretation of their values.

## Remaining finite identity frontier

The paired `004434e0` calls have not themselves resolved the representation
question: their actual work is delegated to `0041b5c0` under the flag gate and
`00494930` unconditionally, with `00462d70` on restoration. These are the exact
missing original bodies. The separate earlier `0048b450(1)` and output leaf
`00526130` remain uninspected from the prior packet; this pass does not infer
their effects from the selected pair.

If a later claim requires the native preparation representation, the direct
always-called candidate is `00494930`, with the conditional and restore-only
children kept separate. This is a named residual, not an automatic next audit:
no positive evidence in this packet requires its binary representation to be
implemented by a modern checkpoint. No recursive decoding is included here.

For a maintained class-2 lifecycle, the outstanding port responsibilities are
separate plan/building and replacement identities, neutral Vault bodies,
active/cell membership, retirement/pending/reuse history, and a supported
initialization/order boundary. Those live gameplay responsibilities are distinct
from the native file layout and pointer encoding. A modern checkpoint can
preserve a proved modern owner without reproducing the original codec; the
owner itself and omitted old-checkpoint history are not supplied by this source
packet or manufactured from browser array order.

The actual user-Load target remains `00427730`. A claim of matching its native
reconstruction and resulting pool/list order would require that separate route
proof. This packet does not impose original Load compatibility on a narrowly
stated modern lifecycle/checkpoint contract, nor declare its reconstruction
semantics closed.

No native execution, file operation, browser/test run or runtime implementation
was performed. All input bytes, two decoder receipts, selected-body boundaries,
source bindings and the previously accepted publication readback are retained.
