# Mission 2 completed camp ordinary witness

This finite scenario checks a newly constructed, initially empty Blue Warrior
Training Hut through the shipped Mission 2 controls and RAF. The runtime candidate
is `b34e79e341a1ef754a812a1adedf67ad1319941a`; final execution still needs the parent's
exact source admission, reviewer acceptance and browser lane. No passing browser
result is claimed by the helper contracts.

## Reuse and scope

The observer, modal/typed checkpoint helpers, M1 reference scenario and helper
tests are selectively carried from the accepted QA commit
`6aa6c58267fad359d85afbe34d5e52cab141b564`, without its old application source.
`tree-hover-input.mjs`, `hut-tooltip.mjs`, `hut-tooltip-input.test.mjs` and the old
engineering note are unchanged. The tree helper's original accepted branch
commit is `5f086577d99edf9a3e6a9d0f6c068185a8aba7ed`, with last source change
`f791834acc80f85b16a1b72a9944064b92a583d6` and SHA256
`4774bff8c644ffde0832aac9c0bf34af80cb6703de5365306abcf63aad78f777`.

The small shared changes parameterize mission admission and the record field
prefix, add a single actual building target, and retain bounded construction data
in the existing synchronous observer snapshots. All controller ticks, including
multiple catch-up ticks in one RAF, remain captured. Pointer deduplication,
pre-start installation, separate tooltip/WebGL/HUD paint boundaries, typed Save,
public Load/session continuity and owned cleanup remain the accepted mechanism.
Modal-hidden pixels now require an actual open game dialog at capture.

The generic runtime interface is `objectPanels.buildingRecords`,
`buildingInspected`, `buildingHeldPointer`, with data-only records
`{phase, remaining, hold, automatic}`. `updateTooltipController`,
`acquireForcedTooltip`, `tooltipController`, `tooltipInput`,
`tooltipInspectionInputs` and the existing inspection outcome strings are unchanged.

## Public inputs and prerequisites

1. Install observation before selecting All missions → Mission 2. Use the actual
   optional Skip and shipped Shaman readiness. Resolve the live Shaman and at
   least eight eligible Blue Braves after the startup conversions, rather than
   carrying Wildman IDs. Startup has no Blue camp and must expose unlocked Camp.
2. Use the existing `createMission1VaultInput` minimap `view` and `settle`, with
   the actual M2 Shaman ID, near (-99, -105). The helper name does not make these
   camera inputs Mission 1-specific. Its action guard requires the Shaman alive,
   not selected. Prepare one rendered camp placement, testing at most 312 radial
   candidates. `placementError`/`buildingPlanPose` receive a detached World;
   diagnostic picking is followed by a later natural render.
3. Shift-click `Select brave`, click `buildings B`, then the exact
   `Warrior Training Hut, 8 wood` button. The actual eligible selection and camp
   mode must be present. Issue one physical canvas placement. No camera or tab
   input intervenes after selecting the plan.
4. At the real pointer-up boundary, require one new Blue camp at the prepared
   anchor and actual selected Brave recipients with its model-6 construction
   order, `work` ownership and builder slots. A new plan without workers fails
   this prerequisite. Eight wood is fetched by those workers, not debited from
   an invented starting balance. Authored M2 has 36 trees/144 initial logs.
5. Wait only on shipped RAF/simulation updates. Require the same camp lifetime,
   progress 1, no preparation, empty builder slots and no unit owning construction
   or occupying it. Admission occupancy, occupants and entry queue must be empty,
   with activity 128 and dismantling clear. Activity 8 and unrelated admission
   counters/timers are valid. Construction completion alone is insufficient while
   the original workers are still leaving.
6. Use the single observed Escape to deselect, then `spells 1–3` for the actual
   Blast destination. Hover Blast, then the same camp through the accepted current
   5×5 rendered interior and a later natural-render boundary. Require actual picked
   and input object identity, imported raw string 912, its Left-click/Right-click
   expanded label, mature paint and the empty `Warrior training: 0 of 5 occupants;
   0% charged` panel. Press and release right mouse at its published point; retain
   ordered successful acquisition/release, drained queue and no held owner.
7. Hover its actual dismantle control for 24 controller visits without activating
   it, leave to Blast until ordinary record expiry, then reacquire. Perform real
   settings → Save → Continue Game → conditional Resume → Load. The exact typed
   Save digest must equal the committed IndexedDB record. Load preserves stable
   actors/terrain/stock/turn/time, clears transient reservations by migration,
   retains the page session and recreates scene records. Retain natural camp
   glyph/panel pixels after Load and close owned observers.

The old `ordinaryMissionTwoTrainingHut` checker provides only the public input
prefix: its direct `tick`, speed assignment, focus, manual camera updates and
render calls are excluded. No training group order follows construction here.
The initially empty episode does not claim natural automatic training visibility,
occupied manual behavior, native wall-time/pool equality, textless HUD, unnamed
objects, hardware performance or audible output. Unsupported panel/status history
stays explicit. The accepted context is ephemeral; its raw Save ends with that
context, while the in-session committed digest evidence remains in the report.

## Bounds and launch

The scenario has a 300-second global deadline, a 60-second startup bound, and up
to 180 seconds for natural construction/departure, additionally clipped so at least
60 seconds remain for inspection/Save/Load. Preparation helpers are also clipped
to that reserved-tail deadline. Witness waits use 12 seconds; inherited camera
helpers retain their supported maximum 45 seconds, clipped to their current
absolute deadline. There is no uncancelled timeout race or automatic replay.
The observer allows 8192 records and eight capture groups. Exhaustion is a retained
failure, not permission to change speed, inject workers, widen time or retry.

Use the existing `scripts/local-render/harness.mjs` with this external scenario,
the stationary accepted product as `--game-root`, a fresh output/private TMP,
known valid port 4192 and restored sandboxed Chrome Headless Shell 154. The parent
sets the outer timeout to cover server/browser startup plus this 300-second
episode and wraps execution in `scripts/orchestration/command-receipt.mjs`.
Bind the scenario, every copied/common helper, the runner/config, source manifest,
runtime executable and final product source before and after. No dependency
transfer, persistent profile refactor or new runner is required.

Cheap contracts compose the actual shipped `placeBuilding`, `canOrder`,
`GameScene.start`, `beginLoad` and `renderTooltip` bodies with supplied browser
boundaries. Supplied Save-publication checks establish typed cloning; the actual
driver requires committed equality. These tests do not claim natural construction
timing or pixels. After the ordinary result is independently accepted, publish only
the concise facts and relevant exact images, embed screenshots inline in future
issues/PRs, verify their public URLs and inspect the rendered GitHub presentation.

## Retained ordinary01 observation failure

The first real episode on product `4e8356ef` and QA `a342caf5` failed after its
trusted placement. Camp 1022 was created at anchor (41984, 24576), nine selected
Braves owned its builder slots, and shared order 29 was model 6 with nine
references. The observer sampled only `unit.native`; the actual
`adoptLiveOrders` caller transfers construction ownership into `unit.builder.person`
and clears `native`. Consequently the per-worker queues were absent and the
assertion failed on `undefined.map`. Their attachment cannot be credited from
this failed observation. Completion, inspection and checkpoints were not reached.

The raw report SHA256 is
`dcdd2a379f38ce78c5dea741fe69f7daec5026b2fed57e7df40ec67d90a229b2`;
the outer failure receipt SHA256 is
`1447f3da751d1dfc4587f7d697d583a20d46608e3b313c3f2e7fc6002ac3226f`.
Observer cleanup closed without errors, restored the actual pointer wrappers and
left no held inspection owner. The original failure remains intact.

The narrow repair reads the actual construction owner, preserving its owner kind,
object identity, person ID/state/work target and queue fields. Missing or malformed
queue observations now fail an explicit assertion. A compact exact projection of
the failed boundary remains a negative regression; a separate contract composes
the shipped `adoptLiveOrders` transfer through the real observer into
`assertCampPlacement`, including detachment and missing-shape rejection. The
application, ordinary inputs, episode bounds and cleanup flow are unchanged.
