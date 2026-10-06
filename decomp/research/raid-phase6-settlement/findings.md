# Type-20 phase-6 settlement and timeout

Refs #248 and #247. The canonical executable SHA256 is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The original [plan](plan.md), [executable preflight](preflight.md), fixtures and
launch manifest preserve their historical source-only wording and exact bytes.
This note records the subsequently executed result and production correction.

At source `bc5debd5c0271efc9cd892111563cc740eeebc91`, one bounded CPU4 batch
executed two real `004cb400` phase-6 calls with all helper leaves intact. It
compared two production `withCampaignTribe → stepComputerTasks → stepAttackTask`
visits. Independent review accepted every one of the 301 native reads, 148 writes, 34 call/return
pairs, complete raw supplied outputs and 30 production coverage assertions.

| Supplied captured visit | Original elapsed / phase | Previous production |
| --- | --- | --- |
| Combat at 8370 | 1801 / 23 | 2 / 6 |
| Moving at 8417 | 47 / 6 | 47 / 23 |

[Immutable evidence and independent review](https://github.com/JohnDeved/populous-new-dawn/blob/97684052bb7bf67e67d4ca044baba00ce838ed04/references/verification/raid-phase6-settlement-2026-10-06/README.md)
retain raw records, full pool, pointer table, stack, RNG, typed/raw returns and
owned-process cleanup. Native membership is explicitly projected from task.members
to assignment 1; actual port assignment 0 and selected registered fight/native
owners remain unchanged. The tribe chain, inactive entity 290 tombstone and opaque
second active-task count carrier are declared supplies. The no-cast sentinel and
ground mode are statically bound through the original script caller and allocator.
These are independent helper visits, not a complete original raid lifetime.

The production adapter now traverses every existing registered member. A combat
state 25/29 or flags2 bit 0x80000 sets elapsed 1801, including when an earlier member
is unsettled. Settlement requires speed 0 and state flag 8, combat 25/29, or an
uncancelled current 17/31/32 in state 10/33. Immediate commands retain priority;
only consumed queue/order fields are validated. Missing owners or unknown fields
stay unsettled without creating a person. The state 33 release/relocation branch
remains uncomposed and cannot be admitted as settled by this adapter. Task-member
ownership migration, no-member cleanup and the existing spell boundary are not
expanded. The separate mixed 19/17 target-persistence adapter is unchanged.

Nine focused actual-caller tests cover the captured results and source-backed
ownership, speed, cancellation, immediate priority and unknown-field boundaries.
Both failure-first generations are retained. The unchanged maintained Mission6
scenario still failed its old fixed-time active 1 assertion after the correction:
registered combat Preacher 398 caused elapsed 1801/phase 23 while the other members
were moving, followed by a separate retirement visit. The independently reviewed
replacement keeps the same setup, supplied conversion and 513 continuation ticks,
and positively requires that causal abort, intact member/order ownership, later
retirement, no duplicates/reactivation and surviving original members. Its one
reviewed replay passed at `47186efd776b6dcc278a967ac009da0be5166af8`.

Standard integrated gates and ordinary UI/candidate lifecycle acceptance remain
separate requirements. No earlier Mission3 loss is attributed to these findings.
