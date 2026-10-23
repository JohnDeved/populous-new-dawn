# Gameplay aggregate admission migration

## Finding and evidence

The shared 180-second browser hang bound predates the present three-episode workload. It is not a measured renderer or gameplay performance threshold:

- `f500a55894881cfe8d2d93ec27b71772e50f103b` introduced the independent gameplay-frames job with only live Level 2 frame recording under the pre-existing 180000 ms runner timer.
- `275355cb4e8f8f88954140e1c8bea7c877cdd2f1` appended an independent ordinary melee context, preserving its own 75000 ms deadline, with the explicit comment “One browser, same cap.”
- `d7335234406386612aa9be0fd60903e3474350f4` appended ordinary follower death/checkpoint continuation, initially one 75000 ms episode.
- `bd0912ba4c7723e6bc5a58d43a500c7aa10c701b` separately bounded death through verified committed save at 75000 ms and subsequent actual load/reframe/resume/terminal verification at 25000 ms. The latter can begin only after exact committed-save proof. It expressly retained the shared 180000 ms runner cap.

The current frame plan itself requires 2000 ms natural warmup + five 1600 ms measured windows + the real 300 ms paused menu interruption = 10300 ms, before mission startup, real routing, five F8 exports and cleanup. The two companions' declared maximum functional windows total 175000 ms. A 180000 ms aggregate therefore cannot accommodate all three existing declared envelopes, even ignoring actual frame setup. Those maxima are bounds, not required sleep durations, so this arithmetic alone does not prove every run must fail.

Exact candidate `dbb9cd8ce16706f03991652d08ac96802627adef`, Tutorial run `39678644125`, gameplay job `119495014982`, demonstrates a concrete aggregate-only failure: frames and melee passed. Corpse death through committed save completed at 64648.7 ms, below its 75000 ms cap. The exact committed corpse was loaded, reframed and resumed, but the shared browser closed at about 78146 ms into the corpse episode while its 25000 ms second phase still had approximately 11502 ms remaining. The retained failure is not a corpse phase timeout or a completed corpse acceptance. Frame completion was approximately 48.3 s after its page time origin; melee occupied approximately 51 s of observed actions. The corpse ordinary-combat phase itself took 41.29 s. No genuine combat duration, simulation speed, target or measured window may be shortened to conceal this.

Evidence belongs to run `39678644125`, job `119495014982`, artifact `12383146402` (ZIP SHA-256 `6f75094d1d32f10189442243a46a52e7c7247ca85c55952c8af09758b61951a7`). The verified manifest and selectively extracted `gameplay-frames.json`, `melee-attack.json`, and `follower-corpse.json` are retained in the review workspace evidence bundle `pr717-hosted-dbb9cd8c-20261021/gameplay/`, not committed under `engineering/`. The earlier 180-second run remains failed regardless of adopting any proposal.

## Explicit bounded migration

Declare the aggregate's actual three-episode admission explicitly: original frame envelope 180000 + unchanged melee envelope 75000 + unchanged corpse phase envelopes (75000 + 25000) = **355000 ms maximum shared browser time**. This adds 175000 ms to the previous aggregate hang bound. It is a functional admission migration, not an optimization or performance pass.

Keep one production build, one browser process, the same independent contexts and exactly the existing episode order. Start one absolute 355000 ms aggregate deadline before the initial context is created; never restart it. Keep the frame episode within its original 180000 ms envelope, including its initial context and close. Keep existing melee 75000 ms and corpse 75000/25000 ms semantics and successful-save transition exactly. Context creation, inter-episode teardown, final cleanup and diagnostics consume the same aggregate remainder, not new resettable allowances. Because existing companion timers start after context creation and stop around final retention/close, the sum is a maximum shared envelope, not a promise that every subphase may use its full maximum plus unrestricted lifecycle overhead. Record these lifecycle intervals and remaining aggregate time explicitly. Do not add a second unexplained cleanup grace or retry after expiry.

Pass a single absolute remaining deadline/abort into any new orchestration boundaries so parent expiry cannot leave a pending public input that later dispatches. Local companion expiry, page errors or early failure still fail the job immediately. Never classify an unstarted or interrupted later episode as passed. Validate all three terminal accepted reports, their exact source identities, and cleanup evidence before setting aggregate success.

Preserve all five frame phases, fixed viewport/DPR, public input route, 2000/1600/300 ms durations, natural RAF, frame cohort/coverage/work counts, F8 export bytes and source-bound comparisons. Preserve ordinary melee's 75000 ms and current immutable first-entry/exact-native-expiry assertions (not the retired v1 ten-turn survival protocol), same actors and target, no synthetic health/clock/world mutation, and exact native artwork/crop evidence. Preserve corpse's real death, committed current save, exact effect/turn identity, actual load, resumed animation, terminal phase and existing two functional caps. There are no workload, speed, metric, threshold or trusted comparison pin changes.

The existing per-job build cap is 120000 ms and GitHub job timeout is 900000 ms. Maximum declared build + browser allowance becomes 475000 ms (7 min 55 s), versus 300000 ms (5 min), an explicit +175 s. Installation, launch, source verification and artifact upload remain bounded by the unchanged 15-minute hosted job. This migration adds no builds, jobs, dependency installs or parallel renderer contention. Actual additional runtime is unknown until hosted evidence; earlier successful frames/melee must be rerun on the exact new merge tree along with corpse.

## Alternatives and why not silently adopt them

Separate the three already independent episodes into jobs. This improves failure attribution and avoids frame startup consuming corpse admission, but requires three builds and installs instead of one, extra browser startup and artifact uploads, additional Actions capacity, and a separately specified lifecycle envelope for each companion because their 75/100 s clocks currently exclude context creation/cleanup. Simply assigning three generic 180 s jobs would admit 540 s total browser time and 360 s build time, versus the proposed single355/120 s. Do not adopt that larger alternative without an explicit cost/contract review. Sharing one built artifact could reduce duplicate builds but adds a new source/artifact handoff contract and is not part of this minimal proposal.

Read-only RPC consolidation may reduce overhead, but is not evidence that the old aggregate can reliably admit the required series. Do not replace bounded workload accounting with repeated blind retries.

## Required negative and admission tests before publication

1. Exact policy constants derive 355000 only for this three-episode aggregate; all other scenario caps, workflow job/build bounds and trusted performance pins remain byte-identical.
2. All five frame phases and both complete companions are required, in the same order, with unique source-bound terminal reports. Missing, skipped, partial or stale reports fail admission.
3. Aggregate time includes initial context creation and all transitions/cleanup. A late-created context is closed and cannot begin input after expiry. Pending witness/preparation cannot dispatch late input after abort.
4. Frame expiry at its preserved180000 fails; melee75000 fails; corpse death75000 fails; load25000 fails. Aggregate355000 expiry fails even if a child has time remaining. No retry resets any deadline.
5. The corpse load allowance starts once only after independently verified exact committed-save evidence; missing/wrong effect, turn, digest or paused state fails without starting load.
6. A small synthetic schedule covers a successful full order and cumulative exhaustion during the last phase, preserving original errors and cleanup failures. Tests should use deterministic clock/scheduler adapters, not real multi-minute waits.
7. Fresh source-bound focused evidence and independent review precede normal publication. Fresh hosted exact-head and current-main synthetic merge evidence must show all three reports and teardown complete. The old180-second failure remains retained, and no performance improvement is claimed from additional admission time.
