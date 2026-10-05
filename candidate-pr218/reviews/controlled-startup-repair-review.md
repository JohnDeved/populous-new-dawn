# Controlled startup repair and failed-run cleanup review

Decision: **ACCEPT** proof-only wrapper
`controlled-render-adapter-startup.mjs`, SHA256
`2e805eb1c5b94be413e072fce69e125d20ddc43b57f2944356f5bc42aaf04eff`,
on unchanged clean source `d97c370da3e996e00130610df97d10b827ab5c4b`.
This is source preflight, not a successful controlled run or browser launch grant.

The prior run95765 failed at the startup inputMask wait, before any geometry
phase assertion. Its inner evidence has zero frames/stages and retains the
20-second timeout. I viewed failure-0.png: the public Skip introduction control
is still visibly present. The maintained checker's one-shot isVisible test before
the asynchronous control appears supports the proposed readiness-race diagnosis;
it is not proof of a game-body defect or proof that the repair will pass.

The new wrapper adds one exact guarded substitution, producing a single new
`await skip.waitFor({ state: 'visible' })` before the existing isVisible/click.
The existing 20-second page default is unchanged. Removing that one line from
the retained new generated file reproduces the previously accepted generated
file exactly. All 13 scaffold substitutions and eight import rewrites remain
guarded and recorded. The subsequent inputMask check, every18-phase assertion,
reward/save/exhaustion/pause checks, sandbox transport, failure propagation and
abort/close delegation are unchanged. There is no forced click, game-state write,
timeout increase, suppressed assertion or manufactured queue value.

## Run95765 resource disposition

The generic launcher retains browserCleanupVerified=false/resourcesReleased=false
because its conservative formula only credits an overall passed receipt. Those
raw fields must remain unchanged; they are not observed close/disconnect failures.

I independently traced the exact outer harness. A real browser was supplied to
the scenario; the wrapper's no-op inner close is a separate local object and does
not replace that browser. In finally, the outer harness awaits browser.close,
requires !browser.isConnected, then stops its owned server. Any close, disconnect
or server-stop failure replaces the scenario outcome or records previousFailure.
The final inner receipt retains only the scenario-status AssertionError, no
previousFailure, and unchanged source identity. The same launcher records both
IPv4 and IPv6 port4318 sockets closed. Thus the supplementary cleanup attribution
is supported for this failed nonpersistent run, without upgrading its test result
or giving any cleanup credit to browserCloseDelegated. No actual counterexample
to that disposition was found in the reviewed path.

Keep the original failed command, inner evidence, conservative launcher flags and
supplementary terminal attribution together. A coordinator-authorized retry must
use a fresh output and retain its generated-source hash and actual outer cleanup.
The source/package/ordinary-cadence results remain valid; final acceptance still
requires controlled terminal evidence. No reviewer job or resource is held.
