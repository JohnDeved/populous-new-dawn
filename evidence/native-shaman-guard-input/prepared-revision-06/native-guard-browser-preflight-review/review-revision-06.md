# Ordinary Mission10 Guard driver: revision6 input-envelope review

**ACCEPT revision6 source preflight.** Runtime remains clean at
`c20a297f5f815ce404f796b08f77ea56396f96da`; accepted fullcheck/build evidence is
unchanged. This accepts the observer/input integration source, not an ordinary
browser result or a launch grant.

Frozen packet under `../native-guard-browser-preparation/`:

- `scenario.mjs`: `a317dca2b6a4ee559a95e24ed15d1455081ac76bdc7052fe20c233cef4ba5647`
- `preparation-receipt.json`: `06bd45b3aa708e3246109a27d83553b2f105320b54c954a580ffcc4b660b101d`
- `contract-audit.md`: `7345817861b036bb169a342966f8161ba05d45d0e8eb08dadb60318914bbac43`
- `input-boundary.mjs`: `704b9c03c24419e9bee553ba259c9e6b7d9bb9b9121e06848e52691c4e861ac7`
- `observer.mjs`: `98bc28e08c1cc035765686a4b61c5cb9cd1ecde5fcea134ea26474899abdc82c`
- `browser-probes.mjs`: `a4ae152d98aa97b6aeafefb61b2a505f99bea840824e702edb75ae0a4c653cdd`

All receipt input hashes, source manifests and archived packets match. Accepted
campaign provenance now reads exact Git commit
`ddef3caa522d45168b16f290cc5b5a4d1541fce2`, preserving the original expected bytes;
concurrent campaign worktree edits cannot change this proof.

## Actual failure and source mechanism

Baseline attempt03 remains failed on missing fresh ground marker. Its stable-source
outer receipt SHA256 `afdc22bd7c860a6fd452a57ed9643124c03490b4c3e8d92d6f47fcc12537119d`
and witness `c150861c85e336bf330a303e736441f01a38b2275932a1e6e239a8bf75e8816b`
retain genuine training and later turn433, but no recorded marker. Revision6 does
not reconstruct that missing observation or upgrade the failed attempt.

[scene-input-runtime.ts](../../../app/scene-input-runtime.ts:375) synchronously
runs command, creates/registers the marker, acknowledges the pointer and returns.
The shipped canvas listener is installed before the diagnostic observer. Its
existing capture-phase begin and later bubble-phase end therefore bracket that
same real handler. [world-effects.ts](../../../app/world-effects.ts:119) gives
markers four processor visits and registers secondary ownership before insertion;
delayed snapshots can legitimately miss both the marker and a short Move queue.

The new synchronous reader copies actual scene/world/epoch, selected actors,
dispatch/ack, effect IDs and secondary ownership, Unit/native/command-owner
identities, current-cursor records and work/target. It adds no picker, renderer,
model processor or clock call. `unitAnimationSource` is a pure owner selector;
its identity is kept separate from command ownership. All state writes belong to
diagnostic globals/WeakMap identities and existing temporary picker wrappers.

## Complete adapter contract

Entity and ground preparation arm the existing pointer observer with the new
reader. The existing finish closure returns its real restored envelope after its
assertions. The actual dispatch path passes that envelope to `acceptedInputBoundary`,
which invokes byte-identical `acceptedOrderEvidence` on pointerup pre/post-handler
snapshots. It does not substitute delayed state or invented marker history.

Validation requires trusted exact-coordinate down/up, correct canvas ownership,
restored wrappers, no diagnostic/picker errors, exact scene/world/epoch, one
synchronous pointerup turn, fresh dispatch and ack. The chosen ground marker must
be absent from **all** pre-handler effect IDs and have actual secondary kind,
effect ID and positive serial. An old same-cell marker, wrong cell/dispatch/epoch,
missing secondary owner or missing actual marker cannot pass.

Command-owner priority matches the accepted campaign source exactly: builder,
flight, fight motion, native, entry. Each record is tied to that owner and its
immediate/current-cursor slot; later queue records cannot satisfy the request.
Fresh same-target input may retain an existing intended record only with the real
fresh handler/ack/new-marker evidence required by the unchanged helper. Training
work/target acceptance uses the captured input boundary; actual later occupancy,
cost4000, replacement, training gain and exit remain separate required observations.
The scenario also retains its conservative delayed training-work check.

Initial Move now pins identities from actual post-handler model3 input and validates
later source-defined ordinary on-foot eligibility. A queued record with status0 is
not native adoption. An empty later state17/19 queue is labelled ordinary idle with
**no completed-Move inference**. Unsupported empty state10, replaced owners,
competing work/controllers, bad flags/routes and non-Move queues fail. Guard still
needs actual state10/status30/current30/target and native renderer ownership;
physical following still requires observed displacement and goal reaction.

Every arm captures the current epoch. Verified Load installs a new observer epoch;
old envelopes/readers fail correspondence and no pointer observer survives the
completed dispatch. Existing checkpoint and Load identity assertions are unchanged.
Renderer phase/mesh observations retain their separate independent RAF cadence.
No afterTurn hook or marker journal was introduced.

Picker wrappers call the original once with unchanged receiver/arguments and
return/rethrow the original result/error. Diagnostic failures use safe error
formatting, remain in the envelope and fail evidence without escaping into the
application handler. Cleanup removes only its own listeners and restores only its
own wrappers; unexpected replacement fails without overwriting that owner.
Application errors remain fatal through the harness error collection and health
checks. Model19 attack lookup and campaign-only sermon/conversion fields remain
outside this training/model3 witness; no corresponding acceptance is claimed.

## Independent verification and pending work

CPU4 verifier passes12 source/provenance/syntax/mock checks and28 focused cases:
10 executed adapter/reader/listener tests,8 ground,4 entry,6 owner/target. Cases cover
five-turn delayed expiry, short queues, same-target input, entity work, wrong/stale/
missing marker and owner conditions, later slots, Load reset, diagnostic errors,
original exceptions and current-origin browser-module assembly for both roots.
[Result](source-checks-revision-06.json) SHA256
`be2e7a1bf4d99bc190978584060636e9206a2ca0504533d1d54cb1026e80702f`;
stderr is empty. These are synthetic adapter/source checks, not game replay.

Point sets, ordinary actions, acceptance thresholds, Guard/Save/Load assertions and
60/300/330-second caps are unchanged. No browser/server/profile/dependency operation
or runtime source edit occurred in review. A fresh launcher must bind revision6;
parent authorization and complete paired ordinary runtime/pixel evidence remain
pending. Prior failed attempts retain their original outcomes.
