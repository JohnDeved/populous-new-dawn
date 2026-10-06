# One bounded Node launch proposal (not run)

Native oracle adoption is complete: raw result `bca1801056967b4d73e704e446c2252cc6b5da30244a5aa46a06a80eada8c8b5`,
independent review `d197450d2435afd93b0625fb43c55243a5aab545d6fd041c73dfb99e986623dc`;
expected rows and test body are unchanged. Remaining prerequisites: exact code
review ACCEPT, parent execution grant and exclusive CPU4 allocation. If any input,
Node binary, application source, expected row or boundary changes, stop and review.

Run from this branch's isolated worktree. Verify its reviewed commit and clean
tracked tree, then verify every218 source/input SHA256 in `source-binding.json`
and the recorded Node binary hash. Create one fresh ignored output directory;
never overwrite a preceding attempt. The proposed command is:

```sh
timeout --signal=TERM --kill-after=3s 15s taskset --cpu-list 4 \
  env NODE_OPTIONS= NODE_PATH= \
  PND_PREACHER_TERMINAL_OUTPUT=work/orchestration/preacher-terminal-turning-live/run-01/rows.json \
  /opt/codex/runtimes/codex-primary-runtime/dependencies/node/bin/node \
  --max-old-space-size=512 tests/preacher-terminal-turning-live.test.mjs
```

Use direct Node invocation to keep one Node process; the imported built-in test
runner reports the single test. Retain stdout/stderr, exact command, start/end,
exit/signal/timeout, process ownership and `rows.json`. Recheck all218 source/input
hashes and Node hash afterward. The15s TERM bound plus3s cleanup includes module
initialization; no package install, native code, browser, server or listener update.

Expected before a gameplay fix: acquisition and negative guards pass; exactly
three wrapper calls and three Preacher updates are retained; the terminal pair
fails with actual mode2/RNG1607832750 versus reviewed mode0/RNG3603658299. Exit1 is
a failure-first result, never a passing regression. An earlier fixture/import,
ownership, side-effect or resource failure rejects this expectation and is not
evidence of the cutoff residual. Do not relaunch or change supplies without review.

After a later reviewed gameplay fix, the same native expectations must pass. This
source proposal grants neither that fix nor either launch. Broader standard gates
are separately planned; this invocation proves no whole-world or rendered result.
