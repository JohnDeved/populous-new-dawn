# Model149 Stone Head: current implementation boundaries

Source reconciliation on 8 November 2026, pinned to main
`15d9607afb5f6b4d9925816210c4bb34123ed586`. This corrects misleading instructions in
the preserved [initial proposal](stone-head-149.md) and
[static delivery record](stone-head-149-static.md). It does not implement animation
or certify any new native, application, rendered or performance result. Issue #21
remains open.

## Preserve the existing static family

The static base149 import and derived scene selection already exist. Reuse
[`stoneHead149Model`](https://github.com/JohnDeved/populous-new-dawn/blob/15d9607afb5f6b4d9925816210c4bb34123ed586/app/stone-head-149.ts)
and the static import's documented base faces, UVs, modes, normals, biases and
atlas coverage. Do not append base149 again or add shared key150/151 model slots
merely to animate positions. The historical import and browser results are not
rerun by this reconciliation.

Keep model45, mode3/base8, Angel157, Vault and unsupported families separate.
The current classifier requires an unambiguous authored mode0 trigger, complete
reward links and linked scenery. A runtime model45 fallback or null animation
state alone does not establish model149 identity.

Do not put an unqualified model149 record into `shrine.stoneHead`. The current
static classifier rejects any truthy value in that field. The
[`model45 runtime`](https://github.com/JohnDeved/populous-new-dawn/blob/15d9607afb5f6b4d9925816210c4bb34123ed586/app/stone-head-animation.ts)
returns existing state from `initializeStoneHead`, dispatches it from
`animateStoneHeads`, and uses hard-coded object45/morph1 reselection in its refill
path. A renderer-only change would miss those callers. These are future
integration hazards, not observed failures of the current static-only family.

## Preserve sampled presence and event order

The [reviewed state diagnosis](https://github.com/JohnDeved/populous-new-dawn/issues/21#issuecomment-6507980405)
records a native signed four-tribe sample: presence is
`max(0, signed16(count[0..3])) > 0`. In contrast, the
[`current world-turn caller`](https://github.com/JohnDeved/populous-new-dawn/blob/15d9607afb5f6b4d9925816210c4bb34123ed586/app/world-turn.ts#L951-L974)
assigns non-mana/non-`rewardMana` heads' `followers` from the player tribe. For
supplied counts `[0, 2, 0, 0]` and player0, those meanings differ. Consume the
existing complete sample separately for presentation; do not change gameplay
recipient ownership or add a per-render proximity scan.

The same retained diagnosis corrects the old stateless hold table. After any
optional object reselection, let E be trigger bit1, P bit8, H render flag `0x400`
and T `0x1000`:

| Condition | Retained selector effect |
| --- | --- |
| E and P | Clear H only when T is clear; retain counter and holdFrame. |
| E and not P and not H | Select hold7, set H and clear `0x800`; retain counter. |
| not E and not H | Select hold1, set H and clear `0x800`; retain counter. |
| Idle or disabled, already H | Retain the held frame and counter. |

Presence edges and ordinary disable notifications do not reselect the object;
refill does. The [reviewed ordering continuation](https://github.com/JohnDeved/populous-new-dawn/issues/21#issuecomment-6508252882)
also records that reset notifies before clearing counts and does not clear P.
Therefore reset-time `followers = 0` is not evidence of an absence edge.

Retain the distinction between a positive sample and a later disable in the same
turn. The reviewed supplied-state case releases held7 on the sample and then
selects held1 on disable; one call using only final disabled/present values would
retain held7. That counterexample requires an accepted reward chance, zero delay,
remaining refill use and no intervening reward-link reselection. It is not an
ordinary-play witness. Current `syncStoneHeadPresentation` runs after the reward
handling; do not assume that final-state notification supplies model149's missing
event ordering.

## Reuse the resource findings without inventing cadence

The [reviewed bank2 findings](https://github.com/JohnDeved/populous-new-dawn/issues/21#issuecomment-6517169581)
record base binding7, 258 expanded corners covering 51 raw points, and the full
149/150/151 point correspondence. MORPH7's stored segment pairs are stale
188→189/189→188; normalization from header `(149, 2, 150, 151)` yields
150→151 for phases0–8 and 151→150 for phases9–17, both divisor9.
Base149 and key151 positions agree but two used UV corners differ. Interpolate
corresponding positions while retaining base149 attributes, rather than swapping
the independently decoded key meshes.

These are retained asset/source findings, not 18 newly observed rendered frames.
The original raw packet and original bytes were not revalidated for this note.
Follow the linked evidence and recover/verify needed inputs before executing a
new comparison; no restoration or native execution is claimed here.

The old suggestion to attach model149 to a generic 24 Hz callback is insufficient.
The current [`advanceGame`](https://github.com/JohnDeved/populous-new-dawn/blob/15d9607afb5f6b4d9925816210c4bb34123ed586/app/game-clock.ts)
calls Stone Head animation on both logical-turn and presentation boundaries.
Model45's `animationUsesLogicalVisits` gate chooses between them. That existing
family's behavior does not prove model149's initialization, dispatcher eligibility,
history-sensitive holds or absolute cadence. Establish model149's composed
constructor/linker, selector/setters, dispatcher and updater behavior before
selecting the clock integration. Do not infer timing from the spell name, model45
or direct `tick` acceleration.

## Current-format continuation and ordinary acceptance

The [development save contract](../../README.md#development-save-contract) supports
only the current development format. The historical old-save hydration/migration
proposal is not a requirement to restore obsolete compatibility. Preserve current
new-game, restart, pause and Save/Load continuation, reject incompatible data
clearly without altering stored saves, and choose any future format change
explicitly. Do not infer a format change from this documentation update.

The [current browser checker](https://github.com/JohnDeved/populous-new-dawn/blob/15d9607afb5f6b4d9925816210c4bb34123ed586/scripts/check-browser-stone-head-149.mjs)
requires the canonical Mission10 Boat → root71 worship → linked72 → checkpoint
route and stops at the first fault. It rejects extra arguments, including
`--static-only`. Its supplied direct-tick acceleration remains simulation/static
evidence, not animation cadence. A future animation witness must exercise the
actual chronological game-clock caller while retaining ordinary worship, reward,
pause and current-format Save/Load acceptance.

The [reviewed test design](https://github.com/JohnDeved/populous-new-dawn/issues/21#issuecomment-6519289087)
is a starting point, not executed acceptance. Reuse the existing classifier/static
tests and authored browser route. Cover family separation, independent buffers,
all 18 original-derived phases, sampled edges, reset, disable/refill and separate
controller/body lifetimes without weakening the existing gates. Exact audio
timing and broader native/rendered fidelity remain separate unresolved work.

No runtime, generated asset, checkpoint schema, checker, test expectation or parity
entry changes with this note. Source inspection establishes the current caller
relationships above; historical issue reports retain their original evidence
limits. No application tests, native instructions, extraction, build or browser
were run for this documentation-only correction.
