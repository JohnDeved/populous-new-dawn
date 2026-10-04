# Owned game profile source preflight

Decision: **ACCEPT for the coordinator-authorized short runtime proof only.** Final PR acceptance is pending the two ordinary UI invocations and required repository gates. No browser, server, build, install, dependency copy, public comment, or merge was performed by this reviewer.

Base: `f78e5c17757ce061b8b159da150536ee690e6b6f`.
Reviewed head: `d9f518e830cd8a6848ea0ed220733607c0e270d4`.
Working tree was clean at final verification on 2026-10-04 20:39 UTC. Full eight-file diff reviewed, including all repairs after original candidate `69e3e334dc5a74fa0ff60462d06802db48022f54`.

## Resolved findings

1. Original startup checkpoint mismatch failed the run but then marked continuation verified, finalized the changed checkpoint identity, and released the lock. Production-function fault probe reproduced this. Repair requires successful initial identity verification plus unchanged source/runtime/scenario, and finish independently rejects unverified continuation. Mismatch now leaves the prior manifest/lock untouched.
2. Original JSON replacer conflated actual nonfinite game effect durations with null, Map values with lookalike objects, and different DataView bytes. Retained digest probe reproduces these collisions. Tagged encoding now preserves nonfinite numbers, negative zero, undefined, sparse arrays, object/type distinctions, Map/Set entries, buffer/view bytes, aliases and cycles, with node/depth/serialized-size bounds. Shared encoding is used for committed storage and the Load boundary.
3. Symlinked application source could consume changed runtime bytes without changing the application binding. Retained symlink probe reproduces this. Persistent profile source inputs now reject symlinks.
4. External/ignored scenario bytes were recorded per run but escaped the checker-continuation review. Persistent scenarios are now repository-enumerated checker files and must be the named module's actual default export. Ephemeral scenarios keep their existing contract.
5. Profile/output aliases are rejected before log creation; the original symlink-error test now passes. The synchronous Load observer catches diagnostic clone failures and unsubscribes before an outer assertion reports them, preserving normal shipped Load behavior.

## Validated boundaries

The default remains ephemeral. Persistent options preserve sandbox and explicit debugging pipe; `ignoreDefaultArgs: true` is paired with the actual owned `--user-data-dir` and blank startup page. Inspected installed Playwright 1.63.0 `coreBundle.js` (SHA-256 `549070af3acabb3efcc4f55bfe6210f9f7c2fcf633cf7eaa59bfe60719969171`): ignoreAllDefaultArgs uses only supplied args; persistent-context close reaches browserProcess.close and awaits disconnection. Runtime proof must use the coordinator's independently verified official Headless Shell binary.

Profile path/root, origin/port, application inputs, installed lock/Playwright/Node/browser/harness bytes, and exclusive owner lock are bound. Unknown metadata, existing unknown profile, wrong binding, symlink paths, and browser Singleton ownership markers fail closed. No stale-lock recovery exists. Failed gameplay assertions may finish only with verified cleanup and provenance; close failures, close timeout, still-connected browser, missing terminal checkpoint observation, source/runtime drift, startup mismatch/read failure, navigation failure, and rejected launch do not release the lease.

The IDB observer uses readonly transactions, waits transaction completion, never creates missing storage, and exports only bounded summaries/digests. The scenario uses shipped Mission 1/Save/Load/Pause controls; its diagnostic subscription copies the replacement synchronously, before shipped Load clears pause and ordinary RAF resumes. No game/model/tick/storage injection is added. Profile storage stays ignored and private; only bounded receipt/manifest metadata is evidence. Persistence is limited to normal closure on this machine, with no cloud-reset guarantee.

The added scope is proportional: one opt-in lease, one checkpoint observer, one two-phase scenario, and focused tests/docs. No recovery framework or application/M3 changes. Maintained TypeScript quality gates are non-applicable to this MJS/docs-only change; normal repository check/build gates remain required.

## Evidence

- `node --test tests/local-render-harness.test.mjs tests/owned-game-profile.test.mjs`: 19/19 passed at exact head, independently repeated. Author source-bound receipt: `../owned-profile-9f-preflight/focused.json`, verified clean same-head before/after and exit 0.
- `node work/orchestration/owned-profile-review-69e3e33/fault-probe-expanded.mjs d9f518e830cd8a6848ea0ed220733607c0e270d4`: 13 production-harness fault cases passed using runtime-only fakes, no browser/server. Raw output `fault-expanded-d9f518e.log`; structured `fault-results-d9f518e-expanded.json`. Named module import is stubbed to the actual supplied fixture callback. The production function comes from exact `git show` bytes.
- `real-world-shape-d9f518e.json`: synthetic Node `createWorld(1)` checkpoint shape encodes successfully and keeps the same full/component digests after structuredClone. This validates type coverage only, not gameplay.
- `git diff --check f78e5c17757ce061b8b159da150536ee690e6b6f HEAD`: passed at reviewed head.
- `orchestration:plan` was inspected and run without executing checks; unmapped harness paths conservatively select repository check plus workflow structural/tests. Full check/build: not run by reviewer, pending coordinator resource grant.
- Earlier reproduced failures retained in `fault-results.json`, `digest-results.json`, `symlink-results.json`; fixed-startup probe in `fault-results-7153bcc-expanded.json`.

## Remaining acceptance

Review two separate terminal invocations at the same exact source and origin: first created profile and shipped Save commits a non-null Mission 1 checkpoint; actual browser closes; second reuses the same profile ID, chains prior run/receipt, reads the same checkpoint digest, and shipped Load restores saved level/turn/time, actor, terrain, stock component digests at the synchronous replacement boundary. Confirm normal auto-resume then ordinary Pause, genuine screenshots, both cleanup/continuation statuses, owner-lock release, and required standard gates. No UI persistence claim is accepted from source/unit tests alone.

M3 owner was informed of the receipt/profile/checkpoint API and persistent named-default-export contract. M3 must continue requiring exact previous/current source fingerprint equality even though the general harness offers reviewed checker-only correspondence.
