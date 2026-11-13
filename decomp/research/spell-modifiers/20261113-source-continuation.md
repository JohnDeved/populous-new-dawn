# Spell modifier source continuation (#1008)

Read-only research on 13 November 2026, bound to main 532cd9efb13acf0a36f2b9774c8892b18f918be6. No runtime, test, browser or implementation acceptance.

## Retained evidence, not a missing callback

The generated file decomp/generated/0049e650.c is absent, but this does **not** establish missing callback bytes. The full correction section of [spell-hud-visibility.md](../spell-hud-visibility.md) links [callbacks.asm](../earned-spell-hud/callbacks.asm), blob cbe3c2f17447890ed5acf3858428dda053533806. It retains disassembly of the right-click callback 0049e650–0049e7c9. Original executable SHA-256: 3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f. This pass read retained disassembly, not a fresh executable.

## Bounded producer trace

After alternate-mode/model/charging-permission gates, 0049e650 tests current-player/model state through 004c2ba0, performs a conditional list cleanup, then selects among three calls to 00479cf0:

- Predicate A: (byte[009845ae] != 0 && byte[009846ae] == 0) OR (byte[0098462e] != 0 && byte[0098472e] == 0). Sends command 0x75, model, zero at 0049e70b–0049e716 and returns.
- Otherwise predicate B: corresponding nonzero/zero pairs 009845bb/009846bb OR 009845c7/009846c7. Sends command 0x74, model and a value derived from whether 004c2ba0 returned zero, at 0049e749–0049e76c.
- Otherwise it requires the permanent model bit, then sends command 0x56 with the same query-derived boolean at 0049e77b–0049e7bb.

A takes precedence over B. Do not label the predicates Ctrl/Shift until the input-array base and key mapping are independently established. The four pushed arguments bind the command-emitter call; they do not establish that same-numbered cases in process_cmd are this command namespace. Indeed retained 004aab80.c cases 0x74/0x75 concern target/context actions, so substituting them as these charging consumers would be unsupported.

## Next exact work

Recover/trace 00479cf0 and its actual queued command consumer, including 0x56/0x74/0x75 mask transitions; map the key-state byte pairs and consumed/edge states; inspect conditional cleanup and 004c2ba0 semantics. Establish restoration, ownership and modifier precedence before implementation. Ctrl cast retention is a separate public-input producer and is not resolved by this right-click trace.

No dedicated #1008 PR was returned by the current PR search. No code, assets, dependencies, workflows or shared runtime were modified.
