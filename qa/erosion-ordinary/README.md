# One ordinary Mission 3 Erosion capture

Source composition: merge `ecb51b5aab912ecd62e736eef372105b71397ec6` joins
accepted issue223 producer `47d2e2dc229f35352f1a7a1cfb948789053c9b1c` and reviewed
recorder `b8cb2d013183d68a4abb60004e65a150f53601f7`. `policy.json` pins the unchanged
combined app tree and source inputs. The first exact CLI attempt at c91ce9d exited13 during the cyclic scenario import,
before any server, profile, browser or public input. Its failed receipt is retained.
The repaired CLI import is checked explicitly before another browser attempt.

## Route and bounds

Start Mission 3 through the visible All missions selector in a fresh task-owned
profile. Observe and retain the exact initial scene, World and original living
Blue Shaman object. Use visible Skip introduction and, if paused, one public
Resume game action during startup; wait for the real opening to release selection.
Select and focus that same Shaman, use an actual minimap click and at most three
ordinary right-drag camera rotations to find the authored Erosion head101.

The clone-only preflight finds command27 enabled and a land route from authored
Shaman row45 `(35,81)` to the canonical head approach `(-5,115)` across the torus.
It proves geometry/admission, not successful live travel. No supplied World, order,
position, clock, RNG, terrain, profile or storage state is used by the scenario.
No Temple, sermon, replacement actor or tactical expansion is available.

Arm the prospective constructor recorder, then dispatch exactly one unmodified
trusted left click on a verified 5×5 integer interior of the actual head. Retain
actual picker calls, scene/World/canvas identity, order27/target101 and fresh pointer
acknowledgement. Observe that original actor arriving and performing qualifying
worship work before the one authored use. Call1 is captured before first afterTurn
at remaining63; call64 retires at activation+63 with remaining0. Version1/64/+64
captures are rejected. Both arrival and work witnesses are required.

Limits are15 minutes overall,120 seconds startup,30 seconds per camera settlement,
90 seconds without actor travel/head work, and30 seconds from activation to
retirement. Later pause, combat, death, replacement, failed route, changed order,
ambiguous creation or unexpected control ends the attempt without another tactic.
Scene binding retries only the actual Playwright TimeoutError within that shared
120-second startup deadline. Up to64 timeout diagnostics are retained separately
from physical actions. Non-timeout errors propagate immediately; each awaited bind
is followed by the existing stop/deadline check. Physical inputs are not retried.
Only the optional Skip click uses Playwright's `noWaitAfter:true`. Its visible,
enabled/stable and initial hit-target checks and physical action remain awaited;
navigation barriers and the post-action hit-interceptor result are not awaited.
The same-scene/original-actor readiness gate proves opening completion. Click
errors still propagate; worship and other proof-critical clicks keep their waits.

## Launch, stop and receipts

The existing local-render harness is the only launcher. The pure sourceReceipt
implementation lives in owned-profile.mjs and is re-exported by the harness; named
scenarios can read it without importing the CLI while its top-level await is active.

Plans require an explicit purpose: capture or startup-smoke. The smoke runs the
same public Mission3/Skip/one-time Resume/original-Shaman readiness prefix, imports
and observes all eight pinned modules, and takes a genuine scene screenshot. It
then returns only erosionStartupSmoke and closes normally, without arming capture
or dispatching worship. It cannot satisfy the native replay admission. Smoke bounds
are120 seconds for the scenario,150 for the harness,180 outer plus20 for forced
termination; resources are fresh. Capture retains the full existing route/gates. Its named scenario module
requires `POPULOUS_EROSION_LAUNCH_PLAN` before the harness creates any browser,
server or profile. A coordinator-reviewed external launch plan must pin the exact
clean source head/fingerprint, combined app tree, scenario hash, server identity
hash, root/origin, fresh profile/output paths, limits and the runtime grant.
The existing command-receipt wrapper records the actual launch command and its
terminal outcome. No executable launch plan is checked in here.

For a stop, place sole command
`[{"action":"stop-preserve-latest","runId":"<actual current run>"}]` at
`<output>/commands/0001.json`. The driver checks it before/after awaited polls and
physical inputs, preserves its bytes, releases any active right mouse gesture,
restores owned observers, and lets the supported harness close the browser/server
and finish its profile receipt. It never issues Save. An incomplete or unexpected
command also stops. There is no detached input promise after stop.

`input.mjs` and `minimap-input.mjs` reuse the previously reviewed ordinary helpers;
`reuse.json` records correspondence and the input helper's sole cleanup-only delta
(removing an unused destructured binding). `stop.mjs` explicitly repairs that
helper's late-ready bug by checking stop and deadline again after the predicate.
Legacy `settleView()` and `effectPixels()` are not imported or used. Screenshots
come from the real page without renderer or mesh writes.

## Bounded source/runtime binding

`source-policy.mjs` hashes the actual immutable installed Vite/vinext/Cloudflare/
Playwright declared package subset, executable/configuration chunks and native
transforms, plus lockfiles and the fixed harness. The actual `.bin/vite` realpath
and bytes must match the collected Vite CLI. Generated caches are explicitly
excluded. This is a bounded compiler/server identity, not OS attestation.

`runtime.mjs` retains actual `Debugger.getScriptSource` bodies for the eight pinned
modules and their parsed URL/script/context/hash records. CDP only enables source
observation and reads scripts. The driver uses current-page imports and requires
exactly one parsed record for each module in one common context; it does not
independently authenticate that context as the main frame. Exact original bytes or
an inline source map containing them establishes supporting correspondence under
the pinned compiler/server. Source maps alone do not authenticate transformed code.

Compact capture/lifecycle/module/input files are bound by the terminal receipt.
The replay CLI additionally requires the exact external launch-plan file and
caller-supplied expected terminal receipt SHA256, source commit/fingerprint and run
ID. The coordinator obtains these from the reviewed actual run and inspects the
script observations. Arbitrary internally consistent bundles are not proof.
`--validate-only` checks those records without importing the native emulator.

## Source checks and remaining execution

Focused tests cover clone-only route feasibility, all64 corrected-producer turns
with every World field deeply equal when capture is disabled/enabled, callback
receiver/return/exception preservation, detached snapshots, deadline/stop behavior,
fake-CDP source checks, compiler chunk/launcher binding, input/runtime admission,
and worst-case full-height exports under32MiB. Fixtures are explicitly synthetic;
they do not stand in for the ordinary run. The older recorder tests compare the
actual pinned uninstrumented controller source too.

A fresh review must bind the final driver head before launch. Combined aggregate,
build/quality and observer overhead gates still need the coordinator's execution
slot. Ordinary capture, actual copy/RAF timing and native replay remain unperformed.
The replay compares all native heights/RNG/countdown and terrain notifications
under both selected sound-bit settings. Actual sound policy, downstream native
walk masks/queues, full engine timing and UI/IndexedDB restore remain unproved.
