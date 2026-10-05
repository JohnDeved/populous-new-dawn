# #214 ordinary logical-visit proof preparation

Status: **source preparation only; browser evidence not run**. This directory is
ignored. No browser/server, dependency work, standard gates, world mutations, or
tracked-source changes belong to this preparation.

## Exact inputs and retained history

- Prepared against clean accepted main `a53fa05587c4c1d363e3596162b41fcb9f26e3e8`.
- `observe-sprite-visits.mjs` extends the independently accepted pure observer
  SHA256 `2d9de66cec40e11eeebb16db31fae1a896665a54bb1bf7264aa8bda44c40ca77` at
  `sprite-animation-timing-audit/work/orchestration/sprite-animation-timing-214/observe-sprites-readonly.mjs`.
- The older valid `browser-readonly` capture at `596475b` remains historical
  24-presentation-visit evidence. It lacks flags/stamps and is not relabeled as
  this new baseline. The earlier `browser` capture remains separately qualified
  because its screen helper synchronized terrain.
- The new run must use a fresh `baseline-a53-raw-owners` output on the accepted
  main source before candidate comparison, then a different
  `candidate-<frozen-head>-raw-owners` output. Both use these exact driver bytes
  and normal ephemeral contexts. No checkpoints or profile reuse.
- `preparation-receipt.json` records exact checker and source-read hashes. At
  execution, the ordinary harness records the full source/tree/diff fingerprint
  before and after; the driver also copies its starting source receipt and hashes
  itself into `sprite-observations.json`. Preserve outer receipt, harness receipt,
  raw rows, screenshots, logs, browser/runtime/dependency hashes and cleanup result.

## Finite sequence and runtime

Reuse the accepted normal Mission 1 entry, Skip Introduction and read-only
Shaman readiness. Observe genuine autonomous movement; issue no world command.

| Segment | Expected speed / pause | Requested observation |
| --- | --- | --- |
| normal-speed natural opening | 1 / running | 8 s |
| public pause | 1 / paused | 1.5 s |
| public resume | 1 / running | 4 s |
| settings pause at 1× | 1 / paused | 0.25 s |
| settings selected 2× while paused | 2 / paused | 0.25 s |
| shipped 2× speed natural play | 2 / running | 4 s |
| public pause at 2× | 2 / paused | 1.5 s |
| settings pause at 2× | 2 / paused | 0.25 s |
| settings selected 1× while paused | 1 / paused | 0.25 s |
| restored shipped 1× speed | 1 / running | 2 s |

Total requested sampling is **22 s**. Allow approximately **60–90 s per run**
including local startup, readiness and screenshots, with the existing **120 s
harness timeout / 150 s outer timeout** as the hard termination/cleanup boundary.
The readiness helper has its existing 30 s deadline; each UI-state confirmation
has a 5 s bound. If RAF stalls, outer harness ownership terminates it. One baseline
and one candidate are serial, separately receipted jobs; no capture lane is yet
requested or held. Assign the port only when the coordinator grants the lane.

The settings behavior is source checked in `app/page.tsx`: `Game settings` sets
`menu=true`; its effect sets `world.paused=true` and opens the dialog. The visible
`1× game speed` button toggles speed between 1 and 2. `Continue Game` sets menu
false; closing the dialog fires `onClose`, which resumes when the level selector
is closed. The driver waits for the actual speed/pause and hidden dialog before
timing resumed play. It also records every ordinary action's before/after state.

## Observed owners and purity boundary

Each row copies actual turn/time/speed/pause, land/level flags, GameClock
animationFrame/time, secondary smoke animationFrame and selected IDs. Up to the
first 16 alive Blue units retain their IDs/kinds/positions and the actual result
of pure `unitAnimationSource` / `unitAnimation` selectors. Native rows include
class/model/object/draw/f1/f2/flags3/stamp, renderFlags, state/substate/commandStatus,
speed, flags2/flags4 and morph fields. A local WeakMap distinguishes source object
identities within each segment; aliases report which existing Unit paths refer
to that exact object. Never compare the local numbers across segments.

Frame, draw, flip, visible layers, piece and UV components are read from existing
unit meshes. Effects retain kind/ID/age/lifetime, animation identity/raw fields,
damage-smoke alias identity and existing group/child UVs. Hut smoke retains copied
existing root/puff state, mode and UVs. Missing values are not invented native
records. No live method is called to derive projection, position, placement,
range, routing, selection, frame, UV or terrain. No extra render is requested.

The only application functions called by the sampler are the two already-reviewed
pure selectors. The shared readiness helper binds diagnostic aliases and calls
its existing pure observer. The diagnostic WeakMap and copied arrays are local
to the independent RAF sampler. It does not install an application callback,
wrap RAF, read a mutating getter, update a camera, seed an effect or advance time.
WebGL renderer metadata uses the accepted observer's context queries. Raw rows
are saved before assertions; errors or missing walks remain failures.

## Acceptance and honest coverage

1. Verify exact source/driver stability, pass/failed receipt status and owned
   browser/server cleanup. Inspect screenshot, console and actual renderer.
2. Require genuine native-backed natural walk samples plus stable native idle
   samples. The driver requires a natural walk; if absent, retain the failed run
   and seek a separately reviewed ordinary reproduction rather than injecting one.
3. Every paused sample must retain the same native pose/stamp, clocks and rendered
   frame/UV selection; running segments must advance actual simulation and
   presentation clocks. Speed assertions use observed values on every row.
4. Compare existing displayed person frames with imported native direction cycles
   at the sampled f2, following the retained accepted offline frame checker. Its
   old assertion that every Shaman f2 delta equals presentation visits belongs
   only to the bad-24Hz baseline and must not be copied as a candidate expectation.
5. After the author freezes the ownership policy, compare stable same-owner,
   same-object/draw/mode/state windows against that policy. Record world-turn and
   presentation deltas together with raw stamps, object identity and actual f1/f2.
   Report skipped frames, wrap/alias ambiguities and owner transitions. A copied
   stamp does not itself prove a processor visit; raw turn equality is not a
   substitute for actual logical ownership. Fine-grained visit replay and all
   refresh/speed/catch-up schedules belong to the author's portable tests.
6. The expected visible distinction is reduced gated person advancement in normal
   1× play, with ungated presentation continuing. Keep full and partial hut smoke
   separate by their actual mode and retain changing UVs if observed. Damage smoke
   and Splash are sampled only if a genuine event exists; absence is explicitly
   `not-observed`, never a control pass. Do not create fake effects or prolong this
   person proof for another family's ordinary reproduction. The reviewed native
   producer packet and the author's unaffected-family tests own those wider claims.

The author confirmed this raw schema fits the frozen implementation proposal:
repaired person stamps will identify the last completed logical animation visit
(`World.turn`), not an original draw serial. Class1, model2–7, nonzero-state active
sources use logical visits for modes1/2 and ordinary mode4. Mode3 and mode4 with
`renderFlags & 0x1000` remain presentation-owned. Splash is the only effect in
scope. Use the recorded `draw` and exact imported descriptors to distinguish those
branches during comparison. The proposal is retained at
`sprite-stamp-gate-audit/work/orchestration/sprite-stamp-gate-214/implementation-proposal.md`.

The final implementation itself was not frozen when this driver was prepared.
Recheck changed
selectors, raw owners and settings/renderer semantics before candidate execution.
This capture does not own checkpoint/lifecycle migration, command-27 completion,
land pause, zero/slow speeds, refresh invariance or native-byte replay. It cannot
establish original OS wall-clock cadence or hardware-GPU performance.
