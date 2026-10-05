# Revision7 timing delta and minimum evidence closure

**ACCEPT revision7 source preflight. Recommend the complete strict candidate run
next; another full baseline is not necessary for the specific before-defect record.**
This is a review recommendation, not a browser/resource grant. Candidate remains
clean at `c20a297f5f815ce404f796b08f77ea56396f96da`; runtime gates carry unchanged.

Frozen packet under `../native-guard-browser-preparation/`:

- `scenario.mjs`: `1650ddce505056d4cade2fccff681303ce204f753a8964a4d187baa68066c274`
- `preparation-receipt.json`: `5ef0c2eecbd4dfe388bf40a577cba8d88d0465515f6fd7d2767c8dbcc2bd596a`
- `plan.md`: `3c09404bc5c7e374eeab25ca9b139e5ec66c602126c2708fedc559a8bc971144`
- `attempt-04-timing-attribution.json`: `6ed3c6a7024e3ea53088b70ed99ba397902e27a7b4e8906acabf26223010dc6e`

All packet/archive/source hashes and the timing receipt's three raw-input hashes
match. Revision6 and baseline04 remain preserved as failed; candidate has not run.

## Timing judgment

The only input change is a declared40.5s Shaman selection/focus preparation boundary.
Actual Move remains42s. Ground minimap/probes/revalidation/dispatch, six prospective
points, Guard/Save/Load gates,1.5s entry-lateness/4s completion predicates and
60/300/330s outer limits are unchanged. Selected Shaman equality is checked again
at Move. Completion logging uses the existing `after.now` sample and adds no page,
picker, renderer, model or clock call. It logs before the same timing assertion.

The split is supported but has **modest, unproven margin**. Baseline04 measured
1.686s for selection/focus, then1.807s to minimap settlement,1.000s through accepted
Move and0.090s until failure. The38s G reissue finished around40.5s. Starting the
same4.583s work at40.5s gives an optimistic completion around45.083s, about0.917s
before the46s deadline, before added preparation-boundary reads/draining and normal
variation. Move may therefore start after42s while remaining inside its existing
lateness bound. This is not a guaranteed or hardware-performance margin; an overrun
still fails. Exact final page-relative time from baseline04 was never logged and
is not reconstructed from wall-clock timestamps.

The schedule contains many checks because it combines several requested lifecycle
controls, but no further general scheduling machinery is needed for this repair.
One prospective preparation boundary is smaller and better supported than removing
the minimap step: no actual ground probe proves visibility from the prior settled
Shaman view. Do not stretch deadlines, remove assertions or add search/retry paths.
The added completion log will expose actual remaining margin in the candidate.

## Minimum bounded closure

Baseline04 is sufficient for the **before behavior and screenshots through the
unchanged pre40.5s input prefix**. Its witness SHA256
`37fefa1049a3223379984eaf8f0338a6641e5aed15d9f7c171ceaea29c1cb74d`
records real training, accepted initial model3 input, and the following distinctions:

- First G sets legacy boolean guard=true while native status remains0, guard count0
  and no native animation source is selected.
- Escape retains that boolean guard.
- Repeat G toggles it off instead of replacing persistent command30.
- Later Shaman-only G leaves an active legacy boolean guard true instead of canceling.

The empty-selection G event was captured with guard already false after repeat G;
it is a control observation, not standalone proof of failure to cancel an active
order. Accepted native and failure-first evidence establish that missing branch.
All six retained screenshot hashes match. First-G and Shaman-cancel images were
visually inspected as actual rendered scenes; phase correctness is not inferred
from those pixels alone. Candidate images at the same named prefix boundaries can
supply the before/after pair, with exact commits, observed timings and headless
limitations disclosed. Revision7's completion logging does not alter that prefix's
ordinary inputs or assertions.

Baseline04 also recorded the later Shaman Move input, but failed its timing stage.
It did not reach physical following or either checkpoint cycle. Its overall result
must stay **failed**, and none of these missing stages becomes passed.

The necessary next evidence is one **complete revision7 candidate** satisfying every
existing native owner/command/target/count check, actual following displacement and
goal reaction, both paused pending replacement/cancellation Save/Load cycles, new
Load epochs, renderer ownership, source/runtime fingerprints, screenshots, errors
and bounds. That establishes the new behavior with native proof and the bounded
before record. A fifth baseline solely to obtain a whole-run PASS label adds no
needed proof of these specific before defects. No paired baseline following,
baseline checkpoint, identical whole-run timing, original-pixel or hardware claim
is permitted; those broader claims would require their own complete evidence.

The launcher may be adapted by the parent to a fresh candidate-only attempt after
accepting this minimum-closure scope. This review grants no execution resources.
A failed candidate cannot be relabelled passed or merged with absent required
candidate stages.

## Independent source checks

CPU4 verifier passes12 provenance/archive/syntax/mock checks and28 focused cases.
[Result](source-checks-revision-07.json) SHA256
`c9004c3816cfe861d23dd210dcbc001ae046b19eb686673101f88ad9983eeddc`;
stderr is empty. These tests validate unchanged adapter contracts, not future real-
clock timing. No browser, server, dependency or runtime source operation occurred.
