# Mission 20 linked worship chain

## Provenance

`scripts/check-native-mission20.py` verifies the hash-matched executable and its
adjacent `levl2020.dat`, `levl2020.hdr`, and `cpscr043.dat`. It executes the
record initializer at `00485b00`, worship completion at `004fb270`, command
dispatch at `0048cc60`, and opcode-1127 leaf at `004f2aa0`. Allocation,
template-copy, first-processing, deletion, presentation, and shared-reference
leaves are intercepted; complete post-dispatch terrain, damage, rendering, and
audio evolution are outside this probe.

## Authored topology and order

All indices are zero-based DAT records. Native clones and first-processes every
nonzero link in slot order before retiring each unshared source and the completed
one-use trigger.

| head | required | ordered links |
| --- | ---: | --- |
| 322 | 5 | 323 Land Bridge gift; 123 Earthquake; scenery 171, 172, 173, 176, 175, 174; 125 Stone Head; trigger 124 |
| 124 | 6 | 122 Flatten gift; Lightning generators 120, 119, 121, 118; 324 Stone Head; trigger 325 |
| 325 | 7 | 326 Firestorm gift; 327 Firestorm controller; 328 Volcano controller; 329 Stone Head; trigger 330 |
| 330 | 8 | 331 Volcano gift |

The `0x06ac..0x06b1` link tokens use their low-byte one-based ordinals to
identify scenery records 171..176. Treating them as full DAT indices silently
drops all six linked scenery objects. Class-7 models 30, 22, and 15 are
respectively Lightning-bolt, Firestorm, and Volcano controllers; they are world
effects, separate from the spell-stock gifts in the same stages.

Interrupted worship clears accumulated work and worship counts without deleting
anything or consuming the remaining use. Successful worship changes remaining
uses from one to zero, retires the sources and trigger in order, and cannot fire
again. There is no cooldown state.

## Opcode 1127

Mission 20's startup command 1127 is exactly `ai.flags |= 0x8000`; paired opcode
1128 clears the bit. The flag later permits an eligible AI Shaman to target an
occupied completed Guard Tower with Lightning. It does not gate the opening,
worship chain, effects, or rewards.

## Browser boundary

The browser imports the authored level/script/message, preserves the four-stage
chain, creates the gifts and world effects in native slot order, activates the
next head, consumes each completed head once, and checkpoints the live chain.
The focused browser check owns shipped UI reachability and ordinary worship.
Exact class-7 presentation/audio and complete downstream disaster equivalence
remain open.
