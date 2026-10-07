# Issue252: focused height green proposal

**Unexecuted proposal.** The exact independently reviewed runtime patch is now
applied at `0acbe338745a8e9007bc8945e7d1d6c831703eb2`, after accepted failure-first
result `b66f3a90661da4c394669f888758f8260c907bcc`. This packet still requires exact
independent source/preflight acceptance and a separate parent CPU4 execution grant.

The only production delta from accepted integrated main
`e3a7a06a4250457502288d5b4c4e4ad8f3b40b53` is the reviewed root-height clamp in
`app/level-start-runtime.ts`: root signed height is grounded once before adding90;
all32 existing child allocations and their own clamps remain in the original order.
The accepted angle file, height test, text patch, native oracle and red evidence
remain byte-identical. See [source correspondence](source-correspondence.json).

## One unchanged four-test command

`node --max-old-space-size=768 --test --test-concurrency=1 tests/startup-burst-height.test.mjs`

Expected Node exit0 and four passes: retained original-byte oracle plus Missions1–3
through `createWorld` and70 existing ticks, with the already reviewed synchronous
birth observer. Require all256/256/512 detached birth records to satisfy offset90,
angle RNG ownership, speed/lifetime/state and age checks, and every authored enabled
stone to produce32 births. The red run's first height failure prevented the later
per-birth and final per-stone assertions from executing; green must reach those
unchanged assertions.

After terminal collection, independently compare the three emitted integrity
objects exactly to the pinned accepted red `diagnostics.json`, including gameplay
and cosmetic RNG words, IDs/counters, stone turns and phase histories. Node pass
alone is insufficient. Retain raw output, the comparison and independent verdict.
Any failure requires review before another attempt; no retry or assertion change.

This is fixed-step production-caller evidence. Ordinary elapsed rendered startup,
post-wave native absolute terrain, old-stone ownership, integrated quality gates
and broader startup/angle regressions remain separate. The accepted native component
still has one supplied arrival, raw terrain, disabled audio, successful allocations
and two call-site-qualified presentation supplies. It is reused without execution.

## Existing host and exact boundaries

`launch.py` is the accepted red host, with only two red-to-green labels changed.
The manifest keeps the exact child argv and all host/process ownership behavior:
CPU4, child40s TERM plus5s grace,45s CPU,768MiB Node heap,32MiB files, FD128, core0;
host absolute50s TERM/55s final boundary,1GiB aggregate RSS,32MiB output with256KiB
terminal reserve. One fresh directory, one invocation, no background watcher.
Owned PID/start/session/groups, actual terminal residual checks and full before/after
source/tool/manifest hashes remain mandatory. The supervisor is the existing
`command-receipt.mjs`; no dependency install, browser, network or native invocation.

Require command receipt passed and host passed, unchanged inputs/HEAD, released
resources and no remaining owned process/group. The exact clean packet HEAD is
supplied only by the parent grant. The named fresh execution worktree does not yet
exist. Preparation parsed source and checked bytes/hashes only; it imported no
application/test modules and executed no simulation.
