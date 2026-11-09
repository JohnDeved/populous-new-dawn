# Bounded test concurrency: measured result

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/engineering/test-throughput-2026-10-16), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Measured source: `d5fd9b889dd6aa301d5e2b2d84362b843085259a`. Observation date: 2026-10-16 UTC. This is a predeclared single full C1-then-C2 pair on the same frozen source and installed dependencies.

## Result

The test phase fell from **38m 41.515s to 22m 42.663s**, an observed saving of **15m 58.852s (41.30%)**. Both runs passed the same **435 files and 2,809 cases**, with no failures, cancellations, skips or TODO cases. Full case hierarchy, case order, per-group counts and totals matched. No assertions or timeouts were weakened, and no library migration was made.

| Measurement | Serial profile | Bounded profile |
| --- | ---: | ---: |
| Test runner wall time, primary | 38m 41.515s | 22m 42.663s |
| Whole `npm run check` wall time | 38m 55.044s | 22m 51.563s |
| Reviewed 357-file group, 2,166 cases | 33m 22.090s | 17m 32.394s |
| Serial 78-file group, 643 cases | 5m 19.412s | 5m 10.262s |
| Whole-check reaped-child CPU seconds | 3240.743 | 3367.940 |
| Whole-check sampled aggregate peak RSS, MiB | 1136.488 | 1485.324 |

Whole-check observed saving: **16m 03.481s (41.26%)**. It includes typechecking, npm startup and the test runner; it is not an end-to-end development/build/browser timing. The comparison isolates bounded concurrency in the final runner. The serial baseline is that same final runner, not a rerun of the earlier ten-file-batch workflow, so there is no separately measured claim for batching removal or focused-workflow savings.

## Equal work and invocation

The literal command was `npm run check` in both conditions. Both used Node v24.19.0, the same 357 reviewed files followed by the same 78 resource-sensitive files, in identical declared order. Only the first group's file-process concurrency changed from 1 to 2. The 78-file group remained at concurrency 1. Built-in Node per-file process isolation was retained.

Both invocations explicitly set `NODE_PATH='' NODE_OPTIONS=''`; `NODE_COMPILE_CACHE` and `NODE_V8_COVERAGE` were unset. The profile was selected using `PND_TEST_CONCURRENCY=1` and then `PND_TEST_CONCURRENCY=2`. A separate private `TMPDIR` was used for each run. The environment's inherited nonempty `NODE_PATH` would trigger the conservative serial fallback, so an ordinary inherited invocation must not be described as necessarily using concurrency 2. The frozen configuration records the exact executable paths and overrides.

The original 2,795 cases were retained; 14 runner/policy regression cases bring this final candidate to 2,809. Native exit status, structured plan/group/final records, exact 435-file inventory, outer TAP summaries, and full indented case hierarchy were checked. Both commands exited 0, without interruption or cleanup signals. Before/after source, runtime, cache-artifact and dependency-byte identities matched. No observed owned process identities remained at release; unobserved escaped or short-lived descendants are not certified absent.

## Conditions and limits

- This is one full C1-then-C2 observation, not a full-suite repeatability study. There is no statistical confidence interval or guarantee of the same saving on another host. Serial-first order, warm state and host variability can influence the difference. The unchanged serial group itself varied from 319.412s to 310.262s.
- One fresh final-source typecheck warmup ran before the pair (10.489s). Its resulting incremental cache and generated type input bytes were then bound in the measurement. The whole-check comparison still has order/cache caveats.
- Complete node_modules and npm CLI content trees were fingerprinted before and after each run, outside timed wall/child-CPU intervals. This warms dependency pages for both profiles; neither is a cold-cache result. No dependency installation or copy occurred.
- The reused Linux x86_64 environment exposed 9 CPUs. Actual CPU/memory quotas were unavailable (`/sys/fs/cgroup` absent), and global host contention and historical unknown processes remain unknown. Coordinated agent-owned heavy work was serialized; this does not establish host-wide idleness or hardware capacity.
- RSS is the 100 ms sampled sum for observed PID/start-time descendants. The sampling is a lower-bound observation of instantaneous aggregate RSS, shared pages may be counted more than once, and short-lived or unobserved escaped processes can be missed. These are whole-check values, including typechecking, not test-only memory. CPU is the reaped-child `RUSAGE_CHILDREN` delta; native threads can make CPU time exceed wall time. No OOM or machine-capacity conclusion is drawn.

## Preliminary pilot and attempt record

An earlier eight-file/46-case pilot used C1, C2, C2, C1 on accepted main `d5768f9dd957a65c76c12a568a92d32ff164cac5`. All cases passed. Individual wall times were 46.760s, 29.880s, 29.211s and 46.003s. It is **preliminary only**: source/runtime/lockfiles were bound, but actual installed dependency bytes were not. Its observations are retained separately and are not used to calculate or extrapolate the accepted full-suite saving.

The earlier `f2a8a220` preparation and its 14.439s passing typecheck were superseded by source-policy repairs. Reported overlapping edit timing made it unsuitable as final-candidate proof; its raw receipt and qualification are preserved. No full check was launched on that preparation. The `0ed19f09` preparation draft was never launched. Final `d5fd9b88` preparation used a new warmup and configuration. Neither full formal condition failed or was retried. Writer-owned focused/lint failures during implementation are preserved separately in the implementation evidence; they are not silently converted into passing benchmark attempts.

## Measurement cost and conditional payback

Recorded benchmark command wall time invested was **64m 43.389s**: pilot 151.854s, superseded warmup 14.439s, final warmup 10.489s, and the two full checks 3706.607s. This excludes implementation, focused regressions, review, dependency hashing, preparation and coordination time. The formal series spanned 2026-10-16T05:01:53.497623+00:00 through 2026-10-16T06:04:12.833135+00:00; its extra elapsed time includes input verification outside the command timers. The two full checks also supplied full verification, so no third full suite was run solely for a separate gate.

At the observed test-phase saving, this recorded measurement-command investment is amortized after **5 comparable future full runs**. This is conditional arithmetic, not a forecast or a claim that the project has already saved net time. Focused test selection is available for shorter feedback, but no unmeasured end-to-end saving is claimed.

## Evidence identity and portability

- Frozen driver SHA-256: `035c8475190ccb3ba7c3a1f2b9cb6d229db59f842adcd46e1ddb8e466c9de03f`
- Frozen final config SHA-256: `80a45732efb79938c46563f72ba3f2c269b809fd3ccf3b12a00c7114a8a51e26`
- Full case hierarchy ordered SHA-256: `649f485930539d00b3f58709b55a2a16c6a2a92ac7950cc87fe1831c66f017e5`
- Full case hierarchy multiset SHA-256: `104b382c4138a7d5e721e8281a9986108caed947111d23b225992b3b51e337e0`
- Dependency tree manifest SHA-256: `b99b6678ec6e98f5fc49577adcd180417e4c4c13d91843e89da64953f50d7ca6`
- npm CLI tree manifest SHA-256: `76b5c06a9dc10ffb200477d5cc36e36ef0ef588153fc3db4d8afea99875e08ff`

See `measurement-results.json` for numeric results and `benchmark-artifacts.json` for every included file's original location, portable archive location, byte size and SHA-256. Raw receipts and logs retain their original bytes, including original absolute technical paths; the inventory maps them to portable locations. Identical superseded dependency manifests are deduplicated with both origins recorded. Private temporary directories and Python bytecode caches are excluded. The inventory also retains the preliminary and superseded/unlaunched artifacts rather than discarding unsuccessful or nonqualifying preparation.
