# Mission 4 data and objective

The supplied Mission 4 files are `levl2004.dat` SHA256
`82a3511c1b5669ba5b44d8ca9eceeefef51c9c6fa7151f650d96d8870f61abad`,
`levl2004.hdr` SHA256
`28423b5c46f3db542852b2a3059b343b255886697f335c38515ad20ffc812e3b`, and
`cpscr013.dat` SHA256
`d0f72bd1d35fcc24f0529edce9d7d87df9ad96ae22607dbd64e11cad818f76fe`.

The level contains a Blue Shaman and two completed Huts, a Matak Shaman with six
Braves, 53 neutral Wildmen, and 42 Trees. Its Vaults grant Guard Tower knowledge
at `(69,-29)` and Lightning at `(-19,-61)`; a four-use Stone Head at `(53,-79)`
grants Convert Wild. The header initially enables rechargeable Blast and Swarm
and knows the Hut, Temple, and Warrior Training Hut plans.

The turn-zero script configures the Matak computer, opens message 110, and marks
that type-one message with opcode 1187. The bounded recurring objective block
runs every 64 turns. Once Matak population is below eight and its internal
"killed by human" counter exceeds ten, opcode 1221 enables forced attack mode.

Reviewed `0048cc60` at opcode 1221 sets or clears tribe `flags2 & 0x40`. Enabling
it calls `0041ca10`, which reaches `0041cc20` and replaces eligible living tribe
members' orders with command 28 targeting the living player Shaman; `0041cb40`
can reissue that attack on the native 16/32-turn conditions. It does not directly defeat the tribe. Ordinary
population-based outcome processing at `00418e30` remains responsible for victory.

Opcode 1179 is `0048cc60` case `0x97` because the dispatch subtracts `0x404`;
case `0x9b` is unrelated opcode 1183. It resolves one script field, advances the
cursor, then—when level flag `0x01000000` is clear and a last message exists—calls
`00430f30`. That leaf accepts message types whose descriptor has bit `0x80` and
writes the resolved value's low 16 bits to message offset `0x10`, its lifetime.
The three contextual branches create type-3 messages 71, 72, and 73 and set each
lifetime to 256. A hash-verified executable/script probe executed all three native
dispatches plus the level, slot, type, and field-width guard cases without
intercepting leaves.

The browser binds the authentic level, turn-zero setup, contextual training and
attack tutorials, opening flyby/message, objective block, knowledge rewards,
forced attack start, and ordinary victory. Mission 4's larger recurring AI remains
unbound, so this is not a claim of full Mission 4 script or AI parity. No parity
update or native recording was made.
