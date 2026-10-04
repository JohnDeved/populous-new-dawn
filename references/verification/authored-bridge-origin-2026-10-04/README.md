# Authored scripted Land Bridge correction

Issue [#190](https://github.com/JohnDeved/populous-new-dawn/issues/190), draft fix [#191](https://github.com/JohnDeved/populous-new-dawn/pull/191), related campaign gate [#11](https://github.com/JohnDeved/populous-new-dawn/issues/11).

## Result

Ordinary Mission 2 worship now creates the short authored Land Bridge from
`(-77,-105)` to `(-61,-105)`, instead of incorrectly starting at the worship shrine
`(-113,113)`. The corrected rendered crossing changes 36 terrain vertices. Original
producer/controller replay from the actual captured initial terrain matches its
observed endpoints and **all 16,384 final terrain heights**.

The separate ordinary old-main baseline changed 108 vertices along the wrong
corridor. Its complete immutable evidence is
[baseline commit 2b82cbd](https://github.com/JohnDeved/populous-new-dawn/blob/2b82cbd603662cac5a0e4079b5fc7897874d5d73/references/verification/mission-two-bridge-baseline-2026-10-04/README.md).
The failed baseline paused-order attempt is preserved there. The expected failing
portable old-main assertion is retained here in `failure-first-f0f8880.json`.

This branch carries review evidence only. Do not merge its raw artifacts into the
runtime branch. The fix remains on `fix/authored-bridge-origin`.

## Source identity

- Final code/gate candidate: `4170e24f91026b9b3fce69ff3a49c0242f9896ef`.
- Rendered/native-terrain candidate: `30e671e8e1ec53ee1624ae85e207a6e60798ca45`.
- Current main adopted normally: `f0f8880127409df0c2aee569c48cfad45351faf0`.
- That adoption adds only the already-reviewed Mission 1 reference report, image
  and reference index. Runtime, probes, tests and dependency declarations remain
  byte-identical to the rendered candidate; see `source-correspondence.json`.
- Each raw command receipt retains its own real source HEAD, tracked-diff hash,
  explicit inputs, command, exit status, timestamps and stdout/stderr hashes.
  No old-source result was relabeled as a new-source run.
- `manifest.json` hashes every other file in this bounded evidence folder.

## Ordinary browser and storage acceptance

`browser-candidate-02-command.json` and `browser-candidate-02/receipt.json` both pass
with zero page/console errors, stable source bytes and terminal harness cleanup.
The owned browser session finished at `2026-10-04T13:47:50.839Z`.

The driver uses public All missions → Mission 2, the ordinary Shaman HUD selection,
minimap/canvas input, normal pause/resume, Game settings, Save checkpoint, fresh-page
Load Game, and Skip introduction. React/store references only observe state,
project actual input targets or read IndexedDB. There is no direct world, actor,
spell, mana, terrain, camera-field, victory, storage or clock injection.

Initial terrain is captured after ordinary worship begins and before the reward.
This includes the unrelated early Green tower foundation grades, which occur before
worship, rather than incorrectly attributing them to the bridge. The tower also
finishes normally during the run. No player construction is requested.

- Actual active effect position is `(-77,-105)`.
- Observed native source is `(47872,24832)`; target `(51968,24832)`.
- At world turn 732, the controller is at bridge turn 12 with one shrine use.
- The exact paused active state is committed to IndexedDB and read back.
- Ordinary Load Game resumes the simulation by design; a normal Pause captures
  bridge turn 23 with the same endpoints and one use, without replay.
- After natural completion, 36 terrain vertices differ from the pre-effect input.
- Completed-state Save → fresh-page Load retains one bridge/statistical use and
  no active bridge. Completed restore is observed at world turn 808.

The active save opens the same game dialog through the visible top-actions
**Game settings** button. `app/page.tsx` explicitly exempts those controls from the
authored reward flyby's input mask, so the active controller stays paused during
saving. The completed final screenshot resumes and skips the introduction normally,
waits for the input mask to clear, pauses, then uses the ordinary minimap.

The first candidate attempt reached the correct active effect but failed later:
its native-HUD Menu click was blocked during the authored flyby, so Save checkpoint
never appeared. This is a retained driver failure, not a passing run. See
`browser-candidate-01-command.json`, its exact frozen driver and failure screenshot.
The retry changes only ordinary UI routing and observation retention.

Screenshots were inspected as rendered pixels. The before/after camera bearings
can differ because the authored flyby rotates the view; these are functional
rendering observations, not aligned pixel-difference or original-GPU parity claims.

- [Before the authored bridge](browser-candidate-02/authored-crossing-before.png)
- [Active authored crossing](browser-candidate-02/authored-crossing-active.png)
- [Active checkpoint restored](browser-candidate-02/authored-crossing-restored.png)
- [Completed authored crossing](browser-candidate-02/authored-crossing-complete.png)
- [Completed checkpoint restored](browser-candidate-02/authored-crossing-completed-restored.png)

Browser identity: Chrome Headless Shell `154.0.8037.92`, sandboxed Linux,
1440×1000 CSS viewport, ANGLE Vulkan SwiftShader. This is software-rendered functional
QA, not hardware frame-performance evidence. Warnings remain in the raw receipt.

## Native evidence

The hash-matched executable is
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The source trace is `00485b00 → 00509c10 → 004fb270 → 004ede10 → 004ed700 → 0050a750 → 0050ee00`.
The model initializer selects processing state 25; the real head allocates at the
linked class-7/model-24 position; the real copier preserves allocation position;
the real class dispatch runs all 63 Land Bridge controller visits.

Worship completion and allocation storage are supplied, along with documented
registration/class callbacks, shared-link scan, sound/presentation, trail allocation,
deletion and notification leaves. The native bridge arithmetic is executed. For the
rendered input, the native terrain queue also executes. Later mixed-link heads
isolate only the authored bridge slot, explicitly marked in the report. No endpoint
is injected into the native producer.

Five currently live campaign bridge heads are covered: Mission 2 head 59; Mission 5
heads 96 and 113; Mission 6 head 355; Mission 9 head 215. Missions 1 and 3 have no such
heads. Tutorial 79's authored head 70/effect 72 is not currently bound by the live
initializer and remains outside this repair. Later mission coverage is data/adapter
and native-controller regression, not a full Mission 5/6/9 playability claim.

The captured all-height comparison is a final-terrain assertion; it does not claim
per-turn browser observation or native graphics-loop execution. The portable test
separately checks every live Mission 2 terrain turn against the unchanged bridge
controller. Original generic controller regression covers 96 complete lifetimes.
No fixtures or parity data were recorded or weakened.

## Final gate results

All final commands below bind `4170e24`; rendered results retain `30e671e` as above.

| Receipt | Result |
| --- | --- |
| `check-final.json` | PASS: typecheck, 959/959 portable tests, parity and orchestration structure |
| `build-final.json` | PASS: production build |
| `native-land-bridge-final.json` | PASS: 96 original complete Land Bridge lifetimes |
| `native-authored-final.json` | PASS: five source cases, 315 native visits, rendered endpoints and all final heights |
| `decomp-check-final.json` | PASS: executable/export integrity |
| `format-final.json` | FAILED: only untouched `render-view.ts` and `viewport-bounds.ts` |
| `lint-final.json` | FAILED: repository baseline debt, 285 errors/2 warnings; no new authored-test/store/init/type findings |
| `oxlint-final.json` | FAILED: repository baseline findings; touched-file comparison is 341 → 341, zero added |
| `fallow-health-final.json` | PASS (advisory report) |
| `fallow-dupes-final.json` | PASS (advisory report) |
| `fallow-unused-final.json` | FAILED/advisory: existing unused files/dependencies, generated/runtime unresolved imports and cycles |

Touched application formatting passes (`final-format-focused.json`), and the actual
Oxlint baseline/candidate reports plus count comparison are retained in
`quality-delta-receipt.json`, `quality-delta.json` and `oxlint-*.json`. Both formatter
failure files have unchanged Git blobs versus adopted main. The world-turn ESLint
findings are unchanged imports outside the modified reward block. The fix does not
claim repository-wide lint cleanup. The final reviewer decides acceptance with these
limits disclosed; final integration/merge belongs to the integrator.

## Checkpoint compatibility limit

Missing immutable origins are recovered for future activations only when the head's
position, range, heading and existing target match an unambiguous authored source.
Existing origins remain authoritative. Unrecognized records keep the old fallback.
Worship progress, RNG, active controllers, uses and terrain are not rebuilt.

In particular, this migration **does not undo terrain already changed by a historical
wrong-origin bridge**, whether that bridge is still running or already completed.
The completed-checkpoint test proves no replay of the corrected world; it is not a
retroactive repair of historical terrain.

No deployment, paid service, GitHub Actions run, game binary/data upload, dependency
upload or parity-percentage claim is part of this evidence.
