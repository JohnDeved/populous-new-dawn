# Compact browser functional admission, version 1

This is an explicit **new policy**, not a recovered historical sub-budget and
not a performance improvement. The compact job admits 225 seconds instead of
180 (+45 seconds). Build remains 120 seconds and the hosted job 900 seconds.
No trusted comparison pin, timing threshold, simulation speed, geometry oracle,
public input, preference transition or required viewport case changes.

## Workload and provenance

`7160549cc` introduced the ordinary M2 45-second functional bound;
`ea2e31e0a` included public loading in that allowance. `8a908e119` gave the
compact four-case episode the same single 45 seconds, not two phases.
`76ab33f47` replaced invented select controls with original-style public
navigation. `ce72f48ac` reduced the route to the minimum seven setting clicks
plus twelve Menu/Options/Back/Continue clicks. The former two select operations
therefore became nineteen required real clicks. `ff9f1d6b` added real wheel
coverage for overflow, with all fields, text and export still required.
Read-only atomic snapshots retained the two animation-frame settle boundary.

At PR717 head `bf15aab151ab56bca7df5b19e1136181da2cfb56`, Tutorial run
39684859007, compact job 119516213069 completed both 400% viewport cases with
strict geometry and frozen-world checks. Public startup/pause took 22.199s,
the first preference was reached at 37.593s, and those cases at 40.082/42.145s.
The 45.002s failure occurred during real Automatic navigation, not a layout
failure. Two Automatic cases were not accepted. This evidence explains the
workload mismatch; it does not establish an SLA or prove the new policy passes.
The verified artifact 12386655058 (SHA256
38855c3700a1c241760fbd1d7c45dfb3cbbb3f268b87b49a8f158eb23ee75b66)
and extracted report are retained outside the repository under the bf15 evidence
collection, not committed here.

## New boundaries

- Compact preparation: one 45-second phase starting before its context acquisition.
  Public Load must preserve the entire exact checkpoint, introduction must be
  released, the world paused in the same scene, and the exact retained authored
  popup restored through its real summary before the phase can finish.
- Compact layouts: one further 45-second phase for **all four** cases, starting
  only after that verified preparation. It includes both native preference routes,
  all F8 toggles, real wheel reachability, screenshots, every original metric,
  nested clipping/text/hit-testing/persistence/frozen-world assertion and context
  cleanup. There is no per-case reset and unused preparation time cannot add to it.
- Compact absolute episode: 90 seconds, clipped by the original absolute host
  deadline, including acquisition and cleanup.
- Expanded picking: its existing independent 45-second episode remains unchanged.
- Hypnotise: its existing 75-second episode remains unchanged.
- Host: 225 = 90 + 45 + 75 + 15 seconds. The retained 15-second lifecycle margin cannot
  be transferred into a compact phase or the unchanged companion deadlines.
  One build/browser is used. Aggregate timing begins before initial context
  acquisition and includes final context/browser/server cleanup.

The harness-only dispatch facade preserves exact Playwright receivers, arguments,
actionability waits and public events. Only the explicit gameplay and compact
owners opt into it. A deadline is sticky even if timer delivery is delayed. It
closes the owned browser to cancel a forwarded pending action, blocks new nested
input/acquisition, closes late acquired resources, and permits only tracked held
input release and cleanup afterward. Every owned final cleanup is attempted even
if another rejects or stalls. Original failures remain primary and cleanup errors
are separately recorded. A promise race bounds pending acquisition/read/cleanup;
late completion cannot publish a passed admission. Earlier failed receipts remain
failed. New source/focused acceptance is not rendered acceptance.

Owned close operations are explicitly recorded as pending before dispatch and
closed/failed on settlement. Late acquisition, deadline-browser closure, inner
compact context closure and final cleanup invoke the existing receipt writer
again on settlement, without extending the deadline or awaiting a new grace
period. Pending cleanup is not verified cleanup. Persistence failure is recorded
and fails admission; it cannot overwrite the original input error. Hypnotise's
reported cap may remain below 75 seconds when its existing outer clipping applies.

## Historical ordinary M2 read-only observation batching

The ordinary M2 episode retained its original single 45-second bound at
`7e33f7d9`, Tutorial run 39694511098, it completed all four viewport layouts,
both real frame exports and F8 reset, then expired during real popup preparation
for the final resume at 45.000 seconds. This is an incomplete episode, not a
geometry failure or a passed companion. The compact four-case episode and its
picking/Hypnotise companions passed separately under the explicit policy above;
that does not imply a speed improvement.

Normal M2 now consumes the public popup helper's already-completed atomic
retained-identity/open-state/all-owner observation instead of issuing an immediate
extra owner count with no intervening action. The exact requested serial and
exactly one or zero owners remain mandatory. The F8 text/style entry checks are
read together. Frame export combines its original before-state and passive
observer installation, then reads the post-export world state, bubbled events,
button/status geometry and button hit test together. The real hover/focus,
keyboard or pointer activation, download and native-work assertions are unchanged.
No viewport, scroll, export, popup restoration, resume or final menu assertion is
removed, and no input, action timeout or episode budget is changed. Any elapsed
time benefit requires new hosted evidence. The later explicitly authorized
[ordinary M2 policy](ordinary-m2-functional-admission.md) adds separate setup
admission after another retained 45-second failure at `1a6b838f`; it does not
retroactively accept those failed episodes or alter compact/picking budgets.
