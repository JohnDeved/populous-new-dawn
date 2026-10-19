# Independent phase extraction review

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/loading-recovery-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Candidate: `adb0f10a1142cb9135192da63af756b43dbc035e`.
Previous reviewed implementation: `42e9e2bc6b3300685fb3133aebe0e932bb5a9b7a`.

## Decision

ACCEPT the bounded loading/recovery presentation and mechanical repair. No open implementation finding. Overall merge remains subject to the parent and final candidate gates.

The exact commit changes only `app/page.tsx`: one pure local string scalar is extracted from the `OriginalLoadingScreen` phase prop. Error remains the first choice; startup `loading` maps to `restore`; the other startup states map to `loading`. The component render guard, key, callbacks, hooks, scene/store code, assets and CSS are unchanged. The independently executed verifier checks the exact whole-file substitution and all 18 declared startup/error/readiness combinations. Earlier full inventory results (433 files, 2789 tests) remain executions of 42e9e2bc and are carried forward only through this explicit equivalence.

## New-head browser execution

Four groups passed on the unchanged production Home mounted in the existing plain React/Vite fixture, using sandboxed local headless Chrome 154.0.8037.92. The run lasted 02:33:04.577Z–02:33:13.369Z on 2026-10-16. All 1108 production input fingerprints matched before/after, and the source was clean.

1. Real IndexedDB open completion held: `restore` phase, status semantics, correct native art geometry, contained keyboard focus, no battlefield yet; releasing the original event reaches the ordinary main menu.
2. Ordinary New Game / Start Mission 1 with real terrain requests held: `loading` phase, correct geometry, dormant real scene with frozen world time/RNG/input state.
3. Aborting those real requests: `failed` phase, browser recovery dialog, automatic retry focus, contained Tab/Shift+Tab, keyboard technical details and pointer-reachable retry.
4. Ordinary Enter retry: same Mission 1, one terrain pair despite repeated Enter, `loading` phase and dormant scene; intentionally aborting the retry produces a usable new `failed` presentation.

This new run intentionally ends at the second failure. It does not claim successful new-head GameScene activation. The prior separate successful single-retry activation remains 42e9e2bc evidence with mechanical carry-forward.

The 640×480 restore and post-retry failure screenshots were independently viewed and match the earlier presentation. They show the original native identity on black with plain browser recovery controls; black is the documented browser compatibility clear.

## Exact test boundaries

Only readiness timing and actual resource network failure were injected: delay notification of the real IndexedDB-open success event, then invoke its original listener/event; hold or abort actual landscape/waves requests. No scene, world, callback, readiness success, clock, RNG or input state was fabricated. This fixture excludes Vinext/Cloudflare/RSC serving and hydration, and software rendering does not certify hardware performance or native full-frame parity.

The original evidence packet remains unchanged. All three wider browser wrappers remain failed; unvisited restart/Continue/checkpoint/stale-owner branches remain unverified. The earlier cumulative retry crash remains failed. Two canvas matches are expected in GameScene, and are not established as the visibility-timeout cause. The optional diagnostic remains not run by parent decision.
