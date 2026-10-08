# Blast person targeting

Issue [#74](https://github.com/JohnDeved/populous-new-dawn/issues/74). The normal
bit-clear, plain left-release Blast path carries the actual picked person's
identity through cast creation, windup, shot flight and the later parent impact.
Ground aiming remains point-based. The same pointer brackets show person hover
and the existing acknowledgment after a successful direct cast.

## Original evidence

The [accepted static report](https://github.com/JohnDeved/populous-new-dawn/blob/0d32cac626b8d95d0fe527f861dc22473b83f8dc/decomp/research/blast-targeting-normal-input.md)
and [indexed byte/hash evidence](https://github.com/JohnDeved/populous-new-dawn/blob/0d32cac626b8d95d0fe527f861dc22473b83f8dc/decomp/research/blast-targeting-normal-input.json)
retain the exact original executable mapping, producer/consumer chain and early
Missions 1–3 header setup. Canonical executable SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No original instructions were executed for this proof.

The normal `0x6a` release packs the selected person ID; the packet consumer and
class-11 initializer pass it to the spell. Blast's descriptor enables the
separate spell and shot destination refreshes. The parent continues refreshing
its destination through the impact visit, independently of the shot's arrival.
Invalid/deleted/class-zero targets clear identity while retaining the last point;
there is no replacement search. HP alone is not invalidation: allocated dead
airborne/state 44 owners can remain valid. Initial person selection has no enemy
restriction. Pointer acknowledgment uses the existing target-ID bracket path.

This corrects the [earlier special-path classification](https://github.com/JohnDeved/populous-new-dawn/blob/1c309ffca6ad043f8397395568b115ab5e38d5b2/decomp/research/blast-targeting.md).
The separate bit-set `0xc4/0x84` identity bridge remains unresolved. This proof
does not authorize broader spell seeking or imply an original boot/gameplay run.

## Maintained implementation

`scene-input-runtime.ts` selects an actual person only for normal Blast and
uses its current position for range validation and HUD feedback. `live-command.ts`
and `spell-casting.ts` pass that optional identity into the existing paid cast.
`blast-targeting.ts` resolves the retained person's valid movement/animation owner;
`unit-animation-source.ts` is the shared unchanged source selector extracted from
selection code. `spell-effects-runtime.ts` refreshes parent and shot independently
and preserves the last destination after identity loss. The optional projectile
field in `world-types.ts` remains compatible with old point-only checkpoints.

Range/payment/RNG, other spells and bit-set behavior are unchanged.
[Focused product contracts](../../tests/blast-targeting.test.mjs) cover motion,
parent/shot independence, lifetime loss, dead retained owners, no reacquisition,
ground/other-spell isolation and checkpoint identity/default behavior.

## Ordinary evidence and limits

The [accepted ordinary report and exact images](https://github.com/JohnDeved/populous-new-dawn/blob/2a33f94cd0661947bb1348b1e1efd48400c8ae91/qa/blast-ordinary/evidence/stage1/README.md)
compare historical baseline `b1ee7aba` with candidate `c4002693`. Both use the real
Mission 2 entry and public controls. The candidate shows original Shaman 54 casting
on naturally present Blue Brave 278, its subsequent public move during windup,
actual windup and flight motion, retained order identity, natural hover/ack and
projectile/impact evidence, and the parent impact at the later target position.
The QA bytes and turn histories differ and are explicitly scoped in that report.
The full [historical QA and failed attempts](https://github.com/JohnDeved/populous-new-dawn/tree/c40026937f39dadf86143ef13f73dba22d2e4a9c/qa/blast-ordinary)
remain on the evidence branch instead of entering the maintained runtime tree.

This ordinary witness is friendly-person tracking and feedback, not enemy-damage
parity. Ctrl `0x6b` mode retention, arbitrary objects, the bit-set input branch and
full original composition are outside the implemented plain `0x6a` scope. Native
execution remains held. Additional ground/rejection/interruption/checkpoint
acceptance and final combined-tree gates are tracked in the linked PRs; historical
helper or standard results are not silently extended across new inputs.
