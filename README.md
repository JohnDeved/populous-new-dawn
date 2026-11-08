# Populous · The Journey Begins

The original first mission, rebuilt for desktop browsers with original-game visual styling and a spherical world. Terrain and initial objects come from the user-supplied game; behavior is being reconstructed and compared against its executable. Spell-head work and delayed gifts are CPU-compared; follower eligibility and world scheduling remain approximate.

## Run

```sh
# Source-only work needs no package install or copied game assets:
python3 scripts/orchestration/shared_setup.py --revision "$(git rev-parse HEAD)"

# For an active development checkout, choose one persistent, same-filesystem root:
export PND_SHARED_ROOT="$HOME/.local/share/populous-new-dawn"
# Requires an already available pnpm 11.25.0 (one-time provisioning below).
# Declare this install's allowance and the space that must remain for other work.
export PND_SETUP_ALLOCATION_BYTES=2147483648 PND_SETUP_RESERVE_BYTES=2147483648
python3 scripts/orchestration/shared_setup.py plan --revision "$(git rev-parse HEAD)" \
  --allocation-bytes "$PND_SETUP_ALLOCATION_BYTES" --reserve-bytes "$PND_SETUP_RESERVE_BYTES" &&
test "$(pnpm --pm-on-fail=error --runtime-on-fail=error --version)" = 11.25.0 &&
pnpm_config_runtime_on_fail=error pnpm install --frozen-lockfile --ignore-scripts \
  --store-dir "$PND_SHARED_ROOT/pnpm-store" --cache-dir "$PND_SHARED_ROOT/pnpm-cache" \
  --pm-on-fail=error --no-runtime --network-concurrency=1 --child-concurrency=1 &&
python3 scripts/orchestration/shared_setup.py check --revision "$(git rev-parse HEAD)" \
  --reserve-bytes "$PND_SETUP_RESERVE_BYTES" &&
pnpm run dev
```

Use Node 24, a desktop monitor, keyboard/mouse and a WebGL 2 browser. The music-note button enables original sample playback for voices, spells and combat.

The allowances above are explicit examples, not measured requirements or a quota.
Choose a root on the checkout's filesystem and adjust the declared budgets to the
coordinator's actual resource plan; do not lower the remaining reserve to force a pass.
Reuse an available pinned pnpm instead of reinstalling it. If missing, provision it
once with `npm install --global --ignore-scripts pnpm@11.25.0` under the separate
tooling budget, before starting this install. For a populated shared
store, add `--offline` to the install; a missing package must fail, not fall back to
network. Use a fresh/private `node_modules`, never another checkout's install.
See [shared storage setup and its measured limits](engineering/shared-worktrees.md#current-pnpm-shared-storage-setup)
for frozen-lock identity, safe reuse, package-cache repair behavior, and asset views.

## Play

The first mission opens with its original camera tour. Press Escape/Space or click **Skip introduction** to return to play; pause also freezes the tour.

1. Select a brave and click the southern Land Bridge stone head. Keep a follower worshipping to earn gifts, with up to four Land Bridge shots held at once. Each completed worship cycle starts a short delivery delay; leaving early loses progress.
2. Move your shaman to the northern edge of the starting island. Choose Land Bridge and click land across the water.
3. Blast the lone Dakini guard. Send the shaman to the Vault of Knowledge to discover warrior training; send a follower to the other stone head for four Lightning gifts.
4. Place a Warrior Training Hut near your settlement. Free braves fetch eight logs and build it. Select braves and click the completed hut to train them.
5. Bridge from the central island to the Dakini. Defeat their followers; Lightning is particularly useful against their shaman.

Click to select/order; drag to select groups; Shift adds followers. Up/down arrows move forward/back; left/right arrows rotate, Ctrl+left/right pan sideways, and Shift speeds up panning. The outer screen edges scroll, including beside the sidebar. WASD pans, Q/E or right drag rotates, middle drag pans, scroll or = / − switches view, and the minimap moves smoothly to a place on its surface. Focus commands preserve rotation and zoom; panning or dragging takes over from an active journey. Enter or ◎ shows the planet overview.

`1–3`: Blast / Land Bridge / Lightning. `B`: buildings. `H`: shaman. `F`: focus. `G`: guard shaman. `Space`: pause. `F8`: toggle the optional performance overlay (also in battlefield menu); `?fps` enables it on load. `Esc`: cancel targeting. Hold the apostrophe/Quote key to show damaged friendly followers’ health. Right-click Blast's card to toggle charging and redirect mana to training.

Send braves inside huts to increase mana flow and breeding. Builders collect actual timber; there is no automatic global wood income. Buildings need a dry, level footprint near the settlement. Followers drown in water, and Blast can knock them off a shore. A shaman reincarnates while followers survive.

## Verify

```sh
pnpm run check
pnpm run build
# With the development server running and Google Chrome installed:
node qa/browser-check.mjs
node qa/flyby-check.mjs
pnpm run test:sprites
node scripts/check-browser-camera-focus.mjs
node scripts/check-browser-camera-input.mjs
node scripts/check-browser-camera-view.mjs
node scripts/check-browser-navigation.mjs
```

`pnpm run test:sprites` checks a frozen atlas hash, 336 original-engine pose fixtures,
actual GPU artwork at native resolution, scaled layer rectangles, selection and
Blast shadows. Run it after sprite, atlas, animation or projection changes. The
fixture generator requires the original executable; updating fixtures is an
explicit `--record` operation after reviewing native comparisons, not part of tests.

Tests cover the original setup, closed island crossings, worship/discoveries, timber delivery, explicit training, mana allocation, complete mission victory, defeat, reincarnation and spherical foundation geometry. Playwright exercises the visible mission controls, construction, training, audio, pause, planet rotation and restart.

`app/model.ts` owns simulation; `app/scene.ts` owns Three.js/input/camera; `app/page.tsx` owns the HUD. `app/level-one.ts` is generated by `scripts/import-level.py`. Original building/tree meshes, their texture coordinates, layered 2D unit animations, HUD icons and level-one landscape textures are imported by `scripts/import-original.py`. Original voices and sound effects are decoded by `scripts/import-sound.py`. Adaptive music is not implemented; original executable binaries are not shipped. See [native asset formats and provenance](references/native-assets.md).

See [level-one research and implementation limits](references/level-one.md) and [art, audio and stack references](references/README.md). Combat, timing and enemy AI remain adaptations; this is the first mission, not a full campaign or an emulator.

Full parity remains an [active goal](GOAL.md). The project includes a [reproducible decompilation workflow](decomp/README.md) and [debug-symbol/upstream assessment](decomp/upstreams.md).

## Parity progress

[PARITY.md](PARITY.md) tracks global verified-checkpoint coverage, each subsystem,
remaining gaps, evidence and assessment history. Its verified gameplay and
game-mechanics parity percentage is the project's progress measure against the
original game. Partial work receives no percentage credit. The denominator is the
versioned known-scope inventory, not estimated effort, and expands with discoveries.

```sh
pnpm run parity                 # Compact global/subsystem report
pnpm run --silent parity --json # Machine-readable counts and percentage
pnpm run parity:check           # Evidence paths, revision and report freshness
pnpm run parity:render          # Refresh report wording without recording progress
pnpm run parity:record "Describe the change and checks run"
```

Edit `parity.json` after comparing and integrating behavior, then record a snapshot.
Keep IDs/scope stable; scope changes require a revision increment and an explanation.
Commit the ledger, history and generated dashboard together. Metadata checks run
with `pnpm run check`; they do not execute the linked native or browser comparisons.

The percentage covers **known scope**. The inventory remains open: add new groups
or `unassessed` checkpoints as research reveals more, or split broad checkpoints
with a recorded revision. New scope can lower the percentage. Unknown work is not
given an invented weight, and an open discovery status prevents 100% checklist
coverage from qualifying for final parity review.

## Editing the game

Maintainability is a standing [main priority](GOAL.md#main-priority-clean-readable-and-maintainable-typescript). The current stack is TypeScript, React 19, Three.js, Web Audio and Vite 8 through vinext. Keep the simulation runnable without a browser; UI and rendering consume its state. [Three.js](https://threejs.org/manual/en/fundamentals.html) supplies scene/rendering primitives while our engine retains control of original simulation rules.

### Gameplay parity and performance

Gameplay parity preserves observable gameplay and relevant deterministic outcomes:
rules, intended timing, targeting/selection results, and RNG progression or
checkpoint continuation where they affect required behavior. Historical code
structure, algorithms, architecture, incidental allocations and internal
representation are not parity requirements. Do not sacrifice performance merely
to imitate the original implementation.

Prefer modern, measurably better algorithms and data structures when they preserve
required behavior. A slow ray-cast path can be replaced with a better spatial query
or acceleration method; optimization need not retain the existing algorithm.
Validate actual gameplay semantics, including hit/occlusion, boundary, wrap and
tie behavior where relevant. Keep native comparisons and supported-behavior regressions;
do not delete tests blindly or weaken correctness requirements to admit a faster
implementation. If a test constrains only an incidental internal detail, establish
and retain coverage of the required behavior before changing that assertion.

Use comparable before/after workloads and measure full-frame or end-to-end cost,
including setup, updates, invalidation, deferred work and allocation pressure as
applicable. Moving work outside a timing bucket or renaming it does not establish
a speedup. Separate microbenchmark results from complete gameplay performance;
follow the [measurement rules](references/modern-performance.md#measurement-rules).

### Development save contract

The game is still in development. Only the current save format is supported;
backwards compatibility with obsolete development saves is not required. Do not
add or retain migrations, adapters, or fallback paths solely to load them unless
the owner explicitly requests that support.

Reject incompatible saves with a clear explanation, without deleting, overwriting,
or silently resetting stored data. Current-format durability, malformed-input
checks, new-game/restart behavior, and deterministic save/load continuation remain
required. Explicit classic/native fixtures may remain as research/test evidence,
not a promise to load old application saves. This policy concerns development
saves only, not unrelated platform or API compatibility.

| Change | Start here |
| --- | --- |
| Spell identity, behavior or engine state | `app/model.ts`; use the shared `SPELLS` definitions, including native model IDs |
| Campaign notifications and imported text | `app/messages.ts`, `app/original-messages.json`; original bytecode integration in `app/model.ts` |
| Native model coordinate morphs | `app/morph.ts`; task transitions in `app/model.ts`, geometry updates in `app/scene.ts` |
| Worship work, decay and refill | `app/worship.ts`, `app/vault.ts`; world eligibility and delayed rewards currently live in `app/model.ts` |
| Campaign bytecode semantics | `app/popscript.ts`; engine command bindings currently live in `app/model.ts` |
| Opening camera events and motion | `app/flyby.ts`; native comparisons in `scripts/check-native-flyby.py` |
| Forced tour callouts, names and lifetime | `app/tooltips.ts`, `scripts/import-messages.py`; native comparison in `scripts/check-native-tooltips.py` |
| Models, sprites, camera or input | `app/scene.ts` |
| HUD and menus | `app/page.tsx`, `app/globals.css` |
| Sound playback | `app/audio.ts`; original sample/cue data is generated |
| Original assets, maps or script data | `scripts/import-*.py`; rerun the importer rather than editing its generated output |
| Native behavior evidence | `decomp/`, `references/reverse-engineering.md`, `scripts/check-native-*.py` |

Run `pnpm run dev` to edit and play, then `pnpm run check` for types and gameplay regressions. [Vite supports fast module updates but does not type-check TypeScript](https://vite.dev/guide/features#typescript), so checking stays explicit. The tests run the same engine modules directly using [Node's TypeScript support](https://nodejs.org/api/typescript.html). Use `pnpm run build` before publishing and the browser checks above for interaction/rendering changes.

Separate growing simulation and scene files only when the locked gameplay feature
requires it. Prefer readable functions, shared data and direct module imports; do not
treat extraction as a standalone backlog. Generated data may stay compact;
hand-written code should stay easy to inspect.

### TypeScript quality workflow

`pnpm run typecheck` uses pinned TypeScript 7.0.2's native checker with one checker
worker to limit parallelism on memory-constrained runners. `pnpm run check` and the existing CI gate use this same
command. It checks the unchanged `tsconfig.json`; it does not replace Vite/Oxc's
JavaScript transpilation or change gameplay performance.

`@typescript/native` aliases Microsoft's stable [TypeScript 7.0.2](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) package.
The existing `typescript@5.9.3` stays pinned for `import ts from 'typescript'`
consumers and typescript-eslint, preserving AST and `transpileModule` behavior.
Native TypeScript is not a drop-in replacement for the JavaScript compiler API.
A separate TypeScript 6 API migration would need to account for its changed emit
defaults, including strict-mode directives in expression-based test fixtures.

Both packages declare a `tsc` binary, so do not use bare `tsc` or `npx tsc`.
The package scripts invoke exact package entrypoints rather than depending on the package manager's
bin-link ordering. `pnpm run typecheck:legacy` explicitly runs TypeScript 5.9.3
for diagnosis, not as a replacement for the native gate.

Use `pnpm install --frozen-lockfile --ignore-scripts` with optional dependencies enabled: the native compiler's
platform-specific executable is supplied by the locked pnpm optional package. No Go installation is required.
For cold-check comparisons, pass `-- --incremental false` to both scripts and keep
source, dependency and generated-type inputs identical. A killed or failed check
is not a performance baseline; no speed or memory ratio is claimed by this upgrade.

Use `pnpm run format` to format maintained app TypeScript with
[ox-standard](https://github.com/JohnDeved/ox-standard), and `pnpm run format:check`
to verify it. Generated level data and original asset JSON remain importer-owned.
`pnpm run lint:standard` runs the preset's Oxlint rules without modifying files.
The preset’s hexadecimal-case rule is disabled because Oxfmt normalizes hex
digits to lowercase; formatting owns that choice. Oxlint currently reports legacy findings; do not hide them or treat it as a passing gate.
Keep `pnpm run lint` for the existing correctness and accessibility checks during migration.

[Fallow](https://github.com/fallow-rs/fallow) is pinned locally:
`pnpm run quality:health` ranks complexity hotspots and refactoring targets,
`pnpm run quality:dupes` finds duplication, and `pnpm run quality:unused` finds
unused-code candidates. These commands are advisory: exit 1 means findings,
exit 2 means an execution/configuration error. For a deliberately time-bounded
advisory attempt, use the opt-in [foreground supervisor](engineering/performance-queue.md#optional-bounded-foreground-advisories)
with a command receipt; timeout is a non-pass, never an advisory success.
Python native-comparison scripts
import engine exports indirectly, so investigate callers before deleting anything.
The initial complexity hotspots are `stepTurn`, `stepCelebration` and
`stepTrainingPerson`; simplify coherent pieces while preserving native comparisons.

Apply [Ponytail](https://github.com/dietrichgebert/ponytail) when editing: reuse
existing helpers, remove unnecessary machinery, and favor clear domain names and
control flow. Concise code means fewer unnecessary operations, not fewer line breaks.
Raw decompiler output belongs in `decomp/`, not in maintained TypeScript.


`node scripts/check-browser-reincarnation.mjs` checks the original stone-ring
positions, facing, keyboard camera rotation and grounding after terrain edits.
For executable comparisons run `python scripts/check-native-reincarnation.py EXE`
with the decompilation environment described in `decomp/README.md`.


`node scripts/check-browser-building-smoke.mjs` exercises live collapse smoke,
frame cycling, camera rotation, growth and expiry. Compare its geometry and
lifecycle with `python scripts/check-native-building-smoke.py EXE`.

`node scripts/check-browser-building-debris.mjs` checks collapsing building faces,
original textures, flight/spin, camera rotation, impact sounds and cleanup.
`python scripts/check-native-building-debris.py EXE` compares the original face
emitter, initialization RNG, directed physics, land/water impacts and splash setup.

`node scripts/check-browser-texture-filter.mjs` checks live texture settings and
80 GPU palette samples across models, terrain, water and both cloud layers.
`python scripts/check-native-texture-filter.py EXE` executes original renderer
initialization/filter transitions; it does not emulate original GPU rasterization.

`node scripts/check-browser-camera-view.mjs` checks close/normal/bird's-eye views,
timed transitions and actual keyboard, wheel and menu controls. Use = / − or
the wheel to switch views. `python scripts/check-native-camera-view.py EXE`
compares original commands, timers and 3,480 transition frames.

`node scripts/check-browser-navigation.mjs` checks original arrows/Ctrl/Shift,
keypad navigation, screen edges, duplicate-direction acceleration and UI/window
gates. `python scripts/check-native-navigation.py EXE` compares the original
key table, command mapper, input accumulator and edge requests.
