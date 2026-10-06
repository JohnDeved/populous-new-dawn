# Controlled live baseline: intended missing-retirement assertion failed

The one authorized supporting Node invocation reached the intended red assertion
at source `1d62a8181432b65106fe77f77b9f48cb07d95194`. All app and fixture sources
correspond exactly to main `1c7e6b05687aca14d9350e17c7ae14dc6c68bb97`; the
capture is unchanged from reviewed preparation commit `07e54532`, SHA-256
`b2e40bb1a451d87d194db4508188aa3829b256dbdd73bd101474457ad400ff51`.

The [command receipt](command-receipt.json) retains **failed / exit1**. Its stderr
is the expected `Native state entry already deleted the retained root` assertion,
actual1 versus expected0. It is not setup failure and is not relabelled passed.
All18 samples were written to [raw stdout](stdout.json) before the assertion.
Stdout SHA-256 is `30f06683ca09822f60c1291c0a90ef767d49e81c0b9013b3c26a09a593f6cc48`.

## Observed discrepancy

Actual command8 admission supplied residents1184/1186/1188 in hut1023. At turn214,
the real secondary owner had full root serial2 and already-emitted child serial3.
Calling actual `igniteLightningScenery` once at that hut's verified terrain cell
changed its state to4 with timer127, retaining the same resident IDs/admission
slots, health/progress and existing child. Root serial2 and its scene visibility
also remained. The independently accepted native a02 composition had already
deleted its root at this corresponding state-entry boundary.

On the next actual game turn, the live root was still allocated and visited:
counter152→153. Child3 correctly changed lifetime16→15. The retained raw timeline
shows the root visible through timer120. Only at timer119/turn222, after normal
evacuation removed all residents, did the root disappear. Child3 survived that
removal with eight visits remaining and expired at turn230 on its own countdown.

The immediate state/timer/resident/health/child assertions passed before the
specific root-retirement assertion failed. Later assertions occur after that
failure and therefore were not executed; the child/evacuation timeline above is
an inspection of retained raw samples, not a claim that those later assertions
passed. A repaired candidate must run the unchanged complete regression.

## Scope and resource receipts

The [source review](source-review.md) accepts this controlled caller comparison.
The supplied world/cohort/hut/population flag come from existing `fullHutScene`;
real command8/admission creates occupancy and the smoke owner emits the child.
The new capture supplies the spell boundary by calling the production Lightning
ignition consumer directly. Texture I/O, projection and unrelated plan geometry
are supplied. The visibility field is real Three.js scene state, not GPU pixels
or an actually displayed browser frame. Ordinary Mission1 reward acquisition,
HUD casting and the rendered witness remain unrun.

The native input was the accepted a02 stdout at SHA-256
`a20ab0ea632b582f74bd24d5c14d968b4cb11d8d3d5f3f5a7e75fe20b311d3c7`.
Its fire allocations are supplied failures; this live consumer can create fire.
No fire-stream or RNG-sequence equality is inferred between them.

Execution used the existing command-receipt helper, a60-second TERM timeout plus
5-second kill grace, CPU0–3 and1GiB V8 heap. The child interval was
`2026-10-06T21:51:57.653Z`–`2026-10-06T21:52:03.115Z`. These are guarded-run
timestamps, not a hardware-performance result. No retry occurred.

The released QA dependency tree was exclusively renamed into this worktree,
with an exact installed-lock-only stub at its donor. The same invocation returned
device27/inode1978923 at `2026-10-06T21:52:06.986999Z`, retaining installed-lock
SHA-256 `65e45d0a87d1ecd4fbf56508b9821eb3bfb3867c8477db4aaa1452eb2bed13d8`.
Both root locks matched `c1599d8d7e3f028e290a13561c653cf926e739e98eb9ec1b476dbe1c2a4558ba`.
The borrower has no remaining node_modules; QA was notified of the return.

[Host/dependency receipts](host-and-dependency-receipt.json) confirm all source
and dependency bytes unchanged, the same returned inode and no remaining owned
processes. Compressed source/dependency inventories contain paths and hashes,
not original game data or installed tool binaries. The [host owner](host-live-baseline.py),
[exact capture](source-capture.mjs) and raw streams are retained for independent
result review. No runtime code has been changed by this research.
