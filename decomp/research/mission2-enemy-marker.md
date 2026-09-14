# Mission 2 enemy-marker counterattack

Mission 2 script opcode `1198` is zero-arity. Interpreter case `0xaa` in
`0048cc60` calls `0040bce0` with the script tribe, which is native tribe 3 for
this mission. `0040bce0` walks that tribe's building list and calls `0040bd20`
for each entry; marker 0 is only the script trigger.

Direct bytes for `0040bd20` require a living model-4 drum tower with a live
model-3 Warrior in its first occupant slot. It searches a height-adjusted
radius around the tower for an eligible hostile person. When found, a second
scan marks nearby same-tribe people; water cells are excluded. Occupants are
propagated only from live same-tribe building footprints whose model flags
include `0x400`. The tribe people list then receives one shared immediate
model-19 order with flags `0x32`. The order is
centered on the tower; for Mission 2's radius 7 its bounds are `0x0a0a`.
Attachment sets person flags `0x10` and `0x02000000`. No RNG is consumed.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-building-counterattack.py /path/to/d3dpoptb.exe
```

The check executes `0040bce0` and its `0040bd20` branch against the verified
executable. Indexed-search, alliance/disguise, and person-order leaves are
intercepted, so it proves traversal, branch selection, direct flag writes, and
the order-call contract—not those leaves' implementations or a whole native
Mission 2 playthrough. Browser regressions separately exercise the imported
script trigger and existing live model-19 consumer.
