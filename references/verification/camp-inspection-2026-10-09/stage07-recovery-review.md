# Interrupted stage 07 recovery

Decision: ACCEPT one isolated rerun of the exact tests-07 argv, followed by the unchanged unrun tests-08 and static/build stages. Preserve completed stages; do not rerun the entire suite. This is admission, not a pass or an old-process cleanup claim.

Readback on 2026-10-09 at approximately 18:33 UTC confirms canonical clean merge `4e8356ef043d9963abd16a840c3246abc972fe48`, tree `158391790e41b3b4f72f9340fba05885c6837654`, dependency inode 538212 and accepted profile `419b8eb80e02c18dd89f2fa3bfb6c7f5f200afb7fc2a19305b9de93b826abe7e`.

Old tests-06 receipt SHA256 `29b6f51cd733abc41ae1b4823faa9e3cd07f4ad0827c35ce85db1bb7ad8b05ae` is terminal PASS/exit 0, 18:18:44.753–18:19:13.055 UTC, stable source, with final outer summary 328/328. Its raw stdout is `cb795316db08910616d7cdfc82d6ce10cebd4bd9219cd327da78e4da98964763`; stderr is empty.

Old tests-07 receipt SHA256 `bf56fc303b6667f916c413c6f9adad9eebfe1e6cc3f7df58600b99e693f409e1` remains unknown/prepared from 18:19:14.548 UTC, without finishedAt, exitCode or sourceAfter. Partial stdout is 5,461 bytes, SHA256 `bdfb8bb7c41d549c61fa95cf84bebf7ec5334c07e6db56ab3722c1062765ac1a`, without terminal summary; stderr is empty. Retain this receipt, its old artifacts and old TMP/cache untouched. Elapsed wrapper limits and lost orchestration-session access do not establish termination or cleanup. Assign this attempt no test/pass credit.

I inspected the 33 tests named by tests-07 and the relevant imported local helper/source closure for shared mutation. These tests read source/assets/JSON and mutate process-local model, DOM, renderer and THREE fixtures. The Node scene loader uses readFileSync/existsSync and in-memory TypeScript transpileModule, with texture loading supplied. The timber comparison helper is pure fixture/model work. Store checkpoint calls have no IndexedDB backend in this Node context. No repository/dependency write, shared output writer, child-process/native/browser launch or listening port was found in the stage's exercised test/helper paths. Installed TypeScript/THREE and other dependencies remain read-only. This supports concurrent-safe filesystem isolation if the original process cannot be observed; it does not prove the original process exited or remove resource uncertainty.

Recovery conditions: exact accepted source, test argv and installed dependencies; a new receipt/artifact destination; fresh private TMP and NODE_COMPILE_CACHE; unchanged CPU 5–7 and inner 180-second/outer 200-second stage bounds; no writes to or cleanup of the old attempt. Continue only on a terminal, source-stable successful recovery receipt, otherwise stop. Remaining stages use the accepted plan and fresh scratch paths. Final aggregation must distinguish the retained unknown attempt from the one accepted terminal coverage row for tests-07, and must not count partial old output.

Read-only reviewer inspection; no test, application, package, native or browser execution.
