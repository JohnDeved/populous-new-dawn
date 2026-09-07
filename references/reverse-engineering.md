# Executable behaviour and effects pass

Analyzed the user-supplied `D3DPopTB.exe` statically with Ghidra 12.1.3, Temurin JDK 21 and a locally compiled arm64 Ghidra decompiler. SHA-256: `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. The Windows executable was not executed or added to the browser build.

[hrttf111/pop3-rev](https://github.com/hrttf111/pop3-rev) provided Ghidra symbol/type metadata. Its reference executable hash differs from this installer, but PE section addresses/sizes match. The findings below were checked against the supplied binary, not assumed from names alone. Some community structure names remain provisional.

## Confirmed findings

| Address / input | Finding used in the browser |
| --- | --- |
| `0049c1a0`, `LEVELS/constant.dat` | Decodes the balance file with bytewise NOT/XOR and an eight-position rotating bit. First matching constant wins. The importer now produces `app/original-constants.json`. |
| `005a6d50` → `005a6858` | Person/action map → sprite-start/draw-type table. Shaman walk is 616 plus tribe×8; standing is 424 plus tribe×8. Braves carry with 72 and stand carrying with 80. Combat callers select rows 8/10/16 (104/120/200 for braves and warriors); 128 is a single-frame pose. All three attack sequences and row-9 reactions are now imported with weapon layers. 728 is a separate ground manoeuvre. |
| `0045f9d0` | VELE layer selector is `(flags & 0x1f0) >> 4`, tribe/person variant is `flags >> 9`. Warrior draw type chooses layer 2, variant 2. Native shadows are separate from body layers. |
| `004673b0` | Camera-relative eight-way direction selection; VSTART nonzero mirror field flips the composite; shamans add tribe×8. Preserve signed element origins, including death frames whose artwork travels above the foot origin. |
| `004ee7b0`, draw records at `005a6ad7` | Person animation frame delays come from the draw record. The imported normal person sequences have a one-turn delay. Camera rotation changes the direction without resetting frame phase. |
| `00476570` | HFX effect pixels are **not ordinary palette indices**. For byte `v`, RGB comes from `PAL[AL[(v | 15) * 256]]`; alpha is `(v & 15) * 255 / 15`. Decode with level-one `AL0-C.DAT` and `PAL0-C.DAT`. |
| `00509c10`, `00513830`, `00511f70` | Native effect starts include explosion 1180, smoke 1224, sparkle 1288, small sparkle 1294, splash 1304, lightning impact 1361 and birth 1441. HFX frames now replace generic particle spheres. |
| `0050b630`, `0050b740`, `005aa510` | Blast has a distance-dependent launch with horizontal parameter 140, maximum distance parameter 0x500, and direct person damage 50. The browser previously inflicted 52 **display** health, killing a brave outright. Native health/damage are now scaled together by 20. |
| `004e6a70`, balance file | Native movement increments map X by sine and Z by cosine, on a 2048-angle circle. Native speeds: brave 70, warrior 59, shaman 58. |
| `004c1d10` | Spell processing has multiple stages, including a six-turn delay. Browser casting now has a six-turn wind-up and can be interrupted; the full original shot/state pipeline is not ported. |
| Balance file | Health 1000/1800/2000; melee damage 60/360/60; human warrior training base cost 3500 mana; hut population values 3/5/7; tree growth 2 per 16 turns; Land Bridge duration 64 turns. |

The existing level importer reflects original map Z. Native models now receive the same reflection, with negated native yaw in Three.js. A map-aligned east/up/south basis prevents unwanted orientation twist around the globe. Door approach points use that same conversion, rather than choosing whichever dry side happens to appear first. Native floor-contact tests still pass.

## Simulation parity pass

Further decompilation corrected several earlier interpretations. Raw `constant.dat` is not sufficient: the executable accepts only names in its registry and converts flagged percentages to 8.8 fixed point, truncating integers. `scripts/inspect-executable.py` now applies that registry to the supplied constants and exports `app/original-rules.json`. For example, this executable ignores `MANA_UPDATE_FREQ = 15`, retaining its compiled mask of **3**. An explicit ignored-name list is included in `executable-tables.json`.

| Native routine | Implemented behaviour |
| --- | --- |
| `004ec6f0`, `004a5590` | One simulation turn per update; browser gameplay now advances at fixed 12 Hz independently of render frames. Four-turn and sixteen-turn systems use integer masks. |
| `0041af80`, `004ecac0` | Mana every four turns: idle brave/specialist 4, busy brave 15, busy specialist 5, shaman 30; sum first, multiply by human factor 320/256 or computer factor 128/256, then truncate. The browser uses 1000 native mana per displayed unit consistently with spell costs. |
| `0041a590`, `0041b0c0` | Warrior cost bands at 4/8/12/16/21 existing warriors. Active huts share training mana, with native intake caps and a second allocation when no spell charges. Empty training huts return invested mana, up to 100 per turn. |
| `0042b230`, `0041b240` | Base population support **6**, plus 3/5/7 per completed hut, capped at 200. Reserve one population place for the shaman even during reincarnation. |
| Building records `005a7228 + type×76`, `0049c1a0` | Hut occupancy is **3/4/5**, distinct from population support. This constants file sets warrior conversion value to one, so the training hut processes one resident at a time; followers wait outside. |
| `00404c80`, `0041b3f0` | Every four turns, add `2 × (occupants + 1)` breeding work. Threshold uses the native 20 population bands and hut base work 4000/3000/2000. Reset work when population is full; remove the previous early-birth bonus. |
| `004050c0` | Every sixteen turns, add `8 × occupants` upgrade work. Threshold 2400 for the first two hut sizes. Upgrading now requires three logs and reconstruction. |
| `004055f0` | Nearby idle braves can take available hut places. The browser approximates the native entry-cell scan with a distance search. Shaman and warriors may be explicitly housed; only braves construct. |
| `00518fb0`, `004d3ff0`, `004a39c0` | Native animated combat sequence 120 replaces the incorrect 128 pose. Melee damage is `max(32, floor(base × currentHP / maxHP))`. Browser attack cadence follows the selected animation length; full random fight choreography remains unported. |
| `00511f70` | Lightning kills eligible people in its native 2×2 map cell, including allied followers but excluding the caster's shaman. Removed invented surrounding damage and knockback. The native loop's `count <= LIGHTNING_NUM_KILLS` permits seven victims with the supplied value six. |
| `0050b740`, `00404c80` | Blast launches allies without direct health damage. Birth uses the actual sixteen-frame HFX 1441 sequence. |

The regression checks compare full world states after thirty seconds at 30 and 144 render frames per second, exercise population/cost thresholds, complete a timber-consuming hut upgrade, verify spell cell boundaries and still win the first mission through worship, construction, training and combat. These are browser consistency and source-formula checks, not a recorded original-engine replay comparison.

## Integer movement and melee exchanges

The next pass ports `00586074`'s integer octant lookup, using the 257 signed shorts at `005861b4`, and `004e6a70`'s movement products, using the 2048 signed sine values at `005ddde8`. Coordinates advance in native 1/256 units. Negative 16.16 products round down: a brave moving diagonally advances 49 native units in positive sine and -50 in negative sine, rather than a floating normalized vector. The endpoint snap and the 49×49 route grid remain browser behavior. New steps also check their actual destination for dry land.

`00518fb0` chooses ordinary, striking and special attacks from a four-bit random value. Braves/warriors use state 2 for values 0–4, state 4 for 5–13, and state 3 for 14–15. Shamans use state 2 for 0–6 and state 4 for 7–15. Their respective animation rows are 10, 16 and 8. The runtime now chooses these moves with the native unsigned generator `ROR32(state * 0x24a1 + 0x24df, 13)`. The browser starts with seed 1; native initialization and all other random consumers are not yet matched.

At each contact exchange, `004a39c0` calculates damage from **both fighters' pre-hit health**. Ordinary/striking attacks apply both hits, including mutual kills; state 4 suppresses retaliation. The browser no longer performs two independent, array-order-sensitive attacks. Recovery blocks repeated hits, and the renderer uses the action's start turn so consecutive identical moves restart their sprite sequence. Row-9 reaction sprites are 112 for braves/warriors and 424 for shamans. The atlas now contains 1876 composited frames.

The first exchange pass did not port the fight object. The following pass adds its groups and ground recoil as described below. Native upper-body-only reaction compositing is still approximated by the imported full sequence.

Target acquisition and commands now exclude housed and airborne people. The full mission regression therefore attacks occupied structures to release hidden defenders, and uses another earned Lightning gift if the enemy shaman survives through reincarnation. New checks cover all eight movement octants, signed diagonal products, known RNG outputs, each attack class, pre-hit retaliation, mutual kills, sprite frame counts and a complete combat replay at 30 and 144 render frames per second. Winning/losing clears unused frame time so terminal state is identical as well.

Further spell tracing (`004c1d10`, `004c21e0`, `004bae30`, `004bbf30`) confirms that the six-turn branch creates a shot and waits for it before spawning effects. It is **not** evidence that every spell impacts exactly six turns after a click. This pass leaves the browser's existing spell timing in place pending the shot initializer/movement port.

## Fight groups and ground recoil

`0051e3d0` defines actual fight slots: one central person and up to three opponents, at radius **180 native units** (180/256 browser map units). A three-person group uses angle offsets 0 and 512; a four-person group uses 0, 682 and 1365 on the 2048-angle circle. `005199f0` places the tribe with one participant at the center. These slots, center switching when reinforcements join, and the four-person limit are now implemented. Extra attackers wait for a place. Participants approach their slot before becoming ready; the native coordinate tolerance is 11 on each axis.

`00518fb0` changes a fight's orientation on a 32-turn cadence, with a random half-chance and signed angle change `random % 341 + 113`. Ready central fighters choose a random outer opponent; outer fighters face the center. Action and reaction substates block normal work and path orders until recovery. Death, Blast launch and new orders release the participant; groups dissolve when only one tribe remains. The renderer loops approach walking and plays attack/reaction cycles once, rather than freezing a walking fighter on its last frame.

An ordinary hit on a non-shaman now spends four turns in reaction, then enters the two-turn push stage. `00518fb0` supplies recoil magnitude `random % 70 + 35`. `004e93f0` adds a terrain-dependent adjustment; on level ground this is `floor(speed / 16)`. `004e6d00` applies an initial impulse movement, then ground damping and another movement. Damping is **28 per horizontal component**, verified for brave/warrior/shaman physics records through person table `005a7060` and movement table `005a7b90`; `inspect-executable.py` exports the checked value. The browser now moves the defender during this stage, then brings them back to their fight slot.

This remains a partial physics/fight-object port. The initial recoil adjustment uses the level-ground formula. Native slope forces (`004ebc20`), airborne integration, terrain-material friction, obstacle collision response and exit-speed flags still need integration. The browser stops recoil at blocked ground. Obstructed fight placement uses a small search for dry, clear slots, approximating `00519d10`'s native terrain-mask search. Prefight states, attacks on recovering opponents in larger groups, class-counter scheduling phase and complete global RNG consumption remain unmatched.

Eight regression tests now include native slot geometry, three-against-one formation, center changes, capacity limits, exact first-turn level-ground recoil displacement, Blast interruption, group cleanup, and identical combat state at 30/144 render frames per second. The first mission still completes through earned spells, building, training and combat. Browser QA also renders an actual four-person encounter and verifies that the staged participants exchange damage.

## Reproduce

```sh
python3 scripts/import-original.py /path/to/extracted/game
python3 scripts/inspect-executable.py /path/to/D3DPopTB.exe app/original-constants.json app/original-rules.json > references/executable-tables.json
npm test
npx tsc --noEmit
npm run build
# With npm run dev in another terminal:
node qa/browser-check.mjs
node qa/native-visuals.mjs
```

`inspect-executable.py` checks the exact executable hash and PE boundaries, then reads the small animation/damage tables. Its output is saved in `references/executable-tables.json`.

For decompilation, import the executable in Ghidra, optionally apply the pop3-rev XML metadata, and run the included `scripts/ghidra/ExportFunctions.java` with an output directory followed by hexadecimal function addresses. Headless example after creating a Ghidra project named `populous`:

```sh
analyzeHeadless /path/to/project populous -process D3DPopTB.exe -noanalysis \
  -scriptPath /path/to/populous-browser/scripts/ghidra \
  -postScript ExportFunctions.java /tmp/populous-analysis 00476570 0045f9d0 004ee7b0 0049c1a0
```

Decompilation is now part of the repository: see [the pinned setup, analysis scripts and C exports](../decomp/README.md), [upstream/symbol research](../decomp/upstreams.md), and the standing [full-parity goal](../GOAL.md). Original executables and downloaded tool/project binaries remain local and ignored; reviewed pseudocode and reconstructed behavior are tracked. The runtime remains TypeScript/Three.js.

## Remaining differences

Full parity is unfinished. The renderer and simulation are browser implementations, not an instruction-for-instruction port. Fixed turns, native movement tables and the random generator are implemented, but original per-object scheduling phases, linked-list processing order, steering and global random-number sequencing still need matching.

The next engine work is native pathfinding/formation/collision, the remaining fight/physics branches above, spell shot travel and resource cancellation, and the campaign AI script interpreter. Initial spell stocks and reincarnation timing are still browser rules. Mana generation and cost formulas are ported, while the original activity timeout, delayed mana awards and computer spell allocation remain simplified. Upgrade timber is fetched after maturation; the original can prefetch at 75%. Construction speed/reveal and building fire/structural damage remain approximations. Building damage routines `00409200` / `004092a0` were traced: damage accumulates, cools every four turns and removes structural timber at thresholds, rather than directly subtracting the browser's current building HP.

Land Bridge uses the native duration with the browser's raised-strip geometry and foundation protection. Lightning branches, shockwave placement, launch physics and native multi-pass Blast targeting remain approximated. Original palette quantization, all effect spawners/blend passes and death substates are not reproduced. The separate carried-log graphic remains to be traced. Original voices, spell and combat samples now play through the partial native cue dispatcher described below; adaptive music and ambience remain unported. Other missions, person/building/spell classes and multiplayer are outside the current first-mission implementation.

Further primary references: [PopResourceEditor alpha formats](https://github.com/Toksisitee/PopResourceEditor), [ALACN Pop World Editor](https://github.com/Toksisitee/ALACNPopWorldEditor), and the [Script 3 engine data definitions](https://www.populous3.info/script3_doc/_module___data_types_8h_source.html).


## Native PCM and cue dispatch

`0056ddc0` selects the PCM bank loader (`00575250`). `005753d0` obtains a sample header from **bank + sampleID × 4**: IDs are one-based, with the entry count at index zero. `00577680` retains the 16-bit sample rate, bit depth and **flag bit 0** as the stereo indicator. The whole flag byte is not a channel count. The supplied effect bank has 443 mono and 52 stereo samples; 493 use 22,050 Hz and two use 44,100 Hz. The separate fallback fight bank contains 37 mono samples. No half-rate conversion is applied. The existing PopSoundEditor source was useful for finding the bank format, but its channel/rate interpretation is not used here.

`scripts/import-sound.py` independently decodes these two banks, validates their headers, lengths and loop regions, writes 532 PCM WAVs, and verifies every emitted PCM byte against its bank. It exports all 229 cue records from `005acf60`. Record bank routing uses the original separate combat bank; the browser uses `popfightnew.sdt`, matching the native fallback when SoundFont loading fails. SoundFont instrument rendering remains absent.

`0048a050` selects one-based sample IDs and pitch variants with the separate `pseudo_random` generator, using the same ROR13 formula as simulation but independent state. Even single-variant cues consume a random value. Pitch spread is `100 + random % (2 × spread) - spread`. The browser implements this selection and the native distance-squared attenuation curve; it starts audio RNG at 1, so complete original random sequencing is not claimed.

The simulation emits casting voices (player/enemy), Blast shot/impact, Lightning and Land Bridge cues, and melee sounds on attack-timer expiry (`00518fb0`). A bounded presentation-event history uses a separate serial and never consumes simulation IDs or RNG. Rendering consumes each event once, including when several simulation turns run in one frame. Canceled casts emit no later impact. Selection/order voices and failed placement use native bank samples. The old synthesized ocean, drum/drone and spell tones have been removed.

The browser's six-turn shot/impact pipeline is still approximate: Blast's shot and impact cues currently coincide when it finishes casting. Land Bridge's native `0xab` and `0x29` cues are attached to the browser bridge effect. Exact source-unit tracking, frame gates, voice prioritization/stealing, all death/work/ambient triggers, pause/resume of active voices, native initialization, SoundFont choice and adaptive drum/music scheduling are unfinished. Distance uses the native quadratic curve with the browser camera focus; screen-space equal-power panning still approximates the original camera-relative integer panning. PCM loop metadata is retained for the future loop scheduler; current sounds are one-shots.

Nine regression tests include exact sample identities and pitch, malformed-bank rejection during import, noninterference with simulation IDs/random state, cancellation, and equal sound-event timing at 30/144 FPS. Real-browser QA checks non-silent decoded samples and verifies that no synthesizer oscillators are started. `qa/audio-check.mjs` additionally renders a decoded native Lightning waveform through OfflineAudioContext (measured RMS 0.10277), checks 74 preloaded samples, and verifies mute/resume, restart cleanup and context disposal. These checks establish extraction/playback and event consistency, not a complete original-engine audio replay comparison.

Reproduce the audio import:

```sh
python3 scripts/import-sound.py /path/to/extracted/game
npm test
# With the development server running:
node qa/browser-check.mjs
```

## Spell allocation and projectiles — 2026-09-07

This pass supersedes the six-turn immediate-impact and movement-cancellation
claims above. `004f4de0` targets the center of a native 2×2 cell, spends a gifted
shot before allocating its spell object, and `004c1b80` starts the shaman's cast
animation separately. `004c1d10` counts six spell turns and creates a shot; a
new movement order does not delete that independent spell. Caster absence
cancels the pending spell without refunding the charge. The browser now follows
these stages and freezes Land Bridge's source at projectile launch.

The executable's 62-byte spell rows at `005a80f6/f7/f8` give Blast (model 2)
shot types `[4,4]` and effects `[5,3,78,38,0]`, Lightning (3) `[2,1]` and
`[17,0,0,0,0]`, and Land Bridge (12) `[2,1]` and `[24,0,0,0,0]`.
`00509c10` switches on **effect type minus one**. Its case `0x11` is Swamp
(effect 18), not Lightning (effect 17). The earlier apparent table mismatch
was an analysis mistake, not a version mismatch.

`004c21e0` adds 96 native height units at launch. Lightning raises the endpoint
by 1024 and moves it 1536 horizontal units toward the source, retaining the
actual strike cell. `004bab10` initializes shots; `004baf00` advances types 1/2
in up to 20 steps of 70 per turn. Each step emits a four-turn trail, consumes
two simulation RNG draws and tests the three coordinate differences against
108 before moving. `004bb440` advances Blast by 1000 per turn, snaps inside
its arrival sphere, and deletes the shot on its following processing turn.
The waiting spell creates the impact after deletion. Blast's attached sprites
are HFX `0x463` and `0x464..467`, separated by 80 native units. Subsequent
movement turns emit up to four additional jitter trails at 160-unit intervals.
Launch and impact cues now occur on distinct turns. The casting voice index is
spell model + `0x74` (player) or + `0x8a` (enemy); Blast's previous cue indexes
were one low, although both aliases selected the same PCM samples.

Visual inspection caught a bank error in the new small particles. The
`draw_polygons` type-1 branch at `004673b0` always selects HFX, including draw
type 1's `0x13a` and `0x142` trail frames. They use the ordinary palette;
Blast's main translucent sprites use the nibble-alpha palette. The importer
now preserves that distinction. Particle frame-counter phase, native palette
fades, lighting and exact release animation still need porting.

`nativeStep3D` reconstructs `004e6ac0` with 32-bit products, arithmetic shifts,
half-scale vertical motion and signed-16 coordinate wrapping. The repository's
`check-native-math.py` loads the hash-checked executable into Unicorn
2.1.4, invokes **the actual x86 movement routine**, and compares 508 cases to
Node's browser implementation. All match. This is stronger evidence than a
pseudocode-only check but covers the movement routine, not the entire shot
processor or scheduler. The browser still converts its approximate terrain
heights back to native units (×45); native triangle flags and interpolation
from `0044e940` remain to be ported.

Ten gameplay tests pass, including cell targeting, charge consumption, a
moving cast animation, first/second Blast flight coordinates, trail RNG,
arrival/deletion separation, elevated Lightning endpoints, caster death,
30/144-FPS world equality and a complete first-mission victory. The mission
assault now targets the breeding huts before the remaining defenders; it no
longer relies on immediate spell hits. Browser QA passed discovery, bridge,
vault, construction, training, audio, camera, pause and restart. Dedicated
visual QA also captures all three projectiles in flight.

Remaining: original mixed-class allocation/processing order, god/reincarnation
shot sources, shaman vertical offsets in towers/vehicles, AI homing references,
reflection, exact particle allocation limits and cosmetic RNG, native effect
substates (including Lightning's extra effect-object dispatch), every other
shot/spell class, complete damage/terrain deformation and original-engine
replay comparisons. The browser's local arrival timings are tested but not
claimed as a complete native turn trace.


## Terrain diagonal selection and integer heights

`0044df40` (`level_land_processing_2`) recomputes tile flags after height changes. For corners A=current, B=east, C=next native Y, D=diagonal, it computes `mean=(A+B+C+D)>>2` and sets bit 0 when A or D shares the largest absolute deviation from that mean. A set flag connects B-C; a clear flag connects A-D. Equality is significant. This is more specific than the community description of choosing the shortest diagonal; it also fixes the browser/native Y reflection.

`0044e940` (`calc_point_height`) addresses the full 128×128 toroidal height grid using unsigned 16-bit coordinates, with 512 coordinate units per tile. It drops the lowest coordinate bit, giving weights 0..255. Each weighted height difference is arithmetically shifted by eight separately before addition, and callers consume the signed low 16 bits. Combining the products before rounding, or bilinear interpolation, changes the answer.

Reviewed reconstructions `nativeTerrainCross` and `nativeTerrainHeight` in `app/model.ts` now sample the original mission heights. `terrainCross` reflects the rule for browser Z and selects the triangles used by the mesh, `height`, `worldPoint`, and the shoreline shader. Foundation vertices remain on their rendered supporting plane. The upper terrain boundary now samples its exact vertex instead of an epsilon inside the final cell.

`scripts/check-native-math.py` executes the original tile flag setter from `0044df40` through its write at `0044e200` (stopping before `0044e202`), then calls the full height routine in Unicorn against the same native cells. All 680 cases match the browser helpers, including toroidal seams, signed limits, fractional coordinates and ties. The existing 508 movement cases also match. Eleven simulation/geometry regressions pass, including both diagonal surface planes and an original ridge whose old bilinear center was 37 but whose native center is zero.

Remaining differences: the browser still crops and resamples into its 97×97 grid, substitutes a shallow seabed for zero, flattens building pads, and uses a spherical projection. Continuous height interpolation over that browser mesh is intentionally distinct from the native integer sampler used to import its vertices. Full-world coordinates, native projection, original deformation scheduling, terrain shading, and exact live native ground physics remain open. The emulation validates these isolated routines, not the entire original terrain processor or complete world parity.


## PopScript control flow and first-mission initialization

`levl2001.hdr` byte 89 selects `levels/cpscr010.dat`, SHA256 `cf694564b0a4a8debbd488b79c0921abf72d9ab9df33e1dc51ce15edf2536901`. The expansion's `levluw/cpscr001.dat` is unrelated. `scripts/import-script.py` reads the original version-12 record: 4,096 little-endian code words, 512 eight-byte field records, 64 signed user variables, and two serialized pointer slots. It retains the 1,528 active words and referenced field range. Unreferenced trailing fields contain stale data and are not interpreted. Forty-nine DO command signatures are observed in the active script; their operand counts are preserved, not treated as evidence of game-side implementation.

Reviewed `app/popscript.ts` reconstructs `0048c6b0` (outer interpreter), `0048c980` (nested blocks), `0048f130`/`0048f230` (comparisons/logical expressions), `0048ef00` (SET/INCREMENT/DECREMENT), and `0048ed90` (MULTIPLY/DIVIDE). Comparisons are signed, both logical operands are evaluated, user writes wrap to signed 32 bits, attribute IDs 1000..1047 wrap to unsigned bytes, and division truncates toward zero with a zero-divisor result of zero. EVERY uses the mask stored directly in the field record and tests `(mask & (turn + signedTribe + offset)) == 0`; it is not a modulo interval and does not resolve the mask as a variable. The terminal instruction pointer stays on SCRIPT_END. Malformed browser inputs fail explicitly rather than reproducing native out-of-bounds behavior.

The Unicorn oracle uses the supplied executable's actual interpreter instructions. DO dispatch is intercepted at `0048cc60` to record operand references and advance CurrentCode; non-attribute internal reads are supplied by a deterministic host at `0048f350`. Across 1,236 cases, command/read order, variables, attributes and final CurrentCode match. Cases include four tribe offsets, all 256 low-byte turn phases, signed random variables, nested eager conditions, arithmetic overflow, byte truncation, divide-by-zero, and a variable-typed EVERY mask. This does not validate the intercepted game-command implementations.

The browser now executes the original turn-zero branch and retains its variables, attribute values, and state-enable flags. `0048cc60` opcode 1164 (SET_REINCARNATION) sets tribe flag `0x10000` at offset `0x93d` for OFF; mission one executes OFF for Dakini. The prior browser incorrectly respawned the red shaman. It now respects that script result while blue reincarnation continues. The first-mission regression was corrected to require this behavior.

Unassigned attributes currently start at zero in the comparison host and browser state; original AI default initialization still needs tracing before these attributes drive the full AI scheduler. Thirteen initialization commands remain explicitly queued in `world.ai.pendingCommands`, including defense/spell setup, marker orders and opening presentation commands. Their game-side effects have not been claimed or simulated by the interpreter. Recurring script execution is not yet enabled: it depends on the complete read/query/command host, original tutorial/flyby handling and AI state scheduling. Existing local combat/defense behavior and the blue reincarnation delay remain approximations. The next campaign work must bind these commands and recurring queries before replacing that behavior.


## Campaign markers and the Land Bridge head

`scripts/import-level.py` now preserves the header's 256 packed markers at byte 100 and records the header SHA256. `00492920` (`GET_HEIGHT_AT_POS`) reads a signed 16-bit coarse terrain vertex directly: both low coordinate bits are ignored, and no triangle interpolation is performed. The browser's `nativeCellPoint` and `markerHeight` follow that addressing. They reverse the browser-only shallow-seabed substitution to native zero and use the original height grid for markers outside the rendered crop. Current browser terrain deformation/foundation changes are still approximate; the query returns their quantized native-height equivalent inside the crop.

The first mission's `cpscr010` words 1370..1469 are an independent `EVERY 31 2` block. For tribe 1 it runs at turns 29, 61, 93, etc. It reads markers 35..40 into variables 21..26 and sums them into variable 52. Only if that sum is positive does it read markers 25..29 into variables 45..49 and sum them into variable 50. If both sums are positive, it issues `REMOVE_HEAD_AT_POS 2 222`. The browser now reconstructs this block directly in `campaignTerrain`; it does not enable the still-incomplete remainder of the recurring script host.

This replaces the prior A* route check performed when a Land Bridge visual finished. The original rule can remove the head with only two isolated raised vertices, one in each marked crossing. It does not require a walkable connection or wait for a particular bridge effect to end. Negative heights contribute to the sums, and skipped branches leave earlier variables unchanged.

`004f2160` finds a class-6/model-6 head in the addressed coarse map cell and deletes it through `004ef180`. Browser `removeHead` removes the matching shrine, cancels its assigned worship orders, and releases its scene mesh/button and minimap entry. Full native linked-object ordering when several heads share one cell, deletion-side state transitions and original AI scheduler phase ordering remain open; mission one's heads occupy distinct cells.

`check-native-script.py` now adds 416 complete native terrain-query command executions and 42 executions of the original terrain-rule block. The latter uses native terrain reads and intercepts only the final removal leaf. Height outputs, timing, accumulated variables and removal decisions match the browser. Thirteen simulation regressions pass, including a removal without an A* route, the turn-29/61 schedule, odd-coordinate cell matching and canceled worship. Browser visual QA also checks removal of the mesh and DOM button.

Additional raw exports locate the upcoming host work: `00492790` reads byte spell-cast counters, `00492860` reads one-off spell counts, `00491c30` queries a head trigger, `0048ff60` defines marker entries, `004902e0` defines spell entries, and `00490440` dispatches marker orders. These commands are not yet claimed as runtime ports.

## Campaign counter bindings and original terrain bytecode

The preceding counter queries are now bound through `campaignCommand` in `app/model.ts`. `GET_SPELLS_CAST` (`00492790`) reads unsigned bytes at `tribe + 0xc26 + spell model`, with literal tribe tokens 1118–1121 or resolved field values. `004c14c0` increments these bytes during spell initialization for models below 22, wrapping 255 to zero. Browser allocations now update independent counters for each tribe; canceled flights retain the count, and rejected orders do not allocate. The displayed total-casts statistic remains separate. Source inspection and 220 native initializer calls establish this counter behavior under the fixture's no-shaman/no-mana/no-notification conditions; other initialization branches remain unported.

`GET_NUM_ONE_OFF_SPELLS` (`00492860` → `004c2b40`) reads the low four bits of the spell-stock byte at `0x96071e + tribe * 0x38 + model`. Its upper nibble is a separate gift counter and does not contribute to this query (identified by the subsequent reward/spending trace below). Browser bindings expose the three represented player stocks; other tribes' stocks and unimplemented spells throw an explicit unbound-state error. The current computer casting/economy model cannot supply those native stocks accurately yet. `004c2b60` was exported as the next setter reference, but its packed-stock mutation is not ported by this change.

`GET_HEAD_TRIGGER_COUNT` (`00491c30` → `004f2900`) reads a **signed remaining-trigger byte**, not the number of gifts received. It traverses the native coarse cell list, skips objects other than class 6/model 6, and returns zero when absent. The level loader (`00485b00`) copies settings byte 3 into offset `0x6b`; mission-one initial counts are vault 1, Lightning 4 and Land Bridge 0. The trigger processor (`004fb270`) decrements positive counts after firing, leaves zero unlimited, and leaves negative values unchanged while disabling further firing. Browser shrines now retain this imported remaining count, expose it to queries and UI, and use it for depletion rather than a hard-coded four-gift condition. Completed browser shrines still retain their visual representation; full linked reward deletion and trigger lifecycle remain to be ported.

The manually translated terrain-rule function has been replaced by execution of the original `cpscr010` words 1370–1469 through the existing interpreter and command host. Native `EVERY`, arithmetic, height queries and `REMOVE_HEAD_AT_POS` now determine that branch directly. This is still one verified block; the remaining mission script is not silently executed with missing game commands. General recurring AI scheduling, messages/flybys and attack/marker orders are unfinished.

`scripts/check-native-campaign.py` adds 2,524 executable/browser comparisons: 1,280 real DO cast/stock queries, 1,024 real DO head queries and 220 real spell-initializer calls. Query destinations use the field record's value as a user-variable index even if its type is not a user variable; invalid indices fail safely in the browser. Existing 1,236 interpreter, 416 height-query and 42 terrain-rule comparisons still pass, as do fourteen gameplay/geometry regressions and TypeScript checking.

Upcoming trigger work is now located in `004fb270`: every-four-object-turn worship sampling, quadratic follower-count work, progress decay when worship stops, refill delay and reward spawning. The browser's current worship duration conversion, eligibility/radius checks, charge cap and reward scheduling remain approximations. This pass does not claim their parity.


## Worship work and delayed gifts (2026-09-07)

The reviewed type-0 work/refill portion of `004fb270` now lives in the browser-independent `app/worship.ts`. `00485b00` supplies signed required-follower, target, remaining-use and growth fields. Every fourth object turn, work increases by `required² / (required - min(required, followers) + 1)²`, using integer division. An empty sample subtracts `required²`, clamped to zero. A gift fires at `target * required²`. Positive remaining counts decrement to deletion, zero means unlimited, and negative counts disable the trigger without changing the count. Surviving triggers grow their target once by signed `growth / 4`, then pass through the native one-turn refill/reset states. A zero growth setting loads the native default 768.

Mission-one reward types now come from the original one-based linked object indices, rather than guessing from the trigger's remaining-use count. Land Bridge requires 28 samples and Lightning 32; at the browser's 12 turns/second these are roughly 9⅓ and 10⅔ seconds of uninterrupted worship before reward delivery, subject to sampling phase. The old seven-second Land Bridge timer was incorrect.

`004fb270` seeds an automatic reward's countdown with 82 turns. The original `004facf0` processor grants it only when that countdown reaches zero. Browser gifts now persist independently of the head and deliver knowledge or spell stock after those 82 turns; the native `0x70` sound cue occurs when the trigger fires. The campaign spell-stock table used by `004c2cd0` confirms a four-shot cap for Land Bridge and Lightning. Full stock does **not** stop worship. Stock already above the cap is left unchanged by a grant.

The packed spell byte has two counters, not stock plus flags as previously described: the low nibble is usable stock; `004c2aa0` independently increments the upper gift counter to a maximum of 15, including gifts awarded at full stock. The human command path in `0043e8e0` calls both the stock decrement and `004c2a50` gift decrement when spending a stocked spell. The browser now retains and spends that separate counter. Its broader UI/recharge role remains unported.

`scripts/check-native-worship.py` compares 4,344 actual native worship turns across follower interruptions, varying required counts, growth, refill, exhaustion and negative/unlimited counts. Another 1,660 actual reward-processor turns compare the browser's delivery delay and both packed stock counters, including full/over-cap stocks and saturation. Only the final object-deletion leaf is intercepted. Worship fixtures provide real command records and cell lists; the native eligibility routine executes. Reward fixtures start after visual initialization and use a non-player recipient identity to avoid the Windows UI hide callback. The executable identity is verified before execution; no executable bytes are embedded in the check.

Limits: the browser still supplies approximate order/radius eligibility and a shared world phase instead of native per-object phases. Native worship chooses the largest eligible tribe group; current first-mission worship orders and rewards are player-only, without competitive tribe ownership. The vault's shaman task still uses an approximate duration. Native floating reward icons, glows, hide timing, pickups and the complete linked-object deletion lifecycle are not ported. These comparisons establish isolated work/refill and automatic spell-delivery behavior under the stated fixtures, not full trigger, reward or campaign parity.


## Vault task states and corrected stone pyramid (2026-09-07)

The approximate eight-second vault timer is replaced by reviewed post-approach
states 2–9 from `0043c7a0`, in `app/vault.ts`. Type-4 trigger processing in
`004fb270` samples every fourth object turn: eligible shaman work increments by
one to the target, and otherwise decrements by one. Reaching the target does not
fire the trigger. The shaman task observes readiness, opens for 40 turns, walks
inside, waits 24 turns and calls `004fbf40` to set the trigger's force bit. It then
waits another 24 turns, walks outside, closes for 40 turns and leaves. The existing
82-turn automatic reward delivery follows trigger firing. A missing trigger
terminates states 2–5; states 6–9 can finish after its deletion. New orders cancel
the browser task; remaining work decays while no shaman is eligible.

`scripts/check-native-vault.py` executes 640 original post-approach task cases,
covering every state 2–9, entry flags, timer boundaries, arrival, readiness and
missing triggers. Movement, animation, facing and audio leaves are intercepted;
branching, timers and the actual force-bit lookup execute natively. Another 320
actual type-4 trigger calls check work, saturation, decay, force signals and reset.
Its decorative/UI callbacks and final deletion are intercepted. These tests do
not establish the omitted leaf behavior or world scheduling. The existing 6,004
worship/reward comparisons still pass after sharing the native reset/refill prefix.

The geometry mapping was corrected from model 94 (prison) to model 192 (stone
pyramid). All 110 unique vertices match the independently named editor
`knowledge.3ds`; its source revision, hash and fingerprint method are recorded in
[native assets](native-assets.md). A regression checks that fingerprint against
the mesh selected by the actual vault. The original task's numeric references
`0x98`–`0x9b` produce unrelated meshes when used directly as extracted record IDs;
that runtime asset/morph mapping was unresolved in this pass (resolved below).
Browser door cues use native `0x9f`. The level's vault orientation is
now imported from its decorative building object.

Sixteen engine regressions pass, including interruption/decay, exact 40/24-turn
stages, delayed knowledge and exit after trigger exhaustion. Chrome visual QA
checks the pyramid during the task; the real UI mission still reaches discoveries,
construction and training. Browser approach routing, shape entry/interior points,
coarse-cell eligibility, collision/visibility flags, interruption cleanup and
per-object scheduling remain incomplete. Full vault and campaign parity remain
open; the recovered task timing does not establish those missing behaviors.


## Native object bank redirect and vault door morphs (2026-09-07)

The wrong asset IDs came from skipping `0040c670`: it substitutes bank 2 when
requested bank is zero before calling `0040c690`. Level-one header byte 97 is
zero. `0049a890` only validates the 68-byte version header and version 5;
`0040c920` relocates pointers without remapping model IDs. The importer now uses
bank 2, with source hashes in `public/original/provenance.json`. Bank-2 model 154
matches the independently named pyramid exactly. Native task IDs 152–155 now
resolve directly to the correct vault; bank-2 prison is 156. This supersedes the
previous unresolved mapping and bank-0 model-192 workaround.

The scenery table at `0x5a79b0` maps tree types 1–6 to 13–18. The building table
at `0x5a7228` identifies towers 79, temples 95, warrior training 103 and vault 152.
Represented blue/red meshes and hut upgrades now use this bank. `0040b170`
selects between three hut variant families (107, 119, 131); the browser retains
family 131 until that RNG selection is ported.

`0043c7a0` starts the 40-turn door morph on base model 152: opening 154→153,
closing 153→155. After opening it selects static model 153; after closing the
base object retains the morphed points. `0040cc60` computes signed coordinates
as `from + trunc((to - from) * frame / duration)`, with native 32-bit multiply
and 16-bit result wrapping. This lives in `app/morph.ts`. Rendering reconstructs
raw coordinates using the imported scale, mutates a private geometry clone and
retains the base model's UVs during the morph. Imported morph topology is checked.
The initial closed mesh remains 154; initial idle morph scheduling is not ported.

`scripts/check-native-models.py` compares all 256 requested bank bytes against
actual `0040c670`, intercepting only its load leaf. It executes `0040cc60`
without interception for 7,595 coordinate cases: signed extremes, deterministic
random cases and every coordinate pair of both actual door morphs across 41
frames. These establish bank selection and coordinate arithmetic, not full
native morph/object scheduling. Browser turn integration and paused rendering
remain separate checks. Approach navigation, entry positions, visibility flags,
cleanup and native per-object scheduling remain open.

`scripts/extract-reference.py` makes selected Inno asset extraction reproducible
from the supplied ZIP without running the installer. Its optional dependency is
pinned separately in `decomp/extraction-requirements.txt`; it checks payloads,
rejects escaping paths, and refuses to overwrite differing files. The worship
and door cues (0x70/0x9f) are now included in audio preloading and playback QA.

Validation: all 16 engine regressions and TypeScript checking pass. Native bank,
morph, vault and worship comparisons pass; all 277 export hashes verify. Chrome
QA checks both moving door stages and paused geometry, native sprites/effects,
head removal and worship cue playback. The UI mission passes discoveries, bridge
casting, construction, training, pause, orbit and restart. Production build passes.


## Original discovery notifications (2026-09-07)

The browser now executes original `cpscr010` words 1242–1321 before the existing
terrain block. The Lightning branch uses `EVERY 63 2`: for Dakini's script index
1 it samples on turns 61, 125, etc. It reads the head at (18,246), emits message
83 when its remaining count drops below four, and sets variable 38 to prevent
repetition. The Land Bridge branch uses `EVERY 15 0`, sampling turns 15, 31, etc.;
it queries Blue's stocked Land Bridge shots, emits message 82 when positive, and
sets variable 43. Both honor the original shared message guard in variable 29.
They run from bytecode, not rewritten conditionals. Other tutorial branches and
all attack scheduling are still incomplete.

Opcode 1176 (`0048cc60` → `0048eae0`) reads its field argument and indexes the
16-bit string map at `005ae310`. `scripts/import-messages.py` validates the source
executable, decodes the supplied UTF-16LE `language/lang00.dat`, and imports all
eight constant message references present in this mission. Message 82 maps to
string 615; message 83 to 616. The original type-3 glyph is HFX 174, selected by
`0049f9c0` at definition offset 17, not the background frame at offset 12. Input
hashes and native definition fields live in `app/original-messages.json`.

`app/messages.ts` reconstructs type-3 allocation and text assignment from
`00430bd0`/`00430e40`. It uses the first free one of 32 slots; when full it
replaces the first eligible slot with the greatest positive signed age. The
original has an uninitialized selection when none qualifies; the browser rejects
that undefined case. Type 3 has no class cap, timed expiry or deletion-history
entry. Serial numbers wrap at 16 bits. Allocation consumes exactly one shared
native RNG draw for icon movement speed, preserves native flags and normalized
height (including the odd-height correction), and emits cue `0xe3`. That cue is
preloaded and non-positional. Removal follows `00430fe0` for type 3.

`scripts/check-native-messages.py` executes 160 native allocations covering free
slots, full-slot eviction, RNG seeds and serial wrap. A further 320 cases execute
the original discovery bytecode, real stock/head queries, message handler,
allocator and list rebuild, comparing all user variables, message records,
random state and cues. Only sound playback is intercepted. A separate removal
case compares surviving native slots. Both executable and original script hashes
are checked; no original executable bytes are embedded.

Limits: the browser shows the native icon and text through a React notification
list, with browser panel layout and dismissal controls. Original screen motion,
font rasterization, click-state flags, popup positioning and other notification
classes are not ported. Browser message ages advance with its shared simulation
turn; native `004314c0` gates age on offset-counter changes and pause flags inside
the presentation loop, whose complete scheduling remains open. Allocation is
compared at a 480-pixel reference height; stored normalized geometry does not yet
drive the CSS panel. Multiplayer's message-suppression flag is not represented.
The remaining original tutorial, camera and global script phases still need
integration. These checks establish the stated isolated behavior, not complete
campaign or notification-engine parity.

Validation: 17 engine tests, TypeScript checking and production build pass. The
existing 1,236 VM, 416 height-query and 42 terrain-rule comparisons still pass.
Browser QA completes the mission discovery/construction/training flow, opens and
dismisses the original Land Bridge notification, and verifies decoded cue audio.
The corrected glyph and popup placement were visually inspected. All 288 exported
routines pass the manifest and executable identity checks.


## Settlement counters, trigger commands and tutorial continuation (2026-09-07)

`004ecac0` rebuilds two signed-short building tables each cycle. Active class-2
objects have flag `0x20000000`; models 18 (vault) and 19 (prison) use separate
lists. Other models increment the all-building table at tribe+`0xbaf`; only
native state 2 increments the completed table at tribe+`0xb7d`. Model IDs 1–3
are hut sizes and 7 is Warrior Training. Browser queries now count represented
buildings by team/model and map `progress >= 1` to completed state. Destroyed
browser buildings are excluded. Native state transitions and the full rebuild
phase are still not ported; this is an explicit world-state translation.

`0048f350` internal IDs 1066–1081 query the executing tribe, and 1082–1145 query
Blue, Dakini and the other two tribes in groups of 16 models. The normal read
uses the completed table. Opcode 1136 sets tribe flag `0x10000`; only the next
building-table read consumes it and uses the all-building table. Other internal
reads leave it set. The community editor header names this command
`PARTIAL_BUILDING_COUNT` (the earlier working name COUNT_WITH_BUILDINGS was not
an original symbol). Self queries currently bind to Dakini, the only running
campaign script; other script owners await full multi-tribe integration.

Opcode 1151 (`TRIGGER_THING`) resolves a field to a marker index and passes the
packed marker to `004fbf40`. It ignores odd coordinate bits, traverses the coarse
cell list to the first class-6/model-6 head and sets force bit 2. Marker 41 from
this mission does not address any represented original head, so that particular
script request has no effect. The general binding handles existing heads, absent
heads and marker validation. Native flag handling revealed a browser bug: force
must persist until the trigger's reset prefix, rather than being cleared after
every vault step. Type-0 heads now honor forcing too, after any work sample on
that turn, bypassing the required work amount and fourth-turn sampling gate.
Reset still clears forcing before evaluation; disabled/refilling heads retain
the native ordering. `app/worship.ts` owns that work/force logic.

The browser now executes the uninterrupted original bytecode range 1080–1504:
settlement growth, advice when too few huts exist (including plans where the
script requests them), Lightning/Land Bridge discovery, Warrior Knowledge theft,
its marker trigger and cast-count baseline, Warrior Training construction, and
the existing terrain-head removal block. Original masks and once-only variables
determine when notifications appear. Opening narration/flyby, the earlier economy
and attack branches, AI defaults and full script scheduling remain unported.

The campaign oracle adds 40 actual native list rebuilds and 3,200 query sequences
(arm partial counting, read time, read a building count twice). Fixtures span
native states, both represented teams, active/inactive flags, all query IDs, and
vault/prison exclusions. Mana rebuilding is disabled; no leaf is intercepted.
Marker tests execute all 256 imported markers, plus 16 explicit hit/adjacent-cell
fixtures because none of those original markers hits the chosen test head.
The extra fixtures produce four hits and establish ignored odd-bit behavior.

The message oracle adds 384 complete native settlement/vault tutorial cases,
comparing user variables, notification records, latch consumption, sound cues and
shared RNG. Those fixtures supply native building counter memory; the independent
rebuild check covers its construction from object lists. Only message sound
playback is intercepted. The worship oracle adds 480 turns covering force during
reset, disabled/refilling phases, non-sample turns and zero-follower work; all
4,824 work turns and 1,660 reward turns pass. Existing vault comparisons also pass.

Names are cross-checked against ALACNPopWorldEditor `script.h`, revision
`1adcc222c6f35cdc76429cbb9c536b6410359df6`; behavior comes from the supplied
executable. The browser still approximates building state/cleanup, worship
ownership, global phases and popup rendering. These tests do not prove full
building, trigger, campaign or engine parity.

Validation: all 18 engine regressions and TypeScript checking pass, along with
the production build. Existing VM/height/terrain, vault, message and worship
comparisons pass. Browser QA completes worship, bridge casting, vault discovery,
construction, training, pause, orbit and restart, and opens/dismisses the original
Warrior Knowledge notification. Its rendered text and pyramid were inspected.


## First-mission opening flyby (2026-09-07)

The runtime now executes original first-mission words **936–1504**. The added
opening block runs on EVERY 7 after turn 70, once via user variable 57. It creates
message 78/string 611, sets its return-on-OK and auto-open bits with commands
1180/1187, releases the initial input mask, and builds the original 18 flyby
events. No replacement waypoint sequence was authored.

`00449240` stores at most 32 eight-byte events, sorted by signed start time with
stable ordering for ties; insertion is disabled while playing. The command
wrappers pack coordinates into bytes, preserve signed short timing, and convert
zoom percentages by truncating `(short(value) << 8) / -100`. The zoom handler
later mutates that event value by shifting it six more bits. Tooltip commands
map modes 0/1 to flags 1/2. The end target is stored independently for interruption.

`004a4960` calls `00449320` from **draw_main**, independently of the simulation
turn. The scheduler warms up for six presentation frames, averages the measured
frame-rate global, clamps the resulting signed byte to 8–24, then converts script
times from tenths of a second. Separate tracks update position, angle and zoom;
the frame at the duration endpoint still runs before completion. Position follows
the shortest signed-16-bit route to the center of an even map cell. Angle events
use the native shortest difference and start from the interest-point track's
velocity (zero for this mission). Zoom is clamped to ±16384 and reset on exit.

`0044a070` computes acceleration, cruise and braking using carried velocity.
The x87 disassembly is significant: intermediate float stores and extended
arithmetic are not interchangeable. Update routines add a stored 0.5 bias, then
truncate the sum of velocity and the current signed coordinate. They do not snap
to a nominal endpoint. `00449080` allows an immediate stop during warmup or blends
to the end target over two seconds (three at frame rates below 11), resetting
position/zoom velocity first. The implementation lives in a separate TypeScript
module, independent of React, Three.js and the simulation tick.

The native oracle executes the supplied binary and original flyby bytecode. It
compares **1,000** profile calculations, **6,270** zoom frames/velocities,
**1,600** event insertions, and **4,077** complete opening frames across measured
rates 8/10/12/24/60 and natural/warmup/midflight/late interruption paths. It checks
camera coordinates, angle, zoom, event cursor, track counters/active flags,
warmup, sampled rate and emitted tooltip parameters. The no-op `004e9d70` executes.
Only renderer zoom setting, tooltip/message presentation, game input-mask OS
handling, notification dispatch and debug output are intercepted. Native
near-target bit 0x80 is excluded from snapshots because the browser's early
input-mask release is unported. CPU setup explicitly uses x87 control word
**0x027f**; the real startup and Direct3D precision modes need verification.
These are isolated arithmetic/timeline comparisons, not full original-frame
capture or proof of camera parity on every graphics configuration.

Browser integration starts the tour and original narration at turn 71, blocks
game orders during it, and supports pause and Escape/Space or a skip button.
The browser supplies a fixed **24 Hz presentation clock**, independent of game
speed; native frame throttling is still unported. Three.js maps the recovered
coordinates/angle/zoom onto the existing approximate sphere. The orbit camera
now preserves the final bearing by inverting that spherical offset rather than
jumping away from the settlement. Browser QA checks the uninterrupted tour,
pause, replay after restart, keyboard interruption and restored selection;
the existing UI mission checks discoveries, construction, training and orbit
after skipping. Nineteen engine regressions and the existing native message
comparisons pass. Rendered opening and completion screenshots were inspected.

Remaining: native interest-point track (kind 4) explicitly fails rather than
silently approximating; this mission does not use it. Tooltip events are now
drawn by the browser as described below. The exact globe
projection, zoom mapping, startup camera state, initial input-mask lifecycle,
message dialog behavior, native frame cap and early near-target input release
remain incomplete. These limits must be resolved for full camera/UI parity.

## Forced opening tooltips (2026-09-07)

The original three flyby callouts now identify the Dakini Warrior Training Hut,
Vault of Knowledge and Lightning Stone Head. `0044d7f0` clears the old tooltip
before selecting an object: mode 1 traverses the even map cell for scenery
class 5/model 9; mode 2 reads its building occupancy flag/index. It stores flags
6 and a signed-short duration, then uses `004f0f90` to choose the original text.
The name routine selects class-specific own/enemy/multiplayer strings; worship
objects use their linked trigger's category, tutorial index and reward flags.
`004851e0` derives those flags from linked type-6/model-2 reward settings.

`004aa4e0` invokes `0044db60` after the flyby update, independently of whether
the flyby is still running. A nonzero duration decrements as a signed short;
expiry or an invalid target clears the callout, while a valid update requests
drawing and sets the hold counter to twice the presentation rate. The browser
keeps this lifetime on its existing 24 Hz presentation clock after interruption
and freezes it with pause. The world adapter still uses first-mission footprints
instead of the native cell occupancy table; tribe formatting covers the current
Blue/Dakini world rather than dynamic multiplayer names. Hover and forced modes
3–10 are not implemented.

The importer reads 72 original English strings, their executable name tables,
and the eight 4×4 HFX border sprites referenced at `005caae8` (center slot zero).
Disassembly at `0044a9e8` supplies ordinary-object background index **152**;
`0044a38b` sets text index **80**. The `0x3a` elsewhere in the decompilation is
a colon used while laying out text, not a background color. `00429c70` loads
the landscape palette; `004a3420`/`004a3530`/`004b1850` copy it into the system
palette. The index conversion `00415f70` and opaque rectangle path through
`004a24c0`/`00516a00` are CPU-compared, including all 256 colors and four expanded
rectangle vertices. Browser callouts currently use that opaque color path.

The naming/selection/timer oracle covers 1,900 names, 144 forced selections and
384 counter updates, including missing targets, signed wrap, owners and linked
worship categories. Native cell traversal executes, but only the supplied-object
portion of the browser port is compared directly. Twenty engine regressions
include the real opening cell bindings. Browser QA sees all three original
callouts and checks pause, expiry, restart, natural completion and skipping.
The Stone Head's elevated text anchor had incorrectly been used for hemisphere
culling; the browser now uses the ground target for that visibility decision.
Rendered callouts were inspected. Visual QA also hashes the actual rendered
closed-vault vertices against the independent `knowledge.3ds` reference, in
addition to checking every door phase.

Native font selection/render routines are exported for further work; browser
text still uses Arial and CSS wrapping. Exact font metrics, text balancing,
mouse-button glyphs, inherited blend state, native clipping/projection and full
hover/fixed-message behavior remain unported. These checks do not establish
pixel-identical tooltips or full interface parity.

## Native camera pipeline and sprite facing (2026-09-07)

The normal ground view is not the browser's current sphere. `0046dbe0` and
`0046de00` apply a camera-relative 14-bit integer basis, subtract curvature from
transformed Y using transformed X/Z, and project through a configurable depth
offset. Their screen fields are **float32**, despite the inferred integer types
in the exported pseudocode. Disassembly and CPU output confirm the stores.
The curvature product deliberately retains the native signed 32-bit intermediate
after shifting a 64-bit product; replacing it with unlimited-precision math
changes overflow cases. Clip flags stop at the first failed axis and preserve
existing bits. The behind-camera fallback retains the executable's unusual
masked shift by `fraction + 100`.

`scripts/import-camera.py` reads all 50 original 94-byte `data/vconfig0.dat`
records (SHA256 `e9226f39682ed3ac149054f1843a4575fa0c15640db08d487f9f115b2559dca8`).
The ten resolution groups each contain five camera modes. `004171f0` chooses
exact dimensions first, otherwise the smallest signed product of dimension
differences. `0041c700` interpolates curvature, matrix scale, pitch, vertical
offset and horizon for flyby zoom. `00417000` overwrites field +52 with 280;
`00476090` uses it as a sprite enlargement factor, including normal-view shamans.
It is not a terrain cutoff. `00520cd0` selects fractional screen precision
from device mode/capabilities: X/Y are 0/0, 4/0 or 4/4, with reciprocal float
multipliers. The full device initialization and its x87 precision remain unported.

`app/projection.ts` reconstructs these calculations, the normalized yaw/pitch
basis (`0047f480`/`0047fab0`), circular and rotated quadrilateral mesh bounds
(`0046e450`/`0046e510`), and original model transforms (`00471490`). Models use
`rawCoordinate * nativeScale >> 8`, then pitch/roll/heading, then their wrapped
half-map position and native height. This differs from treating the editor's
inverse-scaled mesh coordinates as native world units. Half-world coordinate
ties retain opposite signs depending on the original difference.

`00476090` scales signed sprite-layer offsets and dimensions from a **depth-sort
bucket**, not distance to the camera. Its normal/zoomed and shaman paths have
different fixed-point rounding and clamps. `004673b0`, instructions
`00468c7b`–`00468c91`, selects the eight-way sprite offset from
`(cameraHeading - objectHeading - 0x380) & 0x700`. The live scene now uses this
heading calculation. The previous per-unit camera vector introduced positional
parallax and reversed the yaw contribution during the opening flyby. Both live
followers and death effects share the corrected selector.

The native comparison checks 266 resolution selections, 100 nonzero zoom states,
6,144 camera bases (all 2,048 headings), 512 arbitrary basis rotations, 4,096
screen projections, 1,024 real-asset model transforms, 223 circular bounds,
1,024 rotated bounds, 4,096 sprite scaling cases and 18,432 direction selections.
Zoom viewport/bounds leaves are intercepted; all interpolated fields execute.
Model fixtures set face count to zero and capture points before projection, so
they do not verify face lighting, culling or emission. The direction fixture
executes only the identified instruction span. A translation-cache flush ensures
the model-point capture hook also applies to previously executed projection code.
Every fixture uses the pinned executable and verifies the camera data hash.

**Integration limit:** only sprite direction selection is wired into the live
scene in this change. The remaining camera/model/bounds/sprite-size ports are
verified prerequisites for replacing the renderer, not a claim that the visible
world already uses native projection. Terrain, water, picking, labels, sprites
and models must switch together. Original ground-mesh generation, full toroidal
level coverage, depth buckets, face lighting/order, globe overview, input controls,
device selection and startup/frame timing remain unfinished. Browser visual QA
checks actual frame atlas offsets at direction boundaries, all vault door phases,
effects and combat; the existing 20 engine regressions still pass.


## Ground renderer integration (2026-09-07)

`app/render-view.ts` now applies the reviewed integer camera pipeline to normal
view terrain, water, original models, sprite anchors and labels. The shader
retains 32-bit arithmetic wrap and delays conversion to float32 until the native
screen-coordinate store. Model coordinates are restored from editor units and
scaled/rotated using the original transform. Foundations now share a flat native
height with their models; the old sphere-compensating terrain deformation is
removed. Ground triangles use affine interpolation, as their screen positions
already contain the native perspective divide.

`00416e50` replaces normal-view table bounds for 800×600, 1024×768 and 1280×1024,
with a default for other dimensions. An additional 114 CPU cases verify this
setter. Nonzero flyby zoom sets bounds mode zero, selecting circular bounds.
The field at +93 is now named `scaledSprites`: it controls level flag `0x100`,
and is set by both negative-zoom and overview presets. It does not identify
globe mode by itself.

The renderer uploads native coarse-row bounds for fragment clipping. Terrain
uses periodic translated instances; water follows the camera on a coarse grid.
Their unwrapped relative coordinates prevent triangles folding across the map's
antipodal seam. Objects retain the native wrapped-coordinate convention. Picking
inverts the actual projected triangles with barycentric weights and returns
wrapped map positions. This is a browser picker, not a port of the entire native
input/picking state path. Mouse and keyboard ground movement wrap at 256 map
units; the original flyby supplies its recovered camera position, heading and
zoom directly. The existing 24 Hz presentation clock is unchanged.

`qa/projection-check.mjs` runs the same vertex shader under WebGL2 transform
feedback. All 24,576 screen-point outputs exactly match the CPU-compared float32
results. Across 26,838 original model vertices and multiple headings, the maximum
normalized clip-space difference is 5.564e-8 (tolerance 1e-6). Twenty-nine actual
terrain-triangle picks invert within 1e-6 map units, including translated world
copies. The complete mission browser check and opening flyby check cover the
integrated renderer. Native visual QA retains the independent `knowledge.3ds`
geometry fingerprint and verifies every vault door phase; no prison geometry is
selected in these runs. The reported prison on the user's existing page has not
been reproduced; the current page URL/browser state could not be inspected.

Remaining differences: native terrain mesh generation (the browser retains its
97×97 one-unit grid), full toroidal simulation and level coverage, face lighting
and ordering, terrain color lookup calibration, WATDISP water animation, native
clip/rasterizer/device initialization, original globe projection and exact input
timing. Sprite widths/heights use native screen pixels and shaman/zoom scaling,
but still pass a placeholder ±1 depth bucket and composite layers before scaling;
per-layer rounding and depth-dependent size therefore remain approximate. The
minimap camera rectangle, selection/health/construction overlays and some spell
visuals remain approximations too. These results establish ground-projection
integration, not pixel-identical rendering or full engine parity.


## First-mission computer spell setup and shutoff (2026-09-07)

The original `cpscr010` words 564–600 contain an `EVERY 1` block: it reads
Dakini's Blast allocation counter into variable 19, and when that byte exceeds
one it issues `STATE_SPELL_DEFENCE 90 202 OFF` and rewrites spell entries 0 and
1 with model zero. For script tribe 1 this runs on odd turns. The browser now
executes these original words before the already-bound presentation/discovery
blocks. Its existing defensive caster checks the enabled spell entries instead
of continuing to allocate Blasts indefinitely.

`00492c30` evaluates both coordinate fields, truncates them to bytes and toggles
state bit `0x400` only for literal ON/OFF tokens. If that state remains enabled,
it sets tribe flag `0x100` and writes the packed target at +0x46e; otherwise it
clears the flag and preserves the old target. `0048cc60` command 1196 writes the
defense radius as a byte at +0x5be. `004902e0` writes each spell entry's dword
at +0x4c6, word at +0x4ca, and bytes at +0x4ce/+0x4d0/+0x4d1, using a 12-byte
stride. The untouched entry bytes are not invented or consumed by this port.
`004d11b0` and `004d1450` confirm **eight** entries; the latter separately updates
availability after checking mana and other native eligibility. Those consumers
remain unported.

Startup now applies the four corresponding calls: defense radius 7, packed
position (8,28), and two Blast entries carrying the loaded Blast cost, range
field 512, people field 6 and mode bytes 0/1. The cost read is internal 1050,
which `0048f350` resolves through the loaded spell table at `0x5a8150`. Nine
startup commands remain deferred. Other AI defaults are still zero-initialized
browser state, not a recovered native initialization pass.

`scripts/check-native-computer.py` executes 256 full native command calls with
constant/variable fields, ON/OFF/unknown tokens, signed values and all 32 flag
bits. Another 192 executions include the actual startup field references and
unmodified recurring block across 32 turn phases and six counter values. No
native leaf is intercepted; the fixture supplies the loaded Blast-cost cell.
All written fields and the script counter agree with the browser. A simulation
regression holds an opponent nearby through actual spell allocations and proves
the browser stops at two, retains the target when disabled, observes odd-turn
timing and resets entries on restart. Chrome's rendered-world check exercises
the same path. Existing campaign, interpreter, message and complete mission
checks pass; 21 engine regressions and all 389 export hashes verify.

This establishes the script's spell-entry shutoff and its browser integration,
not a universal native two-spell cap. Native mana/bucket eligibility, target
scoring, shaman defense movement, close-combat reactions, casting cadence and
AI state scheduling remain incomplete. Marker orders, attacks, training requests
and the remaining first-mission script still need their original implementations.

## AI task scheduling, training controller and follower counts

Verified against `d3dpoptb.exe` SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Reviewed control is in `app/computer.ts`; raw exports retain Ghidra's inferred
names/types. The complete AI scheduler and person-command system are not yet
integrated into the browser world.

- `004615f0` calls the campaign interpreter before its task branch. With
  `phase = turn + signed tribe index`, `(phase+13)&63 == 0` reserves the radius
  maintenance turn; otherwise `(phase+1)&63 == 0` reserves task production;
  otherwise `004623e0` processes at most one active task. These maintenance
  branches skip dispatch even when there is no radius work. The outer engine's
  invocation order, timers and remaining spell/defense phases remain unported.
- Ten task records begin at tribe+`0x36`, stride `0x52`. `004623e0` starts at
  cursor byte +`0x5b5`, scans inactive slots, calls one handler, then advances
  once. Even an empty queue advances once. `00462730` finds the first free slot;
  `00462770` clears active/cancel bits only. `00462790` retains unrelated flags
  and scratch fields; `00462ca0` has no type-6 reset branch.
- `004e6640` (TRAIN_PEOPLE_NOW) requires a free slot and available people before
  finding the first completed training building in the native linked list.
  Person models 3/4/5/6 map to building models 7/5/6/8. It allocates type 6 with
  the requested signed count, target building and phase zero; it does not train
  a person immediately. `004f67b0` excludes the shaman (model **7**), not model
  10. `004f6730` counts people in states 10/33 with uncancelled housing command 6.
- `004c8490` phases 0/2 initialize the request and eject non-braves from the
  training hut. A full hut ejects its final occupant to make space. Zero count
  calculates `max(0, preference * population / 100 - trained - committed)`,
  bounded by attribute 33 at `0096080b + tribe*48`; multiplication is signed
  32-bit and trained counts are signed 16-bit. Attribute indices 5/6/7/8 select
  spy/religious/warrior/firewarrior preferences. `004f2ac0` supplies already
  committed people; its full native list consumer is not integrated yet.
- Phase 3 acquires the tribe selection lock via `004f5c80` and `004f2290`.
  Active type-20 tasks can prevent acquisition in particular phases even with
  an otherwise free lock. Phase 4 gathers at most 100 people per call and
  reserves them in person state 14; phases 5/6 issue group command 8 and release
  selection. Phase 7 adds the active-task count to its wait counter and moves
  to cleanup when the hut fills or the counter is **greater than** 300.
  Invalid/deleted targets and cancellation share cleanup; a competing lock
  can prevent selection restoration, but the task slot is still released.
- `004f8490` native selection traverses people by priority bands, eligibility
  flags, command state and target distance. This is **not** approximated by
  choosing the nearest browser brave. `stepTrainingTask` exposes native
  selection as an input and ejection/selection/command/restoration as actions.
  These action consumers and native eligibility still need a world adapter;
  the original words 601–624 (TRAIN_PEOPLE_NOW block) stay unbound until then.

`scripts/check-native-training.py` runs 1,024 actual dispatcher occupancy masks,
1,024 actual `004615f0` prefix/phase cases, 1,200 training-controller cases and
300 actual allocation calls. The training comparison executes the controller,
lock contention and release routines; selection, committed-count lookup,
occupancy mutation and person commands are controlled leaves. It does not
prove person selection, movement, native initialization or complete scheduling.
The Node regression separately runs a request through selection, command,
arrival, cleanup and slot reuse.

`campaignInternal` now binds total counts (internal IDs 1–5), per-class counts
(1146–1175), knowledge model constant 1200 (=18), and person constants
1201–1206 (=2–7). `004ecac0` includes active, non-ghost followers while inside
buildings or selected; wild people are separate. The browser adapter currently
covers braves, warriors and shamans of the two represented tribes; the remaining
classes and ghosts have no browser representation yet. Person reads do not
consume PARTIAL_BUILDING_COUNT's one-shot flag. Count timing still follows the
browser world; native rebuild/event ordering remains a larger integration task.

`scripts/check-native-followers.py` executes actual counter rebuilds and 2,016
native queries/constants without intercepted calls (mana rebuilding and
player-only UI excluded by fixture state). It also compares 4,608 executions of
the exact original words 625–680: EVERY 127 offset 14, while variable 2 is less
than 3, blue warrior counts 1–3 / 4–12 / 13+ set attribute 11 (AWAY_BRAVE) to
34 / 67 / 100. Zero warriors retains its prior value. This block now executes in
the browser campaign at the original phase, including turn 113 for Dakini.
Attack command execution itself remains unfinished; this port supplies the
original commitment settings instead of inventing attack waves.

The UI now holds an external simulation store and subscribes through React's
`useSyncExternalStore`. UI edits notify through `store.change`; scene updates
publish the existing display cadence through `store.update`. Restart creates a
new world and rebuilds the scene. This replaces mutating a world held directly
in React component state, which failed the React immutability check. It adds no
simulation rules or dependencies. The native simulation remains independently
runnable in Node; separate store instances, notifications and unsubscribe are
covered by a regression, with restart and gameplay checked in the browser.
