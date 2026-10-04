# Checkpoint readback repair: retained acceptance evidence

PR [#197](https://github.com/JohnDeved/populous-new-dawn/pull/197) merged as
`ea521248b64f0993f4b9884b8e070fb20c4cbbe1`. This separate evidence commit preserves
the accepted candidate `f8a6650d581bb9860598e641c4f862c0284e47fa`; it adds no game
or checker behavior. Accepted main before the feature was
`76df601a76c54b291cc7867021c45022382720dd`.

The caller previously stopped polling when its asynchronous IndexedDB predicate
returned a Promise, even if that Promise later resolved false. It now awaits
sequential reads with the existing helper, closes each opened database in finally,
and requires literal true before reload. The version predicate and later restored
world assertions are unchanged. Three hundred attempts permit 29.9 seconds of
pauses plus read latency. An indefinitely pending read still awaits settlement;
this standalone checker has no verified outer hard deadline.

## Evidence and limits

| Evidence | Result and scope |
| --- | --- |
| [Exact final check](receipts/check-final-f8a6650.json) | Passed typecheck, 994/994 tests, parity and orchestration; no failed/cancelled/skipped tests. |
| [Exact scoped ESLint](receipts/eslint-final-f8a6650.json) | Passed both changed MJS files with empty diagnostic streams. |
| [Focused repaired callsite/helper](receipts/focused-repair-committed.json) | Five tests passed on `fb886ac`; both repaired source files are identical in final candidate `f8a6650`. |
| [Failure first](receipts/failure-first.json) | Original caller failed delayed false-to-true and exhausted-false tests; read rejection already passed. This retained failed result remains failed. |
| [Historical production build](build/build-final-cf43509.json) | Passed on `cf4350944ac2d77fbe97ab5dfe9f78b4aa71c3b8`; carried, not rerun. [Correspondence](build/correspondence.json) verifies 13 production Git objects, installed-lock equality and raw logs. |
| [Prior real-IDB helper evidence](supporting-browser/correspondence.json) | The unchanged helper passed ordinary save/readback and fresh-page load in PR196's lifecycle browser run on `8ef89e3`; saved Mission3 turn122 returned committed=true. This is supporting helper evidence, not a new browser execution of this repaired standalone caller. |
| [Final independent review](review-final.md) | ACCEPT for exact `f8a6650`, no unresolved blocking findings. |

The actual-callsite test executes the maintained saved-snapshot/readback/reload
block with asynchronous fake IDB requests. It checks delayed success, 300 exhausted
reads/299 pauses, read rejection, cleanup on success/false/rejection, no overlapping
reads or open database lifetimes, and no reload after exhausted/rejected reads.
The five focused tests are also included in the final aggregate.

No browser replay, game fixture, new production build, deployment, parity credit,
native equivalence or hardware-performance claim is made. Existing real-IDB helper
evidence does not carry the entire earlier browser runtime result to the newer
transport app. The [audit](audit.md) retains the bounded remaining inventory and
the corrected Menu/Game settings finding.

## Portability and verification

`sha256-manifest.json` lists SHA-256 and size for every packet file except itself.
The [source/input manifest](source-input-manifest.json) maps copied artifacts and
source snapshots to original paths, commits, Git objects and SHA-256 hashes.
Receipts and raw stdout/stderr are copied byte-for-byte, including original
absolute artifact paths. Their portable streams are adjacent in each matching
`.json.artifacts/` directory. Original paths are provenance, not prerequisites for
reading this packet.
Raw build/failure logs retain original trailing whitespace and terminal blank
lines; a whole-packet whitespace diff reports those archival bytes. They were not
trimmed. The authored/source files pass whitespace checks excluding raw `.log`
streams.

The source snapshots in `inputs/` are archival bytes, not runnable entrypoints.
They preserve the original failing caller/test and final caller/test/helper,
receipt writer, supporting browser scenario, installed dependency lock metadata,
and a short installed Playwright polling excerpt. They contain no dependency tree,
tool binary, credentials, cache, browser profile or unrelated working notes.

Full source remains available at the exact Git commits named above.
[Source correspondence](source-correspondence.json) confirms the feature's two
reviewed blobs remained identical after normal adoption of accepted main.
The evidence branch is separate from main; parent integration remains unchanged.
