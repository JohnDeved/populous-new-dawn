# Mission 10 opening and Totems

## Supplied data

Mission 10 uses `levl2010.dat`, `levl2010.hdr`, and tribe-3 script
`cpscr059.dat`. The reviewed inputs have SHA-256 hashes:

- executable: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
- level: `0b0e073e0214597db814d3b69ba565127ea3df58cf5f46e6796466b7059c9f5d`
- header: `2576ff6cddb23ff12afe86c9fc5b8680a035947f1f1e583568c95ea8be4f7bbb`
- script: `d37b2af43edc9adb7b7d5b53cdba13b85967ac2c57c0f9fe87e9b0df31cb5a2f`

The opening message is number 57/string 679. It warns that the starting
settlement will sink. A supplied, unlinked Blue class-4/model-1 Boat is active
at level start, but it is not the player's usable crossing. Object 109 remains
at native `(9814,6230)` in open-water cell `0x1826`; its record contains no
occupants or destination, native initialization does not relocate it, and the
native boarding predicate rejects it there.

The deterministic authored crossing starts from the completed Blue model-13
Boat House, object 159. Its anchor is native `(9216,1536)` (imported browser
`(30.859375,-15.140625)`) with angle 512. Native production uses dock-mask
cell `0x0628`, center `(10496,1792)` / browser `(33,-15)`: an eligible occupant
works for 600 turns, a model-1 Boat is allocated, and its builder boards at
launch. Mission 10 starts with zero Land Bridge stock, though that spell remains
rechargeable as a possible later alternative.

## First authored objective

The first objective is the Blue class-6/model-6 Totem at browser `(29,-67)`.
Script command 1131 queries it at native script cell `(36,58)`. Its type-0
worship settings are one use, two intended worshippers, and target 64. Message
58/string 680 identifies it as the Totem across the water that provides the
land needed to replenish the tribe.

On completion, reviewed `004fb270` traverses the Totem's one-based links
`[145,147,146,59,60]`. Those templates are class-7/model-90, two
class-7/model-26 effects, the next class-6/model-6 Totem, and neutral
class-5/model-9 scenery. The trigger clones and initializes these objects;
PopScript does not allocate them.

The browser currently maps the two known model-26 allocations to its reviewed
Earthquake controller and admits the linked Totem into the live shrine and
renderer collections. Model-90's exact terrain consumer and the linked scenery
consumer remain unrecovered, so this slice does not claim their complete terrain
result.

## Script transition and timer

The recurring native block is words `391..<528`, eligible for tribe 3 at turns
`5 mod 16`. Once command 1131 reports that the first Totem is exhausted, its
one-shot presentation block (`445..<525`) queues ten flyby tracks, ends at
`(36,54,1646,0)`, locks input through command 1206, latches variables 7 and 9,
and starts a 480-second timer. At the native 12-Hz simulation rate this is 5,760
turns. The browser binds the query, latches, flyby, and timer transition while
leaving the block's still-unbound AI command 1093 out of the live slice.

Native timer routines prove that completion is false for the first 5,759 ticks,
true after tick 5,760, and false again after clearing. Browser commands 1200,
1201, and 1202 therefore use a checkpointed nullable remaining-turn counter:
positive is active, zero is complete, and null is cleared.

The second-success slice is words `528..<633`. Command 1131 queries object 58,
the one-use Totem at browser `(-5,21)` with two intended worshippers and target
64. Completion clears the deadline, queues the authored six-track final flyby,
sets variable 6, initializes variable 18 to 64, and decrements it on later
eligible evaluations. After 64 evaluations, command 1151 forces marker 20's
object 39, whose ten links create the settlement Erosion chain. The script does
not issue a victory command; the normal outcome system remains responsible for
eventual victory.

Words `633..<647` are the separate Shaman-loss watchdog, not part of the success
slice. Deadline expiry is words `647..<722`, evaluated for tribe 3 at turns `1
mod 16`. Command 1202 leaves variable 8 clear while the timer is incomplete.
Twelve turns after the 5,760th timer tick in the authored schedule, it reports
complete; the branch queues message 131/string 682, adds its head and open-message
flags, forces heads 24-26, queues the four-event sinking flyby, latches variable 9
from 1 to 2, sets level flag `0x01000000`, and sets player-tribe flag `0x00020000`.
The normal outcome phase consumes that player flag and reports loss; opcode 1222
does not itself set the result. Message 59/string 681 remains the second-Totem hint.

## Evidence and limits

`scripts/check-native-mission10-opening.py` executes the original VM over the
recurring and deadline blocks while intercepting game-command leaves and supplying
the head-count and timer-query results. It directly executes the original timer,
level-flag, and player-result-flag leaves. Message, head, flyby, and outcome
consumers remain outside that byte-executed composition. The
existing Boat House native probe separately verifies the 600-turn producer and
occupied launch. The browser check continues Mission 9 into Mission 10 and uses
the authored Boat House for both crossings. Its first crossing uses an ordinary
ground command to exercise automatic group boarding, checkpoint restoration,
landing, and retained-order completion; the second crossing still uses explicit
Boat input. Rendered HUD, ground, Boat, Totem, menu, and Blast input carry the
party through live defenders; checkpoint reload resumes second-Totem worship
deterministically. From a saved first-Totem checkpoint it also advances the exact
remaining timer, observes the authored failure message, normal outcome loss screen,
and `Begin again`, then reloads the checkpoint and continues the success path. The
check observes both success flybys, deadline clearing, the 64-evaluation delay, all
ten Erosion targets, terrain upload, building-mesh synchronization, objective UI,
and restart state. A deterministic test starting
with the intact settlement separately verifies Erosion-driven building removal.
The complete native simultaneous automatic-crossing schedule and live
full/unavailable-Boat retry remain open.

Full Mission 10 AI, command 1093, the Shaman-loss branch, natural endgame victory,
and exact model-90/model-26 terrain equivalence remain open.
