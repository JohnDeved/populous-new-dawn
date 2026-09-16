# Mission 6 autonomous construction

## Native contract

The hash-verified release executable schedules ordinary computer production before
task dispatch. Matak produces on turn 60 and Chumara on turn 61. From the imported
Mission 6 state, `004e5580` allocates the first free task with type 0, model 4,
exact-location flag 0, phase 0, and the tribe Shaman cell as its initial origin.
Allocation does not consume RNG.

With that tower task still active, the next ordinary producer visits are Matak turn
124 and Chumara turn 125. The active task-0 count remains below each tribe's limit,
and `004f6480` counts the zero-progress tower plan. Native therefore requests a
Matak model-1 Hut and a Chumara model-7 Warrior Training Hut in the next free slots.
The accepted tower plan establishes the construction base used as both requests'
origin; Matak's coordinate latch applies only to model 4. Allocation again consumes
no RNG, while each task's phase 0 consumes the same rotation and orientation draws
and selects exactly two Braves.

On its first dispatch, `004c6da0` uses AI flag `0x20` to decide whether to replace
that origin with the coordinate latch. Matak's turn-zero `1069(208,128)` sets the
flag and latch, so its spiral center becomes `0x80d0`. Chumara's marker latch uses
flag `0x40`, so its center remains the Shaman cell `0xd094`. Attribute 30 is one for
both tribes: phase 0 consumes two RNG values before searching, first for spiral
rotation and then for tower orientation. The task searches up to 2,000 cells in
groups of 40, inserts a valid plan, selects exactly two eligible Braves, and emits
shared person command 6.

Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-mission6-economy.py /path/to/d3dpoptb.exe
```

The probe executes the native producer and allocation helpers. It controls building
availability/counts and the previously established available-person and housing-order
counts; site search, person eligibility, terrain acceptance, plan insertion, worker
movement, timber, and completion are browser evidence.

Native `004e59a0` considers Temple/Preacher, Spy Hut/Spy, Warrior Hut/Warrior, and
Firewarrior Hut/Firewarrior in that order. Each candidate needs its building enabled
and completed, and its trained population below its attribute percentage. It chooses
uniformly among eligible candidates with one producer RNG draw, then requires the
chosen building's capacity to be no greater than available Braves plus housing-order
Braves. A Chumara probe with population eight, no Preachers, attribute 6 at 15, a
completed Temple, and five available Braves allocates type 6 at that Temple with
count zero and advances RNG from `0x12345678` to `0x32be789b`.

Matak's original cpscr015 words 352–500 run first at turn 121 under `EVERY 255
OFFSET 132`. Direct execution of opcode `1173` established that this is a
spell-interval profile: it writes tribe-local bytes at `tribe+0x53f+4*index` and
does not change the producer attributes at `0x9607ea+48*tribe`. The earlier claim
that this block made the producer request a model-7 building was incorrect. The
focused producer probe's model-7 scenario remains a synthetic consumer test, not
evidence that this script block supplies those attributes.

Construction remains the higher-priority producer. Matak's initial attributes make
the tower followed by a model-1 Hut reachable; the interval profile does not add a
later model-7 request. Chumara keeps its initial housing target of nine before
training.

Chumara's `EVERY 511 OFFSET 39` profile enables one model-5 Temple after its
population exceeds nine and it has more than two completed model-1 Huts. Its
`EVERY 63 OFFSET 22` fallback also enables the Temple after Blue completes one.
Native `004e5580` checks schools in model order `[7,6,5,8]` against target attributes
`[3,1,2,4]`. With the earlier targets zero and attribute 2 at one, the native probe
allocates model 5 at Chumara's `0xd094` origin without consuming RNG.

Native `004c6da0` phase 8 also recovers incomplete construction after assigned
builders are lost. It compares the plan's assigned-builder count with the native
required count of two. Sixteen deficient dispatches increment task byte `+0x0d`;
the seventeenth returns to phase 4, retains the observed count in byte `+0x0c`, and
leaves the retry byte at 16. Phase 7 resets the retry byte before entering phase 8.
The focused probe executes object/plan resolution, `004f5d20`, the comparison, and
the task writes natively; only the unrelated `004f6320` progress helper is neutralized.

## Live integration and boundary

`stepComputerTasks` now preserves those schedules, per-tribe queues, center choice,
RNG order, bounded spiral search, model-4 validity, two-Brave selection, command 6,
and the existing timber/construction lifecycle. The Mission 6 portable regression
proves both tribes independently assign workers, survive checkpoint restoration,
complete their first Guard Tower, and allocate Chumara's initial model-7 expansion
and Matak's initial Hut. It also covers construction recovery and the shared type-6
training consumer with an explicitly prepared building. The former claim that the
interval profile naturally produced Matak's Warrior Hut, population growth, and
first raid has been retired. Those later behaviors require their actual producer
attribute owner before they can be reclaimed as live integration.

Native site validation does not reject living people, and its builder tasks 5 and 6
immediately return to ordinary work. The browser therefore skips only grounded
Wildman-occupied candidates until native wild wandering is live; the regression
covers the first Chumara candidate and subsequent valid site.

Explicit `BUILD_AT`/1082 occurs later (Chumara turn 501 and gated Matak turn 55).
Ordinary 1059 attacks and command 1093 remain outside this slice. No parity ledger
status was changed.
