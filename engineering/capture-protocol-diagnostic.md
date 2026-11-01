# Opt-in Tutorial capture boundary diagnostic

Ordinary Tutorial invocation is unchanged. The dedicated `scripts/tutorial-browser/run-capture-protocol.mjs` entry is disabled unless explicitly opted in through the owned performance queue. No raw protocol log is persisted: the exclusive stderr observer retains only bounded method/session-hash/id/outcome/timing metadata; stdout is discarded. DEBUG_FILE is removed before the runner and diagnostic variables stripped from its direct build/git/Chrome descendants.

The template is deliberately NOT executable: fill only after review of a stable same-host queue scope, private immutable checkout, actual Node identity, installed dependencies and Chrome binary/policy. Do not use an alternate queue directory or kill a controller to bypass a source-envelope mismatch. No browser or queue execution was performed to prepare this proposal.

The trusted manifest digest is externally admitted alongside the CLI and Node by the queue. The builtin-only CLI verifies that manifest, its declared input bytes and Node BEFORE dynamically importing application helper sources. The17 entries include the supervisor dependency-profile import. This is not self-authentication, a sandbox, a complete runner dependency inventory or protection against concurrent source/install mutation. External admission must cover entry/manifest/bootstrap and immutable execution scope.

The observer windowComplete flag certifies markers only. Use all malformed/overlong/dropped/ambiguous/censored counters; no clean evidence if collection was lossy. Protocol logging still incurs upstream JSON serialization, pipe and scheduling overhead; measured boundary intervals are not browser CPU/encoding time. The observed screenshot was censored by a35-second episode timer; this diagnostic does not fix or relax it. Build120000ms, Tutorial240000ms and episode35000ms caps/assertions are preserved. The template900000ms is a proposed host ceiling, not an admitted plan.

Focused data/supplied-leaf checks:

```sh
node --test tests/capture-*.test.mjs tests/qualify-capture-inputs.test.mjs tests/integrated-capture.test.mjs tests/supervisor-extension.test.mjs
```

These tests never launch a real child/browser. Qualifier fixtures copy exact production checker bytes into an owned temporary directory with synthetic manifests and inert input files; they test admission logic, NOT installed Playwright identity. Historical exact locked-package verification remains separately recorded. Baseline line/hash fixtures anchor source compatibility, not runtime equivalence. Actual OS group cleanup/port absence, arbitrary transitive logging sinks and full Tutorial/browser success remain unverified. Do not automatically schedule this diagnostic from ordinary CI.
