# Hut smoke allocation-turn lifetime

Issue 73 follow-up. The existing original descriptor socket selection remains
unchanged. This repair concerns the first processing visit of a retained partial
root, not the unresolved secondary full-hut child-puff allocator.

## Failure-first ordinary caller comparison

At baseline `af2fd84852f8ce404c9b28379a41f9e81f3def32`, an unmodified authored
Mission 2 world naturally admitted Brave 79 into Hut 72 (level 3 / object 109)
at world/building counter 186. The checker called the actual `advanceGame`,
real housing notification and `updateBuildingsFrame`; it did not assign
occupancy, resident slots, positions, building counters or smoke state.

The newly allocated browser root remained at lifetime 16 after that turn. Over
16 observed visits its lifetimes were `16,15,...,1`; it was still visible at the
last sample. The corresponding original-byte composition returned
`15,14,...,0`, hiding at the last sample. The red run failed the intended direct
comparison, not setup, with the source and external input hashes unchanged.

The native sequence is:

1. [0040c4e0](../generated/0040c4e0.c), the real occupancy reconciler, allocates
   model 75 through [004edbd0](../generated/004edbd0.c).
2. Real initializer `0050c150` sets lifetime 16 and resolves the corrected
   [00404540](../generated/00404540.c) attachment.
3. The later secondary-list slice `004ec924..004ec942` of
   [004ec6f0](../generated/004ec6f0.c) sees the already-prepended root.
4. Real dispatch through [004ed700](../generated/004ed700.c) and
   [0050a750](../generated/0050a750.c) reaches
   [0050c260](../generated/0050c260.c), consuming its first lifetime visit.

The first observed remainder is therefore 15; the duration is still **16
processor visits including the allocation turn**. Newly created children during
the secondary traversal have a different insertion boundary and are not changed.

## Bounded live repair

The periodic helper now processes newly created roots on their allocation visit.
Its previous comment incorrectly applied the secondary-child deferral rule to
roots created by the earlier primary building pass.

Immediate occupancy events require care: ordinary admission runs after the
browser building counter increments, while effects such as Tornado can release
residents before that increment. Simply decrementing every new root whenever
`advanceGame` is active would count the pre-building case twice.

`afterCurrentGameTurn` queues transient presentation callbacks and flushes them
at the end of each actual fixed turn, including catch-up calls containing several
turns. It preserves existing before/after hooks and clears phase/queue ownership
on exceptions. Queues are clock-specific, not World/checkpoint fields.

When an occupancy event creates a partial root, its completion callback compares
the building counter at allocation with the counter after the turn:

- If the counter advanced, the normal counter delta already owns the first visit.
- If it stayed unchanged, the callback supplies that otherwise-missed first visit.
- Root identity, visibility and initial-lifetime checks make completion one-shot
  and prevent a replaced/removed root from being aged.
- Events outside an active turn do not schedule completion. Checkpoint/scene
  reconstruction retains the previous initialization behavior.

The source change is limited to `game-clock.ts`, `hut-occupancy-smoke.ts` and the
existing scene binding. It adds no world-turn hook, primary/secondary allocation
pool, smoke artwork, attachment change, gameplay RNG draw or guessed puff phase.

## Supporting checks and integration boundaries

The focused regressions cover ordinary Mission 2 admission, periodic expiry and
its first hidden RNG visit, real command-8 admissions/departures, a controlled
pre-building release callback, counter wrap, same-turn root replacement, repeated
rendering, batched turns, and callback isolation/exception recovery.

The paused-command fixture initially assumed a paused ground command would
release a resident; `live-command.ts` correctly rejects it. The corrected test
asserts that rejection, issues the real release unpaused, then pauses the new
root and proves it is not aged before the next simulation visit. No production
command policy or lifetime assertion was changed to satisfy this fixture.

After adopting startup main `68b470d`, controlled housing fixtures use the
accepted `finishLevelStart` / `retainFixtureUnits` workflow. The primary natural
Mission 2 comparison still starts at `createWorld(2)` and processes the actual
opening through `advanceGame`. Its bounded wait accommodates opening plus
ordinary admission, rather than forcing the earlier absolute admission turn.

## Reproduction and proof limits

```sh
python -B scripts/check-native-hut-smoke-first-visit.py /path/to/d3dpoptb.exe
node --test tests/hut-occupancy-smoke.test.mjs tests/hut-smoke-events.test.mjs \
  tests/hut-smoke-first-visit.test.mjs tests/game-clock.test.mjs
```

The native harness pins EXE SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` and the shipped
`smoke.txt` hash. Receipts additionally bind original object/shape files, the
checker, scene fixture and private dependency lock. The exact same native
checker produced the red baseline and the first green result at `cf851ea`.
Later combined-game checks must retain their own source-bound receipts.

Native unit pools and the building lookup cell are supplied. Class initialization
routes the allocated smoke object to the real initializer; unrelated class/list
transitions and animation setup are intercepted, and terrain is constant 384.
The final position consumer copies the computed coordinates. The original
secondary traversal and effect dispatchers are not intercepted. No surrounding
full world loop, Windows/Wine launch, fixture recording or Ghidra mutation occurs.

The scene fixture supplies texture IO, projection and unrelated plan geometry.
It proves actual application caller/state behavior, not GPU pixels, hardware
performance or complete original-game scheduling. Rendered evidence and standard
code gates remain separate requirements. Full-hut secondary puffs, the complete
class-7 allocation stream and complete checkpoint presentation parity remain open.
