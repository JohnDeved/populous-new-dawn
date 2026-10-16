# Thread CPU accounting diagnostic: slow blocks are mostly current-thread CPU

Two serial block-mode v2 processes completed with exit 0. The same archived phase, immutable-input, attribute-version and source fingerprint checks passed. No production source or prior evidence was modified.

The candidate's last 64 changed-turn calls took 498.864 ms wall time, 498.848 ms current-thread CPU and 498.841 ms process CPU. At indices 320–383, the corresponding readings were 391.609, 391.198 and 391.190 ms. Other candidate blocks also closely matched. This run therefore does not show a large unaccounted wall-time gap or helper-thread-only explanation at 64-call resolution. It does not distinguish JavaScript, native, JIT or GC execution. Block totals cannot localize each sample's CPU usage.

Candidate: seven calls exceeded 10 ms, maximum 11.947508 ms at index 494/phase 239; zero GC entries observed. Baseline: fourteen exceeded 10 ms, maximum 14.747637 ms at index 422/phase 167; 54 GC entries observed. Baseline thread CPU also closely followed wall time. The prior 48–60 ms candidate maxima did not recur, so this run cannot account directly for those earlier spikes. These diagnostic runs do not establish a speed, FPS or smoothness improvement.

Wall bounds enclose current-thread CPU reads, which enclose process CPU reads. Endpoint intervals differ slightly; raw differences are approximate and same-key microblocks especially unreliable. Existing empty-body controls do not directly measure the additional thread-CPU boundary pair. GC overlap remains correlation, absence of recorded GC is not a proof of no collector activity, and heap deltas are not allocation rates. No forced GC, per-call CPU probes or between-call/block yields were used.

Raw files preserve all 512 samples per case, block CPU/resource/memory data, GC events and controls. diagnostic-thread-summary.json reproduces their summaries. The API is Node process.threadCpuUsage, current execution thread user/system microseconds, distinct from aggregate process.cpuUsage. This experiment remains draft with prior local typecheck failures unresolved.

Independent review verified all summaries, archived phases/invariants, 341 candidate and 339 baseline current fingerprints, and empty stderr. Aggregate changed-case wall/thread CPU was 2828.601761/2827.294 ms for candidate and 3123.695519/3122.253 ms for baseline; all 16 block gaps were below 0.5 ms. All seven candidate >10 ms calls fell in the last block. Review recommends no further measurement without a separate targeted hypothesis.
