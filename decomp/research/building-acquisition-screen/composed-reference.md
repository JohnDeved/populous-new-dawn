# Finite building CPU composition

This extends the independently accepted source packet at
`5a1d7c779054d9f414657081ce7f3d65cb2c3fdf`. It is a **source-derived reference**,
not new executed-original proof, GPU equivalence, browser acceptance or runtime
implementation. App, assets, profile, clock and world code remain unchanged.

## What actually runs

`composed-geometry.mjs` reads the hash-pinned EXE and extracted OBJS/FACS/PNTS as
DATA. Its authored M1/M3 initializer and controller translation calls a CPU
geometry translation on every reference UI visit. It does not supply transformed
depths: those now come from each original model's ordered corners, radial offset,
centroid rotations, normalized global yaw/tilt, integer products/shifts and screen
projection. Feedback then runs before any clipping/culling. The reference stops
at ordered CPU face vertices; lighting, clipping, painter queues and GPU work are
excluded.

`0047fab0`'s axis2 call on identity includes normalization and reorthogonalization.
The translation preserves normalized row2, normalized cross(row2,row0) for row1,
then normalized cross(row1,row2) for row0. It uses `00586000`'s original square-root
seed table/Newton recurrence. The three face rotations and later tilt use
`0047f7b0` matrix multiplication with signed32 products/sums and arithmetic shift14.
Native sine/atan DATA was already matched by the static audit. Float32 projection
stores are explicit. The bounded x87 flight expression is evaluated as an exact
rational from those float32 values and float32(0.1), then truncated as `0055bc54`.
This does not claim general-purpose x87 emulation.

`composed-reference.mjs` reuses the unchanged, accepted
`app/worship-acquisition.ts` companion and spell code. Before composition it
matches every particle/RNG state and ordered sprite-command hash in all four
retained companion-only native fixtures. It then stages the existing public
helper in pulse+companion and spell-only calls, inserting the building reference
between them. No existing pulse or companion is visited twice. Building and spell
remain distinct slots; either initializer replaces the companion and preserves
the existing pulse. Building initialization advances the same cosmetic RNG before
creating the companion. Model12 in the reused companion object is a browser
draw-binding tag only, not a claim that the building is a spell.

## Finite inputs and source-derived results

The23 composed cases are: both models × two cosmetic seeds × visible/fallback
origin (8); three initial/whole/flight pause patterns for each model (6);
building→building and building→spell replacement at UI visits10/95 for each
model (8); and one already-active spell followed by a Temple handoff (1).
Each has a maximum320 reference UI visits and must reach controller/pulse cleanup.

| Normal case | First face selection | All faces started | Building retirement | Pulse tail ends |
| --- | --- | --- | --- | --- |
|Camp103|87|115|126|129|
|Temple95|87|124|135|138|

Both seeds and source origins produce those normal lifecycle counts after the
assembly phase converges; earlier geometry/companion state still differs. All107
or147 faces start exactly once in the normal cases. A three-call initial pause
produces camp129/132 and Temple139/142 retirement/tail: pending advancement before
pause can skip entry-only setup, so pause duration cannot simply be added to an
unpaused transcript. Mid-flight pause can still produce CPU eligibility feedback.
These numbers are **derived by this translation and require its independent
review**. They must not replace the old175-visit intercepted-probe receipt with a
new native claim or become unqualified wall-clock constants.

The record retains every UI visit's pause/phase/count, selected face IDs,
started-face count, companion/pulse/spell/limiter state, shared RNG, full face-state
hash, CPU-vertex hash and companion/spell draw-field hash. The actual vertices and
particles can be reproduced from the pinned inputs/source. No original binary
data is published. Complete source/fixture hashes accompany the result.

Gift timers are supplied at76, the independently evidenced six-visit handoff.
The screen wrapper never changes either building timer, including replacement;
spell arrivals affect only the separate spell timer. A separate arithmetic
countdown retains visit81-before/82-grant. This is **not** an execution of the
original object scheduler, world cloning, knowledge write, audio, arrival UI or
Save/Load. Those owners retain their accepted evidence and future ordinary checks.

## Reproduction and next decision

```sh
node --disable-warning=ExperimentalWarning \
  decomp/research/building-acquisition-screen/composed-reference.mjs \
  ../raid-base-delivery-shards-03/work/orchestration/canonical-input-recovery/component0 \
  work/orchestration/issue23-static-inputs
```

The first complete23-case runner passed in2.12seconds; its raw initial output is
retained locally as `work/orchestration/issue23-static-source/composed-reference-attempt1.json`.
The frozen `composed-reference.json` additionally tracks both building gift timers
in replacement cases and uses compact JSON. Review must check the full translation
against the addressed source, especially matrix orientation/normalization,
pending-before-pause ordering, signed thresholds and scheduler split. No broader
native audit is a prerequisite to that review. A future narrow runtime can compare
these state/vertex results, but ordinary M1/M3 screen pixels, persistence/display
binding and standard product gates remain required before acceptance.
