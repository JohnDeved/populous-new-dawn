# Mission 3 anti-preaching notification

## Authored path and native proof

CPSCR012 words `504..<530` form the complete conditional which warns when a Blue
follower is being converted by an enemy Preacher. The original `EVERY 31` header
at `457..<460` schedules it when `(turn + Chumara tribe 2) & 31 == 0`, starting
at turn 30. Other conditions sharing that original periodic block remain separate.
The browser now executes this original conditional, not a new population trigger.

Opcode 1168 resolves its first operand as a tribe literal 1118..1121 or a normal
script value, invokes `004f21f0` on that tribe and stores the result in the user
variable index carried by its second operand. `004913f0` owns the argument and
result handling. `004f21f0` walks the linked list at tribe `+0x881` through person
`+8`, counting exactly state byte `+0x2c == 23`. It performs no RNG draw or writes.

The authored command reads Blue into variable 21 while variable 20 is zero. A
positive count emits message 107 with commands 1176/1180 and sets variable 20 to
one. Re-evaluation must not create another notification.

Run `python scripts/check-native-mission3-preaching-message.py /path/to/d3dpoptb.exe`.
It verifies executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
and source script SHA256
`d5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601`, then runs
original interpreter, 1168 dispatcher, linked-list counter and latch instructions.
Controlled Blue lists are empty, non-victim states `[17,10,33]`, one victim `[23]`,
and two victims `[23,17,23]`; every case also has a Chumara victim to detect wrong
tribe selection. Turns 29, 30 and 62 cover the schedule and duplicate suppression.
Message presentation commands are intercepted, so its unchanged RNG claim applies
only before the existing message presentation consumer, not to notification sound
or visual randomness. No installer or full game process runs.

## Missing localized input

Message 107 was absent from the imported table. The executable table at
`0x5ae310 + 107*2` resolves string ID 650. The native probe compares both ID and
text to the hash-verified adjacent English `language/lang00.dat`.

The existing producer now accepts the bounded command
`python scripts/import-messages.py /path/to/game --message 107`. It verifies the
existing executable/language provenance, imports only that entry and preserves
all other messages, profiles and provenance. It does not regenerate artwork,
tooltips, sky or unrelated script messages. Other language support is unchanged.

## Live simulation evidence and limits

`tests/mission3-preaching-message.test.mjs` uses shipped Mission 3, ordinary turns,
real births, the enemy's autonomous Temple and its explicitly trained Preacher.
An existing Blue Brave receives a normal movement command toward that Preacher.
The existing sermon and conversion victim machinery place the Brave into state 23;
the original script then creates exactly one ID-650 notification on its next
32-turn opportunity. No entity, state, population, counter or outcome is injected.
Checkpoint migration and 128 further turns preserve the latch, messages and RNG.

This is natural simulation/command-path evidence in Node, not rendered UI
acceptance. Mac browser verification remains separate. The other recurring
Mission 3 tutorial and AI blocks are not certified by this slice; the original
whole-game comparison and full missions 1–3 parity remain open.
