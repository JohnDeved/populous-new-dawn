# Mission 2 positioned message

Mission 2 opcode 1177 dispatches to `0x491040`. For script arguments
`68, 204, 96, 308`, the verified executable maps message 68 to English string
644, allocates notification type 3, and finishes with lifetime 3000 and flags
`0x36f1`.

`0x430e60` packs target cell `(204, 96)` as `0x60cc` and stores the fourth
argument, 308, as a separate unsigned 16-bit payload. It also snapshots the
player view position and angle. The paired layout suggests that 308 is a target
view angle, but the downstream camera consumer has not been exported, so the
runtime keeps the payload neutrally named and uses only the proven target for
camera focus.

Evidence: reviewed exports [`0048cc60.c`](../generated/0048cc60.c),
[`00491040.c`](../generated/00491040.c), and
[`00430e60.c`](../generated/00430e60.c). A scoped Unicorn probe executed the
original handler and all allocation/setter/list leaves; only sound dispatch was
intercepted, requesting cue `0xe3`. Executable SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
