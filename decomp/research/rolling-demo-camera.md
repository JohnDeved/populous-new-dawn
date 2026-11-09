# Rolling Demo CP staging and camera application

Refs #16 and #987. Static original-byte research, 9 November 2026. This extends
the [stream framing/control contract](rolling-demo-control.md), rather than
repeating its identity table or implementing replay. The earlier manifest keeps
payloads opaque and remains unchanged. Source-map identities remain unresolved.

## Exact source and scope

The existing verified D3D EXE is 2,275,840 bytes, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
GNU objdump 2.44 reads it as data only. No original instruction, emulator, Ghidra,
Windows API, application, browser, extraction or installer ran.

Three complete instruction windows and their hashes are retained in
`rolling-demo-camera-evidence/`, with commands/tool/input identities in
`provenance.json`:

- `004b3920..004b3a47`: the CP service, EOF cleanup and GP-gated camera call;
- `004b4020..004b4225`: the complete CP chunk reader/dispatcher through its return;
- `004b43f0..004b4751`: the complete staging-to-camera helper through its return.

The 11-entry dispatch table at `004b4228` is recorded as data, not disassembled
instructions. Existing exports `004b43f0.c` and `0041c700.c` were navigation aids;
the instructions bind the new claims. This note covers type 10, the supplied
recordings' camera payload. It does not establish every other CP message's
semantics or the downstream view/rendering routines.

## Type 10 replaces staging, not individual destination fields

`004b4066..004b4075` reads the header's type byte, subtracts one, admits indexes
0..10 and dispatches through `004b4228`. Table index 9 names `004b41bd`, so this
is the type-10 handler. In the authenticated supplied recordings its payload is
eight bytes. The handler maps those bytes as follows:

| Payload offset | Staging destination | Operation |
| --- | --- | --- |
| +0 | word `0098f700` | Copy the 16 bits unchanged. |
| +2 | word `0098f702` | Copy the 16 bits unchanged. |
| +4 | dword `0098f6fc` | Sign-extend the 16-bit value to 32 bits. |
| +6 | word `0098f704` | Copy the 16 bits unchanged. |
| Header auxiliary byte | byte `0098f708` | Replace the whole byte, not OR it. |

This handler does not itself write the selected tribe record or invoke rendering.
Its decoded positions are staging fields, not a source-map identity. Do not infer
coordinate units or a modern camera conversion from the copied bit patterns.

## Playback branch and all-field commit

`004b43f0` constructs the current tribe record pointer from signed byte `0089c6f0`,
base `0089d1c8` and stride `0xc65`. It snapshots playback-active flag 8 from
`0098f746`. With that bit set, `004b441a` skips the ordinary-input damping and
return-to-default preparation, reaching `004b45be` directly.

At `004b45be`, the **low nibble** of staging auxiliary byte `0098f708` gates the
whole commit. A zero low nibble returns, even if upper bits are nonzero. With a
nonzero low nibble and playback still represented by the captured flag, the
branch at `004b45ce` reaches `004b46ee`, bypassing ordinary movement, angle
normalization and the local-input +/-0x2000 clamp. It then always writes all four
fields, regardless of which low-nibble bit made the gate nonzero:

- staging word `0098f700` to tribe word +`0x24`;
- staging word `0098f702` to tribe word +`0x26`;
- staging word `0098f704` to tribe word +`0x32`;
- **arithmetic** right shift by three of signed dword `0098f6fc`, then its low
  word, to tribe word +`0x34`.

The auxiliary bits are therefore **not per-coordinate write masks**. Nor does
the playback branch apply ordinary-input smoothing, angle `&0x7ff`, or that
local-input clamp. For example, signed -1 shifted right three remains -1; a
decoder must not silently use division truncated toward zero instead.

Two additional side effects have separate bit gates:

- auxiliary bit 4 ORs `0x80` into dword `0087ca1c` at `004b4723`;
- auxiliary bit 8 calls `0041c700(signed_staging_value >> 3, 0x400)` at
  `004b4744`. Even a zero shifted value reaches this call when bit 8 is set.

The complete helper does not clear the auxiliary byte on its playback path.
This is not a proof of its lifetime across all external writers or a whole-frame
camera owner. The view-configuration callee, its descendants and final rendered
pixels are outside this new proof; copying only tribe fields is not established
as a complete playback camera implementation.

## Scheduling, overwrite order and EOF

The existing simulation service reads counter `0089d188`. While CP is active,
`004b39ac..004b39f1` processes due CP chunks and reads their following headers
before it reaches the camera helper. For multiple successfully consumed type-10
chunks in that service visit, later chunks replace earlier staging values. Do not
invent an application/render step between every chunk. This does not claim that
every possible CP type is side-effect-free or that arbitrary counter jumps are
native-equivalent.

At `004b3a35`, the GP activity bit 0x10 gates the call to `004b43f0`. In this
service path there is one such call, after the CP loop/cleanup and before due GP
commands. The active-CP flag is not the call gate. This distinction matters when
CP reaches EOF before GP, as already observed for recordings 5 and 3.

On CP EOF/error, `004b3a1c..004b3a2c` zeros the 30-byte staging range
`0098f6ec..0098f709` inclusive and clears activity bit 8. The branch does **not**
write zeros into the tribe record's camera fields. If GP remains active, the
subsequent helper visits its inactive-CP path with cleared movement/staging flags
and returns at the low-nibble gate without committing camera fields or calling
the view-configuration callee. An internal idle counter may advance on that path;
do not describe the whole staging block as permanently zero afterward.

Consequently this service's EOF handling leaves the previously committed tribe
camera fields intact on that call. It does not establish their persistence against
other writers, later montage activation, GP completion cleanup or renderer state.
If a due batch reaches EOF, cleanup occurs before this helper invocation; no
additional apply of the just-cleared staged tuple is established. CP EOF must not
be implemented as either zeroing the destination camera or completing the montage.

## Continue without overclaiming

Reproduce the retained windows with the exact commands in provenance, for example:

```sh
objdump -d -M intel --start-address=0x4b43f0 --stop-address=0x4b4751 /path/to/d3dpoptb.exe
```

The supplied framing/data identities and checksum research are retained, not
rerun or counted as new tests. There is no helper, simulated/native playback,
camera decoder or application activation in this change. A future implementation
must preserve staging-versus-destination ownership, the actual flag gates and
signed shift, then establish downstream view configuration and integration with
GM restore, GP command/checksum state, input/focus return and the real replay.
Current-format saves, original execution, browser/rendered behavior, performance,
full project checks/build and whole-issue acceptance remain open.
