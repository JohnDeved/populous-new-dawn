# Invented gameplay-overlay removal: migration review checklist

Base: `be44bc76f21429c472978c3dcb8893e565b6a4fb`. Scope: source review of every changed script, not a claim that every full-game scenario has run.

The public Space input now owns introduction skipping. No synthetic controller call, hidden DOM skip button, camera/simulation rewrite, or pinned historical fixture change is used. Existing mission/fixture gates and observer order were compared against the base diff. Each nondefault action budget is explicit; local-render primary pages inherit45s, tutorial-run primary pages25s, and fresh unspecified Playwright pages30s. Specific2.5s recovery and absolute8s Spy deadlines remain separate. Native-readiness polling and delivery share the provided cap rather than extending it with a second cap.

Self-review corrections: restored Hypnotise fixture/Mission22 prerequisites; restored per-file inherited and explicit budgets; bounded keyboard delivery in formerly timeout-bound click paths; retained New Game recommendation wording. Distinct full episode timers, abort checks and cleanup are unchanged.

## Per-file checklist

- `scripts/browser-game.mjs`: All-missions selection, Enter activation, bind, flyby observation, unlock and current-world rebinding remain ordered.
  - Delivery: `await skipIntroductionWithSpace(page)`
- `scripts/browser-introduction.mjs`: New shared read-only native-input predicate and bounded public Space delivery. Loading and late authored levelStart gates remain required; no controller injection. Separate worker owns deadline/race tests.
  - Delivery: `if (action === 'skip') await pressIntroductionSpace(page, { timeout: timeout - (performance.now() - started) })`
- `scripts/check-browser-audio-preferences.mjs`: Mission selection/reload binding precede skip; input unlock remains before sound and persistence observations.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/check-browser-campaign-message-presentation.mjs`: Mission selection and current-scene alias assignment precede skip; input unlock precedes freezePresentation and popup observations.
  - Delivery: `await skipIntroductionWithSpace(page)`
- `scripts/check-browser-follower-frame-alpha.mjs`: Separate DPR2 context still selects Mission1 with Enter and binds before skip; unlock, freeze, HUD scale2, pointer framing and crops unchanged.
  - Delivery: `await skipIntroductionWithSpace(widePage)`
- `scripts/check-browser-follower-tasks.mjs`: Separate DPR2 Start Mission1 route, bind and active/unlocked readiness retained; unlock, freeze and followers-tab observation unchanged.
  - Delivery: `await skipIntroductionWithSpace(dprPage, { timeout: 45000 })`
- `scripts/check-browser-follower-transports.mjs`: Separate DPR2 Mission22 route and binding retained; unlock, freeze, clear, craft setup and subsequent measurements unchanged.
  - Delivery: `await skipIntroductionWithSpace(dp, { timeout: 45000 })`
- `scripts/check-browser-followers-tab.mjs`: Mission selection, scene binding, active/unlocked readiness, unlock and current-world alias checks retained for each context.
  - Delivery: `await skipIntroductionWithSpace(page)`
- `scripts/check-browser-loading-screen.mjs`: Required loading/failure/retry and scene-binding gates remain at callers; skip helper still waits for input unlock afterward.
  - Delivery: `await skipIntroductionWithSpace(page)`
- `scripts/check-browser-loading-small-viewport.mjs`: Only deleted desktop-advisory behavior removed. Loading failure, retry top-hit-target, retry action, loading removal, bind and Mission1 checks remain; replaced overlay-z comparison with advisory absence.
  - Delivery: `No generic Space call; existing special-case or observer budget retained.`
- `scripts/check-browser-mission11.mjs`: Mission12 and13 initial camera snapshots and >0.5 movement observations remain before skip; exact authored flag and unlock checks remain after. Removed only Skip UI readiness.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 20000 })`
- `scripts/check-browser-mission12-vault-bridge.mjs`: Normal-opening until(authored opening,64), holdRaf(false), input unlock and all acquisition/camera observations retained.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 15000 })`
- `scripts/check-browser-mission4-natural-victory.mjs`: Advance-until authored flyby, releaseRaf, unlock and current-scene rebinding retained before ordinary victory inputs.
  - Delivery: `await skipIntroductionWithSpace(page)`
- `scripts/check-browser-mission4.mjs`: Mission4/5 initial camera snapshots, >0.5 motion gates and native completion/AI-variable conditions retained; Mission6 state inspections also stay before skip.
  - Delivery: `await skipIntroductionWithSpace(page)`
- `scripts/check-browser-mission6-natural-victory.mjs`: Active-or-unlocked readiness, unlock and world identity rebinding stay before natural victory sequence.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 60000 })`
- `scripts/check-browser-mission7.mjs`: Mission narrative-text readiness still precedes skip; input unlock still precedes Convert selection and targeting.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 10000 })`
- `scripts/check-browser-reincarnation-wave.mjs`: No new waiting loop: same80 batches, abort checks,24 Scene.animate steps and25ms yield. Read-only native predicate replaces visible-button predicate; same skip-turn record before bounded Space.
  - Delivery: `await pressIntroductionSpace(page, { timeout: 60000 })`
- `scripts/check-browser-shaman-death-ground.mjs`: Same80-batch loop and abort checks. Native gate precedes bounded Space, original Resume game action remains afterward, then readiness and deterministic pacing.
  - Delivery: `if (await page.evaluate(introductionInputState) === 'skip') await pressIntroductionSpace(page, { timeout: 45000 })`
- `scripts/check-browser-spell-hud-icons.mjs`: Mission16 Enter selection, bind, skip, second bind and exact level16/unlocked readiness preserved before HUD observation.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 20000 })`
- `scripts/check-browser-spy-combat-lifecycle.mjs`: Authored-opening until(...,64), RAF release and complete native input/flag readiness retained before Spy gameplay.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 15000 })`
- `scripts/check-browser-stone-head-animation.mjs`: Mission1 Enter, bind, skip, second bind and unlock preserved before authored animation inspection.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 20000 })`
- `scripts/check-browser-stone-head-orientation.mjs`: Per-item mission Enter and bind precede skip; unlock still precedes exact frame/heading evaluation.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 15000 })`
- `scripts/check-browser-texture-cache-retry.mjs`: Failed-resource/retry counts, third-scene identity and measured activated-time assertions precede skip; input unlock and ordinary time advancement follow.
  - Delivery: `await skipIntroductionWithSpace(page)`
- `scripts/check-browser-vault-appearance.mjs`: Authored active flyby and locked-input readiness retained. Removed conditional Skip/Escape fallback in favor of actual public Space; unlock remains before native vault observation.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 10000 })`
- `scripts/check-browser-vehicle-assets.mjs`: Mission button attachment/click and bind retained. Space return condition controls second bind; terrain preparation and vehicle camera setup remain after.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 20000 })`
- `scripts/check-browser-vehicle-panel.mjs`: DPR2 Mission22 keyboard activation, bind, unlock and freeze remain; right-click, render and panel checks stay ordered.
  - Delivery: `await skipIntroductionWithSpace(dp, { timeout: 45000 })`
- `scripts/check-browser-world-selector-failures.mjs`: Required atlas failure, Try again, bind and Mission1 assertion stay before native skip; checkpoint save/load and tutorial paths unchanged. Only deleted advisory action removed.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/check-browser-world-selector-lifecycle.mjs`: Bind/Mission1 ownership checks precede45s skip; unlock precedes renderer and selector lifecycle observations. Deleted advisory action removed.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/checkpoint-loading-retry.mjs`: Public Start Mission1 and bind precede skip; unlock and turn>0 remain before landscape/checkpoint failure evidence.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/early-missions.mjs`: Fresh page per episode retains30s default and mission startup sequence. introductionSkipped now records actual native Space action; unlock and before/after snapshots unchanged.
  - Delivery: `const introductionSkipped = (await skipIntroductionWithSpace(page)) === 'skip'`
- `scripts/local-render/harness.mjs`: Public mission focus/Enter and bind remain before45s skip; unlock, scene alias and scenario invocation remain after. Missing DOM is no longer silently forgiven; native ready is accepted.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/ingame-prepared-assets.mjs`: Asset preparation/decode counters and original Start Mission1 route retained; unlock+turn>0 still precede decode assertions and menu measurements.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/minimap-frame.mjs`: Actual Restart world and bind remain before skip; existing immediate freeze/capture behavior stays after, without new camera commands or synthetic renderer steps.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/options-keyboard.mjs`: Per-context Start Mission1 and bind retained; unlock then Game settings remains before keyboard ownership cases.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/original-main-menu.mjs`: Tutorial quit, failed-load retry and checkpoint load branches retain their ownership gates. Only deleted advisory controls removed; native skip stays after retry binding and before checkpoint save.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/original-menu-checkpoint.mjs`: Start Mission1, bind and active-or-unlocked gate retained; skip/unlock still precede checkpoint snapshot. Separate60s DPR menu-only context never calls skip.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/original-options-display.mjs`: Options/Sound first, original Start Mission1 route, bind and readiness retained; deleted advisory action removed. Unlock remains before options and viewport screenshots.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 });await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)`
- `scripts/local-render/original-options-ingame.mjs`: Master/music settings,800x600 startup, bind,1280x960 resize and native readiness retained in order; unlock then Enable sound unchanged.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/original-pause-checkpoint-recovery.mjs`: Special2.5s recovery helper retains input-unlocked precheck, bounded awaited Space and failure forgiveness only after observed unlock. Late-intro once-only callback still caps by existing remainingMs; no refreshed episode deadline.
  - Delivery: `await pressIntroductionSpace(page, { timeout })`
- `scripts/local-render/original-pause-display.mjs`: Tutorial and bind followed by Game settings unchanged; only deleted advisory action removed. Font-failure and screenshot assertions preserved.
  - Delivery: `No generic Space call; existing special-case or observer budget retained.`
- `scripts/local-render/original-pause-exits.mjs`: Tutorial/non-tutorial branch unchanged; only campaign branch skips. Real pointer-drag, held Enter, restart boundary and scene disposal tests retain order; advisory action removed.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/original-pause-menu.mjs`: Canvas/bind/readiness, initial skip/unlock, restart-confirm ownership and second skip remain. Tutorial pointer capture/menus unchanged; deleted advisory actions only removed.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/original-pause-save-failure.mjs`: Start Mission1, bind and native readiness retained; unlock precedes actual Pause game assertion and save-failure menu. Deleted advisory action removed.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/readiness-lifecycle.mjs`: Caller binds and observes active/unlocked state before skip; independent60s shaman-readiness deadline, level assertion and Escape/menu sequence unchanged.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/result-loss-lifecycle.mjs`: Initial and restarted-world skip paths retain bind and unlock. Restart additionally observes new world identity and result removal before Space; all result-state observations unchanged.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/route-notice-modal.mjs`: Public Start Mission1, bind and unlock retained before running/paused route-notice episodes. Route expiry, pointer/menu and pause restoration assertions unchanged.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/route-notice-replacement.mjs`: Initial and restart paths retain bind/unlock; old-world replacement observed before second skip. Injected route fixture and stale ownership checks unchanged.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 }); await bindGame(page); await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/startup-burst.mjs`: Observer is still armed before Mission1 Enter and binds aliases at canvas insertion before turn30. Space replaces the one skip click; first-frame, RNG, bounded records and full before/burst/after observations unchanged.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 45000 })`
- `scripts/local-render/water-shore-animation.mjs`: Restart world/bind retained; explicit15s readiness preserved instead of common default. Unlock still precedes restarted sequence measurements.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 15000 })`
- `scripts/tutorial-browser/README.md`: Only skip interaction wording changed; original New Game recommendation step retained.
  - Delivery: `No generic Space call; existing special-case or observer budget retained.`
- `scripts/tutorial-browser/building-panel-identity.mjs`: Mission22 setup and bind retained; custom ready predicate still requires completed levelStart sites. Native skip gate replaces DOM gate; all post-unlock ownership and UI identity observations remain.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 10000 })`
- `scripts/tutorial-browser/compact-message-layout.mjs`: Read-only witness now rejects invented generic message cards; source-backed route remains observed when present. Native pause rect replaces badge; all F8 rows, overflow, overlap and campaign-text checks retained pending popup integration.
  - Delivery: `No generic Space call; existing special-case or observer budget retained.`
- `scripts/tutorial-browser/follower-corpse.mjs`: Existing Mission2 startup readiness/level check and action-record boundary remain. Bounded10s Space replaces click; input unlock, unpaused and turn>lastOrder checks remain before attack phases.
  - Delivery: `await action('Skip introduction', () => pressIntroductionSpace(page, { timeout: 10000 }))`
- `scripts/tutorial-browser/gameplay-frames.mjs`: Mission2 bind/startup snapshot and level assertion retained.25s inherited action limit preserved; unlock+unpaused then pointer move, warmup, F8/export and measured phase order unchanged.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 25000 })`
- `scripts/tutorial-browser/m2-pointer-f8.mjs`: Existing load/setup/native readiness, startup snapshot and input unlock retained. Deleted desktop action becomes absence check; baseline still uses Pause game. F8 fields/export and source test surface preserved; native pause is noninteractive bottom-right.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 10000 })`
- `scripts/tutorial-browser/melee-attack.mjs`: Mission2 startup snapshot/level assertion and action record retained;10s bounded Space then unlocked/unpaused/turn readiness unchanged. Camera/minimap, observation and effect setup order untouched.
  - Delivery: `if (report.startup.action === 'skip') await action('Skip introduction', () => pressIntroductionSpace(page, { timeout: 10000 }))`
- `scripts/tutorial-browser/profile-readiness.mjs`: Read-only bound/current/connected scene and loading guards unchanged. Available native skip flags replace removed DOM visibility field; recovery classification otherwise unchanged.
  - Delivery: `No generic Space call; existing special-case or observer budget retained.`
- `scripts/tutorial-browser/scenery-placement.mjs`: Actual New Game recommendation No and Start Mission1/bind retained;15s input limit and unlock remain before Pause, Brave/Hut and placement observations.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 15000 })`
- `scripts/tutorial-browser/selector-inspection.mjs`: Actual New Game recommendation No, Start Mission1 and bind retained;25s skip/unlock remain before ordinary current-world observer and selector episodes.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 25000 })`
- `scripts/tutorial-browser/spell-conversion.mjs`: Mission3 waits its late authored native gate instead of accepting initially unlocked input. Before/after startup snapshots and12s action budget retained. Resume occurs only after observer armed using real Resume game; deleted advisory branch removed.
  - Delivery: `await pressIntroductionSpace(page, { timeout: 12000 })`
- `scripts/tutorial-browser/spell-hypnotise.mjs`: Self-review repaired accidentally removed setup: frozen fixture readiness, showAllMissions, Mission22 click and bind all restored before10s Space. Unlock, Pause, preparation, save/load, framing and observer/cast sequence unchanged; outer deadline retained.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 10000 })`
- `scripts/tutorial-browser/spell-projection.mjs`: Mission1 setup and original ready-or-skip predicate retained, replacing only DOM eligibility with flags.10s limit, input unlock and Pause remain before source fixtures/observations.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 10000 })`
- `scripts/tutorial-browser/spell-test-menu.mjs`: Per-phase bind/startup/unlock retained under12s limit. Diagnostic field now reports native introductionActive rather than removed element. F9 production implementation unchanged.
  - Delivery: `await skipIntroductionWithSpace(page, { timeout: 12000 })`
- `scripts/tutorial-browser/spy-source-readiness.mjs`: Exact bound-scene, loading, inputMask===64 and flags0x11 gates retained without DOM requirement. Existing8s-or-outer absolute deadline wrapper surrounds public Space; no changed observer/action ordering.
  - Delivery: `No generic Space call; existing special-case or observer budget retained.`

## Remaining acceptance boundaries

- Full affected browser scenarios and standard check/build gates remain for combined integration/CI. Source/lint/unit checks do not substitute for natural gameplay evidence.
- Native Paused bitmap fixture covers only the actual component, viewport/DPR, raw glyph geometry and input transparency. Actual Page keyboard-effect tests cover public Space skip/pause ownership separately.
- Original native timed Flyby Cancelled feedback is not added here: native32-render-visit lifetime is not a guessed second-based toast.
- Route603 presentation remains unresolved, visible and explicitly not claimed original. Generic browser-authored world-message card/prose is no longer visible.
- Browser help/checkpoint panels, all-missions controls, result actions, startup additions and remaining Unicode HUD inventory require separate evidence-bound batches. F8/F9 remain exempt.

## Independent-review corrections

- `scripts/local-render/original-pause-checkpoint-recovery.mjs`: fresh native input/pause snapshot before delivery, unchanged-pause verification afterward, all observations/delivery inside the original 2500ms or supplied remainder. Natural completion may forgive delivery failure only if pause did not change. Late observation cannot dispatch a key after expiry.
- `scripts/tutorial-browser/spy-source-readiness.mjs`: current native readiness is reobserved after handle disposal; completed introductions dispatch no Space. A changed pause state after delivery fails the episode rather than being recorded ready. Every added observation uses the existing absolute 8000ms-or-host deadline wrapper.
- `tests/introduction-special-races.test.mjs`: actual extracted Home keydown handler covers initial running and paused worlds, completion before input, last-moment completion at key delivery, ordinary skip, and stalled observations. Six cases fail on pre-repair source; no compensating key is emitted.
- `scripts/check-browser-building-clearing.mjs` and `scripts/check-browser-building-ground.mjs` are active scripts, not pinned historical producers. Removed their unconditional attempts to hide the deleted badge; retained screenshots and every geometry/GPU/assertion step. Native Paused remains visible.
- `scripts/local-render/startup-burst.mjs`: records the shared helper's actual result, distinguishing a delivered Space from natural completion; observer order is unchanged.
- Removed-selector inventory: remaining `.desktop-recommendation` counts are negative assertions; optional `Continue anyway` checks in active HUD-scale/minimap/recovery scripts are harmless visibility-guarded no-ops. `minimap-frame-baseline.mjs` explicitly targets the exact old base and remains untouched. The four crop observers' pause/popup selectors are owned by the popup integration lane. `.world-message` references are either negative assertions or read-only route/crop observations. Fixture-only old badge CSS/DOM is intentionally retained for labeled before screenshots. No active unconditional deleted-overlay locator wait/evaluate remains after the two building repairs.

### Remaining direct Space ownership

Independent review classified every remaining direct introduction delivery instead of assuming the shared helper covers it:

- `check-browser-reincarnation-wave.mjs` installs `requestAnimationFrame = () => 0` before navigation. Its awaited24-frame Scene.animate batch finishes before the native read/key pair, and the next batch begins afterward. `check-browser-shaman-death-ground.mjs` similarly installs its owned held-RAF function before navigation, advances only explicit awaited batches, and later verifies/restores that owner. Natural presentation completion cannot run between read and key in either loop. Their existing60s/45s input caps and controlled-driver ordering remain unchanged; introducing RAF polling here would deadlock rather than improve safety.
- `tutorial-browser/follower-corpse.mjs` and `melee-attack.mjs` retain their10s input limits and immediately require `!inputMask && !paused` before any Resume action or attack observation. A completion/Space race cannot silently pass: it times out the original episode instead of accepting the unexpected pause.
- `tutorial-browser/spell-conversion.mjs` retains its authored Mission3 gate and12s key limit. Its armed renderer observer rejects an unexpectedly paused running world, and the outer setup assertion requires `paused === false`; a race therefore fails acceptance rather than becoming false success.
- The recovery and Spy paths were different because their old postcondition accepted inputMask0 regardless of pause. Those are repaired above with fresh pre-input reads and immediate post-input pause checks. No control path uses compensating keys, injected events or controller calls.
