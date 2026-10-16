# Plain-person replay comparison views

Base: c9e3cbc8003be7c9b3fc489d794297679476d2b9.

This test-only change reuses the accepted non-mutating checkpoint comparison view. The prior local normalizer deep-cloned two whole worlds on each of 1,200 ticks, in both fresh and historical cases. The exact original undefined-reward/truthy-rewardMana policy remains in the shared helper.

The new startup checks compare each actual live/restored world against the retained old clone-normalizer. All four worlds are checked. Every paired replay tick and deep equality assertion remains, as do the mixed-team, full-capacity and released-world branch clones. Fresh setup is still earned through the original commands, and historical setup still uses its full verified checkpoint.

Structural reduction: 4,800 per-tick comparison clones are replaced by four startup oracle clones. This is an operation count, not a speedup claim. Accepted Full490 observed fresh/historical case times of 23.345939536 and 21.355500934 seconds on a different concurrent hosted runner (run38914211820, job117017391625, tested merge1dd4a1a6c6ee943c49d9282fe021e06d2f672f18). The original test blob is identical at that merge and this base.

Views must be used synchronously and never retained or mutated. Initial incompatible aliases/prototypes/symbol shapes fail the domain checks. Current world initialization, world turn, effect and command source blobs match the earlier reviewed e1188916 alias audit: persistent shrine IDs/coordinates are retained rather than whole shrine objects, and linkedShrine promotion deletes its old reference before tick returns. This helper is not a generic arbitrary-object clone replacement.

Validation uses the existing five-case differential oracle suite and one capped serial run of the two changed replay cases. Embedded source-bound receipts include raw output, exit/signal and before/after fingerprints. Runtime measurements are observations only; no whole-suite or FPS saving is inferred. Required hosted checks remain authoritative before merge.

Focused results: existing helper oracle 5/5 passed; both replay cases passed with no skips, exit 0 and empty stderr. All source fingerprints remained unchanged. Fresh case 17.238109483s, historical case 17.357984877s; receipt interval 36.165s. This is a serial local observation, not a controlled comparison against hosted Full490.

The manifest preserves pre-execution preparation metadata; its “not run” field describes that earlier checkpoint. The oracle and replay receipts record the completed execution above.

Resource policy: only this already-parallel test's source fingerprint changed. No concurrency classification or gate changed. The recovered executor's existing Node customization makes the default planner conservatively select serial execution. A plan-only invocation with NODE_OPTIONS, NODE_PATH, NODE_COMPILE_CACHE and NODE_V8_COVERAGE unset confirmed the existing reviewed 364 C2 / 79 serial plan. The focused runs used the existing executor environment; they were not rerun under the sanitized planning environment.
