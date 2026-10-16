# Hosted actual-Home Tutorial validation

`node scripts/tutorial-browser/run.mjs` builds the real `app/page.tsx`, production
styles, store and scene through a small plain Vite entry, then runs
`scripts/local-render/tutorial-recommendation.mjs`. The entry only mounts Home;
it does not replace loaders, inject scene state, or seed the answered flag.
This checks real Tutorial loading and retry behavior, but does not validate
Vinext, Cloudflare, or RSC hosting.

The separate `Tutorial browser` GitHub check runs on relevant ready PRs, on the
exact synthetic merge revision. It is not yet a branch-required check. For
PR #482, the maintainer must verify both this check and `Full check` succeeded
on the final candidate before merging. A skipped/path-filtered browser run is
not acceptance for a change affecting this scenario. No auto-merge or repository
settings are changed here.

The lockfile-installed Playwright CLI downloads its pinned Chromium revision.
Ubuntu's system dependencies come from the hosted image/package repositories;
they are not claimed to be immutable. Chromium keeps its sandbox enabled; a
sandbox failure is a failed check, not a reason to disable security. No external
browser executable or developer-machine path is used.

Build time is capped at 120 seconds, browser time at 180 seconds, and the job at
15 minutes. The output directory must be fresh (default
`outputs/tutorial-browser`). Public assets are linked from the checkout rather
than copied into a second large asset tree. Receipts record the source hashes,
browser executable hash/version, dependencies, output bundle hashes, and cleanup.
The workflow retains only receipts, logs and screenshots for seven days, even
on failure; it does not upload dependencies, the bundle, or original game assets.
Local typechecking/full builds should not be repeated just to run this check.
