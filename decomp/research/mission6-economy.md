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

Matak's original profile block is cpscr015 words 352–500. `EVERY 255 OFFSET 132`
runs first at turn 121 and, below population 80, sets the model-7 target attribute 3
to 64 and Warrior percentage attribute 7 to 70. At Matak's next producer turn 124,
native `004e5580` therefore requests model 7 before housing and consumes no RNG.
With a completed model-7 building, zero Warriors, and five available Braves,
`004e59a0` allocates type 6 with count zero and consumes one RNG draw. Four available
Braves fail the capacity gate after that same draw.

Construction remains the higher-priority producer. Before Matak's recurring profile,
the tower supplies one housing slot and a model-1 Hut supplies three. The profile
then makes Matak's model-7 request precede further housing; Chumara keeps its initial
housing target of nine before training.

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
and continuous Mission 4→5→6 browser check prove both tribes independently assign
workers, survive checkpoint restoration, complete their first Guard Tower, then
complete their first settlement expansion, run Matak's profile, construct both
Warrior Training Huts, recover construction after training redirects builders, and
reach Matak population 23 while retaining at least six Warriors. They also prove
Chumara's profile enables exactly one Temple, normal construction completes it, and
the shared type-6 path converts a Brave into a Preacher across checkpoint restoration.
Both original first-raid population reads (`I1 > 22` and `I1147 > 5`) then pass through normal
simulation and checkpoint restoration. Native site validation does not reject living people, and its
builder tasks 5 and 6 immediately return to ordinary work. The browser therefore
skips only grounded Wildman-occupied candidates until native wild wandering is live;
the regression covers the first Chumara candidate and subsequent valid site.

Explicit `BUILD_AT`/1082 occurs later (Chumara turn 501 and gated Matak turn 55).
Ordinary 1059 attacks and command 1093 remain outside this slice. No parity ledger
status was changed.
