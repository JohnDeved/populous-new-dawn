# Startup stone-burst root height: reachable source discrepancy

Read-only assessment, 2026-10-07. Base `7c0bcdb246023ff4263b4baeddf5a84f7f90a7a0`.
No runtime edit, original-code execution, simulation, browser, fixture recording,
parity credit, or PR251 scope expansion. This is a source/data reachability finding;
a composed original creation capture remains required before fixing the caller.

## Finding and exact precondition

Fresh successful startup stone creation supplies the burst with a position **240
native height units below its sampled ground**. The original model9 initializer
clamps that root before adding90. The live caller adds90 before clamping its model3
child. With stable ground during synchronous allocation and no signed-short wrap,
the original child therefore begins at `ground + 90`, while the port begins at
`ground`. This difference is reached by each new stone in an uninterrupted,
allocation-success Mission1–3 opening; it does not require the optional old-stone
replacement branch. It is not yet a captured original ordinary-mission result.

For an arbitrary supplied stone height S and the same sampled ground G:

- Native: `max(short(max(short(S), G) + 90), G)`.
- Port: `max(short(S + 90), G)`.
- Away from signed overflow, they agree when S >= G. For S < G, the native
  child is higher by `min(90, G - S)`.
- A fresh stone returns S = G - 256 + 16 = G - 240, so the difference is90.

Thus the claim is not that every model9 origin differs. The existing retained
native trajectory fixture starts children at346 over ground256, and the portable
comparison supplies that already-created origin directly. It cannot expose this
missing root operation.

## Original producer and consumer ownership

The existing [startup sequence](level-start-sequence.md) and the independently
accepted [angle source audit](https://github.com/JohnDeved/populous-new-dawn/blob/7f54a508/references/verification/startup-burst-angle-ownership-2026-10-07/README.md)
establish command18 -> class8/model1 -> arrival `004bb290` -> class7/model7
`0050c690`. The following exports resolve the fresh-stone height ownership:

1. [00433a10](../generated/00433a10.c), state3, samples the destination's ground
   and writes the effect7 tuple: stone index, destination X, destination Y. The
   carrier's stored destination and source positions have separate owners.
2. [004bb290](../generated/004bb290.c) pushes the tuple and the one-shot argument
   flag. [004ed8a0](../generated/004ed8a0.c) copies the supplied XYZ, consumes the
   flag, and initializes the allocated class before returning.
3. [0050c690](../generated/0050c690.c), lines44–47, allocates class5/model12,
   then passes the **returned stone's** `+0x3d..+0x41` to class7/model9. It does
   not pass the carrier destination height directly to model9. Its temporary
   stone-allocation tuple exposes only two explicit position words in the
   pseudocode; do not invent ownership for an adjacent initial height word.
4. [004a7d80](../generated/004a7d80.c) snaps the new stone XY to cell centers,
   sets rising state1, and immediately calls [004a7eb0](../generated/004a7eb0.c).
   That consumer overwrites `+0x41` with its own current ground, subtracts256,
   allocates dust, and adds16 before returning. This overwrite resolves the
   incoming-height ambiguity for the fresh-stone burst. The dust's separate
   [005137c0](../generated/005137c0.c) samples ground and places dust at G-112;
   it does not overwrite its parent stone's height.
5. [00509c10](../generated/00509c10.c) always invokes
   [0050bcd0](../generated/0050bcd0.c) first. That common initializer samples
   ground and clamps the model9 root upward. The default
   [0050ccd0](../generated/0050ccd0.c) then adds90 to `+0x41` and makes32 child
   allocation attempts. Model9 is given no replacement argument tuple here.
6. Successful class7/model3 allocation again goes through common initialization,
   then [0050bf60](../generated/0050bf60.c), which also clamps to ground. With
   unchanged G, the child keeps G+90. Its later `0050bd70 -> 004e7a80` consumer
   owns movement and ground contact; the birth discrepancy may affect later
   contact, so a universal constant trajectory offset is not claimed.

All exports are the indexed Ghidra12.1.3 evidence for original EXE SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
No new decompilation or executable read was needed for this assessment.

## Actual authored reachability and terrain data

The [data-only inventory](../../references/verification/startup-burst-height-assessment-2026-10-07/authored-data.json)
parses the existing imported level JSON without importing application code. It
retains each original-level and imported-file hash, all six Shaman positions,
all48 candidate stone XY positions, and their four authored terrain vertices.
These are input vertices, not guessed heights after a wave or browser resampling.

| Mission/site | Native center X,Y | First stone, index7 | Fresh stones |
| --- | --- | --- | --- |
| 1 Blue | 4352,55040 | 3328,56064 | 8 |
| 2 Blue | 40192,23808 | 39168,24832 | 8 |
| 3 Blue | 11008,42752 | 9984,43776 | 8 |
| 3 Chumara | 56064,24832 | 55040,25856 | 8 |

All authored Shamans already occupy their snapped centers. The eight offsets are
(0,6),(4,4),(6,0),(4,-4),(0,-6),(-4,-4),(-6,0),(-4,4), in256-unit coordinates;
command18 visits them in reverse order. The imported Mission1/Mission2 scripts
turn enemy reincarnation off (opcode1164, argument1023), so Dakini at2304,7424
and Matak at25344,33024 do not enter fresh-stone construction. Mission3 has two
enabled sites. This follows [campaign-runtime.ts](../../app/campaign-runtime.ts)
and [level-start-runtime.ts](../../app/level-start-runtime.ts), including the
phase0 disabled-site test, phase2 wave wait and phase3 carrier producer.

The imported terrain vertex bounds are0..424,0..1020,0..1024 for Missions1,2,3.
The ordinary startup wave moves included vertices toward its bounded target;
there is no signed-height overflow in the fresh-stone G-240/G+90 calculation
for this authored case. No particular shared original/port post-wave G is assumed.
The port samples G at arrival, so the local height-order defect remains even if
an independent world-terrain discrepancy changes its absolute value.

The live new-stone branch, lines247–264, computes dust at G-112 and passes
`point.h - 128` (= G-240) to `stoneBurst`. Lines48–63 add90 first and invoke
`createSpellTrail`; [spell-trails.ts](../../app/spell-trails.ts) then clamps the
child. The relevant live runtime file's SHA256 is
`cce900dc4e08ce890ac88060d7db41bb1cde578f80c2424317d4842d8884451b` on both the
accepted base and the inspected PR251 source `f9b565ca`.

For ordinary uninterrupted openings, the existing actual-caller angle test
observed8/8/16 stones and1,024 children through real `createWorld`/`tick` calls.
Its [retained candidate result](https://github.com/JohnDeved/populous-new-dawn/blob/f9b565ca/references/verification/startup-burst-angle-ownership-2026-10-07/candidate-portable.json)
is angle/RNG evidence, not a birth-height assertion. No new simulation was run.

## Coordinates, resampling, and the old-stone branch

Native planar X/Y are unsigned wrapped16-bit coordinates; native `+0x41` is
signed vertical Z, represented as `h` in the port. Browser planar `z` reflects
native Y. `browserPosition` ignores h. `burst.height = trail.h / 45` and
`scene.locate` converts that value to rendered Y by multiplying45/dividing128.
Thus90 native units correspond to2 units in the stored Effect.height and
90/128=0.703125 rendered world-Y units before projection. This is not a shader
clamp or a renderer-only offset: SpellTrail physics also consumes the h field.

`terrainPointHeight` samples `w.land.heights` with its stored diagonal flag.
The compatibility terrain grid is separately resampled by `refreshTerrainSurface`;
`syncNativeTerrain` can write it back when versions differ. This assessment does
not substitute the compatibility grid, the nominal site target, or authored raw
vertices for the current arrival G. Neither the root nor child changes XY during
birth, and the fresh-stone equation compares their local current-ground samples.

The existing-stone path in `0050c690` has a different source: the retained old
stone's actual position before removal. At S>=G there is no clamp-order gap. At
S<G the general formula above applies. The port estimates old-stone height from
`stoneTurns` and newly sampled G; equivalence of that estimate after terrain
changes is not established. In an uninterrupted fresh opening every stone slot
starts null and receives one carrier, so this optional branch is not needed for
the finding. Do not extend a fresh-stone repair into old-stone state recovery.

## What prior original proof covers

- `check-native-level-start.py` executes `004a7eb0` against declared ground321
  and verifies the immediate/next stone-rise visits; sound and dust allocation
  are intercepted. It establishes G-240 after the immediate rising visit.
- Its five effect9 cases call `0050ccd0` directly with zeroed model3 allocation
  records. They cover lifetime/speed/angle draws, not common root/child clamps.
- The accepted [11-call component](https://github.com/JohnDeved/populous-new-dawn/blob/5732cc32/references/verification/reincarnation-scheduled-burst-observer-2026-10-06/attempt-02/README.md)
  executes real allocator/model9/model3 initialization and139 later child visits,
  but its body, terrain, site origin, pools and other world consumers are supplied.
  It is a reincarnation producer, not the startup effect7/stone composition.
- PR251 reuses those raw children at4096,4096,346 over declared ground256. It
  preserves32 births,139 visits and96 child gameplay draws. Neither that fixture
  nor the angle fix proves startup birth origins, native pool success for a full
  authored mission, complete cross-class scheduling or original rendering.

## Finite next proof and smallest possible later fix

Before any runtime edit, capture **one fresh Mission1/index7 carrier-arrival
component** using the existing research executor and allocator/observer tooling.
This is a proposal only; no source/probe preparation or execution grant follows.

- Entry: original `004bb290` with the source-traced class8/model1 payload
  (class7/model7, index7, X3328,Y56064), one declared terrain snapshot, an empty
  prior-stone handle, and explicitly declared real allocator pools. Retain the
  supplied carrier bytes and terrain hash; do not label this complete command18
  scheduling or recover a post-wave height from a browser screenshot.
- Run actual `004ed8a0 -> 004ed580` class/model initializers, effect7,
  scenery12 including immediate `004a7eb0`, common model9 initialization,
  `0050ccd0`, and model3 initialization. Ground sampling must execute against
  the declared terrain. Reuse existing sound/light/render interception boundaries;
  declare every supplied leaf. Stop immediately when this one arrival returns.
- Passively retain raw six-byte XYZ at stone allocator return, model9 allocator
  entry, common-initializer return, model9 offset write, and all32 successful
  child allocator returns; retain direct-call rows and every gameplay/cosmetic
  RNG write. Require G-240 -> G -> G+90 and children at G+90. Require default
  arguments,32 attempts and, for a declared sufficient-capacity case,32 births,
  96 gameplay plus32 cosmetic child advancements. Do not force allocations to
  succeed or claim exhaustion coverage. The startup carrier's prior jitter draws
  are outside this arrival-only entry and must remain outside its RNG claim.
- Keep the earlier isolated stone-rise and retained child-motion proof; do not
  repeat11 scheduling calls, native lifecycle sweeps or a full OS-game route.
  A separate ordinary port regression should observe birth XYZ/ground at the
  existing caller without supplying entities, effects, RNG or startup state.

Only after independent source/result review, the smallest candidate is to clamp
`stoneBurst`'s root h against current native ground before its existing +90, while
retaining the child's own clamp. Preserve short arithmetic, draw ownership and
count, allocation/phase order, counters, stone/dust height and all angle-PR scope.
Use the original birth capture for a failure-first regression; do not manufacture
expected records from the proposed browser helper. Preserve separate failure
boundaries: original failed stone/root/child allocations do not imply a burst,
and the current browser's unbounded allocation adapter is not native exhaustion
parity. A broader model9 abstraction or old-stone rewrite is not justified here.
