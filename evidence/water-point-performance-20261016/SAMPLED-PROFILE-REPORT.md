# PR483 sampled CPU diagnostic

Both planned processes completed with exit 0. No further run is proposed. Existing 256-phase/archive invariants, every raw-derived summary and current loaded-input hashes (341 candidate, 339 baseline) verify. Both stderr files are empty. Source remained immutable; only scratch runner/artifacts were added.

## Result
At the resolved stack level, candidate work is dominated by updateWater: 2256.196 ms of conservatively included weighted samples, versus 118.423 ms separately resolved as waterPointValues (about 5% of 2383.861 ms included). Baseline resolves 2185.938 ms as updateWater and 773.452 ms as waterPoint, plus 36.564 ms labelled garbage collector, within 3001.611 ms included.

Candidate precompute sample weight increases from 44.784 ms in the first 256 calls to 72.553 ms in the last 256 calls, while updateWater remains dominant at 1104.891/1136.110 ms. These are weighted sampling observations, not measured function durations. Inlining and unresolved work within updateWater prevent identifying retained vertexLighting, attribute writes, or inlined helper cost separately. This profile does not establish the cause of prior tail regressions.

The candidate profile's maximum call is 13.698 ms and baseline's 17.919 ms; prior 48–60 ms extremes did not recur. No causal claim or speed/FPS comparison follows from this instrumented pair.

## Clock alignment and perturbation
Profiler.start request duration was 357.907 ms candidate and 339.564 ms baseline, outside timed blocks. The largest profile timeDelta in each profile belongs to startup/request handling and is excluded from workload regions. Profiler.stop request duration was 14.916/14.189 ms.

Assuming each profile start/end timestamp occurs within its corresponding request bracket and clocks share a monotonic rate, the intersection of independently derived clock-offset intervals has width 14.777 ms candidate and 14.083 ms baseline. No numerical clock-origin equality is assumed. Analysis retains only weighted sample intervals fully inside each region for every offset in that interval. Therefore whole-case and first/last-half attribution is supported at this coarse level; individual 10 ms call attribution is not. Start/stop and sampling affect execution; historical v2 is not a contemporaneous unprofiled control.

## Decision
Inconclusive for the tail cause. The new precompute helper is not the dominant separately resolved sampled frame, but cannot be absolved because of inlining/sampling limits. Keep PR483 experimental. Do not add more repetitions merely to obtain an outlier. Any next diagnostic needs a distinct hypothesis and authorization; a line/optimization-state investigation of unresolved updateWater work may be considered separately, without disabling optimizations to create artificial production results.

## Reproduction and artifacts
Runner: diagnostic-sampled-cpu-v3.mjs. Analysis: analyze-sampled-profile.py; output sampled-profile-analysis.json. Raw profile-{1-candidate,2-baseline}.{jsonl,cpuprofile,stderr}. BENCH_SOURCE_ROOT names the original immutable variant snapshots; DIAGNOSTIC_MODE=block, BENCH_PROCESS_INDEX=1/2, PROFILE_OUTPUT names the profile file. Each process used timeout 120s and --run. Output reserve exceeded 4 MiB at each runner check. Local inspector Session only; no listening inspector port, dependency install, production change or per-block yield.
