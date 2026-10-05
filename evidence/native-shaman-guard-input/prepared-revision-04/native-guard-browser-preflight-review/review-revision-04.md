# Ordinary Mission10 Guard driver: revision4 delta review

**ACCEPT revision4 source preflight.** This is a bounded correction to the failed
entry pilot. It grants no browser lane and establishes no training, Guard, rendered
or Save/Load PASS. Candidate source remains clean at
`c20a297f5f815ce404f796b08f77ea56396f96da`; application/harness sources are unchanged.

Frozen packet `../native-guard-browser-preparation/`:

- `scenario.mjs`: `7e2c40f3bf9db50f1a546dcae5b28582dc43c1db84fe1c2c020824381aa5ded3`
- `observer.mjs`: `f172a58ccea14a3038eea1803b1e6b52c30f89a219846a83f4dfd5df3d43c1df`
- `entry-identity.mjs`: `a72943d933abeab19f627a5613e69481c746e59832e4fc690cb61b7529d2589c`
- `mission10-construction.json`: `313a6eb81997c8bc1169666610ea59f62dadacf1e1c81861dbf93a56894e35cf`
- `preparation-receipt.json`: `bd1d39c0f75a43e7142ab552b6587d81e60de7c9d95501dc208540dbb8028a95`

All packet inputs, both source manifests and preserved revisions match their
hashes. Revision3 archive keeps its failed baseline outcome and original receipt
`90624ba41e75cb149384aec317fec4e77a1b4ddfba7f05e6c073ff6c408bda6e`.

## Diagnosis and bounded repair

The actual revision3 baseline receipt remains failed, with stable baseline source
and unchanged input hashes. Its witness fails the60-second entry assertion before
training or G; training IDs and sampled occupancy/cost are absent. The retained
snapshot is ready at turn592, with original Braves119–123 plus six additional
Braves, and actual Blue Firewarrior hut98. The harness source unconditionally waits
up to45seconds for visible Skip and swallows that timeout. The precise45-second
contribution is inferred from source; the pilot lacked stage timings.

The new entry helper uses current-runtime `showAllMissions`, public Mission10
keyboard activation, `bindGame`, flyby/input-mask readiness and sequential awaited
Shaman readiness. Skip is clicked only when actually visible. There is no model,
clock or camera call. It retains the60-second acceptance deadline from harness
start,300-second harness cap and separate330-second process envelope. New stage
records make future elapsed-time diagnosis possible. The60-second check is an
acceptance boundary, not a separate process-kill timer; any overrun fails.

Authored building index149 is resolved uniquely by model8, tribe0, object99,
orientation0 and native anchor(7168,0), derived from authored coordinates(20,-8)
and building rules. Actual `buildingPose` preserves native anchor versus displayed
center. Its live ID is observed and passed through target/work/capture/Load paths;
98 is not a replacement hardcode. Wrong, missing or duplicate native matches fail.

Original Brave IDs119–123 come from the hash-bound initialization trace, with
source-authored coordinate correspondence. All five must still be alive as Blue
Braves. Additional observed Braves are recorded separately; this does not measure
their exact birth times. The actual HUD-selected training Brave must be original.
Housing is allowed because shipped training input can release that owner; real
accepted input, observed occupancy/cost4000, actual replacement allocation, source
Brave removal and completed Firewarrior exit remain required. The new early-loss
check rejects disappearance without new Firewarrior allocation and training gain.

Passive nearby-threat/health snapshots call only pure source helpers and write
diagnostic state. They do not suppress AI/combat or establish tactical safety.
The ongoing sampled actor scope is retained. Existing G timing/actions, current-
order/target checks, continuous Unit/native/renderer ownership, verified Load-only
rebinding and checkpoint comparisons are unchanged byte-for-byte where factored.

## Verification and remaining boundary

Independent CPU4 source-only `verify-preparation.mjs` passes10 checks, including
four new source/mock entry/identity cases and six unchanged owner/target cases.
[Result](source-checks-revision-04.json) SHA256
`694bbdac95f8db5a48ee670485fd90efe7a5766068c67fc2ef08412958f88522`;
stderr is empty. No browser, dependency move, server, profile, game construction or
simulation was performed by this review. The supplied initialization trace was
read and checked against source, not presented as ordinary gameplay.

The [revision3 review](review-revision-03.md)'s remaining runtime/pixel limitations
continue to apply. A new source-bound launch plan must name these revision4 hashes
and fresh attempt paths. Parent lane authorization, actual target/input reachability,
training, complete G schedule, both checkpoint cycles and paired screenshot review
remain necessary. The failed revision3 pilot is not an eligible successful before
capture, and this source acceptance does not predict that revision4 will finish.
