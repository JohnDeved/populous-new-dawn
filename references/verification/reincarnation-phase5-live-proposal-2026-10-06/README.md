# Returning-Shaman phase5: bounded live integration proposal

**Source proposal only; no app edit or new execution.** Fresh fetch and local
main both resolve to `1c7e6b05687aca14d9350e17c7ae14dc6c68bb97`.
`source-evidence.json` hashes every inspected app/probe file, retains the actual
person-initializer call trace and compares retained native birth records. App
and probe files equal that main exactly. The research branch's project-map adds
research links; both its hash and main's hash are recorded separately.

The smallest useful target is the existing eligible phase5 caller in
`world-turn.ts`, with a dedicated returning-person initializer adapter and final
burst producer. Today even the common-success caller differs: it returns a
`native:null` person, consumes no person-creation RNG and creates no final burst.
A blanket `addUnit` change, dummy RNG advances or task-private pool would not
resolve those owners.

## What is accepted, and the proposed acceptance limit

The accepted native packet establishes the complete11-call successful component
with actual person/root/child initialization, first visits, retirement, free-list
return and handle reuse. The accepted three controls establish person failure
with low-pool burst, person success with burst failure, and both exhausted.
All196 RNG writes in the successful timeline equal the previously accepted
standalone creation writes:98 gameplay advances and32 cosmetic advances.
The older failed attempt and accepted calls1–9 remain preserved.

The proposed first live acceptance is narrower: **ordinary owner0 returning
Shaman in Missions1–3, common successful browser allocation, exact declared
person birth values/RNG, final burst fields and relative effect visits**. That
is a feasible comparison target, not a result already obtained. It must exercise
the actual returning caller and actual `addUnit`/`effect` adapters.

Full native allocation/initializer equality cannot currently be accepted:
`World` lacks the shared class1/class7 primary pool, class1 allocation seed,
retirement queue and reusable native handles. `addUnit` and `effect` always
append. Class7's `effectCounter` is a partial browser allocation adapter.
No task-private capacity or returning-person counter may stand in for those
shared owners. Complete native failure admission, allocation-counter identity
and resource reuse require that separately reviewed shared prerequisite.
The first live adapter must name these unequal fields in its comparison rather
than silently supplying a native person or declaring full initializer parity.

## Actual original and current caller

Original selected chain:

`004ec6f0 → 004ed700 → 00500ec0 → 005029d0 phase5 → 004da0f0`

The wrapper stages20 argument bytes, attempts class1/model7, then attempts
class7/model9 regardless of the person result, and returns the person pointer.
Only successful person return lets the controller play local cue107 and retire
the body. Person failure retains phase5 for a later scheduled attempt; it does
not inherit the earlier mode2 wave's one-shot/no-retry rule.

Current chain:

`world-turn` respawn loop → `stepReincarnation` → `addUnit(w,team,'shaman',site)`

`stepReincarnation` commits remaining0 from eligibility before any actual
allocation result. The live caller then plays cue107, selects the new blue unit
when appropriate and expires the body. `addUnit` supplies full browser HP,
heading`Math.PI` and `native:null`; it has no capacity check or native initializer.
`campaignPosition` is the authored mission position, while original phase5 uses
the retained tribe site. Use the retained native site when available, with the
same explicitly documented legacy-save fallback as the existing wave path.

## Returning-person initializer: exact reuse assessment

The retained actual person attempt has17 direct-call edges before the root
attempt. It includes real`004ed8a0 → 004ed580 → 004d23d0 → 004d5920`, cell
registration`004ee470`, movement clearing`004ea460/004e9b40`, state initialization
`004ed640 → 004d2740`, ordinary-order initialization`00432260`, animation setters
and final terrain sampling`0044e940`. Model7 initialization writes the tribe's
Shaman handle and updates population/model totals before the wrapper returns.

Two gameplay draws have semantic owners. The first fills person`+57`, called
`turnAngle` in the current person-state bridge. The second initializes life and
maximum life using the model's randomized life range. Under accepted seed
`12345678`, LIFE_SHAMEN2000 and ordinary Mission2 flags, these are155 and1778.
They are not discardable draws to align the later burst.

| Field at accepted call6 birth | Original | Actual current live birth / lazy handoff |
| --- | --- | --- |
| Person record | allocated class1/model7, state10 | `native:null`; lazy bridge is not allocation |
| HP / native life | 1778/20 =88.9; life`+6e` and maxLife`+6c`1778 | HP100; lazy life2000; max-life storage has a separate live health adapter |
| Angle / heading / turnAngle | `+26=0`, `+5d=0`, `+57=155` | browser headingπ; lazy angle/heading/turnAngle all0 |
| Position / height | saved-site4096/4096; actual ground256 | authored campaign position; browser ground adapter |
| Anchors and goal |4352/4352 after cell centering | lazy anchors at position, goals0 |
| Physics / speed |18 /0 | lazy18 /0 |
| Animation |object424, renderFlags384 | absent; lazy object0/renderFlags0 absent other modifiers |
| Flags2 / flags3 / flags4 |`40021080 / 00040104 / 20800100` | absent; ordinary lazy defaults differ |
| Allocation counter |class1 seed250, independent of turn | no class1 seed owner; lazy `(world.turn-1)&255` |
| Tribe handle / roster |native handle and model/population counters | unit-list membership; no same native handle field |

Offsets and raw formats in the JSON take precedence over ambiguous field names.
The current `createLivePerson` explicitly bootstraps an existing browser follower
and consumes no RNG. `initializeLivePerson` is a state-entry adapter, not a
replacement for creation. Reuse original rules, native RNG/math, supported state/
animation helpers and `registerLivePerson` only after comparing the resulting
fields. Do not call a state-entry helper that adds a new speed draw or silently
uses existing orders. Port a dedicated ordinary model7 creation prefix for this
caller, retain the real new unit, and synchronize HP/position/animation from its
actual resulting fields. Unsupported flags/building-support/Armageddon cases
stop this acceptance scope; do not broaden into general person initialization.

## Burst producer and resolved angle mismatch

The existing `level-start-runtime.ts:stoneBurst` is not a drop-in allocation
owner: it manually increments the root counter but creates no model9 record,
then calls the unbounded effect adapter32 times. Its scalar helper also has a
composition mismatch hidden by the older native probe's labels.

Native`0050ccd0` writes the second gameplay draw to`+59` and the third to`+57`.
Real directed consumer`004e7a80` uses`+59` as pitch/vertical inclination and`+57`
as yaw/planar direction. `SpellTrail` and its native physics probe use those
same meanings. `levelStartBurstParticle`, however, returns second draw as yaw
and third as pitch; the older level-start probe reads the opposite offset names.
All32 retained birth records expose that swap. First child836 is yaw815/pitch326;
direct helper reuse would give yaw326/pitch815. The JSON retains every comparison
and its first real scheduled position/velocity. This is source/raw-data evidence;
no new physics or native call was executed.

For this returning burst, generate lifetime first, **pitch second, yaw third**,
and assign the actual SpellTrail fields. Reuse `createSpellTrail` for the real
model3 cosmetic draw and existing `stepSpellTrail` for physics/fade. Keep startup
runtime and its older proof unchanged in this task; document their reuse limit
rather than quietly relabelling them.

## Minimum proposed code seam, after review

1. Add a small returning-phase5 helper called only when current eligibility and
   remaining1 request a spawn. Its person/effect allocation callbacks return an
   object or failure. Attempt the person once, run the model9 attempt regardless
   of that result, then commit remaining0/body expiry/cue/selection only on
   person success. On person failure keep remaining1 and the same body/site.
   Earlier remaining6 mode2 creation stays one-shot even on failure/busy state.
2. Add the dedicated returning-person semantic initializer described above.
   The real live adapter calls existing`addUnit` after eligibility, then this
   initializer; it does not globally change generic`addUnit`. Preserve and report
   the existing browser allocation/counter boundary. No invented successful
   return, private pool, private class1 seed or dummy draw is permitted.
3. Allocate one actual root through the existing effect owner before children.
   Keep it hidden with its native object0/draw0/hidden flag, state8-equivalent
   timer2, and a small identifying tag for observations/checkpoints. Root height
   is `short(max(savedSiteHeight,currentTerrain)+90)`; each actual child keeps
   its own preinitializer ground clamp. Attempt exactly32 model3 children in
   allocation order. Cosmetic initialization precedes each successful child's
   three gameplay draws. Failed children consume neither of those draw owners.
   Do not manually increment a synthetic root counter in addition to`effect`.
4. Retain the current effect-loop captured length and reverse order. Births made
   in the late phase5 caller first visit next turn; among burst effects, newest
   child first and root last. Root expires after2 visits; child timer1/2 plus
   fade3 retires after4/5 visits. Existing `turnsRemaining` can own the hidden
   root, while `SpellTrail.remaining` owns particles; avoid stepping the root
   through the spark fade path. Public Save/Load must retain these actual fields.

The proposed app surface is one new phase5 runtime module, a small pure burst/
returning-person helper if needed, the existing respawn branch and one optional
root marker in `Effect`. Reuse the existing hidden-animation renderer path.
No startup rewrite, global pool/counter change, mixed world scheduler rewrite,
additional owner matrix or general lifecycle migration belongs in this change.

Current effects and people are separate passes: the older wave is processed
before the new person's later ordinary unit pass, whereas native interleaves
new person before older wave. The accepted native test deliberately supplied
that later ordinary-person consumer. This remains a named global scheduling
boundary; acceptance covers the burst-effect subsequence, not full caller RNG
with actual later person/world processing.

## Focused acceptance and stop

Before app edits, review this scope and especially the class1 seed/allocator
prerequisite. Then prepare the actual portable comparison against the accepted
raw creation and11-call records. Start with current `addUnit/native:null` so the
missing initializer/particles and angle swap fail visibly. Do not insert a native
person into the fixture to make pixels or RNG line up.

Compare the implemented caller's person semantic fields and both RNG streams,
saved/current/root/child heights, root/child allocation order, fields at birth,
first visit positions/velocities,2/4/5-visit lifetimes, local cue and successful
body completion. The comparison must list excluded native allocation counter,
handle identity, pool-return and mixed person/wave ordering explicitly. If those
fields are required to claim full equality, the shared primary owner is a hard
prerequisite; do not approximate it inside this caller.

Reuse the three accepted control outcomes for the nullable caller contract:
person failure still attempts burst and retains the body; burst failure does
not cancel successful person return; both failures retain phase5 with clean
arguments and no RNG. A callback-controlled portable test proves that contract,
not native resource exhaustion in the live app. Because today's live adapters
always append, runtime capacity parity remains unimplemented. Do not rerun the
16-case matrix or claim these supplied outcomes as a new shared allocator.

After focused source/portable acceptance, request one separately bounded ordinary
Mission2 route: visible mission/Skip controls, public H selection and pointer
attack on an authored enemy, ordinary elapsed simulation to death and return,
then public Save/Load and resumed controls. Read-only observations may identify
births/cues/frames. No command/tick calls, speed writes, supplied animation times,
HP/state changes, injected enemies or Swamp fixture belong in that ordinary
route. The old browser script remains only a labelled fixed-step render diagnostic.

Stop on an initializer field/seed owner that cannot be derived from actual live
state, an unexpected extra RNG draw, wrong angle or scheduled visit, or a need
to redesign shared allocation/scheduling. Return that concrete prerequisite for
review instead of silently expanding this bounded returning-Shaman task.
