# Spell modifier input and consumer continuation (#1008)

Read-only source trace, 13 November 2026. Extends the producer note from 7c54865; no gameplay implementation, tests or browser acceptance.

## Evidence identities
At main 532cd9ef:
- generated/004a9d90.c: d54a0b4137ba36c8e1c63d2e4e9db0b4d19a2aa2
- generated/004aa1c0.c: d70c263ec14e08163f881e1e43333e45b06a4bcc
- generated/004c2ba0.c: a2e80d3533065cd4a32375f3b2a9dcd7388fae2b
- generated/0043e8e0.c: 84736619371ad4ffe2ad1934177d84565bbb8f92

These are retained Ghidra pseudocode, not executable original source. Original executable identity remains SHA256 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f.

## Input-array resolution
004a9d90 writes key-down/up arrays at 984591+key and 984691+key in opposite states: param2 zero writes 0/1; nonzero writes 1/0. Thus the earlier callback predicates are not inferred previous-frame edges. Predicate A indexes 0x1d/0x9d; B indexes 0x2a/0x36. These correspond to standard PC left/right Ctrl and Shift scan codes respectively; native handler independently groups 1d/9d into modifier bits4/8 and2a/36 into bits1/2. The callback tests A before B, so its Ctrl-like path wins when both are active. Complete input-adapter scan-code identity remains a separate validation item.

004c2ba0 returns1 only when model is nonzero and field10_0x10 bit(model-1) is clear. 004c2be0 clears that bit. Do not call field10 an enabled mask: the predicate polarity is inverse.

## Consumer located
0043e8e0 (process_tribe_cmd) has charging cases matching the callback's emitted 0x56/0x74/0x75:
- 0x56 applies the supplied enable/disable argument to one model, then clears bit0 of tribe+0x9e9.
- 0x74 loops model indices0..31 where the spells mask includes that index, applies the requested state, then clears that bit0.
- 0x75 compares requested model with tribe+0xc25 and tests saved marker bit0 at+0x9e9. Repeating the same selected model with marker set restores mask states for eligible models, clears marker and selected model. Otherwise it resets saved mask, records currently enabled eligible models, disables them, enables requested model, stores selected model and sets marker.

The loops and availability use bit(index), whereas field10 helpers use bit(model-1). Preserve this distinction rather than directly copying masks. Some generated helper calls omit arguments, so exact machine-code confirmation is required before literal translation.

## Remaining implementation gate
Trace 00479cf0 emitter into this consumer to verify record layout/dispatch, confirm input scan-code adapter, and verify eligible-model index conventions and omitted helper arguments against retained machine code. Initial guards/alternate mode and permanent-versus-stock availability remain part of producer semantics. Ctrl cast retention is a separate producer, not solved by right-click charging. No speculative patch was made.

Research was coordinated between the queue and control workers; this single note preserves their combined trace.
