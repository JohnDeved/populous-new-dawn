# Bounded parity discovery: final source and focused-result review

Decision: ACCEPT source implementation and focused verification at `b83292389afe52040a2184924f4d41b0ebd7b484`, tree `f290f9eb5252d2c7f432d68c380b24f85077581d`, in `parity-discovery-scope-20261009b`. This is not a historical-corpus projection or game/native parity pass. Additional delivery quality gates and any complete-corpus report invocation remain separately parent-owned.

The clean final change is based on delivered `50657af8bc5b403f9306a3d9d1f866d74071e33c`. Nine paths differ: the new bounded-reader/cache helper, narrow parity-measure integration, check registry/workflow routing, the workflow copied-module fixture, two focused test files and two engineering documents. Application/game data, package/dependency files, owned adapters and capability definitions are unchanged.

## Accepted source correspondence

Carry the exact scope review `parity-discovery-scope-review-20261009.md`, SHA256 `5f36c1748979ef46a8636221fefa210b3a09441458b07fb32d35088bf189187c`, and measured initial-red review `parity-discovery-red-review-20261009.md`, SHA256 `d105b739443b97059a5d4c6ec37c3ed7aa7b550fa98e267c9d70640b123aeafc`.

The 116-line helper enforces fixed 64 MiB file and 256 MiB aggregate limits. Test-only reductions cannot enlarge them. It checks regular-file identity/size, opens with NOFOLLOW and NONBLOCK, compares lstat/fstat identity and nanosecond metadata before/after the bounded reads, counts returned bytes and rejects short/changing/unreadable files. Strict UTF-8 decoding and full JSON parsing occur only after the completed read is validated. Malformed bytes consume the aggregate. Oversize/parse/read uncertainty becomes a warning; aggregate exhaustion throws. No prefix classification, truncated parsing, index, new adapter, CLI override or evidence deletion was introduced.

Directory enumeration is bounded before sorting, includes the overflow detection entry and closes the iterator. The existing global 10,000-entry charge and locale ordering remain. The only new exclusion is a real direct `*-tmp/node-compile-cache` with one recognized version directory containing exclusively regular eight-hex-named files, verified under a 1,024-entry per-root probe. Parent/root/version metadata must remain stable. Ambiguous shape, JSON, nesting, symlink, mutation, probe exhaustion or error returns to ordinary traversal. Each root still counts globally. Proven non-JSON cache descendants are omitted from receipt traversal, not removed from disk.

Full bounded JSON values reach the unchanged generic and owned-candidate predicates. Warning-bearing scans still make every receipt ineligible. Traversal/aggregate exceptions still invalidate current output rather than publish partial scores, preserving history. The adapter `jsonFile` limit remains 4 MiB; source/runtime freshness, newest-attempt/tie behavior, capability denominators and no-manual-credit semantics are unchanged.

The registry adds both focused tests to its maintained five-file measurement command and binds the helper/test paths as inputs. Workflow routing names those paths. The one workflow fixture correction copies the new transitive helper required by its existing copied CLI; it changes no runtime behavior.

## Reviewer finding and measured repair

Initial implementation `26426438` retained `if (!existsSync(directory)) return` inside recursive walk. When cache verification detected a disappeared directory and fell back, this silently dropped the already-enumerated subtree, potentially returning an older partial pass. The actual-discovery regression was frozen before the fix at test-only `0f841915f904a8a3c1b41cde72e68e2d71ab7ad3` and failed with `Missing expected exception`.

Retained targeted-red receipt: `work/orchestration/parity-discovery-race-red-20261009b-01/node-tests.json`, SHA256 `639d4810479e54a7f4f03dcfd6a5c4f9b6dcacdeb02fd19df3cefcb4dabb8914`; stdout SHA256 `81ab79165073648aa981a71f9d76525f0d042565dcf050ec7997e3f42900430c`, empty stderr. All three pinned committed inputs and source/sourceAfter equality match. It failed at the intended missing exception, not setup.

Final code moves the absence check to the initial orchestration root only. Any disappeared already-enumerated nested directory now throws and prevents partial discovery; an initially absent root still returns empty evidence. The regression renames the enumerated cache during the actual probe and requires ENOENT from discoverReceipts. The separate absent-root guard passes. These are the complete production changes after the original full-diff review; no second source blocker remains.

## Final focused verification

`work/orchestration/parity-discovery-green-20261009b-02/node-tests.json`, SHA256 `d68cf4e05a051b8186184bd354a5bdc509bd3549a76f456f1ea22dffba38815e`, is bound to clean exact final `b8329238`. It runs the maintained measurement, checkpoint, Blast, discovery, reader, orchestration, workflow-handoff and workflow-policy test files. The result is 97/97 PASS, zero failures/canceled/skipped/todo, exit 0, 17:57:54.606–17:58:03.860 UTC. Raw stdout SHA256 `73a0e0ca564101df28b8c7887cf0750641f979933c99e6d0988d57ebe6f5d510` and empty stderr independently match. All six receipt input hashes match their committed Git objects; source/sourceAfter are identical.

Earlier 50/50 result at `26426438` remains valid for that source but does not supersede the discovered gap. Its receipt SHA256 is `98a2dcf686ceab409c9b1d70b8adc46fd4d17dbf7dd2d8a7098a425b2b4293ae`. Preserve the original eight-case red and the reported earlier workflow fixture failure as failed attempts, not successful runs. The final green includes the repaired fixture and all relevant suites.

## Remaining proof boundary

The historical 373-file / 200,431,763-byte corpus and old diagnosis are unavailable after reset. Neither reconstructed prose nor these synthetic tests restore them. Actual historical-corpus projection remains HOLD until original inputs are restored and verified, or a separately identified new complete corpus is measured and explicitly admitted. A current projection must preserve raw evidence and either inspect its complete stable corpus or remain fail-closed. Input limits do not establish a peak-RSS or wall-time guarantee, and no game/native behavior or parity percentage is earned by this repair.

Review activity was source/diff/receipt/hash inspection only. No reviewer application, test, report, browser, native/emulation or dependency execution occurred; no evidence was altered or deleted.
