# PR220 independent source and focused-runtime review

**ACCEPT the bounded implementation at `c20a297f5f815ce404f796b08f77ea56396f96da`
for final full/quality/rendered gates.** No remaining concrete source defect was
found. This is not merge-ready acceptance: final-head full check/build/typecheck/
quality and ordinary Mission10/UI Save/Load evidence remain required.

Base `3b899125cc8cedef938823718ad5d44f49957b66`; final tree
`9af7241660efc11eb8969845ab7e587231d906bc`. Tracked source is clean. Reviewed the
complete original ddd0904 diff and both substantive repairs, covering all final19
changed paths. The [final source manifest](../native-shaman-guard-input/source-manifest-c20a297.json)
matches all19 path hashes and5 receipt hashes; SHA256
`0c3fb40f5a584824da3faac2180fdb9fbf275ae60196be9292fac8e6b679dcd3`.

## Accepted behavior and limits

- The small G producer preserves native shared allocation, reference cleanup,
  replacement, exact current/saved Shaman identity, default retain1 and active
  state10/status30 cancellation. Exhausted allocation still clears/attaches0 and
  can retry a newly freed slot on a later follower; the sentinel accounting is
  explicitly disclosed. The live adapter uses existing unit-array roster order.
  It does not claim native linked-list identity/order equivalence under exhaustion.
- The whole selected batch uses native input only when every follower has a
  supported ordinary native owner. Busy/mixed batches retain the old operation.
  Legacy boolean checkpoints keep their missing-target/history policy; no native
  order, historical phase or marker is manufactured from the boolean. Raw stale
  native producer predicates do not expand live eligibility.
- The optional same-person marker retains animation and dispatch ownership through
  replacement/cancellation state10/status0, without status spoofing or phase writes.
  It survives pause/clone-migration, protected preparation, protected cancellation
  and relevant early returns; it is cleared on completion or explicit supersession.
  Brave guards cannot fall into legacy auto-housing. Clone/migration tests are
  supporting storage evidence, not the outstanding ordinary browser Save/Load gate.
- Separately signed distances match all28 original decisions. Vehicle targets
  finish guard even when `inside` is null. Cancellation and completion share the
  raw saved-target anchor, including dead/class0/vehicle targets in another cell.
  Absent retained target records use the disclosed follower-position fallback;
  full original removed-object-pool history remains outside the claim.
- Native vector extraction checks the three immutable raw-result hashes. Tests
  reconstruct and verify full before/after pool hashes before comparing every
  observed person field and pool byte except model30's proven-unused `b`. Other
  command models retain exact `b` comparisons. Reused port `b` is honestly retained;
  raw bytes and hashes are not relabeled equal. The lifecycle vectors are retained
  evidence, with three actual deferred-setter phase comparisons, not a false claim
  of replaying every stage in TypeScript.

## Review findings repaired

The earlier protected-cancellation marker and invalid-target completion-anchor
findings are repaired, with focused regressions. This review found two additional
issues; both are fixed on the accepted head:

1. **Building-contained target.** At ddd0904, a public Shaman→Tower command reached
   real occupancy state21/vehicle0/hp100, then incorrectly removed the follower's
   guard. Original `0043daa0` uses `0040a3f0`/`004044b0` to resolve the building
   outside point. Repair328aad3 removes only the incorrect `inside===null` filter.
   My original [command-driven repro](check-contained-target.mjs) now passes;
   the maintained test also verifies fresh-G destination, cancellation anchor,
   reference/count ownership and separate vehicle rejection.
2. **Same-turn supersession.** Before c20a297, release/resting initialized a queued
   G before clearing it when move3/attack19/worship27/entry replaced it. This changed
   source/target/speed/RNG without a logical visit. c20a297 narrowly clears a real
   pending G before that eager resting initializer, for non-preserving release and
   direct route replacement. It preserves native bit16.

The independent [original caller probe](check-native-supersession.py) executes
`00444f60`→actual clear/attach→initializer: only replacement3 is configured, never
discarded30. Bit16 survives and legitimately configures replacement3 again at the
next `004d42a0`. Its sole additional intercepted leaf is acknowledgement00436330,
besides the accepted destination/UI leaves. Script SHA256
`4d41f43b90d27354fa5c01dfc601d064f800e7b9b99f6c5694feb18a0d1605d5`;
[result](native-supersession.json) SHA256
`f27f202d9f936df58d1c1b1359a807649cfdee75ae79c89a99447bf2c5dc3a8a`.

My independent [post-repair control](check-next-controller-visits.mjs) exercises
all four public replacement commands through three logical/controller visits.
Immediate source/status/target/speed/RNG match the no-G control, apart from the
legitimate removal notification. The same person is retained; no Guard queue,
count or marker survives. Move/attack/worship consume bit16 on their first visit.
Entry's fresh first visit installs command8 while retaining bit16; its second real
preparation consumes it. This establishes the current entry owner transfer and
absence of stale-G dispatch, **not complete original entry-scheduler equivalence**.
[Control result](next-controller-visits-c20a297.json) SHA256
`c0109beabbb9428a0732fc835cf6f2c40124d56c8cb2b080c26bda9e4d4922c1`.

## Verification

- Final independent CPU4/timeout60 replay: `node --test
  tests/shaman-guard-input.test.mjs tests/shaman-guard-native.test.mjs`, exit0,
  **104/104 passed**, 8.8seconds. [Log](focused-c20a297.log) SHA256
  `521e2bf4e8e0bb9e5913346b5c3930faeec85d74f0df1d709d11ba3bb4b38f72`.
- Earlier ddd0904 independent replay passed99/99, the two changed existing
  game/follower-classification tests passed, and read-only vector `--check` exactly
  reproduced the tracked fixture. Baseline evidence has20/45 live failures and
  5/28 signed-distance failures, with25 legacy controls passing; these are actual
  assertion failures, not module/setup failures.
- Three independent move-supersession controls passed for pending issuance,
  replacement and cancellation. Final four-command/three-visit controls and
  original caller proof passed. No browser, dependency mutation, fullcheck/build
  or performance job ran during this review.
- TypeScript change is small and reuses existing queue, preparation, anchor,
  selector and dispatch machinery. No new global clock or animation engine.
  Prior scoped ESLint stdout is byte-identical to baseline210 errors; normalized
  Oxlint reports388→388 with none introduced. The app-only ff0d3b4→ddd0904 diff
  reproduces quality receipt SHA703249dc84a1333a29f58a0a4df474117f4b4f2792e7beee75646d63ebd11c86,
  so that earlier scoped format/typecheck correspondence is verified. The later
  source changes still need exact final-head quality checks. No final Fallow or
  performance result is claimed.

Final ordinary acceptance must use real Mission10 Firewarrior acquisition and
public G/deselect/repeat/cancel/following/Save/Load. Mechanics fixtures do not
replace that witness. Busy-controller migration, full native route/physics,
physically settled Guard and uninterrupted historical animation phase remain
outside this bounded acceptance. No parity credit or deployment is approved here.
