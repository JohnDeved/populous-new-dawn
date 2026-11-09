# Rolling Demo GP checksum: live state, not file integrity

Refs #16 and #987. Static original-byte research, 9 November 2026. This narrows
the checksum prerequisite left by [Rolling Demo control](rolling-demo-control.md).
It does not decode a GM save, execute a command, activate playback or establish
replay equivalence. All source-map identities remain unresolved.

## Input and observation boundary

Original D3D EXE: 2,275,840 bytes, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The existing verified Component0 extraction was reused read-only. GNU objdump
2.44 decoded the selected instructions as data; no original instruction, Windows
API, emulator, Ghidra, browser or application ran. No new archive extraction was
needed. The retained `004b3920.c` export is navigation only; original instructions
bind the claims below.

The [static checker](../../scripts/check-static-rolling-demo-checksum.py) verifies
the executable identity, the instruction anchors and literal stores. The complete
checksum routine is `004439d0..00443b39` (end exclusive), SHA-256
`46e301fb421c8f39e25f32fdccc7d0f6b887c39b2d60cd5a97e544b63ce85126`.
The complete decoded window is retained beside this note in
`rolling-demo-checksum-evidence/checksum.asm`. These are disassembly listings,
not new Ghidra exports or recovered compilable source.

## What is compared, and when

In the authenticated supplied recordings, a GP type-1 frame has an 18-byte
payload. Its first four bytes are the stored little-endian checksum; the remaining 14 bytes are the
command submitted to `0043e8e0`. In `004b3920`:

- `004b3aad` calls `004439d0` with **no payload argument**. The callee reads
  globals and live linked objects described below.
- `004b3ab2` compares the full returned 32-bit value with the stored dword at
  stack +0x18. This happens before the current command is dispatched.
- `004b3ab8` marks a mismatch, but both equal and unequal paths reach command
  pointer construction at `004b3aba` and the consumer call at `004b3add`.
- The mismatch then writes 8 to byte `0098f74f`. A payload-read failure follows
  a different path through `004b3ae7`, which marks the scheduled counter -1.
  Do not turn checksum mismatch into immediate EOF or suppressed command execution.

Thus this value is not a CRC/hash of the following command bytes and cannot be
validated by the manifest reader's file digests. It depends on the live state at
each dispatch boundary, including effects of earlier same-counter commands.
The existing manifest SHA-256 checks continue to serve a separate purpose.

## Exact six-nibble construction

`004439d0` clears eight local dwords and accumulates six of them. Arithmetic is
32-bit wrapping x86 arithmetic. The final packing retains only each sum's low
four bits. Labels S0..S5 below describe this note's sums, not original symbols.
Avoid assigning gameplay meanings to unmapped offsets merely from their values.

| Sum | Exact inputs |
| --- | --- |
| S0 | Dword at `0089d178`. This is distinct from the previously proved scheduled simulation counter at `0089d188`. |
| S1 | Four records starting at `0089d1c8`, stride `0xc65`. Include a record only when its byte +`0xc20` is nonzero, adding both dwords +`0x91d` and +`0x925`. |
| S2 | Follow the pointer stored at `00890320`, then each node's dword next pointer +4 until null. Sum unsigned word +`0x24` multiplied by its **zero-based traversal ordinal**. |
| S3 | On that same first chain, sum the per-node fields listed below. |
| S4 | The same ordinal-weighted unsigned-word calculation on the separate chain rooted at pointer `0089031c`; restart the ordinal at zero. |
| S5 | On the second chain, sum the same fields as S3 **plus signed words +`0x5f` and +`0x61`**. |

S3's common per-node sum is:

- unsigned word +`0x24`;
- unsigned bytes +`0x2a`, +`0x2b`, +`0x2c`, +`0x2e`;
- signed byte +`0x2f`;
- signed words +`0x5d`, +`0x3d`, +`0x3f`, +`0x41`.

S5 includes all of those fields and the two additional signed words. There is no
extra eligibility filter in either traversal. The note does not establish the
producer, membership/lifetime or cycle invariants of these list roots.

The return value is:

```text
(S0 & 15) | ((S1 & 15) << 4) | ((S2 & 15) << 8)
| ((S3 & 15) << 12) | ((S4 & 15) << 16) | ((S5 & 15) << 20)
```

The packing is directly visible at `00443aef..00443b38`. The upper byte of a
computed result is zero, although the caller compares all 32 bits of the stored
value. This is a weak state fingerprint: differences by 16 in a component sum
can be invisible. Matching it alone does not prove complete simulation equality.
The ordinal terms also mean membership order cannot silently become set order or
a sorted-ID order. The pointer roots lie outside the raw GM copied span; this
does not prove their nodes or reconstruction metadata are absent from that span.

## Error-byte search: useful negative evidence only

A complete literal scan of the PE `.text` bytes for little-endian address
`0098f74f` finds seven occurrences, each inside the exact instruction
`mov byte ptr [0098f74f], 8` at:

`004b2c8a`, `004b2eff`, `004b3655`, `004b3688`, `004b3af1`, `004b3e37`,
`004b4219`.

No occurrence in that literal scan is a read. Initialization `004b26c0` also
zeros `0098f650..0098f750` inclusive through a 64-dword plus one-byte bulk store,
which covers the error byte without naming its address as an immediate.
**This is not proof that the error byte has no consumer.** Indirect addressing,
overlapping accesses, aliases, callbacks and external code are not excluded by
a four-byte literal search. Do not label it dead state or implement an exit policy
from this negative result. Its later consumption remains unresolved.

## Reproduce and continue

```sh
python3 -B scripts/check-static-rolling-demo-checksum.py --exe /path/to/d3dpoptb.exe
objdump -d -M intel --start-address=0x4439d0 --stop-address=0x443b39 /path/to/d3dpoptb.exe
```

The checker uses only Python's standard library and writes JSON to stdout. It
reads at most the expected executable length plus one byte, refuses a different
identity, and never evaluates the checksum over supplied gameplay objects. Use
the verified regular original file; this is not general filesystem admission or
an I/O timeout guarantee. A passing static check is not an executed checksum test.

The next codec work must map these exact live fields and ordered lists after GM
restore and at each GP command boundary before claiming checksum compatibility.
Separately retain the unresolved error consumer, full command semantics, CP
playback, deferred input/focus return and actual replay equivalence. There is no
current-format save, native execution, browser, gameplay, performance, full-check,
build, parity or issue-completion credit from this research.
