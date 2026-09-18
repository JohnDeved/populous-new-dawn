# Campaign-message regression follow-up

Issue 59 received a user report after PR71 that campaign-message motion looked laggy and the presentation was positioned incorrectly. This note records the bounded follow-up diagnosis and separates the repaired browser-composition X defect from the still-open animation-cadence question.

## Position regression: browser seam mapping

PR71 correctly recovered the native message-strip coordinate value but mapped it into the browser composition incorrectly.

Native evidence already retained by the repository proves:

- `004314c0` uses normalized message-strip X `0x2800`.
- `scripts/check-native-hud.py` independently passes logical HUD right-edge X 100 through the same native screen-width converter.
- `100 * 65536 / 640 == 0x2800` exactly.
- `tests/fixtures/hud-scale.json` therefore records the native HUD right edge and message-strip X at the same pixels: 100 at 640×480, 225 at 1440×1000, and 537 at 3440×1440.

The browser HUD does not use that native independent X scaling. Its actual rendered sidebar is the modern `--side` width derived from a uniformly capped/user-selectable HUD scale, and `.world-viewport` begins at the same pixel. At automatic size the browser seam is 200 px at 1440×1000 and 250 px at 3440×1440.

PR71 changed `.campaign-messages` from `left:var(--side)` to an absolute full-window `screenX(0x2800)`. That separated the message parent from the actual browser world seam by 25 px at 1440×1000 and by 287 px at 3440×1440. Because the open popup body is positioned at `left:0` inside the same `details`, both the icon/summary and popup inherit that shifted parent anchor. The earlier focused checker computed its expected left from the same full-window formula and measured only the summary rectangle, so it could not independently expose the browser-composition mismatch.

The repair is deliberately limited to the X mapping:

- `.campaign-messages` is anchored to `var(--side)`, the actual rendered HUD/world seam.
- the obsolete `--message-left` assignment is removed from the resize effect;
- message strip **width** retains the recovered native full-screen width parameterization;
- message **top/height** retain the recovered native full-height parameterization;
- the modern HUD-size preference is allowed to move the message X anchor because it changes the browser's real seam. This is an explicit browser adaptation, not a claim that the original exposed the same preference.

The existing authored Mission 2 browser acceptance now independently measures `.native-hud.right` and `.world-viewport.left` and requires the message `details`, summary and open popup body to share that seam at 1440×1000 and 3440×1440 under Automatic and 100% HUD sizes.

## Motion regression: diagnosis remains open

The reported lag has a separate source-level concern and is **not** repaired by this X-only change.

Native ordering:

- `draw_main 004a4960` calls `004314c0` before `main_loop_outer`.
- when messages exist, `004314c0` calls motion routine `00431c40` regardless of whether `offset_counter_2` changed;
- only age/lifetime bookkeeping in `004314c0` is explicitly gated by the `offset_counter_2` change;
- the repository's native message checker calls `00431a80` + `00431c40` per presentation visit and proves the browser motion state transition for each visit.

Browser ordering:

- `advanceGame` advances `stepMessages` at the existing 24 Hz adapter;
- React state exposed by `page.tsx` is normally refreshed from `scene-hud-runtime.ts` only when `uiTimer > 0.2`, roughly a 5 Hz UI refresh boundary;
- before PR71, `.campaign-messages details` had `transition:top .2s linear`;
- PR71 removed that CSS transition while leaving the React refresh boundary unchanged;
- the PR71 acceptance advances message state manually and calls `testStore.update()`, so it does not measure the ordinary user-visible React refresh cadence.

This is enough to explain why removing the transition can expose visibly discrete top updates, but it is **not** enough to choose a parity repair. The original actual draw/presentation rate has not been proved, and the follow-up must not infer per-RAF stepping, restore arbitrary easing, or change game clocks/RNG from this evidence alone. The X-position repair therefore leaves `messages.ts`, `game-clock.ts`, `scene-hud-runtime.ts`, simulation speed, lifetimes and CSS smoothing unchanged.

A later cadence repair requires independently anchored evidence for the original presentation schedule or an explicitly justified browser adaptation. Until then, issue 59 should report position fixed and animation lag still open rather than treating the prior pass as complete evidence.
