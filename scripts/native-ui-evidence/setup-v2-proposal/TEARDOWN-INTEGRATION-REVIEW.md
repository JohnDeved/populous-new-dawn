# Popup teardown integration review

Source baseline: d68134ca8a98ab077a192534030887ccd779f826. Read-only review of policy.mjs, adapter.mjs, browser-owner.mjs, browser-worker.mjs and supervise.mjs. No browser, process-group experiment or production runner change was performed.

## Existing reusable ownership

- policy.boundedEpisode races work against deadline/abort, then awaits close() and the original work before permitting its caller to advance. A late success cannot override timeout.
- adapter passes owner.closeContexts as that close function and terminates the episode series on failure.
- ownBrowser retires admission/generation before context cleanup and rejects late context/page creation.
- browser-worker has an outer supervisor; SIGTERM aborts its signal and requests browser close. supervise sends group SIGTERM, then SIGKILL after the cleanup grace on timeout.

The new popup helper remains inside an inactive proposal. Its teardownRequired signal must be retained in the future diagnostic receipt and cannot be swallowed by an episode catch/retry. The fixed nine-episode acceptance contract is not a gameplay adapter.

## Remaining blockers and exact limitations

1. ownBrowser.closeContexts and close await context/browser close and pending context/page operations without their own wall-clock bound. boundedEpisode also awaits close and work without a separate local cleanup timer. The worker supervisor is the ultimate bound; do not claim a short context-close guarantee from the helper's 250 ms lease grace.
2. supervise's child close handler sends final group SIGKILL and immediately resolves. It does not observe process-group disappearance, so its success receipt is not proof that no group members remain. Existing supervised tests cover actual exit/output and timeout rejection, not a surviving detached descendant or observed group cleanup.
3. A helper timeout can leave the original locator input pending. Its sticky inputCleanup/teardownRequired record survives later phase settlement. identityCleanup='settled' means only that tracked handle work settled; it must not certify input RPC or global process cleanup.
4. No future diagnostic episode may begin after an uncertain input failure. Record the phase/failure and stop, even if a late original click subsequently runs. Do not replay it.

## Smallest next implementation boundary

Keep workflow choices disabled. Reuse an owned episode/context and external process supervisor rather than granting the helper browser ownership. Add a fixed diagnostic adapter that persists the live helper trace on both success and failure, rejects any teardownRequired trace even if an episode catches the helper error, retires resource admission before close, and cannot start another episode until cleanup is resolved. Record context-close outcome separately from worker/process-group outcome. An unresolved close must remain failure and escalate to the existing external owner, never become a successful cleanup receipt.

Before activation, add supplied-owner tests for pending input plus successful/failed/hung context close, late acquired context/page, failure snapshot surviving mutation, no subsequent episode, and original failure preservation. Separately admit a small process-owner test proving the chosen supervisor's actual group-cleanup receipt; supplied mocks cannot establish that OS fact. Real Playwright/native input and the complete gameplay acceptance gate remain separate.
