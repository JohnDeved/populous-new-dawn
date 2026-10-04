# Early-mission pre-table response lifecycle

## Scope and executable evidence

This continues [issue165](https://github.com/JohnDeved/populous-new-dawn/issues/165)
from reviewed `7dcd89f9858600d9bd889d00a758fb78baa13f73`. It binds the complete
reachable type9 branch for authored Missions1/2 only. Mission3/type8 defense and
other unbound producers remain open; this does not close issue165 or claim full
original AI allocation timing.

Original EXE SHA256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Reuse [producer scheduling](early-mission-producer-schedule.md), `004e5b60`,
`004c5cf0`, `004f8e10`, `00461f90`, `004f6840`, `00462770`, and their indexed exports.
Three scoped additional exports (`004f35b0`, `004f3f20`, `004f6800`) were produced
with Ghidra12.1.3 / Temurin21.0.12.1 from the existing original-byte fresh-analysis
project. The wrapper verified all file-backed original section hashes, requested
outputs and successful project save. The old metadata fields in `exports.json`
are not provenance for this fresh-project batch.

Reproduce with:

```
python scripts/check-native-ai-response-task.py /path/to/d3dpoptb.exe --compare
node --test tests/ai-response-task.test.mjs
```

No Windows process starts. All native scanner/controller cases execute original
instructions without intercepted leaves. World lists, terrain flags, attributes,
selected ownership and candidate invalidation are controlled inputs. They do not
prove original whole-world composition or native unit-list creation order.

## Native observations

- `004f8e10` processes one non-allied tribe's complete list per visit, skipping
  self/allied tribes in that same visit. It scans people first, then buildings.
  Return15 continues; return13/12 identifies a person/building; return2 ends both
  passes. Territory is the scanning tribe's upper bit in the current cell's region
  byte, not an origin/radius distance approximation.
- `004f6800` treats self and tribe255 as allied and otherwise reads the scanning
  tribe's directed alliance mask. `004f3f20` rejects candidates within native
  wrapped squared-cell distance **less than26** of active type8 response centers.
  Distance25 rejects; distance26 accepts. This is squared distance, not radius26.
- A Spy disguised as the scanning tribe consumes exactly one RNG draw. Native
  attribute40 chance or attribute24 versus person+0x87 can trigger `004f35b0`.
  That leaf visits a3x3 area and reveals eligible disguised enemies through
  `004de7f0`; flags3 bit0x1000 protects them. Other apparent tribes and unfinished
  disguises follow the ordinary target path. These general cases remain evidence,
  not a claim that the early live slice implements later Spy detection.
- `004c5cf0` initializes and scans in one phase0 visit. A hit changes phase to3;
  the next visit sets flag8 and, when attribute15 is nonzero, flag4. State8 may
  allocate genuine defense; its maximum also comes from attribute15. No hit clears
  flag4 when flag8 is clear. With attribute31 zero, phase3 proceeds to5. Phase5
  calls normal selection cleanup and deactivates the task, even when another task
  holds selection. The cancellation bit does not bypass these phases.
- `00461f90` clears a lost candidate ID before response processing. It does not
  cancel the whole type9 task or clear the remembered candidate cell.

Fifteen scanner cases cover list priority, people/buildings, territory/alliance
filters, disguise/protection and distance/wrapping. Eleven complete controller
cases cover no-hit, person/building hit, list/category priority, allied/nonterritory
entities, flag4, cancellation, candidate death and another selection owner. Each
runs with three origin/radius payloads, proving identical observable phases,
candidates, flags, cleanup and RNG across the full reachable lifecycle. A separate
state8-enabled case executes the real allocation/area summary and leaves type8
phase0 undispatched, documenting the remaining consumer boundary.

## Why Missions1/2 are a complete bounded branch

Both full authored programs contain exactly one state8 command, disable1023; they
contain no attribute31 field at all, so no assignment/arithmetic or branch can
change its zero initialization. Neither program uses type9 marker overrides1066/1067.
Their imported script bytes are checked against the supplied original files.

Both authored levels contain no model5 people, existing Spy Hut, Spy Hut permission,
or Spy Hut acquisition reward. Their ordinary person conversions/training therefore
do not enter the scanner's disguised-Spy branch. Mission3 explicitly enables state8
and has attribute15=1; it cannot safely reuse the Mission1/2 controller branch.
Complete-program and acquisition invariants are executable regressions, not an
assumption that startup settings last forever.

## Live integration and limits

Normal campaign turns call `stepComputerTasks`. Missions1/2 now bind the original
pre-table opportunity to `requestEarlyResponseTask`, ahead of the existing producer
table; duplicate/state/full-pool gates remain real. A last-slot allocation suppresses
the table pass. Normal task dispatch scans current living world people/building
arrays and existing territory bits, applies directed alliance filtering, invalidates
lost candidates, sets the native flag effects, and invokes the existing selection/
person cleanup. It is a real finite scanner, not an inert queue reservation.

The dedicated checkpointed response record retains only observable category,
tribe cursor and candidate ID/cell. The original allocator's origin/radius only
become scratch fields never read by the reachable scanner/controller/cleanup path;
33 complete native runs prove this independence. No guessed construction radius
or unrelated defenceRadius is introduced. This is behavioral lifecycle equivalence,
not byte-for-byte task-record equivalence.

The initial normal-world test failed on the unchanged base because the first
producer opportunity never allocated type9. After the repair both missions complete
and repeat real scans. Normal Mission2 Shaman movement into enemy territory reaches
a real phase3 candidate, followed by native flags and cleanup, and checkpointed
continuation preserves the whole AI and RNG. No successful entity, task, territory,
or outcome is injected into these natural tests. The normal world supplies list
order; exact original whole-world list ownership remains a broader adapter boundary.

Do not bind this helper to Mission3 or custom missions by removing its scope guard:
first implement type8 response and applicable type11/15/Spy consumers. This work
changes no parity percentages, smoke/pool/clock/motion behavior, or deployment.

## Composition regression attribution

The first full check on the type9 checkpoint found four failures; the exact
unchanged base passed all four. Three were controlled-fixture assumptions: a
construction predicate expected the entire queue to remain untouched, a training
reservation expected dispatch on the very next tick, and an artificial Mission1
Spy test pinned a detector in native state14 while normal type9 cleanup could now
restore it. The fixtures now isolate the unrelated scanner or wait for the actual
bounded queue visit; their original assertions remain.

The natural Mission2 Swarm route required separate gameplay diagnosis. Both heads
reach the preceding Tornado milestone at turn2482 with RNG1470132895. Type9 shifts
construction/training visits, person IDs and formation positions. On the old deep
base waypoint83,127 the candidate loses one of its six Warriors to a Matak melee
opponent at turn2805, and no longer meets the authored spell group threshold.
A normal nearer staging waypoint109,125 allows the real cast while all six remain
alive (candidate turn2769, target107,123). Paired exact-base/candidate runs preserve
all original cast, impact, panic, mana, ownership and count assertions and limits;
only that ordinary player waypoint changes. No runtime timing, RNG, combat or spell
threshold was altered to recover acceptance.
