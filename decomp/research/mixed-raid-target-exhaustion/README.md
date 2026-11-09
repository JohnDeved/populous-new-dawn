# Mixed-raid target availability

Base: ae348ed113a76bfda6db8cdcb18737e10714790d. Issue #446.

The ordinary Mission6 candidate run that exposed this pre-existing adapter bug
lost cached entity289 at turn8098. Warriors367/368/449 retained order19 at target
14394 (0x383a), while Preacher425 legitimately retained order17. Blue Shaman95
remained alive at100HP, outside buildings, without flight, native state19, packed
cell13370 (0x343a), squared distance4 from the attack cell. These observations
motivate the supplied live-caller regression; it is not a full campaign replay.

## Native static evidence

Original executable SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
GNU objdump2.44 disassembly was retained by independent review, then rechecked
against the original file read as data. No original code was executed.

Reproduction (EXE is the verified original executable):

```
objdump -D -Mintel --start-address=0x4cc112 --stop-address=0x4cc330 "$EXE"
objdump -D -Mintel --start-address=0x4f5950 --stop-address=0x4f5c80 "$EXE"
```

`phase16-static.asm`: call4f5950 at4cc14a collects the target arrays; call4ce2c0
at4cc172 separately handles members. Empty arrays are checked at4cc1a3/4cc1b1.
Retries increment at4cc236; greater than32 at4cc240 takes the staging-return path.
`target-collection-static.asm`:4f5950 scans cells and applies object, owner and
state filters; collection does not require every attacking member to hold19.
The existing native comparison probe supplies/intercepts4f5950, so it does not
certify the live collection predicate. Full native collection/filter equivalence
and member retarget logic remain outside this correction.

## Narrow correction and regression

Keep `computerAttackTargetsRemain` and every existing person/building ownership,
health, containment, flight, state and radius filter unchanged. Split member-order
readiness into `attackOrdersCurrent`, used only by the cached-entity refresh
branch. Missing cached targets now consult collection alone. The cached-entity
branch retains its prior refresh conditions, including mixed-member refresh.
Genuinely empty targets still randomize, exhaust32 retries, and return on33.

`tests/raid-target-exhaustion.test.mjs` enters the live type20 phase15 dispatcher
to create real Warrior19/Preacher17 orders, then visits phase16 with a missing
cached entity and nearby living Shaman. Main fails only this mixed-raid case;
the corrected adapter passes it without consuming RNG or replacing orders.
Warrior-only, true-empty, excluded-target, cached missing-order and moved-target
controls protect the unchanged boundaries. These supplied cases are adapter
regressions, not original-executable or full native composition evidence.

This does not change the separate newborn update, award parity, or resolve the
paused Mission19 health-wrap investigation.

The command-pool exhaustion regression also distinguishes a failed order allocation
from empty target collection: nearby eligible targets keep phase16/retry0 through
supplied visits and ordinary turns. Only explicitly ineligible target inputs permit
32 retries and the33rd staging return; bounded ordinary cleanup and task-slot reuse
remain required. The raid collector's pre-existing radius/flight-filter differences
from the original helper remain separate work and are not certified by this fix.
