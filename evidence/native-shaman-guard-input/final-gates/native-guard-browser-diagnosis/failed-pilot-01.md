# Mission 10 pilot: entry checker failure

This is diagnosis of the retained baseline attempt, not a Guard acceptance result.
The application remains unchanged at baseline `3b899125cc8cedef938823718ad5d44f49957b66`
and candidate `c20a297f5f815ce404f796b08f77ea56396f96da`.

## Measured result

The original baseline session 88672 started at 2026-10-05 20:46:24.396675 UTC
and ended normally with exit 1 at 20:47:43.909862. Revision 3's assertion
`Entry/readiness real-clock bound` failed before the first training or Guard input.
The candidate was not run. The fixed 60-second entry, 300-second capture and
330-second outer limits were not increased. Both localhost and 127.0.0.1 port 4392
were closed after normal harness cleanup in the launcher's network namespace.
The source tree and explicit receipt inputs were unchanged. Browser errors were
empty; software WebGL, read-pixel stalls and missing-image warnings are retained.

At the last read, Mission 10 was playing at turn 592, time 49.3333333333, speed 1,
unpaused, inputMask 0. Readiness was true. Shaman 63 had 100 HP, state 19, and was
selectable/orderable. The camera was settled at (29,-5), native (9472,64768), with
no active camera motion. Thus the exception reports elapsed entry time, not an
unready Shaman. The assertion is after a dynamic probe import and measures from
the harness receipt's start time. No per-stage timestamps were captured.

The retained screenshot shows ordinary settled Mission 10 before training. It is
not a before/after Guard image or hardware performance evidence.

## Three source-bound checker defects

1. `scripts/local-render/harness.mjs`'s `openMission` waits up to 45 seconds for a
   visible `.skip-introduction`, even when no introduction is active. Fresh
   `createWorld(10)` starts with inputMask 0, flyby flags 16 and no events. The
   Mission 10 flyby is queued only after the first Totem's exhaustion; the retained
   Totem is untouched. A nonexistent Skip wait is therefore a source-supported
   explanation for substantial delay, not a directly measured 45-second stage in
   this attempt. Vite reported 10,139 ms readiness; the witness reported page
   performance time 57,265.4 ms. These clocks do not supply the missing stage split.
2. Authored object indices are not runtime IDs. `world-initialization.ts` walks
   supported objects and `addBuilding`/`addUnit` allocate `w.nextId`. Authored Blue
   Firewarrior Hut 149 (model 8, x20,z-8, angle 0) constructs live building 98,
   native anchor (7168,0), object 99, full HP 260/progress 1. Its building-position
   center is native (7646,65466), browser (21.8671875,-7.7265625), exactly matching
   the retained live building. Remote authored hut 120 similarly becomes 73. The
   missing runtime ID 149 is not evidence of destruction.
3. Authored Braves 171–175 construct live IDs 119–123. All five remain in the
   retained read, with six additional naturally created Braves (143,145,158,160,
   162,183). An exact total of five is therefore invalid after natural elapsed
   play. A revised witness must retain the five original identities, separately
   record births and still establish real training of the selected Brave.

`mission10-construction.json` is a source-side initialization observation with
source hashes: no ticking, browser execution, actor injection or profile access.
It corroborates construction and identity mapping, not an ordinary gameplay replay.
Relevant source: `world-initialization.ts` object loop; `construction-runtime.ts`
buildingId/addBuilding/anchor and rendered-center calculation; `world-state.ts`
addUnit; `level-ten.ts`; `decomp/research/mission10-opening.md`.

## Retained tactical limits

Blue Warrior 113 is damaged to 30.7 HP at (17,-3). Completed Green Tower 65 is at
(11.02734375,-3.16796875), about six map units away. The observer retained Blue
units only and no damage history, so neither the attacker nor a safe training area
is established. Shaman 63 and original Braves 119–123 have full HP; 119 and 121
are housed while 120, 122 and 123 remain outdoors. The repaired witness must keep
health/actor-loss checks and record actual nearby threats. It cannot isolate AI,
freeze actors or infer tactical safety from initial placement.

## Repair and acceptance boundary

Revision 3 and all raw failed receipts remain immutable. A source-only revision 4
will condition entry on actual normal readiness or a visible Skip control, using
the accepted browser-game entry approach and recording stage timestamps. It will
bind the authored hut by native anchor/model/tribe/orientation, retain the original
Brave identities and record births separately. The same time caps and genuine
training/move/G/repeat/cancel/checkpoint requirements remain. No application or
maintained harness change, simulation mutation or longer timeout is authorized by
this diagnosis. Fresh source review and a later separately granted paired replay
are required. The PR remains draft and its ordinary rendered gate remains pending.
