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

The Playwright client is lockfile-installed; the browser is the official Chrome
channel preinstalled on the Ubuntu runner. Ubuntu provides an existing AppArmor
profile for this supported channel. Its exact version and executable hash are
recorded, but its version is runner-managed rather than pinned by Playwright.
The runner image and system packages are not claimed to be immutable. A missing
Chrome channel or sandbox failure fails the check. No downloaded-browser fallback,
AppArmor/sysctl changes, or sandbox-disabling arguments are permitted.

Build time is capped at 120 seconds, browser time at 180 seconds, and the job at
15 minutes. The output directory must be fresh (default
`outputs/tutorial-browser`). Public assets are linked from the checkout rather
than copied into a second large asset tree. Receipts record the source hashes,
browser executable hash/version, dependencies, output bundle hashes, and cleanup.
The workflow retains only receipts, logs and screenshots for seven days, even
on failure; it does not upload dependencies, the bundle, or original game assets.
Local typechecking/full builds should not be repeated just to run this check.

After the existing Tutorial groups, one Mission 1 scene checks live-world selector
inspection. A fresh context follows New Game → recommendation No → Start Mission 1
→ Skip introduction, then Game settings → Options → Browser compatibility and help
→ Select Level. Browser controls' Inspect campaign world selects Mission 2 without
starting it. Both initially paused and initially running episodes exercise Back,
Escape, Continue Game, and a second Escape from the returned pause menu.
Read-only observers retain world/scene/canvas and captured menu-session identity,
check frozen level/turn/time and modal suspension, and reject disposal, terrain
abort, canvas removal, or a loading replacement. Continue and repeated Escape must
restore the captured pause policy. This differs from Quit Level → Yes, which
abandons the world. `selector-inspection.json` and two screenshots retain the
episode results; the runner's source manifest includes the added scenario.
