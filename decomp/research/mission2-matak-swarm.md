# Mission 2 Matak Swarm ownership

Mission 2 uses `cpscr074.dat` SHA-256
`03931ad1bc69860177c0a0d7d850db46b268683bf95b274926e18fe1f8a5d9db`.
Its startup script configures two Swarm model-5 entries for tribe 3 with a
10,000-mana reserve, range 512, six-person threshold, and offense/defense modes.

`004ecac0` indexes follower contributions by each person's signed tribe byte.
The bounded check leaves tribe 1 at 111 and raises tribe 3 from 333 to 335 for
one eligible tribe-3 Brave. `0041a550` scans all four tribe records and calls
`0041a590` for every active, unfrozen tribe; with only tribe 3 active, 40,000
incoming mana moves into tribe 3 while tribe 1 remains unchanged.

Mission 2's header leaves permanent Swarm availability clear. Opcode 1108 writes
only the AI entry fields, and `004d1450` derives readiness from that entry, its
reserve, current mana, and range. `004f4de0` still prepares the normal model-5
price with the availability bit clear, passes owner 3 to allocation, and
`004c14c0` debits 40,000 only from tribe 3.

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission2-matak-swarm.py /path/to/d3dpoptb.exe
```

The check uses executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
It intercepts allocator `004ed8a0`, projectile initializer `004c1b80`, and the
unavailable-notification slot `00430bd0`; it proves native ownership, readiness,
price, and debit, not a complete native Mission 2 playthrough or rendered effect.
