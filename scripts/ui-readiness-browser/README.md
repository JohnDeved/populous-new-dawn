# Built-worker help and neutral-cursor diagnostic (not run)

Runtime integration: `b88bdf1c6e1102c07ff64c78d546f9f6ae333a9f`, based on
`ce0c4f7e` with accepted help and neutral-cursor merges. Diagnostic files are copied
onto a separate branch, not merged back into product history.

The first run [39210083073](https://github.com/JohnDeved/populous-new-dawn/actions/runs/39210083073)
on `622618c5` passed all nine asset-readiness modes and the building palette.
Help Missions 1/2 passed; Mission 19 DPR2 reached content/screenshot but expired
before final geometry/return/resume. The run remains timed-out, not passed.
Prior readiness/palette evidence remains scoped to those exact old runtime inputs.

This candidate uses seven cases: five in-game asset modes (healthy, font failure,
slider failure, late font and late sliders), repaired contextual help, and the
reviewed neutral-cursor helper. New cursor readiness changes scene preparation,
so in-game cases are repeated; unrelated frontend/palette cases are not blindly
repeated. Help repair `a8d3b0a3` closes completed resumed game pages immediately and
records phase timings without changing its 85-second cap or content assertions.
Cursor helper SHA256 is
`5fc26e3a0f1d9d78a13d4b8c7d6f5fa2d0a643ac0b49221c32b8b222fa2747c6`.

## Execution and bounds

The workflow is admitted only on exact branch `diagnostic/ui-help-cursor-20261019`.
A workflow-only successor pins the diagnostic source parent and runtime grandparent,
not a product PR Ready event. Standard `npm run build` produces the Vinext/RSC
worker; local Wrangler/workerd serves it on GitHub Ubuntu at 127.0.0.1:5199. This
is not deployed Cloudflare/CDN proof, a plain React fixture, or a user-computer run.

Official Chrome is sandboxed using the existing browser configuration and exact
reviewed version/hash from `f9f77dc8`. Mismatch fails without install or fallback.
Source hashes, build hashes, browser identity, all case statuses and owned process
group cleanup are recorded. The runner writes its initial receipt before risky
setup; workflow preflight covers earlier setup/build failure.

Unchanged caps: build 10 minutes, worker readiness 60 seconds, each case 90 seconds,
help/cursor helpers 85 seconds, runner 7 minutes, external kill bound 8 minutes,
workflow 20 minutes. Any actual case/global timeout aborts later cases; ordinary
assertion failures may continue independent cases. Server cleanup awaits TERM
for 2 seconds then KILL/check for 2 seconds. Logs cap at 2 MiB; final staged upload
including receipt is capped at 128 MiB, withholding oversized output in favor of
an explicit failure receipt. Artifacts retain for 7 days.

Only the five routed in-game readiness cases disable HTTP cache through routing;
other helpers have fresh contexts and their own explicitly scoped routes. Reopen
means same-document reuse. Cursor CSS assertions do not prove OS cursor pixels
or hotspot rendering. Headless screenshots do not establish hardware performance,
complete native cursor parity, or whole-UI standard/wide/high-DPI acceptance.
Existing in-game freeze checks use read-only React fiber discovery, not injected
simulation state. No runtime source or loading timeout is changed here.
