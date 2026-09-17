# Tutorial Shaman-selection lesson

## Native boundary

CPSCR057 words 2648–2670 run when stage 4 is outside World View. They call
`1142(16, ON)`, emit marked message 61 (“Left-click on the Shaman…”), and set stage
5. Variable 7 is the existing World View latch; neither the branch nor opcode 1142
contains a click-success predicate.

[Opcode 1142](../generated/00491810.c) resolves operand 16 through the native UI
table to record 41. ON writes record 41 to the active highlight byte; OFF writes
`0xff`. The existing consumer in [0044ac00.c](../generated/0044ac00.c) compares that
byte with active UI records and draws the matching rectangle. It reads no person,
model, selection flag, or script destination. Record 41's Shaman-box identity is
inferred from the authored message and script pairing; native UI pixels were not
captured.

The browser has no separate native UI-record registry, so this presentation-only
command is a validated no-op. The authored living Blue Shaman remains selectable
through the existing direct-click and Shaman-box owners; the browser acceptance
uses that live path without injecting selection or a script variable.

## Deliberate stop and provenance

The delivered slice stops at stage 5. Words 2599–2647 begin the following Obelisk
transition with `1151(102)` and a flyby and remain outside this feature.

- EXE SHA256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
- Ghidra 12.1.3: `python3 scripts/decomp.py export 00491810 --output <ignored-task-dir>`
- Export SHA256: `32eb1f3804f93502dfcce537b18dad72d5451f6f7b169163d5e21ceddb81c4b4`

This is byte-linked pseudocode plus a live browser adapter check, not recovered
source or a native Tutorial playthrough. Later lessons, trigger heads, completion,
and exact presentation remain open.
