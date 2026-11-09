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

## Opt-in task-owned checkpoint persistence

Use `--profile /absolute/game-checkout/work/local-render-profiles/task-name` only
for ordinary game checkpoint journeys. With no option the browser stays ephemeral.
This creates a private, ignored, game-only directory, or reopens a recognized one;
it never adopts an existing unmarked directory, personal profile, or symlink path.
Keep every output directory separate from the profile. Never commit, attach, copy,
or export its browser data. Only bounded receipts/manifests are review evidence.
This preserves saves across normal harness termination on this machine; it does
not promise survival of a cloud workspace reset.

Persistent runs must name `--scenario`. The official Headless Shell runs through
Playwright's `launchPersistentContext`, with the existing sandbox and explicit
`--remote-debugging-pipe`, `--user-data-dir=<owned-directory>/browser`, and blank
startup page. All Playwright default arguments remain disabled. HTTP/WebSocket
requests are restricted to the exact loopback game origin, downloads are disabled,
and service workers are blocked. This is for game QA only, with no login or auth.

`owner.lock` is exclusive. Never delete or recover a live, stale, unknown, or
interrupted lock automatically. Browser close must complete and disconnect before
the lock can be released; timeout, failed close, changed ownership, or missing
terminal checkpoint observation retains the lock and a failed receipt. Browser
Singleton ownership markers also block reuse. A failed gameplay assertion can
still preserve a genuine save when terminal cleanup and source identity are known.
No process is killed by name or port.

The manifest binds the canonical game root, exact origin (including port), game
input bytes, browser binary, installed dependency lock, Playwright runtime, Node
version, and harness bytes. Receipts retain exact source commit/tree/diff/untracked
fingerprints and scenario hashes before/after execution. Changed game/runtime
inputs always require a new profile. Only `qa/` and non-runtime scenarios under
`scripts/local-render/` are checker inputs; other repository files fail closed as
game inputs. A changed source identity or checker additionally requires
`--profile-correspondence /absolute/review.json` naming:

```json
{
  "priorRunId": "previous terminal run ID",
  "previousSourceFingerprint": "previous exact source fingerprint",
  "currentSourceFingerprint": "current exact source fingerprint",
  "previousChecker": "previous receipt.profile.inputs.checker",
  "currentChecker": "current profileInputReceipt(root).checker",
  "decision": "ACCEPT",
  "reviewer": "independent reviewer identity",
  "reference": "retained exact-source review location"
}
```

This file records an actual independent review; it is not an approval generator
or a game-input migration override. Each changed-source continuation names its
immediately preceding run. Same-source retries need no correspondence. A journey
may impose a stricter same-source-only boundary on its own checkpoint milestones.

Before the scenario executes, `receipt.profile.checkpointAtStart` is read from the
committed IndexedDB `latest` record and compared with the previous terminal record.
`receipt.profile` includes `id`, `path`, `runId`, `mode` (`created`/`reused`),
`inputs`, `previousRun`, `checkpoints`, and final cleanup/continuation status.
`previousRun` includes the preceding receipt path/hash, exact source fingerprint,
commit, checker digest, run ID, status, and `checkpointAtEnd`.

The scenario receives `observeCheckpoint(label)`, which only reads committed
IndexedDB. It returns `{ label, observedAt, profileId, runId, sourceFingerprint,
checkpoint }`, where `checkpoint` is null or `{ version, level, turn, time,
checkpointSha256, actorsSha256, terrainSha256, stockSha256 }`. Hashing retains typed
array type/values and Map/Set entries. No raw checkpoint storage is exported.
The stable full-record identity is `observed.checkpoint.checkpointSha256`.
Use ordinary Save and await the readback; observation alone does not prove the Save
UI action. Use ordinary Load and synchronously observe the store replacement to
check the saved turn boundary before the normal clock automatically resumes.

For the small restart proof, run the same command twice with different outputs:

```sh
node scripts/local-render/harness.mjs --game-root "$PWD" \
  --browser "$POPULOUS_BROWSER" --port 4188 --timeout 180000 \
  --profile "$PWD/work/local-render-profiles/checkpoint-restart" \
  --scenario "$PWD/scripts/local-render/checkpoint-restart.mjs" \
  --output "$PWD/work/orchestration/checkpoint-restart/save"
# After the first receipt verifies terminal browser cleanup, repeat with:
# --output "$PWD/work/orchestration/checkpoint-restart/load"
```

The first run starts Mission 1 through shipped controls, awaits Shaman readiness,
opens Game settings, clicks Save checkpoint, and checks committed readback. It then
terminates its browser. The second launch reopens the same owned profile, clicks
Load Game, and compares saved level, turn/time, actor identity/position/HP, terrain,
and stock at the actual replacement boundary. Load's normal auto-resume is recorded,
then the ordinary Pause control is used for a screenshot. No tick, world, or storage
injection occurs. This proves restart continuity only, not mission completion.

## Ordinary-control scenario preflight

Read this before writing or extending a journey. These contracts were checked
against main `ab6e857` on 2026-10-04. Inspect the named callers again when their
source changes; a successful DOM click alone does not prove an accepted command.

### Keep scenario imports and startup completion explicit

A named CLI scenario must not import the executing harness module. The harness
awaits that scenario import, so importing the harness back can leave top-level
await unsettled before a server starts. Shared source fingerprinting now lives in
`owned-profile.mjs`; the harness re-exports it for existing callers. Exercise the
real named-scenario CLI entry, then a short actual server/scene startup before a
long route. An import-only check does not establish rendered startup.

Use one bounded startup budget for scene binding and native actor readiness.
Short individual waits may time out while a cold scene becomes visible. Retry
only genuine Playwright `TimeoutError` from the read-only binding operation,
retain those diagnostics, and check cancellation/deadline after each await before
accepting success. Other errors propagate immediately. Keep physical mission,
Skip and command inputs single-shot; never repeat a click merely because its
completion wait failed. Once bound, pin the scene, World and original actor.

For the optional Skip setup control, a scenario can use a single supported
`Locator.click({ noWaitAfter: true })` followed by its explicit same-scene/native
readiness gate. In the verified Playwright 1.63 implementation this still awaits
the physical action and initial actionability checks, but skips navigation and
post-action hit-interceptor waits. That return alone does not prove the opening
finished. Do not apply this completion choice to a proof-critical worship/order
click without its own reviewed input/recipient contract.

The Erosion QA CLI, startup, cancellation and click regressions retain the three
observed failures: import-cycle exit 13, the initial two-second canvas wait, and a
Skip click that physically completed before its navigation wait timed out. The
startup-only result is separate from an ordinary controller capture/native replay.

Retained evidence: [CLI import exit 13](https://github.com/JohnDeved/populous-new-dawn/blob/d4b877ad56ca62f78fc6c49ee07cb4b5837c1f85/failures/import-cycle/command-receipt.json),
[initial canvas timeout](https://github.com/JohnDeved/populous-new-dawn/blob/d4b877ad56ca62f78fc6c49ee07cb4b5837c1f85/failures/scene-binding/receipt.json), and
[Skip completion timeout](https://github.com/JohnDeved/populous-new-dawn/blob/d4b877ad56ca62f78fc6c49ee07cb4b5837c1f85/failures/skip-completion/receipt.json).
The [actual Erosion capture and bounded native replay](https://github.com/JohnDeved/populous-new-dawn/blob/d4b877ad56ca62f78fc6c49ee07cb4b5837c1f85/report.md) succeeded after
these fixes. Regressions are [the real CLI boundary](../tests/erosion-ordinary-cli.test.mjs)
and [startup/stop/click completion](../tests/erosion-ordinary-cleanup.test.mjs).

### Selectors depend on the current screen

Use button roles and the actual accessible name, scoped to the visible dialog
when needed. The [world selector](../app/world-selector.tsx) and
[game page](../app/page.tsx) own these names:

| Screen/action | Button name |
| --- | --- |
| Campaign worlds (Missions 1–3) | `Select Mission N`, then `Start Mission N` or `Replay Mission N` |
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
first. Tutorial Escape opens its menu instead; use that mode's actual control
contract rather than this early-campaign selection sequence. The owners are
`cancelInteraction`/`selectFollowers` in
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

For Missions 1–3 after fresh entry or Continue, use the read-only
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

Use the supported GitHub CLI attachment flow below from the authorized executor.
The [PR visual-evidence requirements](README.md#visual-evidence-before-review)
still apply. Keep review-only images and logs in ignored `work/` or outside the
checkout; do not commit them to main.

### Check the CLI and upgrade only if needed

```sh
gh --version
gh pr comment --help
```

The help must expose repeatable `--attach file` with
`<file>#<image alt text>` and `--body-file`. Version **2.102.0 (2026-09-30)**
was verified; this is not a claim about the earliest supported version. Use the
installed binary if capable. Otherwise obtain a release from
[official CLI releases](https://github.com/cli/cli/releases/tag/v2.102.0).
For Linux x86_64, this Bash block downloads that verified version to a temporary
directory, checks its published SHA-256 **before extraction/execution**, and
selects it for this shell without replacing the system CLI:

```bash
set -euo pipefail
[ "$(uname -s)" = Linux ]
[ "$(uname -m)" = x86_64 ]
gh_version=2.102.0
gh_asset="gh_${gh_version}_linux_amd64.tar.gz"
gh_tools=$(mktemp -d)
gh_release="https://github.com/cli/cli/releases/download/v${gh_version}"
curl --fail --location --silent --show-error \
  "$gh_release/$gh_asset" -o "$gh_tools/$gh_asset"
curl --fail --location --silent --show-error \
  "$gh_release/gh_${gh_version}_checksums.txt" -o "$gh_tools/checksums.txt"
(
  cd "$gh_tools"
  awk -v asset="$gh_asset" '$2 == asset {print}' checksums.txt > selected.sha256
  [ "$(wc -l < selected.sha256)" -eq 1 ]
  sha256sum --check selected.sha256
  tar -xzf "$gh_asset"
)
export PATH="$gh_tools/gh_${gh_version}_linux_amd64/bin:$PATH"
gh --version
gh pr comment --help
```

For another OS/architecture, select its matching official asset and checksum;
do not run the Linux binary. A failed download/checksum/capability check blocks
this route. Reuse the authorized account/configuration (`gh auth status`);
never print tokens, copy credentials into commands/reports, or change auth to
bypass a denial. Attachments require repository push access. See the
[official comment manual](https://cli.github.com/manual/gh_pr_comment) and
[attachment documentation](https://docs.github.com/en/github-cli/github-cli/attaching-files-with-github-cli)
for supported media and access requirements.

### Prepare and publish one evidence comment

Inspect the actual pixels first. Exclude secrets, account details, private URLs,
and unrelated personal information. Caption each image with its full tested
commit SHA (distinguish PR head from tested merge), scene, camera/phase, viewport,
browser/renderer, and what it demonstrates. Label before/after separately.
Disclose seeded/injected state, controlled stepping, crops and other limitations;
distinguish ordinary UI actions from test setup and original-game references.
Images alone do not prove gameplay acceptance, native parity or hardware performance.

Run from the repository root. Replace **all uppercase placeholders** below with
actual values; these are deliberately not a live PR number or old evidence paths.
Retain your inspected captures as `work/pr-evidence/before.png` and `after.png`.
Create `work/pr-evidence/proof.md` with a text editor, for example:

```md
Before: BEFORE_FULL_SHA. After: AFTER_FULL_SHA.
Scene: SCENE; camera/phase: CAMERA_PHASE; viewport: WIDTHxHEIGHT at DPR.
Browser/renderer: ACTUAL_BROWSER_AND_RENDERER.
Demonstrates: OBSERVED_CHANGE. Setup/limitations: ACTUAL_SETUP_AND_LIMITS.

![Before: SCENE at BEFORE_FULL_SHA](work/pr-evidence/before.png)
![After: SCENE at AFTER_FULL_SHA](work/pr-evidence/after.png)
```

If a before capture is unavailable, explain why and omit its reference/flag;
never fabricate it. For changed motion, also attach the required ordered sequence
or recording. Check existing comments before uploading:

```bash
repo='OWNER/REPO'
pr='PR_NUMBER'
gh pr view "$pr" --repo "$repo" --json url,headRefOid,isDraft,comments
# After replacing placeholders and checking the destination and captions:
gh pr comment "$pr" --repo "$repo" \
  --body-file work/pr-evidence/proof.md \
  --attach 'work/pr-evidence/before.png#Before: SCENE at BEFORE_FULL_SHA' \
  --attach 'work/pr-evidence/after.png#After: SCENE at AFTER_FULL_SHA'
```

Repeat `--attach` for each distinct file (up to 50 per command in the verified
version). Matching local Markdown references are replaced with GitHub asset URLs
and retain **the Markdown's alt text**. The flag's `#` alt text applies to images
appended because the body did not reference them; video has no alt text. Use the
same path spelling in Markdown and flags. `--body-file` preserves multiline text
without shell expansion. `gh issue comment` supports the same attachment flow,
but link relevant issues to the PR evidence instead of duplicating uploads.

### Read back and retrieve the published attachments

Save the returned comment permalink. If the upload times out or its outcome is
uncertain, inspect existing comments before retrying; do not re-upload blindly.
For `.../pull/PR_NUMBER#issuecomment-COMMENT_ID`, use that exact numeric ID:

```bash
comment_id='COMMENT_ID'
gh api "repos/$repo/issues/comments/$comment_id" \
  --jq '{html_url, body}' > work/pr-evidence/posted-comment.json
gh api "repos/$repo/issues/comments/$comment_id" \
  --jq .body > work/pr-evidence/posted-body.md
cat work/pr-evidence/posted-body.md
```

Check the returned permalink is the intended PR/comment, all captions are intact,
and every expected image reference is a GitHub-hosted asset URL. Inspect the whole
body: no `work/`, absolute executor path, `file://` URL, unexpanded placeholder,
or other local image path may remain. A local Markdown file is not published
image evidence. Copy each exact hosted URL from the readback and retrieve it,
for example (repeat for every image):

```bash
asset_url='HTTPS_GITHUB_ASSET_URL_FROM_READBACK'
curl --fail --location --silent --show-error "$asset_url" \
  --output work/pr-evidence/retrieved-after.png
file work/pr-evidence/retrieved-after.png
cmp work/pr-evidence/after.png work/pr-evidence/retrieved-after.png
```

Confirm retrieval is an image, not an HTML login/error page; inspect its pixels
and the rendered comment using the available image viewer/GitHub interface.
A byte match confirms the original file; if bytes differ, investigate conversion
and compare actual pixels rather than claiming an exact match. If private media
requires authentication, use authorized GitHub access, never send a token to an
arbitrary asset/redirect host. Report inaccessible assets or missing rendered
verification as blocked; keep the PR draft until required evidence is verified.
Link the verified comment from the PR's visual-evidence section and relevant issue.

[PR #683's Tornado comment](https://github.com/JohnDeved/populous-new-dawn/pull/683#issuecomment-6290131966)
is an existing successful two-image example, not evidence for a new head. Do not
repost those images to test this procedure. Reuse already published asset URLs
when appropriate within the same repository. Avoid private Library URLs,
unofficial upload endpoints, duplicate evidence commits and release spam.

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

## Cloud reset recovery and real browser persistence

For the verified official Headless Shell version, download provenance, hashes,
reset recovery boundaries and distinction from the provisioned Chrome/CDP browser,
see [cloud render recovery](cloud-render-recovery.md). Never silently substitute
a desktop browser wrapper or weaken the sandbox when a previous binary is missing.

`mission10-boat-checkpoint.mjs` is a two-process ordinary-input witness. With a
fresh task-owned profile it boards the authored Shaman and four Warriors in Boat62
and saves through the menu. With the same exact source/origin/profile it loads the
genuine browser checkpoint and uses the visible passenger panel to unload and
await physical landing. Run it using the `--scenario`, `--profile`, and separate
`--output` conventions above; allow `--timeout 600000` for software rendering.
It does not prove a sea crossing, full mission or campaign completion. The
[source-bound result and preserved failures](../references/verification/m10-boat-browser-2026-10-14/README.md)
include the actual reviewed checker-only correspondence used during development.

## Ordinary M14 linked-head acquisition

`mission14-linked-head.mjs` starts authored Mission14 through the public menu,
selects original Braves50–55 using the HUD, targets head47 through minimap and
actual pointer input, then waits for natural walking/worship and both linked
Earthquake/Bridge gifts. The browser owns all RAF/simulation progression. Use a
fresh output, `--mission 14`, `--scenario` and `--timeout 660000`; no profile is
required. See the [source-bound inspected packet](../references/verification/m14-linked-head-browser-2026-10-14/README.md).
It proves bounded acquisition, not campaign completion. The retained pre-repair
screenshot also exposes the incorrect one-follower command toast.
