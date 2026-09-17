# Original model45 Stone Head presentation

**2026-09-18, incremental issue21 slice.** This implements only the original
model45/46/47 automatic-reward head family. Mode3/base8, default149, the empty
146family, static157 and cue193 synchronization remain explicit follow-ups. No
whole-issue completion or native GPU/audio fidelity is claimed.

## Source identity and existing evidence

The [worship/reward evidence](mission22-rewards.md) distinguishes the class6/model6
reward trigger from its colocated class5/model9 decorative scenery. The retained
[post-load linker](../generated/004851e0.c) finds linked class6/model2 gifts and
sets trigger bit0x20 when the gift's **byte+0x80 is3**. This is imported reward
`settings[2]`, not `settings[3]` (the independent grant/availability field).
The exact native load/compare/flag instructions are `0048525c`, `00485262` and
`00485266`. The focused checker executes this linker on a supplied three-object
allocation list; it does not simply pre-set the resulting bit.

[Trigger processing](../generated/004fb270.c) invokes presentation separately
from work, refill and reward allocation. In `004fbd20`, the model45 branch has
priority over other non-mode3/5 families when bit0x20 is present. It chooses
base45 with draw4 and scenery presentation mode2. A running, enabled head does
**not** require followers; no-worship idle therefore still animates. Disabled
presentation holds original frame1. Refill reselects the object and releases the
hold, resetting the raw counter through the existing object setter.

The mode3 frame49 completion sequence described in the Mission22 note is a
*different* family. No frame49, generic glow, alternate artwork or cue193 was
added to45 by analogy. Exact cue phase/mixing remains unproved for this slice.

## Raw morph data, base topology and integer behavior

`scripts/import-stone-heads.py` is a standalone, scoped writer. Its exact outputs
are `app/original-stone-heads.json` and a new `stoneHeads` provenance entry in
`public/original/provenance.json`. It reuses the existing read-only model decoder,
never its broad import pipeline. Existing `original-models.json`, all textures,
units and prior provenance fields are unchanged.

Canonical inputs are pinned:

| Original input | SHA-256 |
|---|---|
| `objects/objs0-2.dat` | `e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d` |
| `objects/facs0-2.dat` | `01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a` |
| `objects/pnts0-2.dat` | `09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911` |
| `objects/morph0-2.dat` | `1939b4d30839f2ab49ea110abb29d40eb001d6cc6fa4932be72ce44c3aebf066` |
| `d3dpoptb.exe` for the original comparison | `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` |

The prior bounded trace found the relevant bank2/6 morph and geometry blocks
identical; this importer deliberately installs only the reviewed bank2family.
Morph record1 contains base45, two key objects46/47 and length-minus-one values
8/8. [Original normalization](../generated/0040ce30.c) creates segments0–8 and
9–17, with interpolation divisors9. There are **18 animation updates per cycle**,
not18simulation turns and not a newly inferred number of real-world seconds.

The original [morph consumer](../generated/0040c9f0.c) interpolates52corresponding
raw signed-short points into the base object's buffer using
[integer coordinate interpolation](../generated/0040cc60.c). The renderer keeps
base45's52faces, scale150, UVs, material modes, normal references and painter biases.
The key objects have92faces and scale160; substituting their expanded triangle
arrays or normalizing each endpoint by its own scale would be incorrect even
where their triangle counts coincide. The new data therefore stores raw keypoints
and the base's exact point-index correspondence, including all base faces.

## Clock, state and lifecycle integration

`app/stone-head-animation.ts` reuses `setAnimationObject` and `stepObjectAnimation`
from the existing [animation implementation](../../app/animation.ts), and
`morphCoordinate` from [morph.ts](../../app/morph.ts). It does not add another generic
animation engine. The one presentation call sits on the existing chronological
24Hz boundary in `app/game-clock.ts`, after the existing object-animation call.
The original selected native rate/visibility-catch-up configuration remains a
broader documented limit; render-FPS samples are not used as an animation timer.

The state holds the original counter, rendering flags, hold frame, enabled state
and separate trigger/scenery identities. Pause and land-pause flags prevent
updates. The minimal `world-turn.ts` notification records enable/disable changes
without advancing a clock: this matters when fast simulation disables and refills
a head within one animation interval. It does not alter work, followers, delays,
uses, stocks, sound or either RNG. Original setters/clock bodies are paired with
this case in the focused comparison.

When a final use deletes its trigger, the native controller's deletion branch
does not also delete the independently linked model45 scenery. The browser
therefore retains that decorative mesh and its last enabled presentation instead
of hiding it merely because `shrine.active` became false. It does not reactivate
the reward trigger or award another gift. Other family/Vault visibility stays on
its existing path.

New checkpoints serialize the optional per-head presentation state directly.
An older checkpoint without the field reconstructs only a proven authored45source
at deterministic phase0, or held1 when disabled. This restores compatibility,
not unknowable historical animation phase, and never replays a reward. Unsupported
families are recorded as null; Vault is not assigned this field. No broad store
migration or schema rewrite is needed.

The non-Vault scene update copies cached original positions only when the phase
changes, marks the position attribute updated and refreshes bounds. The existing
lighting, shader, painter and picking consumers read the new geometry/version.
Vault marker and existing Vault morph bodies, generic clocks and shared model/
atlas data are unchanged.

## Reproduction and acceptance boundaries

```sh
# Only the two declared outputs; no broad import.
python3 -B scripts/import-stone-heads.py /path/to/original-game
python3 -B scripts/import-stone-heads.py /path/to/original-game --check
node --test tests/stone-head-animation.test.mjs

# Isolated original instructions: run through the canonical shared test queue.
python3 -B scripts/check-native-stone-head-animation.py /path/to/original-game \
  --output /path/to/new-native-result.json
```

The native checker uses the existing `native_cpu` environment and canonical
resource bytes. It executes `004851e0`, `0040ce30`, `004fbd20` and its setters,
`004ee7b0`, `0040c9f0` and `0040cc60`. No callee is intercepted. Allocation-list
storage, visible-object context and enable transitions are supplied; final native
wallclock, full global traversal and sound synchronization are not simulated.
It compares complete raw coordinates, hold/reset/loop transitions, all18phases,
and unchanged base face/UV/normal data. Optional `--live-models` additionally
executes original model submissions for actual captured browser poses.

The focused [headless browser check](../../scripts/check-browser-stone-head-animation.mjs)
uses an owned page and port4318 through the canonical queue. It verifies all idle
phases without followers, actual GPU attributes and changing pixels, pointer
worship through the shipped command path, earned stock, disabled/refill holds,
new-page checkpoint restoration, independent decorative lifetime and paused
geometry reuse. It reuses the existing Blue-only/AI-paused worship fixture. Its
last-use exhaustion case explicitly changes only the remaining-use count before
normal work/reward completion; it is not mislabelled as an unmodified campaign
playthrough. Headless page input is not OS/user input or window-focus manipulation.

Portable tests compare normal gameplay state with presentation disabled, including
both RNG streams; they also cover pause/interrupt/refill, independent heads,
legacy/new checkpoints, and30/60/120/144Hz plus irregular schedules. Those schedules
prove state independence from rendering frequency, not achieved FPS. A few paused
draw costs and stable cache identities likewise are not paired performance or
native GPU raster certification. Per-attempt logs and exact tested heads belong
in the PR's verification receipts; this note does not imply an unrun test passed.
