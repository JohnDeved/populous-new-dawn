# Bloodlust runtime acceptance preparation (#6 / PR130)

## Scope and immutable prerequisite

Preparation starts at PR130 head
`3254efac4f1758234eacc5e6f512917b0c682c98`. The original five-file asset/proof
prerequisite remains byte-identical: `scripts/import-bloodlust.py`,
`scripts/check-native-bloodlust-appearance.py`, `app/original-bloodlust.json`,
`public/original/bloodlust.png`, and `decomp/research/bloodlust-appearance.md`.
No runtime helper, caller, asset, importer, provenance, scheduler or checkpoint
implementation was changed. The previously denied runtime write was not retried.

This follow-up adds executable preparation, not gameplay or a completed browser
acceptance. All new maintained files are tests, checker support or this note.
The browser checker has **not been executed**, even in a preflight mode.

## Shipped path and current owners

| Step | Existing owner | Prepared assertion |
| --- | --- | --- |
| Choose Mission16 | `app/page.tsx` Mission buttons -> startMission/beginLoad -> `createGameStore.startMission` -> `createWorld(16)` | Use `openGame(browser,16)`, the shipped button and introduction skip |
| Select the authored six Braves | page Escape -> cancelInteraction; Shift `Select brave` -> followerControl/chooseFollowers | Clear initial Shaman selection, assert exact six authored IDs, no replacement people |
| Worship the left Bloodlust head | canvas pointerUp -> `live-command.command`; native commandStatus27 -> existing worship/reward path | Pick actual head geometry; all selected people enter worship; no position/work/reward injection |
| Acquire one stock | authored head6 at(-33,-13), existing linked reward and gift handoff | uses1, giftCount1, stock1 before cast |
| Shaman approach | H selection, normal ground pointer command toward(-26,-13) | Wait for actual movement into range; no teleport |
| Cast | Bloodlust1shot HUD button sets mode; canvas pointerUp -> cast -> projectile/status owner | Exactly six original Braves receive Bloodlust; stock becomes0 |
| Render | `GameScene.animate` calls existing advanceGame, then updateUnitsFrame -> animatePerson | HFX1478..1487 and original alpha/anchor, not procedural ring |
| Checkpoint | `createGameStore.saveCheckpoint/loadCheckpoint`, structuredClone and migrateCheckpoint | Critical gameplay/RNG/status fields unchanged; no repeat reward or stock consumption |

The direct normal engine path was re-observed in the Node scene fixture at turn1403:
six real Braves have status1440/flags3 0x80000. Production is unchanged. The fixture
then executes the actual `makeUnit`, `updateUnitsFrame` and `animatePerson` code.
It observes `TorusGeometry`, no material texture, no frame UV transform, scale1×1
and opacity0.8. The only requested textures are effects, selection, unit-health
and unit-layers: the frozen Bloodlust atlas has no current runtime consumer.
This is a stronger red baseline than failure to import an unimplemented helper.

Current `makeUnit` owns the procedural red ring; `updateUnitsFrame` rotates it
from world time and blinks from global world.turn before resolving the body's
native animation record. `animatePerson` subsequently supplies actual VFRA frame
height, body bucket and direction. `scene-assets.texture` and `render-view` already
support immutable textures and independent per-draw atlas transforms. No new
shared renderer or clock is required by the retained proof.

`setUnitBloodlust`/`stepUnitBloodlust` in `app/spell-effects-runtime.ts` own existing
status and flag lifetime. The new tests/readers must not decrement it, consume RNG,
spend mana/stock or update reward state. `game-clock.ts` owns the existing24Hz
presentation visits; `scene.ts` owns its fresh clock on scene construction.

## Smallest later runtime reservation (not authorization or implementation)

Reserve **two maintained TypeScript paths only**, after the denied-write boundary
is resolved and an implementation task is authorized:

1. A small `app/bloodlust-appearance.ts` pure gate/frame/rectangle helper, exporting
   the `bloodlustOverlay` comparison seam already named by the frozen native probe.
2. The Bloodlust-only portions of `app/scene-entities.ts`: replace the existing ring
   creation and its old pre-body update, and consume the helper after animatePerson
   has set the frame height/bucket. Keep the existing semantic child name
   `bloodlust-aura` for observation and normal group cleanup.

A separate scene helper is optional only if a demonstrated maintainability need
justifies it; it is not a prerequisite reservation. Reuse existing texture(),
Sprite/atlasTransform handling, spriteCoordinate and group visibility/cleanup.
No render callback may write simulation state. Do not move work to a different
owner to evade the prior safety denial.

Explicitly outside this reservation: `game-clock.ts`, `game-store.ts`,
`spell-effects-runtime.ts`, `world-turn.ts`, `scene-assets.ts`, `render-view.ts`,
all five frozen prerequisite files, shared HUD/effect/unit atlases/provenance,
training/occupants, worship acquisition VFX, Shaman death, Totem149, other PRs,
and parity metadata. Missing original GPU blending subtleties do not authorize a
global renderer rewrite.

## Failure-first focused suite

Run explicitly:

```sh
node --test tests/bloodlust-runtime.pending.mjs
```

The file deliberately does not match the unchanged `tests/*.test.mjs` aggregate.
It has normal assertions, **no skip/todo/xfail**, and must become green through the
later runtime repair. Excluding an intentionally red preparation suite from the
ordinary aggregate does not make it green or replace its required future run.

The suite contains five named desired-behavior checks: R1 original sprite/atlas
rather than torus; R2 first/second real presentation visits and two full10-frame
cycles; R3 scaled/unscaled dimensions and VFRA-relative anchoring; R4 independent
person-counter expiry blink; R5 checkpoint scene reconstruction with original
artwork. Supporting checks cover frozen PNG identity and normal route, render-only
full-world/critical-state preservation, pause/migration, and paired rendered versus
unrendered chronological histories at30/60/144Hz and an irregular schedule.

Boundary fixtures for R4 alter only a **cloned test world**, setting remaining
status/person counter/global turn independently. They do not create the normal
route, change production code or assert browser gameplay. The original gate must
produce `[false,true,true,false]` for remaining/counter/world-turn cases
`[120,2,0]`, `[120,0,2]`, `[128,2,2]`, `[0,0,0]`. The existing global-turn gate is
expected to disagree. Other code paths still use the authored ordinary cast.

`tests/support/bloodlust-scene.mjs` transpiles the unchanged app modules in memory
for Node's Vite-style TS/JSON imports. Only texture IO, projection and unit-position
presentation boundaries are supplied. The real scene functions and simulation
modules run; no browser/server/network/GPU is started. No file under app/ is written.
The texture-loader/document substitutions are restored by finally cleanup.

`scripts/lib/bloodlust-acceptance.mjs` is test-only. Its expected rectangle uses
the frozen artwork and shared original sprite scaler, and was compared successfully
against **all1600 retained native cases** without rerunning native code. Its scene
observer reads the existing child, actual texture/UV/dimensions and body anchor;
it does not fill in missing artwork or repair the renderer.

## Prepared browser acceptance — NOT RUN

`scripts/check-browser-bloodlust-appearance.mjs` must remain unexecuted until a
runtime implementation exists. Before importing Playwright or launching Chromium,
it requires an explicit40-hex `PND_BLOODLUST_IMPLEMENTATION_HEAD` equal to clean
local HEAD, an actual scene-caller diff from the prerequisite, and a passing focused
scene suite. These gates do not grant permission to bypass the denied runtime write.
Only the syntax checker (`node --check`) was run during preparation.

The future canonical supervisor should use an owned free port and artifact directory,
set the exact implemented HEAD, and run this script once. No job was submitted and
no server/port was acquired here. The script prepares these acceptance stages:

- Shipped Mission16 entry, Escape/Shift selection, actual head/ground/cast pointer
  clicks, normal movement/worship/stock acquisition, and the normal HUD cast.
- Served Bloodlust PNG SHA256 equals the frozen metadata;21 actual presentation
  samples consume the exact10 UV rectangles, dimensions, original alpha and body
  anchor; removing only those sprites changes a nonzero number of GPU pixels, with
  visibility restored in finally.
- Paused renders preserve observed frames and critical state. The shipped store
  clone/load API round-trip preserves mana arrays, spell stock, gift counts, both
  RNG states, statuses, respawns, outcome and head uses. This is a **store API adapter**,
  not a claim that checkpoint menu pointer input was tested.
- New GameScene clock semantics stay unchanged: restored overlay must agree with
  that scene's actual animationFrame, not a newly invented global-frame persistence
  field. No prior HFX phase is forced into the checkpoint.
- Paired full-world copies advance through identical actual clock calls at
  simulation speeds0/0.25/1/4 and30/60/120/144Hz/irregular render schedules. Only one
  copy is passed through the renderer. Their complete world serialization must
  remain equal; mana/RNG may legitimately change during simulation, but rendering
  cannot cause any additional consumption.
- Existing status expires naturally, without shortening timers or replacing dead
  followers. Below128 turns, person-counter blink is checked each turn, then the
  overlay is hidden and0x80000 clears. Stock stays0 and giftCount stays1. Browser
  errors, failure screenshot/report and cleanup are explicit.

These are prepared assertions, not passed acceptance. Pointer availability,
checkpoint scene reconstruction, full GPU output and natural expiry remain to be
validated after implementation. No result is invented to cover their absence.

## Recorded checks and current inspection blocker

The focused suite ran once through canonical queue receipt
**d533f40c-7725-4669-bbdb-67b92ac63cb2**, returning exit1. The subsequent request to
read its detailed command log was blocked by the tool safety check. No alternate
log access or unchanged failure rerun was attempted. **Individual suite results
are unclassified**; do not report a specific pass/fail count from the test source.
The direct pre-suite scene observation and the suite exit code are separate facts.
A subsequent progress-update request was also blocked and was not retried.

Before that stop, Oxfmt on the four new JavaScript files, targeted ESLint, browser
script syntax, and1600-case test-oracle comparison all passed. No maintained
TypeScript changed. Frozen prior689/689/typecheck/build evidence belongs to the
asset prerequisite, not a new claim that the red runtime tests pass. The independent existing Bloodlust portable and workflow-structural contract checks
subsequently passed. Final new-file Oxfmt/ESLint and syntax pass; Oxlint reports
0 errors and14 warnings (not a blanket lint-clean claim). A scratch assignment
text scan falsely matched a strict equality comparison, then a stronger AST check
passed without altering assertions. Only unexecuted browser-code style was adjusted
(new Error, globalThis, separate assignments); the three red-suite input files
remain unchanged. No native/browser execution or red-suite rerun occurred.

Local records: `work/orchestration/worker5-bloodlust-preparation/`, including
`frozen-baseline.json`, `spec.json`, `contract.json`, `oracle-comparison.log` and
`red-baseline-status.json`. Frozen native evidence remains under the earlier
`work/orchestration/worker5-visual-worship/` directory. Publication should retain
the draft and update only tests/checker/research content. The coordinator reviews
the preparation and resolves the denied detailed-result inspection boundary before
claiming the full red baseline classified. Runtime integration remains separately
blocked. No gameplay completion, native GPU parity, issue closure or parity credit.
