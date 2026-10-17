# Frontend assets settle before the menu appears (#513)

The Home startup overlay now covers checkpoint restore and a frontend-only asset preparation promise. Independent groups load composition, normal/highlight fonts, low font, logo, background, pointer and frontend sliders concurrently. MainMenu and frontend Options consume one settled snapshot. A named 10,000 ms browser deadline freezes missing groups as fallbacks for that Home session. Late decodes cannot enable their CSS URLs or replace visible fallback text/sliders. There are no retries.

MainMenu sizes and draws its initial canvas in layout effects. Options publishes its foreground text rows in a layout effect so the parent draws their shadows before paint. Frontend Options reads prepared readiness synchronously on initial entry and remount. The existing in-game Options asset-loading branch remains unchanged and ignores the frontend snapshot; its caller does not supply the frontend row callback. GameScene, level loading, pause keyboard handling and clocks are untouched.

## Source and prior baseline

- Accepted production base: `14a985b3f11c6efde862d9837596fe2e9ed0588b` (#510).
- Retained baseline publication: `ce76881944c446c0aa9fab5005323e3b05c12de5`; [original baseline](../ui-preload-baseline-20261017/README.md) and its 33 hash-bound files are unchanged.
- Initial implementation/browser source: `ea98ff70b45c5a67ae77c1370e464851678619e8`.
- Final tested implementation: `7122a48291150fbb201fa59e5724b1d2a0289dd7`. Follow-up moved the image helper out of the session closure and used `new Error` to satisfy the strict linter. All final browser cases and focused tests ran on this clean commit. The subsequent publication commit only adds evidence.

## Final checks

| Check | Result |
| --- | --- |
| Nine affected test files via `npm run test:focus` | 73 passed, source-bound final-focused receipt |
| TypeScript | Passed |
| Scoped formatting | Passed |
| New asset module strict lint | Passed without findings |
| Scoped ESLint comparison against accepted #510 | No new findings across 14 changed JS/TS files |
| Scoped strict lint across four application files | Failed on two inherited MainMenu `react(refs)` errors; raw final-oxlint-scoped receipt retained |
| Structural orchestration check | Passed on initial implementation; final correction changes no structural metadata |
| Full check/build/hosted serving | Not run locally; parent-owned ready-PR gates |

The ESLint comparison retains complete before/after messages in `receipts/lint-details.json`. Existing findings are MainMenu's two `react-hooks/refs` errors at its row map, page HUD-size restoration's `set-state-in-effect` error, and its image warning. No lint configuration or suppression changed. The strict lint run also retains inherited warnings in existing menu/page code. Its initial run found two new `throw-new-error` errors and a helper-scope warning; those were repaired before the final checks.

The orchestration planner was inspected against the exact production base. Its coarse `app/page.tsx` mapping selects unrelated campaign/native probes and a conservative full suite for unmapped files. Those are not claims of this frontend-only slice; native execution is outside authorization, and full suites/build remain hosted integration gates. Focused tests cover the changed production paths, retained composition goldens, Options states, checkpoint restore ordering/cancellation, and selector launch guards.

The accepted resource policy (`engineering/test-resources.json`), runner, workflow and gate drivers are unchanged. This application change may require the parent's reviewed resource fingerprint refresh under the separately coordinated CI work before readiness. No policy refresh is claimed here. Main later merged #510 as `bc9cabf404240ad99b2aab8c26e9b0137cdd7702`; evidence remains attributed to the accepted pre-merge #510 source, with no automatic rebase.

## Browser evidence

Actual Home, store, CSS and assets in a plain React/Vite fixture, official Chrome Headless Shell 153.0.8010.12, 1280×800 DPR 1. Sandboxing is enabled; default arguments are omitted; launch contains `--remote-debugging-pipe` and an owned temporary profile. Each source.json records actual launch, browser executable hash, installed dependency lock hash and production/probe file hashes. Browser/context/server close is awaited; only the owned profile is removed. Port 4401 was no longer listening after the run. No build ran.

| Final case | UTC interval | Result |
| --- | --- | --- |
| Healthy cold + warm | 02:30:12.217–02:30:15.989 | All 10 relevant assets requested during startup; held composition keeps loader visible. First observed menu frame has decoded fonts/logo, 768×480 populated canvas displayed at 1280×800. Cold/warm Options have zero fallback labels and ready sliders. Reopen adds no relevant requests or image decode calls. |
| Slider HTTP 404 | 02:30:16.840–02:30:20.270 | Native slider fallback remains usable; fonts/logo/background/cursor stay ready. Warm result stays settled. |
| Normal-font HTTP 404 | 02:30:21.212–02:30:24.907 | Fallback text remains stable; logo, sliders and other healthy groups remain available. Shadow rows remain omitted for fallback foreground. |
| Late success | 02:30:26.046–02:30:40.563 | Background, pointer and one slider held across the native deadline. Snapshot observed about 10.615 s after first decode began has CSS background `none`, cursor `auto`, fallback sliders and healthy text/logo/composition. All held decodes then resolve; flags, CSS and fallbacks stay unchanged, including another Options remount. |

All cases exercised arrow non-interception in frontend Options, Enter to select Sound, range Home/End, Tab movement, Escape return and restored MainMenu Options focus. This is not a focus-containment claim. MainMenu first observed canvas dimensions/alpha are asserted on every visible frame sample. Options Game text-shadow row 139 hash is `ee09a376` on every sampled cold/warm ready frame; failed-font fallback consistently uses `4e059302`. The baseline had fallback-to-glyph reflow and delayed row publication; this check sees neither in the healthy case. These samples establish the observed frontend behavior, not exhaustive compositor timing.

Each case retained one Canvas2D readback performance warning caused by observation. Deliberate font/slider 404 cases retain their expected URL-specific console error; no unexpected console errors or page errors occurred. Responses are gated directly; native Image.decode is forwarded and observed, with no injected app state/readiness. Routing disables HTTP caching, so warm means same-document resource reuse. The fixture does not validate Vinext/Cloudflare/RSC serving, hydration, gameplay or hardware performance.

## Retained attempts and integrity

`healthy-1.json` failed before browser/server launch because the output environment variable was missing. It is retained with its raw log hashes. The four initial corrected browser runs passed on the first implementation; their reports/source metadata and receipts remain alongside the four final runs. Final screenshots are published; earlier passing screenshots remain in the owned local raw run directories. No previous baseline artifacts were replaced.

`manifest.json` binds each published artifact to original and published SHA-256 values. Portable text redacts machine paths; hashes embedded in command receipts continue to describe the original raw logs. Local raw receipts are under `work/orchestration/frontend-prepared/`. Weekly Codex usage was 20%, below the 70% stop threshold. This is a draft review handoff; no merge or ready transition is authorized here.
