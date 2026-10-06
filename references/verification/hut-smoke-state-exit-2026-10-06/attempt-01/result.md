# Attempt 01: failed ABI checker, no smoke-cleanup result

The one authorized invocation at source
`07e54532b41a2d1b04d16db5f8dffd48648962b4` failed with exit1 after
0.278923seconds. Source, external inputs and host-tool fingerprints were unchanged.
The same foreground invocation observed an empty owned process group at terminal;
CPU4 was released immediately. No retry occurred.

The retained [receipt](receipt.json), [raw stderr](stderr.txt), empty
[stdout](stdout.json), [exact executed probe](source-probe.py),
[source manifest](source-manifest.json), [launcher](source-launch.json),
[host receipt owner](host-one-case.py) and independent
[execution preflight review](executable-review.md) bind that failed attempt.
Original EXE/data files and tool binaries are not copied into this bundle.

## Failure boundary

The traceback ends at probe line67, inside the supplied class5 fire-allocation
leaf reached from real `00408cb0`. The assertion treated all three class/model/
tribe stack arguments as fully specified32-bit integers and required exactly
`(5,10,0)`. It aborted before returning the declared failed-allocation result to
the original burn initializer. No final root-release/list/child output exists.
This is a checker ABI failure, not a measured native/runtime smoke mismatch.

The original [caller bytes](allocator-caller.asm.txt) show:

- `00408972`: `mov dl, byte ptr [esi+0x2f]` supplies the tribe byte.
- `00408975`: `push edx` passes a32-bit stack slot without clearing its upper24bits.
- `00408976/00408978`: class/model are literal pushes10/5.

The allocator consumes bytes: class at `004ed8a5`, model at `004ed8cd`, and
class/model/tribe at `004eda3b/004eda3f/004eda43`. It copies those bytes into
record offsets `+0x2a/+0x2b/+0x2f`; the point argument remains a full32-bit load
at `004eda4a`. See [entry widths](allocator-entry-widths.asm.txt) and
[field widths](allocator-field-widths.asm.txt). The registered decompilation
`004ed8a0.c` independently declares its first three parameters as byte/byte/
undefined1. These are static reads of the unchanged canonical EXE, not another
native invocation.

The minimal correction is to retain/log all four raw stack DWORDs, decode the
first three using `&255`, keep the position pointer full-width, and apply the
existing `(5,10,0)` assertion to the decoded bytes. Log before asserting so any
future rejection retains its actual arguments. No root, pool, child, resident,
RNG, lifecycle or resource assertion should be relaxed; no supplied leaf should
expand. The raw DWORD values from this attempt were not logged, so their exact
numeric values are not reconstructed or claimed.

A corrected source packet needs review and a fresh explicit one-case execution
grant. This result does not authorize a retry or a runtime edit.
