# Early-mission AI producer scheduling

## Source and scope

This follows merged PR161 at `734e496807020a8ab62bc5e981cfd00187f71719`.
[Issue165](https://github.com/JohnDeved/populous-new-dawn/issues/165) owns the bounded
Mission1–3 table-scheduling slice. It is separate from the accepted natural-victory
journey in issue2 and does not claim whole-mission or complete allocation timing.

Executable SHA256 is `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Existing reviewed `00461d70`, `004625e0`, `004627f0`, `00462790` and `004623e0`
exports establish initialization, scheduling, gates, record writes and dispatch.
Thirteen newly indexed exports were generated with official Ghidra12.1.3 from the
same existing fresh-analysis project used for early-mission research, without
community metadata. The wrapper verified all original file-backed section bytes,
every requested output and successful project save. They are `004e5810`,
`004e58b0`, `004e5950`, `004e5b60`, `004e5bf0`, `004e5c40`, `004e5ca0`,
`004e5ee0`, `004e5f30`, `004e5f80`, `004c5cf0`, `004f52b0` and `004f8e10`.
`decomp/exports.json` records their hashes; its historical metadata description
is not provenance for these fresh-project exports.

## Table order and fairness

The initializer copies twelve 20-byte records from `0059d878` to AI+`0x36e`.
Fields are producer id byte, function pointer+4, signed attempt count+8,
priority+12 and group length+16. Native initial id order is
`[1,0,3,4,5,6,7,8,9,2,11,10]`; attempts start at zero. Groups are one construction
entry (priority100), ten middle entries (90), then one final entry (50).

`004625e0` first finds the earliest of ten inactive slots. A full queue skips
all producer calls and sorting. Otherwise it tries `004e5b60` first; if successful
it repeats the free-slot search, returning immediately if that consumed the last
slot. It then visits table entries in their current order until a producer succeeds.
Every called function increments its attempt count even when it fails; this is
signed32-bit wrapping arithmetic. A null function does not increment.

Afterwards it makes **one forward adjacent-swap pass** within each group, swapping
only when the next signed attempt count is strictly smaller. It does not fully sort
or move any producer across its priority group. Ties retain order. Construction
therefore always precedes Convert Wild and training; the old construction-first
comment alone was not proof of a bug.

The existing adapter's fixed Convert Wild→training order does disagree with this
mechanism. With construction failing and both succeeding, native winners across
two opportunities are Convert Wild then training. The first Convert Wild success
moves its record to the end of the middle group. Controlled scheduler probes
supply producer results and prove this table mechanism only, not real eligibility
or natural mission timing.

## Pre-table type9: substantive remaining dependency

`004e5b60` uses the real state9/no-active-type9 gate and writes a phase0 type9 task.
It runs before the table and can allocate **two tasks in one producer opportunity**.
Unhooked tests with only states9/2 enabled show `[type9,type2]`, and show that the
last free slot goes to type9. No RNG change occurs in these allocator cases.

With AI flag0x10 clear, the origin is the same base/Shaman source as `004f6020`;
radius is7 before a construction base exists, otherwise nonzero base byte+0x36c
or1. Flag0x10 selects marker byte+0x5b7 and radius+0x5b8 instead. All three early
mission startup state masks enable state9. The browser currently has no ordinary
live allocator or consumer for that task.

Its `004c5cf0` controller initializes the scan and calls `004f8e10`. The scanner
walks enemy tribes and their person/building lists, with alliance, region, target
and person-specific filters. It can consume RNG and initiate additional effects.
The controller can allocate a type8 response, or type11/type15 follow-up, before
cleanup. This is not an inert timer and must not be represented by a dummy task
merely to shift the existing queue's visits.

A complete type9 live implementation needs those scan filters and response/cleanup
consumers recovered and bound to normal world lists. Table fairness work does not
close this dependency or the other missing table producers.

## Reproduction and bounds

`python scripts/check-native-ai-producer-schedule.py /path/to/d3dpoptb.exe`
checks the pinned EXE and runs eight controlled scheduler cases plus five unhooked
type9/type2 allocation cases. Controlled callbacks are explicitly separate from
the real allocator cases. The real initializer and scheduler always execute.
No full EXE launch, native Windows session or rendered acceptance is implied.

The controlled cases cover repeated success rotation, construction priority,
all-failing stable ties, full-pool skip, pre-table last-slot exhaustion, renewed
first-free selection, one-pass versus complete sorting, and signed counter wrap.
The unhooked cases cover both enabled, either state disabled, last-slot priority
and full-pool rejection, including exact radius7/base payload and unchanged RNG.

At this research checkpoint, runtime behavior remains unchanged. The intended
next implementation is exact table scheduling around the existing Mission1–3
producer adapters, with missing producer/response semantics explicitly retained
as open boundaries. Later missions remain outside this slice.

## Automatic-training threshold correction

The existing early-mission `produceMissionTraining` adapter inverted the native
capacity gate. `004e59a0` requires the signed32-bit sum of idle and housing-order
people to be at least the selected school's capacity. Twelve executable cases
cover below/equal/above capacity, negative values, and signed addition overflow.
The state gate, candidate loop, real completed-building lookup, native RNG and
record writer run; model availability and the two people-count leaves are supplied.
Every eligible candidate case consumes the same single native RNG step before the
capacity test, including rejected low-capacity cases.

`check-native-ai-training-capacity.py --compare` pairs those cases with the actual
live predicate. `tests/ai-training-capacity.test.mjs` separately exercises the
Mission3 runtime adapter with controlled world fixtures. The old runtime fails
at four available people and wrongly accepts the request; five and six now pass.
This change is limited to Missions1–3; Mission6 already used the correct direction,
and other later mission predicates retain their previous behavior. Candidate
model selection, preferences, permission/building predicates and downstream
training timing are unchanged and not certified by this threshold proof.
