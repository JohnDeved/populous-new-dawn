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
source commit/tree, tracked-diff and untracked-content fingerprints, browser version,
renderer, console diagnostics,
and pass/fail. `server.log` records build diagnostics. Failure captures are best
effort. Timeout/interrupt outcomes cannot be changed by a late scenario return;
failed receipts never include a successful result. Receipts are detached snapshots.
Owned browser and server process group are stopped on success, failure,
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

## Put visual evidence directly in GitHub reviews

Use GitHub CLI's supported media attachment flow when screenshots help reviewers.
The official CLI gained `--attach` in September 2026; version 2.102.0 was verified
for this workflow. Check `gh --version` and `gh pr comment --help` first. If an
older installed CLI lacks the flag, obtain a current release from
[the official CLI releases](https://github.com/cli/cli/releases), verify its
published checksum, and use that binary without changing authentication settings.
Reuse the already authorized account/configuration. Never print tokens or copy
credentials into commands, reports, or repository files.

Inspect the actual image before publishing. Exclude secrets, account details,
private download URLs and unrelated personal information. Record the tested
commit (and tree when useful), mission/scene, camera or phase, renderer, and the
scope of the check in the comment. Distinguish ordinary UI actions, seeded
storage fixtures, deterministic tick/frame stepping and genuine real-time play.
A screenshot does not establish full gameplay acceptance, native pixel parity,
or hardware-GPU performance. Label before/after commits separately.

For example, a `proof.md` file can include:

```md
Mission 2, tested commit FULL_SHA, fixed camera angle 1.
Local WebGL2 / ANGLE–SwiftShader. This is a paused render-placement check;
occupancy arose in ordinary play, and camera focus is controlled test setup.

![Mission 2 roof-smoke placement at FULL_SHA](work/proof/mission2.png)
```

Then publish it with the matching path:

```sh
gh pr comment 123 --repo OWNER/REPO --body-file proof.md \
  --attach work/proof/mission2.png
```

Repeat `--attach` for distinct relevant images. `gh issue comment` works the same
way. The CLI rewrites matching local Markdown references to native GitHub asset
URLs; unreferenced attachments are appended. Alt text can alternatively be given
as `--attach 'work/proof/mission2.png#Scene and tested commit'`.

Verify the returned comment and read its body back: the expected image references
should use GitHub-hosted assets, with no leftover local paths. Check for an
existing evidence comment before creating another. If publication is uncertain,
inspect the destination before retrying; do not blindly re-upload a batch. Reuse
an existing native GitHub asset URL when the same image is relevant in another
review of the same repository, rather than uploading duplicates. Avoid unrelated
images, bulky duplicate evidence commits, release spam, private Library URLs,
and unofficial or reverse-engineered upload endpoints.

See [GitHub's attachment documentation](https://docs.github.com/en/github-cli/github-cli/attaching-files-with-github-cli)
for current file types, access requirements and command support.

## Early-mission real-clock journey

Run the maintained bounded scenario through the same harness:

```sh
node scripts/local-render/harness.mjs \
  --game-root "$PWD" --browser "$POPULOUS_BROWSER" \
  --port 4188 --output /absolute/fresh-proof-directory --timeout 480000 \
  --scenario "$PWD/scripts/local-render/early-missions.mjs"
```

It uses a fresh browser profile per mission and checks Missions 1–3 public entry,
HUD group selection/Escape, keyboard/button pause and resume, settings/objective
visibility, Select Level Back/Escape interruptions, and ordinary checkpoint save
followed by a full-page reload, Load Game, pause and resume. Mission 1 uses the
campaign selector; Missions 2–3 explicitly use public All missions. This does not
claim to prove campaign unlocking, completed objectives or natural victory.

The scenario reuses `browser-game.mjs` public-entry binding. Scene/store/IndexedDB
references are observation-only: all changes are ordinary UI input and the live
RAF clock. It does not seed storage, inject entities/outcomes/mana, advance ticks,
or manipulate camera state. Startup normally preselects the Shaman, so the journey
uses ordinary Escape before checking that Ctrl-click adds five Braves. Treat a
failed test precondition separately from a reproduced game defect; retain the
failed attempt and correct the scenario rather than changing gameplay to satisfy it.

`journey.json` records every completed assertion group and its observations as the
run progresses, including failures; `receipt.json` contains the harness's terminal
result and exact game source identity. The report also hashes the scenario bytes,
which matters when `--game-root` and the scenario come from different checkouts.
Opening, saved-settings and restored-paused PNGs support visual review. Keep each
attempt's output separate and inspect images before attaching them to an issue/PR.
The normal harness owns cleanup and cancellation; the scenario adds no controller.
Actual software WebGL pixels and real elapsed time establish functional behavior,
not hardware-GPU performance, native pixel parity or first-three-mission completion.
