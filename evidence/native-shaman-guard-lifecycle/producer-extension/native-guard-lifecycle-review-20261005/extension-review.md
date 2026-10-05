# Independent review: finite G producer and caller extension

**ACCEPT the bounded producer/caller evidence and source-only controller map.**
No runtime implementation, full current-controller handoff, ordinary gameplay,
physical-stop or continuous idle-phase parity is accepted.

Reviewed on clean main `3b899125cc8cedef938823718ad5d44f49957b66`, tree
`5228a79f26b90d3daeffe65498c01ada077ba132`, 2026-10-05 UTC. The previous
[baseline review](baseline-review.md) remains frozen at SHA256
`27538c420093465594e9bd3fb519b5801d59871c31ae8d5e75472532905e2798`.
The baseline findings' sole subsequent count correction (nine explicit-entry
cases plus two native-transition cases) is accepted at SHA256
`2802bd502d5de72032708318ba6731bf4c823964914349c7afca2445d342d58d`.

[Producer findings/controller map](../native-guard-lifecycle-20261005/producer-findings.md)
SHA256 `0e67b49df68f3211ccedd147afed12be32cee3a9b6aa5114062f052da2abeabe`
accurately retains the executed/supplied boundaries and source-only status.
[Producer receipt](../native-guard-lifecycle-20261005/producer-receipt.json) SHA256
`454af6fb12e1c8a1e9281f4a164eb53033b8e10a4386fda7b926972a5591e61d`;
[caller receipt](../native-guard-lifecycle-20261005/key-mode-receipt.json) SHA256
`498f623e4492189f406a3e1587c6ebd250e2ae5ac01b25a63613cb3df6f1ce6a`.
All recorded input/source hashes match. Local links resolve. The mode helper
`004999d0.asm` matches original EXE bytes, SHA256
`c75d4289179e4c6ecc57250c2336133047395d1004e80ce3c19c6c8c9482f1c9`.

## Native evidence

Independent CPU4/60-second replays passed byte-identically; both extension scripts
also verify the unchanged baseline script and complete baseline output hash before
running their own cases. Runtime and tracked source remain unchanged.

- [Producer probe](../native-guard-lifecycle-20261005/probe-guard-producer.py):
  `24921a87e6e42340434a1b79ddc88a7823437ea940711dab4ff1ea54911e3340`.
  [Independent result](producer-replay.json), 20 cases/43 stages:
  `92153069ba20138e60280cb639cfc2f794d1ed4532e7234dbaa79e39843bc922`.
- [Caller probe](../native-guard-lifecycle-20261005/probe-guard-key-mode.py):
  `ead992a61285f60faa20b53c27c549a74a0e742aa665f6be39d1feb159e1bfea`.
  [Independent result](key-mode-replay.json), 2 selection-mode cases:
  `d4462509561db958ad03b884430e50b3b81d623693804bde7a8a71b3078324ff`.
- Commands are the baseline replay command with each script/output basename
  substituted. Both exit0, approximately0.26s/0.13s respectively; both stderr files
  have SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
  Existing baseline leaves remain explicit.

The producer allocates one shared command for a selected group, replaces it on
repeat G, and preserves another follower's reference during partial replacement.
Adoption counts each guard; cancellation releases both references/counts. No-
selection G still leaves unadopted commands intact. The last free slot799 wraps
the allocation cursor to1 and is shared across three followers.

At exhaustion, native G still clears each follower's old orders and calls attach0.
The genuine attach routine mutates record0 references and active accounting even
though the person's command slot remains0. Clearing an old command can free a slot
for a later follower's allocation retry: the tested three-person result is
`[0,1,1]`. This establishes native behavior; silently claiming failure preserves
orders is wrong. A modern port must explicitly choose/document its resource-limit
compatibility policy rather than accidentally reproducing sentinel corruption.

Raw supplied selected records with dead/protected/airborne/ghost/class0/training
fields still receive30. Another model7 person is included because exclusion uses
the exact tribe-Shaman pointer, not model7 alone. These are **producer predicate**
facts, not proof that all such selected states are reachable through ordinary UI
or that their later controllers accept a handoff. With retain0, clearing vehicle
passenger selection while visiting the first person causes the second person to
be skipped; retain1 processes both. A frozen prefiltered selection list would lose
that ordering in the nondefault branch.

An absent current Shaman pointer prevents both issuance and cancellation. A nonzero
stale/dead/class0/vehicle pointer is accepted by the producer, then rejected by the
guard consumer. Replacing the tribe-Shaman pointer does not retarget an existing
order; a new explicit G targets the replacement.

The caller executes `0042bfa0` initialization, `004999d0(0)`, action0xc1 in
`004aab80`, and packet0x82 dispatch in `0043e8e0`. Initial settings0 become0x10040
and emit retain1; preexisting0x100000 survives initialization and emits retain0.
The shipped key record is checked. Palette/globe/auxiliary initialization and
outgoing emission are additional supplied leaves. The captured third emission
argument is copied into a packet fixture, so the transport scheduler and real
keyboard/OS event loop remain unexecuted. This proves the default-clear override
branch and explicit override semantics, not a user's persisted original settings.

The current port has no analogous retain-selection setting in the inspected
page/store/world surface; `playerOrderInput` explicitly implements default keeping
selection. This supports choosing retain1 for the present G adapter, while preserving
the nondefault native result as a distinct compatibility boundary.


## Source-only handoff decision

Independently checked the map against actual world dispatch, preparation,
initializer, entry, construction, selection and vehicle callers. Ordinary on-foot
`u.native` with command30 and no conflicting earlier controller reaches
`stepLiveMovement` → `stepLivePhysics` → `preparePersonTurn` on the same record.
This supports the proposed narrow adapter integration point. It is not yet an
executed G-to-browser handoff.

The recorded exceptions are real: resting assumes an empty state10 queue and can
send it back to17; fight motion has an existing adoption bridge but its outer
visit ends before guard processing; flight landing does not universally install
its person into `u.native`; occupied entry state21 skips preparation, while other
entry dispatch can treat30 as training; builder logic reclaims/removes the native
alias and forces state10 without preparation; passengers can bypass person
preparation/dispatch. Common alias lookup order does not describe all world
branches, including exceptional states visited earlier.

Do not broaden raw producer acceptance into permission to initialize an invalid
projection. Resolve the actual owner, retain identity/phase/queue, and test each
supported controller's work/registration/selection cleanup and adoption. Default
retain1, explicit pool-exhaustion behavior, target-vehicle rejection and separately
signed coordinates are the finite implementation decisions now supported. Legacy
boolean saves require their own policy; they lack the historical target and phase.

The next work is the bounded port adapter and meaningful controller tests, then
ordinary Mission10 training/acquisition/move/G/deselect/repeat/cancel and save/load
observations. Further whole-world native physics is not a prerequisite for that
bounded implementation; it remains necessary for any later full natural Guard
stop/timing/phase claim. Fullcheck/build/browser/performance and maintained
TypeScript quality gates were not run: no runtime or TypeScript changed here.
