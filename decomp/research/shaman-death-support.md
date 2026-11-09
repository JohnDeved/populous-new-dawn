# Shaman death entry and phase2 support audit (#30)

Static-only follow-up on main `56115714ede56ac0837110d870c87cc10a344727`,
tree `60aef91f489515de2d8cb836e648eab369edacea`. No runtime change, ordinary
counterexample, new original execution, or parity credit follows from this note.

## Result

The two support queries have different owners. `00502910` asks the **linked source
person** whether it is drowning. `005029d0` phase2 asks only whether the **corpse's
death-point x/y** has terrain support. The app uses `supportsFollower` at both
sites, but that alone does not prove a reachable Mission1–3 mismatch. The phase2
call is already equivalent at its coordinate-only boundary. Death entry has a
conditional field difference that needs an ordinary witness before changing it.

The complete original drowning predicate is already implemented by
[`personIsDrowning`](../../app/person-update.ts). Do not add a second generic
helper. The retained [person-update probe](../../scripts/check-native-person-update.py)
and [research index](../README.md#person-update-preparation-and-health) document
4,096 native predicate comparisons; this audit did not rerun them. Those comparisons
do not establish the death caller's ordinary state.

## Producer and initializer operands

The registered [`004d5cf0`](../generated/004d5cf0.c) ordinary death producer waits
for source `+0x2d` to reach zero, applies the existing Shaman reincarnation gates,
puts the source person pointer into the linked-allocation record, and calls
`004ed8a0(10,12,source.owner,source+0x3d)`.

[`004ed8a0`](../generated/004ed8a0.c) clears the new record, copies source x/y and
signed height, sets the linked-allocation flag `+0x0c & 0x400`, and initializes
class10/model12 through [`004ed580`](../generated/004ed580.c) and
[`00500a30`](../generated/00500a30.c). Clearing the new record does **not** simplify
the later drowning test, because it is not the queried record.

The pinned [initializer excerpt](shaman-death-support/initializer.asm) establishes:

- `00502912`: ESI is the new corpse. `0050293a`: EDI is the linked source person.
- `0050293c..00502941`: insert the new corpse at its copied position.
- `0050294d..00502974`: copy source model, heading, cargo byte and, for model7,
  owner/classifier. No source position or drowning fields are overwritten here.
- `0050297c..00502987`: push **EDI**, call `004eeff0`, and test AL.
- For Shaman model7, false selects phase0 at `00502989`; true selects phase3 at
  `0050298f`. Source model1 is a separate unconditional phase3 path.
- `00502993..005029ae`: mark phase entry and immediately dispatch the new corpse's
  class10 state12 initializer. This is the already-proved first controller visit.

## Exact source-person conditions

The [pinned predicate](shaman-death-support/drowning-predicate.asm) agrees with
registered [`004eeff0`](../generated/004eeff0.c) and `personIsDrowning`:

| Source field | Effect on the result |
| --- | --- |
| flags2 `+0x0c`, bit2 or bit`0x80000` | Return false before terrain support. |
| physics `+0x30`, descriptor flags bit2 | Return false before terrain support. |
| signed height `+0x41` above current ground at `+0x3d/+0x3f` | Return false. |
| `0044f980(source+0x3d)` nonzero | Clear source flags4 bit`0x1000000`; return false. |
| Unsupported terrain, flags4 `+0x10` bit`0x800000` clear | Return true. |
| Unsupported terrain with that bit set | Return true only when vehicle `+0x9f` is zero and either category flags lack `0x3c` or flags4 lacks `0x1000000`. |

Canonical data at `005a71c4` selects physics18 for Shaman model7;
descriptor flags at `005a7d7c` are1, so the normal Shaman descriptor does not itself
exempt drowning. Both values match `original-rules.json` and are retained in the
[provenance manifest](shaman-death-support/provenance.json).

The ordinary state3 entry routes through [`004d2740`](../generated/004d2740.c)
and [`004d5c70`](../generated/004d5c70.c). Its direct flags2 mask clears bit2 while
retaining bit`0x80000`; the death-specific function adds `0x110000`, zeros speed,
life and target, and does not itself normalize the queried height or transport
fields. This is not a claim that all arbitrary flag combinations reach death:
[`004d43a0`](../generated/004d43a0.c) already defers life-zero state3 transition
while bit`0x80000` is set. The complete class1 scheduler and ordinary reachability
must remain distinct from a supplied predicate record.

## Phase2 is a coordinate-only test

The [phase2 excerpt](shaman-death-support/phase2.asm) is exact about the boundary:
after decrementing its timer, `00502b4c..00502b50` passes ESI+`0x3d` to
`0044f980`. It does this on all three processed phase2 visits, including the final
visit that has just selected phase3 for the next call. No source person, physics,
flags, vehicle or stored corpse height participates in this support query.

When unsupported, `00502b60..00502b94` copies the corpse point into a temporary,
resamples the temporary's height, and requests class7/model65 with corpse owner.
It does not overwrite corpse height. Thus phase1's last body-ground sample and
phase2's newly sampled splash ground can differ legitimately.

Current [`world-turn.ts`](../../app/world-turn.ts) passes the retained plain
`respawnPoints[tribe]` to `supportsFollower` and emits the existing grounded splash
for each phase2 event from [`stepReincarnation`](../../app/reincarnation.ts).
These points have no `inside` field, so the helper's building-occupancy branch
cannot apply. Its [`terrainSupportsPerson`](../../app/person-collision.ts)
coastal mask is the port of [`0044f980`](../generated/0044f980.c). This closes the
proposed phase2 predicate mismatch at that boundary. Global terrain/object
scheduler order and allocation failure behavior are not proved by this mapping.

## App difference and witness prerequisite

At death creation, `world-turn.ts` instead calls `supportsFollower(w,u)` and
resamples ground through `nativePosition(w,u)`. It does not consult the source
person's stored height/physics/flags/vehicle via `personIsDrowning`. The predicates
agree for an outdoor grounded normal Shaman with no drowning exemption. For an
unsupported point, they can differ only if the actual source record meets an
exemption above (or the browser has a separate live-building occupancy owner).
This audit establishes that conditional difference, not a reachable bug.

Current death cleanup excludes active flight and electrocution state44. The
earlier unit loop defers flight, electrocution, Tornado state24, recovery state33
and selected native state owners; `stepLiveImpulse` keeps flight ownership until
landing. Those gates prevent treating an invented airborne/vehicle record as an
ordinary counterexample. Original retained death probes supply `004eeff0` and
`0044f980`; their direct-drowning fixture does not resolve the missing witness.

The finite current-writer check does not establish a universal equivalence
invariant either. `createLivePerson` supplies physics18, no bit2/airborne flag,
and no flags4 coastal exemption for a fresh outdoor Shaman. Combat entry grounds
its person, and the melee/impulse wrappers propagate airborne ownership into
`u.flight`. These concrete baseline paths supply no counterexample. However,
`world-turn.ts` also calls `stepLivePhysics` directly for recovery state33 and
native combat states25/29; `stepLiveMovement` does the same for ordinary movement.
`stepLivePhysics` can set bit`0x80000` through `markPersonAirborne` or
`stepPersonPhysics`, but does not itself assign `u.flight`. The final death filter
does not inspect that bit or stored height. Thus `!u.flight` alone cannot prove
that every admitted source person lacks a drowning exemption.

A second exact boundary is terrain change before a native person's next update.
`syncLivePersonCells` retains the active animation source's stored height when
x/y is unchanged (`unitAnimationSource(u) === p`).
The ordinary unit loop's unsupported-surface HP-zero branch precedes its movement
physics, after the special-state/flight dispatches. If ordinary play makes that
point unsupported while the retained source height is still above new ground,
the app can choose direct-rise entry while `personIsDrowning` on that record is
false. The required terrain transition and admitted death have not been witnessed
here. This may be an earlier person-update/death-timing question, since original
`004d43a0` defers airborne death; replacing only the VFX predicate would not prove
the complete original behavior. Close this audit without selecting a runtime fix
unless that finite source-height/airborne boundary is demonstrated ordinarily.

Use the existing Mission2 H → attack authored warrior13 episode as the dry-ground
control. A candidate discriminating episode must first establish an ordinary
death at unsupported terrain **while a source-person exemption still applies**.
The retained Mission1 Bridge → Warrior33 route in
[the terrain note](shaman-death-vfx.md#controlled-clock-rendered-acceptance-plan)
is a bounded starting point for inspecting existing evidence, but its observed
174→184 ground change does not establish that condition. No ordinary unsupported
counterexample was found or simulated in this audit.

Before implementation, preserve a reachable episode's source owner, x/y/stored h,
ground, flags2/flags4, physics, vehicle, support result and actual death handoff.
If these establish a divergence, reuse `personIsDrowning` at that specific owner
boundary and independently decide whether copying stored source height is part
of the same proved behavior. Do not synthesize missing records or change global
death/clock ownership on the strength of this note.

Acceptance would require the ordinary dry control plus the discriminating public
episode; correct entry phase, anchor/heading, splash count and ground, rise/wait/
respawn, checkpoint continuation, and unchanged outcome/gameplay RNG. Native
caller composition, ordinary rendered acceptance and elapsed-cadence proof remain
separate; all new native, browser and model execution was paused for this audit.

## Reproduction and evidence level

GNU objdump2.44 read already-recovered canonical PE bytes with SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The manifest records exact end-exclusive ranges, PE-byte hashes, normalized text
hashes, commands and successful exit statuses. The executable input pathname and trailing line whitespace
were normalized in the excerpts. No Ghidra or original CPU instructions ran; no
archive/profile/binary, dependency, imported asset, runtime or parity file changed.
This is static source/byte evidence, together with explicitly cited prior bounded
native evidence. It is neither a fresh dynamic comparison nor an implementation.
