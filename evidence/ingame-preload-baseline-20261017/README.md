# In-game pause/Options readiness baseline (#513)

The same flash reproduces in the actual in-game pause menu and Options, including warm reopen. No application, asset, loading lifecycle, gameplay, CI or resource-policy code was changed. #514 remains untouched on its own branch.

Production base is accepted #510 `14a985b3f11c6efde862d9837596fe2e9ed0588b`, before #514 and the queued #511 keyboard fix. The observed source is `add5dc0405ccc49e933779e0b628fb6339358f71`; final publication adds evidence only. Initial run `9894e683f1d66af475e0456e6a673753ec21021f` also passed. Its one unused probe variable lint failure is retained; removing that binding was the only second-run change.

## Observations

Actual Home → New Game → first-time recommendation → Start Mission 1 → Skip introduction → Game settings → Options. Only `/original/pause-font.png` and `/original/options/ingame-{0,1,2}.png` responses were delayed. No application state, readiness, clock or storage fixture was injected. Native Image.decode calls are forwarded and observed.

The final run passed from **2026-10-17T02:38:48.110Z to 02:39:06.390Z**, 18.280 seconds. Eight screenshots and both raw browser observation reports/source fingerprints are retained.

| State | Observation |
| --- | --- |
| Initial level loading | None of the four target assets requested. Three natural loading-frame samples have `started=false`, turn/time/animation clocks zero, `previous=null`, and no gameplay keys. |
| Cold pause | Pause font requested on menu mount. Eight fallback labels visible with no loading overlay. |
| Cold Options | Pause font decoded again; three slider requests begin on Options mount. Nine fallback labels and `data-art-ready=false`. |
| Font released, sliders held | Glyphs become ready while sliders independently retain native browser fallback. |
| Sliders released | Slider artwork becomes ready. |
| Warm Options | No new target network request. Four new decode calls start around page time 15095.7 ms and finish at 15112.3 ms. Animation-frame sample at 15096.5 ms has nine fallback labels/unready sliders; 15115.0 ms is ready. |
| Warm pause | No new target network request. One new font decode starts at 16501.2 ms. Frame at 16502.8 ms has eight fallback labels; 16535.2 ms is ready. |

Options Back text changes from **71.59×36.67** CSS pixels at `(604.19,760)` to **106.67×46.67** at `(586.67,756.67)`. Its outer button stays 236.67×43.33. Pause Continue Game text expands from 252.79 to 333.33 pixels wide; its outer button is unchanged. The first observed pause frame already has correct viewport scaling; this run does not demonstrate a separate scale defect.

The four target URLs are each requested once. Warm reuse is same-document loaded-resource reuse after routing is removed, not a warm HTTP-cache benchmark. Routing disables HTTP cache while active. Frame observations establish captured prepaint states and complement screenshots; they do not measure the compositor or hardware performance.

## Clock and input boundaries

Five 500 ms checks cover cold pause, cold Options, font-ready/sliders-pending, warm Options and warm pause. During each, real keyboard W, Left Arrow and `=` events were sent to focused menu controls. The complete JSON-serialized world SHA-256, turn/time, animation frame/time, UI timer, camera position and gameplay key set stayed identical. `world.paused` and `scene.modalSuspended` stayed true. Rendering timestamps may advance, as intended by the existing modal-suspension path.

Continue Game clears pause/suspension and advances the world. The elapsed simulation-time check passes without catching up the modal hold. This does not claim every input route is covered; pointer, touch, audio, ordinary Space-pause ownership and keyboard navigation defects are outside this baseline.

The existing loading overlay is **not active while these menu assets are pending**. Natural level startup samples show stopped clocks and empty keys; this probe did not inject input during that short natural loading interval. Source inspection corroborates that `GameScene.start()` installs input listeners and starts animation only after Home's `created.ready` resolves. Modal keyboard isolation is exercised directly; a newly added loading wait would still require a dedicated clock/input regression.

## Source-bound next-slice proposal — not implemented

On this base, `OriginalPauseMenu` owns a mount-local `ready=false` and Image.decode effect for `pause-font.png`. `OriginalOptions` independently owns mount-local text/slider readiness and decodes the same font plus three ingame slider images. Cached downloads therefore do not prevent either first-render fallback. `GameScene.ready` covers terrain and its existing preload set; it does not own these menus.

Prefer a small **Home-session-owned in-game menu preparation result**, with independent font and slider groups and retained decoded image references. Begin those four downloads during the existing Home startup loader alongside checkpoint/frontend preparation, then pass their settled state synchronously to pause and in-game Options. Reuse that state across menu remounts. The four files total 14,452 raw bytes. This avoids changing when a new GameScene starts, and keeps #514's frontend work independently reviewable.

If authorized, follow #514's explicit 10-second browser-policy deadline and freeze each failed/timed-out group for the Home session. Preserve readable text/native slider fallbacks and group independence. No retry loop, new loader, native mapping or pause-keyboard changes are indicated by this baseline. Keep GameScene ready/start, level loading and pause ownership untouched under this preferred approach.

A different choice to await these assets during per-level loading would cross the gameplay start boundary: Home must not call `created.start()` before that additional wait settles. Merely keeping an overlay visible after start could run hidden clocks/input. That alternative needs separate authorization and loading/retry/cancellation evidence; it is not implemented or recommended by this baseline.

Focused follow-up acceptance should cover healthy cold/warm pause and Options without fallback frames/new decodes; separate font/slider failures; deadline plus late-success stability; unchanged pause world/animation/camera/input state; Continue without catch-up; and existing pause ownership/keyboard tests. Preserve the queued #511 fix independently. No unrelated game assets need investigation for this slice.

## Evidence, warnings and limits

The official sandboxed Chrome Headless Shell 153.0.8010.12 used an owned temporary profile and isolated port 4402 at 1280×800 DPR 1. Actual launch arguments, browser hash, installed lock hash, production/probe hashes and exact command results are in source/receipt JSON. Both browser runs and final scoped ESLint passed. No full suite/build was run for this probe-only change.

The plain React/Vite fixture exercises production Home/store/GameScene/CSS/assets but excludes hosted Vinext/Cloudflare/RSC serving/hydration. Expected software-WebGL, GPU readback-stall and Three missing-image-data warnings are retained; no page or console errors occurred. No unsafe browser flag was added in response to warnings. No original executable was opened or run.

Browser/context/server closure is awaited and only the owned temporary profile removed. Port 4402 had no listener afterward. The branch leaves application/public/package/engineering/workflow/runner files byte-identical to the accepted base. The 24-artifact ledger records original and portable SHA-256 values; paths are redacted in portable text, while embedded raw-log hashes still refer to originals. Earlier passing screenshots remain in the owned raw run directory. No #514 file was changed.
