# Local Linux rendering harness

Use an installed official Chrome Headless Shell. The harness never downloads a
browser, changes sandbox settings, starts a remote service, or modifies game code.
Install dependencies in the game checkout first. A Linux runtime must support the
browser's normal sandbox and inherited IPC; desktop Chromium may fail on a
ProcessSingleton socket where official Headless Shell works.

Run from this checkout:

```sh
node scripts/local-render/harness.mjs \
  --game-root /absolute/game-checkout \
  --browser /absolute/chrome-headless-shell \
  --port 4188 --mission 1 \
  --output /absolute/ignored-proof-directory --timeout 120000
```

Alternatively set `POPULOUS_BROWSER`. The other defaults are current game root,
port 4188, mission 1, and `work/orchestration/local-render` output. Every run starts
an isolated Vite config with the Cloudflare inspector disabled and its own fresh
browser context. The supported CLOUDFLARE_CF_FETCH_ENABLED=false setting disables
the optional external Request.cf metadata fetch; Wrangler metrics are also off.
The browser retains its sandbox; all Playwright defaults are
removed and only the debugging pipe is enabled. No unsafe SwiftShader opt-in is
passed. Rendering may use the browser's built-in CPU fallback.

The harness checks HTTP readiness, then visible mission UI and actual attached game
canvas/state. It does not wait for networkidle. The normal mission button and Skip
Introduction controls start the game. Reading test references is observation, not
world/tick injection. `mission.png` and `receipt.json` contain actual output and
source commit/tree, dirty state, browser version, renderer, console diagnostics,
and pass/fail. `server.log` records build diagnostics. Failure captures are best
effort. Owned browser and server process group are stopped on success, failure,
SIGINT, SIGTERM or timeout. Never reuse an output directory concurrently.

Advanced focused checks can supply `--scenario /absolute/scenario.mjs`. Its default
async export receives `{ browser, context, page, url, root, output, openMission,
receipt, signal }`. Honor cancellation and keep all asynchronous work awaited.
Scenario-created additional contexts must remain isolated and owned by this run.
Label manipulated fixtures explicitly; they cannot prove natural gameplay.

A startup screenshot is not campaign completion, full regression acceptance, or
performance parity. CPU/SwiftShader timings must not be compared as equivalent to
Mac hardware-GPU timings. Serialize graphics captures and performance workloads.
Downloaded binaries and proof images belong outside tracked source.
