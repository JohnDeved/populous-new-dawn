# Mission 3 opening data

The supplied Mission 3 files are `levl2003.dat` SHA256
`eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf`,
`levl2003.hdr` SHA256
`219dd7611a4e3f6c2d4e78620a4d5bb9cf61bf0e9c66c21b2b43b89c8ba4d3f0`, and
`cpscr012.dat` SHA256
`d5dfcd826f77909a64cca03ca9d9e3d351d2a7cb3f63eb8ba811b59916e83601`.

The level contains one Blue Shaman and Hut, an owner-2 Chumara Shaman with six
Braves, and 44 neutral Wildmen. The header enables rechargeable Blast and Swarm;
there is no Swarm head or one-shot Swarm gift in this level.

The Vault trigger at `(-37,-133)` links a class-2/model-5 knowledge reward. Native
training tables and English message 109 identify it as Temple knowledge used to
train Preachers. The ordinary head at `(-7,115)` links class-7/model-23 Erosion at
`(-15,111)`. It clones that effect when worship completes; it is not a spell gift.

The turn-zero script configures Chumara Swarm use, grants Chumara one Convert Wild
shot with opcode 1115, enables the unrelated marvellous-house death flag with opcode
1197, and opens message 105 directing Blue to the Chumara Vault. The current opening
port retains the imported script and its supported initialization but deliberately
does not run Mission 3's recurring block. Unbound recurring commands include 1221,
1168, 1179, 1074, 1103, and a later 1030; those block any claim of full Mission 3
script, AI, tutorial, or victory parity.

These findings come from the hashed level/header/script bytes, verified executable
table reads, the reviewed PopScript interpreter, and existing native worship,
training, and Erosion evidence. No native game recording or parity update was made.
