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

## Motion regression: browser publication bottleneck

The follow-up lag report exposed a second, independent browser presentation defect. It does **not** establish a new native animation rate.

Native ordering remains bounded as before:

- `draw_main 004a4960` calls `004314c0` before `main_loop_outer`;
- when messages exist, `004314c0` calls motion routine `00431c40` regardless of whether `offset_counter_2` changed;
- only age/lifetime bookkeeping in `004314c0` is explicitly gated by the `offset_counter_2` change;
- the repository's native message checker proves browser/native message-state transitions per presentation visit, but the original wall-clock draw rate is still not recovered.

The browser had an additional publication throttle unrelated to those motion rules:

- `advanceGame` mutates campaign-message position through the existing presentation adapter;
- `page.tsx` rendered that mutable position into each campaign-message `style.top`;
- ordinary React/store publication from `scene-hud-runtime.ts` occurred only when `uiTimer > 0.2`;
- therefore several message-state changes could occur while the mounted DOM retained an older `top`;
- the earlier browser acceptance manually called `testStore.update()` after advancing message state, bypassing that ordinary state-to-DOM bottleneck.

The repair removes only this extra browser publication delay. Each rendered campaign-message `details` carries its stable message serial. The existing per-frame HUD presentation function directly synchronizes the **already mounted** message element's `top` and lower-half popup direction from the current mutable message state. The general `scene.onChange()` / `uiTimer > 0.2` React publication boundary is unchanged, so unrelated HUD/page state is not rerendered every frame.

This is deliberately not CSS smoothing or a new clock:

- no `transition: top` is restored;
- no new polling or RAF loop is created;
- `messages.ts`, `game-clock.ts`, `world-turn.ts`, simulation speed, lifetime, collision, RNG and sound ownership are unchanged;
- DOM top changes only when the existing message presentation state changes.

The focused acceptance now starts ordinary scene RAF with the generic HUD publisher reset, waits for message position to change **before the store revision changes**, and requires the mounted DOM top to match that new position. That independently proves the campaign-message binding no longer waits for the 0.2-second general UI publication. It does not infer or certify the original executable's absolute presentation frequency.
