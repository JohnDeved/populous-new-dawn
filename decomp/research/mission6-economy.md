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

Native `004e59a0` queues Chumara warrior training when the model-7 capacity of five
is no greater than available Braves plus housing-order Braves. A six-Brave probe
allocates type 6 with count zero and consumes one producer RNG draw. Matak's Hut
feeds the existing native `00404c80` birth path; at the initial Mission 6 population
band its 4,000 base work becomes 1,187 and each eligible building update contributes
twice its occupants plus two, without RNG.

Construction remains the higher-priority producer. The tower supplies one housing
slot and a model-1 Hut supplies three; both tribes therefore keep requesting Huts
until live huts and plans reach Chumara's target of nine and Matak's target of ten
before Chumara training.

## Live integration and boundary

`stepComputerTasks` now preserves those schedules, per-tribe queues, center choice,
RNG order, bounded spiral search, model-4 validity, two-Brave selection, command 6,
and the existing timber/construction lifecycle. The Mission 6 portable regression
and continuous Mission 4→5→6 browser check prove both tribes independently assign
workers, survive checkpoint restoration, complete their first Guard Tower, then
complete the camp and native housing sequence and reach live warrior training and
population growth. Native site validation does not reject living people, and its
builder tasks 5 and 6 immediately return to ordinary work. The browser therefore
skips only grounded Wildman-occupied candidates until native wild wandering is live;
the regression covers the first Chumara candidate and subsequent valid site.

Explicit `BUILD_AT`/1082 occurs later (Chumara turn 501 and gated Matak turn 55).
Ordinary 1059 attacks and command 1093 remain outside this slice. No parity ledger
status was changed.
