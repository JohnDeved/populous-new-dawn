# Observer contract attempt 01: receipt-launcher rejection

The authorized CPU4 invocation on `a688f484d18143f25e5ef7ea78ba56ac516e93d6` exited 1 at 2026-10-06 22:37:55.485 UTC, before starting any test or syntax child. The host passed an absolute output argument to `command-receipt.mjs`; its existing safety guard requires a relative JSON path under `work/orchestration/`. This is a host-launcher failure, not an observer-test result. Four contract tests and syntax remain unrun.

The exact host source, raw stdout/stderr and before/after source/tool fingerprints are retained. Source bytes were unchanged and the owned group had no remaining processes. No retry occurred. The proposed correction changes only the receipt output argument to the same repository-relative destination and chooses a fresh attempt directory; it requires a new bounded invocation grant.
