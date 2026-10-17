# In-game menu preparation (#513)

Builds on cleaned frontend preparation #514 (`e5cd67777a40a1905d72012f0ae07023fa5834db`). Home prepares the pause font and three in-game slider images concurrently with frontend assets, under the same 10-second browser-policy deadline. Independent frozen font/slider results retain decoded image references and feed pause/Options on their first render and every remount. Failed or late groups keep readable/native fallbacks for that Home session; healthy frontend groups remain usable.

The retained baseline is `codex/ingame-preload-baseline` at `add5dc0405ccc49e933779e0b628fb6339358f71`, documented in its `evidence/ingame-preload-baseline-20261017/README.md`. It showed cold and warm mount-local decode flashes. This change preserves GameScene readiness/start, per-level loading, and pause keyboard/input ownership. The queued #511 keyboard guard remains separate.

Focused tests cover group order/failure, shared deadline/late success, stale Home/effect replay, and synchronous cold/warm pause and Options readiness. The reusable browser scenario drives actual Home → Mission 1 → pause/Options, gates real menu responses, observes native decode and animation-frame states, sends real input during the Home asset wait, and checks modal freeze/resume. No state/readiness/clock injection is used.

Run from the worktree with `POPULOUS_INGAME_PREPARED_OUTPUT` pointing outside Git, `POPULOUS_BROWSER` pointing to an official sandboxed Chrome Headless Shell, and `POPULOUS_INGAME_MODE` set to `healthy`, `font-failure`, `slider-failure`, `late-font`, or `late-sliders`:

```sh
node evidence/ingame-prepared-assets-20261017/run-probe.mjs
```

The fixture uses production Home/store/GameScene/CSS/assets through plain React/Vite on isolated port 4402; it does not cover hosted Vinext/Cloudflare/RSC serving/hydration. Warm reopening means same-document resource reuse, not an HTTP-cache benchmark. Frame observations do not measure compositor or hardware performance. Raw outputs and receipts stay outside Git. Hosted full gates remain root-owned; this branch stays draft pending review.
