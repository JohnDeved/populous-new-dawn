# Native seated-position ownership after route retirement

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/verification/m16-seat-sync-2026-10-14), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

PR436, base `a550ac898d15ce5a5c58947c0cd0f8cbabc0cd06`.
Runtime `287d4ee0a90df1296a626bbde26edb9d86f56c3a`.
Corrected test head `c900971788dfa014ef3aa99a9f3121a91e9ecbe9`.

## Finding and repair

An ordinary M16 actual-clock route produced three Balloons and boarded three
original Braves alongside their manufacturing pilots. After route retirement,
`syncLiveVehiclePassengers` no longer found people in the transient route map.
Browser-only seat coordinates kept moving; existing native coordinates did not.
The public unload consumer correctly retained that native owner, exposing stale
home coordinates on its next physics tick. The preserved failure moves112 by
114.6124 wrapped units in one tick.

The fix resolves `pathfinding.people.get(id) ?? unit.native` before existing
seat synchronization/registered-cell relocation. Map precedence and native
identity remain intact; no new route, actor, departure relocation or reward is
manufactured. Original static465ea0 writes the actual physical-slot person's
position regardless of route membership;4659d0 launches from that position.
See the research report and verified EXE/export/objdump hashes. No original
executable was executed or emulated.

## Independent ordinary public-input replay

The player independently replayed from immutable preboarding9396, not from the
already-corrupted unload endpoint. Public boarding9432, all seats9446, island
arrival10183, panel unload10186, all six healthy supported ground landings10195,
Angel head completion11236 and earned stock11336. Exact native/browser/seatXYZ,
registry and linked-cell checks passed after every complete frame; public
Save/Load twins remained equal. This uses the shipped simulation/animation and
camera driver, not rendered browser or full AI parity. The historical10183
fixture separately isolates the regression and does not certify its earlier
stale metadata. Both preboarding and failed10186 inputs are archived as gzip;
uncompressed original hashes are in `public-replay/input-hashes.txt`.

## Standard and affected qualification

- Full initial `npm run check` is **failed:2606/2611**, retained unchanged. Four
  M22 Balloon attack tests pinned chronology/outcomes from stale native origins;
  one unchanged CLI timeout fixture missed expected child stdout under aggregate
  scheduling. No full green aggregate is claimed.
- Paired source-bound observation-only collectors force a non-passing result.
  Baseline runtime is byte-identical to basea550 and satisfies all old assertions,
  including the historical victory. Corrected seat origins alter the existing
  mode1 grounded attack exit and subsequent guard interception. This is separate
  from voluntary launch physics; original435550 reads actual personXYZ for its
  768-unit exit. The old test/positive outcome is preserved, and current-source
  loss plus complete cleanup is asserted honestly.
- Normal reruns of all three changed M22 files plus M16 regression pass6/6.
  They retain order references, counter visits, identity, Save/Load and cleanup,
  and add exact seat-origin plus bounded mode1 ground-exit assertions. Native
  wrappers may retire after ordinary no-order landing; active-flight identity
  remains required. First historical normalization is an ordinary tick, not an
  actor edit. The isolated unchanged foreground file passes9/9.
- `quality/combined-coverage.json` verifies all403 test-file hashes and explicit
  rerun ownership. Runtime/app/public/dependencies match the full-run source.
  This is combined qualification of2611 cases, not a green aggregate receipt.
- Affected vehicle suite24/24, typecheck, production build, parity/orchestration,
  final changed-file ESLint and formatting pass. Full-app Oxlint retains exactly
  the baseline1408 diagnostics, zero introduced; raw nonzero lint is preserved.
  Fallow health completed as advisory.
- Synthetic paired seat-sync microbenchmark: fresh immutable checkpoint for
  every sample,15000 calls/sample with supplied repeated craft offsets. Medians
  baseline11.46ms/candidate11.29ms, ratio0.986. Descriptive noisy micro-timing only;
  no FPS/hardware/gameplay performance conclusion.

## Evidence and limits

Raw source-bound receipts and stdout/stderr are portable copies under `gates/`,
`history/`, `chronology/`, and `public-replay/`; original absolute paths remain
in receipts. The manifest binds copied files. Raw whitespace is intentionally
preserved. Initial loader failure, overstrict post-landing alias assumptions,
failed aggregate, old successful assertions and non-passing diagnostic attempts
remain visible. The diagnostic plain-person paired rows are limited to3539–3545
because later fresh/historical turn labels overlap.

Independent reviewer accepted runtime/native ownership, paired changed-origin
classification and public replay; final evidence-head acceptance is required
before merge. No full M16 victory, rendered flight witness, native boarding
countdown, general mode1 ground-physics or complete AI parity is claimed here.
