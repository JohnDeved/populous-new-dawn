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

## Ordinary-control scenario preflight

Read this before writing or extending a journey. These contracts were checked
against main `ab6e857` on 2026-10-04. Inspect the named callers again when their
source changes; a successful DOM click alone does not prove an accepted command.

### Selectors depend on the current screen

Use button roles and the actual accessible name, scoped to the visible dialog
when needed. The [world selector](../app/world-selector.tsx) and
[game page](../app/page.tsx) own these names:

| Screen/action | Button name |
| --- | --- |
| Campaign worlds | `Select Mission N`, then `Start Mission N` or `Replay Mission N` |
| All missions | `All missions`, then `Mission N` or `Mission N, completed`; direct entry does not prove campaign unlocking |
| Startup checkpoint | `Load Game` |
| In-game checkpoint | `Game settings`, then `Save checkpoint` or `Load checkpoint` |
| Close settings | Name beginning `Continue Game` (includes an arrow glyph) |
| Explicit pause state | `Pause game` / `Resume game` |
| Visible introduction | Name beginning `Skip introduction` (includes the ESC hint) |

[showAllMissions](../scripts/browser-game.mjs) waits for the `Start game` dialog
and chooses the direct-entry view. Do not reuse its `Mission N` selector against
the campaign-world view. `Game settings` is a top-actions control allowed through
the authored flyby input mask; ordinary HUD/world input may still be blocked.
Check the mask and actor readiness before issuing a world order. A visible Skip
button is not evidence that the input mask or startup actor exclusion has cleared.

### Prepare the view before selecting a command

[scene-camera-runtime.ts](../app/scene-camera-runtime.ts)'s `focus` clears
`world.mode`. Minimap focus and follower focus can therefore cancel building or
spell targeting. Position the view and resolve a visible eligible target first;
then choose the mode, click without another focus operation, and immediately
assert the accepted plan, order or cast before waiting for completion. An entity
or ground helper that focuses internally must not run after mode selection.

[live-command.ts](../app/live-command.ts)'s `command` rejects paused/non-playing
worlds. Resume through the UI before an order and verify the intended selected
IDs, input mask and mode. Keep route/allocation progress separate from initial
input acceptance. Diagnose a failed acceptance immediately instead of spending
the whole construction, travel or combat timeout waiting for an order never made.

Startup can already select the Shaman. Follower class controls add to the existing
selection; do not assume Ctrl-click yields exactly five people. For a new group,
use ordinary Escape and inspect the result: one Escape cancels an active mode,
the next clears selection. Account for visible dialogs/flybys consuming Escape
first. The owners are `cancelInteraction`/`selectFollowers` in
[selection-runtime.ts](../app/selection-runtime.ts), the keyboard handler in
[page.tsx](../app/page.tsx), and the regression in
[deselection.test.mjs](../tests/deselection.test.mjs).

### Separate saved state, load state and subsequent play

Click `Save checkpoint`, then await committed IndexedDB readback with
[waitForCheckpointReadback](../scripts/checkpoint-readback.mjs) and assert its
literal `true` result. Each asynchronous read must finish before the next starts;
do not use an async `waitForFunction` predicate as the storage completion guard.
[checkpoint-readback.test.mjs](../tests/checkpoint-readback.test.mjs) covers delayed
success, non-overlap, bounded false results and rejection.

Both load buttons reach `beginLoad` in [page.tsx](../app/page.tsx), which calls
`store.loadCheckpoint()` and explicitly clears `paused`. A paused save therefore
does not imply a paused post-load UI. Rebind the actual new scene/store; record
the saved turn and first observed loaded turn separately. If inspection needs a
pause, click `Pause game` and record that additional action. Natural turns between
load and observation may change timers, positions or short-lived effects; compare
their valid continuation instead of requiring the later snapshot to equal the
saved instant. Exact restoration-boundary proof needs a separately reviewed
observer of that boundary. Count active time across load epochs without double
counting restored turns, and keep wall time, paused time and game time distinct.

After fresh entry or Continue, use the read-only
[campaignShamanReadiness](../scripts/campaign-start-readiness.mjs) observer while
the normal RAF remains active. Preload it once, poll synchronously, and assert the
final ready result. `canOrder` alone misses the independent native flags4/128
selection exclusion. [campaign-start-readiness.test.mjs](../tests/campaign-start-readiness.test.mjs)
and [level-start.test.mjs](../tests/level-start.test.mjs) retain the failed-before /
ready-after boundary without weakening startup behavior.

### Diagnostics must remain observations

Reading a method name is not a purity proof. `selectionPeople` writes selection
flags, and `findPath` synchronizes terrain/landscape owners. Run placement, route
or range validators whose purity is not established on a detached
`structuredClone(world)`, with actors/targets taken from that same clone. Do not
pass a live actor into a cloned-world helper. Ordinary journeys must not advance
ticks, cancel RAF, write camera state, seed entities or invoke model commands.

If adjacent-turn evidence needs a diagnostic observer, review it separately: keep
it synchronous, chain the existing callback exactly once, copy only the needed
observations, and contain diagnostic errors so they cannot stop the game's next
RAF. Report observation errors as evidence failures; do not silently lose them.
Rebind after load and preserve the original callback's behavior. See
[game-clock.ts](../app/game-clock.ts) for the callback owner.

Retain every failed command and its exact checker bytes. Correct an attributed
helper mistake in a separately hashed input; a later exploratory victory does not
turn the failed outer receipt into a clean pass. Keep bounded stage-progress
diagnosis, actual game outcomes and resource timeouts distinct.

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
