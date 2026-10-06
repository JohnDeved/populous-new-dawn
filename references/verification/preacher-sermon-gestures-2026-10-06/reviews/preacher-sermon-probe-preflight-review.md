# Frozen sermon probe preflight review

2026-10-06. Reviewed clean `c169cf80b287fa2f166113409a6a30dd242faf38` over corrected parent `e72837e42ca445ac1220d6c8a1291c0d71adec3e`. Manifest SHA-256 `5e01eb2c7c02179051f0e2b239c7ad067d7cbf28e11569d9663846a46c61526a`.

**BLOCKED on two receipt repairs; ACCEPT the finite cases, native/port composition and supplied boundaries.** No additional case, game behavior, asset or framework change is needed.

## Required repairs

1. `compare.py:68–130,393–424`: source/input/node checks occur only before execution. Add terminal checks against the originally captured manifest expectations and original manifest bytes before a diagnosis-supported result, and in failure handling. Preserve a source-bound failed/blocked record on drift; do not reload a changed manifest and validate against its replacement values. The parent's planned source-bound outer receipt is useful additional evidence.
2. `compare.py:410–413,426–434`: Node TimeoutExpired currently bypasses stdout/stderr writes and retains only its message. Catch that exception, save captured stdout/stderr and timeout/child status, then retain the normal blocked outcome. Python subprocess.run already kills and reaps its direct child on timeout. Static imports contain no process-spawning code; no new child-management framework is needed. The outer87-second TERM plus3-second kill bound must target the task-owned process group, as the parent specifies.

## Accepted inspection findings

- Exactly27 cases:5 main traces with41 pairs plus22 single-call boundaries,63 total. No open-ended search, full person dispatch, approach, native process launch, importer, package/browser/server or expanded emulation route.
- Actual sermon, stop, upper/lower setters and mode2 updater execute under exact decoded-address/CALL-target restrictions. The fixture supplies byte-counter increment, eligibility stamp and one updater. Command32 completion deliberately does not run an outer queue; the plan discloses retained-owner limits.
- Actual acquisition is intercepted with the necessary status-bit2/count/first-angle effects. Main empty-listener cases suppress subsequent turning. Registration and reveal no-op domains agree with indexed exports. Prior-listener sound uses old assignment64; late positive acquisition cannot request a retroactive sound. Audio RNG is explicitly unexecuted.
- The port calls the current stepPreachingOrder, stopPersonMovement, setPersonAnimation and stepObjectAnimation. Port callback effects match the declared live-adapter domain. Native game/player/tribe/updater flags match supplied port inputs. The extra footprint suppression is inert for this fixed source family and no real-world equivalence is inferred.
- Full256-byte raw records, decoded fields, commands/order, both RNGs and all four phases are retained; no broad ignore or normalization. Port lower-setter intent and acquisition-facing event differences are honestly labelled. The core assertions prove98/99 birth failure, no-decision draws, final/return timing, active counter32 no-redraw, and95/97 reset plus assignment16 differences. Existing arrival/timer/command32 discrepancies remain diagnostic rather than widened repairs.
- Native executable mapping is9,748,480 bytes plus262,144 fixture bytes. Guest writes are restricted to the supplied person, bounded stack and two RNG words. Per-call100,000 instructions/1second, total60seconds native,15seconds Node and80 controller maximum are fixed. Input/output paths are frozen and output existence rejects a rerun.
- All actual local port imports are present in the source hash manifest. Corrected inline-producer and entry-reset documentation is explicit. Native instruction and input identities are checked, with no full-game execution claim or ptrace-denial workaround.

## Static validation

`PYTHONDONTWRITEBYTECODE=1 ../prerequisites/venv/bin/python decomp/research/preacher-sermon-gestures/compare.py --validate` exited0: preflight-passed,27 cases,63 calls,22 boundaries, exact manifest hash above; native/port execution not-run. Independent standard-library AST/import-closure review found no unfrozen local import and no mapped-field overlap; original scope-review SHA matches. `git diff --check e72837e4..c169cf80` exited0.

No native, Node or browser instructions executed. No tracked edits; only this ignored review file. Implementation still requires actual separately granted comparison and the ordinary baseline.

## Repair re-review: ACCEPT

Reviewed clean repair head `19c88e1ceabbfe28ed8524410aaf2b1dfaf6bd3d`, manifest SHA-256 `125acb5330e5487c7c5bd6438c13c2ec975ecb9d04538560ee9898d885b4a3b7`. **ACCEPT the frozen source preflight. Both required repairs are resolved; no remaining source-preflight blocker.** This is readiness for the parent's separately authorized component execution, not permission or a native result.

`prepared()` now captures the original manifest bytes. The finalizer always checks those bytes and the originally captured source/input/Node expectations on success or handled failure; it records individual actual/expected hashes and suppresses diagnosis-supported output on drift. TimeoutExpired now preserves exact partial stdout/stderr bytes and a timeout status before entering the same blocked/finalized path. The direct-child kill/reap contract remains standard subprocess.run. External forced termination without postflight remains blocked, using the parent's task-owned87-second TERM plus3-second group cleanup and outer source-bound receipt.

Independently verified native/comparison/assertion function ASTs unchanged, cases.json and compare-port.mjs byte-identical to c169, and the retained host-test script/runner hashes match its receipt. Reviewed all five host-only success/drift/failure/timeout checks and their assertions; these tests do not claim real child termination. The corrected static `--validate` exited0 with27 cases/63 pairs/22 boundaries and exact125ac manifest; `git diff --check c169cf80..19c88e1c` exited0. No native, Node, application or browser execution in this review.

The accepted next run is the existing fixed compare.py `--execute`, only after the parent supplies its separate grant and CPU4/90-second outer bound. Preserve output-directory exclusivity; no retry/expanded cases/native paths. Implementation remains blocked until actual comparison results and ordinary current-source baseline are reviewed.
