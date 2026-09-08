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

Browser integration starts the tour and original narration in the tribe phase at
turn 71, before object turn 72 (outer-loop correction below), blocks
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

## Native follower eligibility and selection

`app/computer-selection.ts` ports `004f8490`, its ranking leaf `004f8390`,
availability (`004f25b0`, `004f67b0`, `004f6730`), command predicates
(`004f62c0`, `004f39d0`), transport exclusion (`004f7720`), building exclusions
(`004f3200`, `004f61f0`), forced selection (`004f6720`) and base defense
(`004f55d0`, `0049c720`). The input preserves native tribe-list order and raw
person fields; it does not infer original states from browser animations.

- Selection visits priority bands 0–6, filters assignments, ghosts, shamans,
  transports and current orders, then either keeps traversal order or ranks by
  wrapped Manhattan distance. Strict-less-than insertion preserves ties across
  bands. Requested count is clamped to 0–100; only returned people consume
  flags-3 bit 1. Native scratch writes beyond the returned prefix are not
  represented as world memory.
- Current commands are read only in person states 10 and 33. A cancelled
  immediate command suppresses the queued command; there is no fallback.
  Housing orders require selection option 4. Defending orders use wrapped,
  halved-axis squared distance with an inclusive radius boundary.
- The inside-building lookup is terrain record **+8** (`008a03ec`), masked to
  10 bits. The adjacent record +6 is a different field. Full-building exclusion
  requires building flag 64 as well as signed occupancy >= capacity. In the
  imported table only models 13–16 have this flag; a completed model-7 training
  hut is not excluded merely because it is full.
- Transport duty excludes a brave driving a valid vehicle and passengers whose
  valid driver is not in a ready state. `00465650`'s landing predicate is pure;
  both consumer branches make the same driver-state test. Its terrain reads
  can therefore be omitted from the reconstructed eligibility result.

`scripts/inspect-executable.py` now imports the 46 person-state flag records
from `005a6f78` (stride 5, flags +1), and 20 building flags/capacities from
`005a7228` (stride 76, flags +72, capacity +32). Unknown person states fail
explicitly in the port instead of silently inventing eligibility.

`scripts/check-native-selection.py` runs **1,870** actual native availability
and selection comparisons with all leaves executing: randomized person/command
records, each option mask, all building models and signed occupancy boundaries,
cancelled immediate commands, seam/tie ranking and more than 100 candidates.
Another **256** cases run the actual `004c8490` phase-4 controller with the actual
selector. Only person initialization/restoration are intercepted in those
combined cases. A Node regression covers recruitment ordering, command
precedence, selected-bit consumption and the building-flag distinction.

Group command creation/commit (`00435730`, `00435780`, `004359b0`), command
removal/attachment (`004364d0`, `00436d00`), payload update (`00438730`) and
selected-person release (`00418ce0`) are exported but not yet ported. They use
shared reference-counted command records and person-state transitions. The
training controller and selector remain outside the browser world update until
those consumers are reconstructed; original mission words 601–624 remain
unbound. This change adds verified engine behavior, not new playable AI orders.

## Shared person orders and command ownership

`app/person-orders.ts` reconstructs `00435780` encoding, valid eight-slot
`00435730` enqueue, the allocator/group control in `004359b0`, reference and
person-slot changes in `004364d0`/`00436d00`, and route conversion in `0043b010`.
The importer records command models 0–34: people masks at `005a7dc4` and flags
at `005a7dca`, stride 22. Unused payload bytes retain old contents; command 7
sets flags 4/8 according to its first argument. Queue overflow writes beyond
the original eight records, so the port rejects that unsupported corruption
path rather than silently simulating a larger queue.

The pool is 800 ten-byte records at `00938830`, with cursor/active count at
`0096aa78`/`0096aa7a`. Allocation scans at most 800 times, wraps to slot 1,
clears model/flags/attached-object identity, and preserves payload. Allocation
does **not** reserve a record. A nearly full pool can therefore return the same
zero-reference record repeatedly before group attachment begins. Cursor zero
can return the failure sentinel after resetting record zero and advancing.
The port retains both behaviors; it does not substitute unique reservations.

Group commit allocates first, then visits selected people in tribe-list order,
filters the three requested models, removes old commands, clears two person
flags and attaches eligible queued commands. Cancelled or ineligible entries
still consume positions. An allocation failure keeps all old person orders;
the group queue clears in either case. Each command is shared by all eligible
followers, so reference count transitions control active-record count and
attached-object deletion. Immediate replacement acquires the new reference
before releasing the old one, including replacement by the same record.

`0043b010` finds the first run of route models 11/25, allowing empty slots
inside the run and stopping at a different nonempty command. Two or more route
entries convert model 11 to 25, expand the packed cell into two coordinates,
and set person flags-2 bit 16. These records are shared: conversion is visible
to other followers referencing them. Disassembly confirms the apparent
uninitialized decompiler local is assigned by the first route entry before
use; the reconstruction does not depend on stack residue.

Removal preserves the original effect sequence: active work interruption,
model-7/model-30 cleanup, reference decrement and possible object deletion,
person-slot clearing, command-status reset, then fight-assignment release.
`OrderEffects` makes the unported world consumers mandatory: target preparation
(`00438730`), live work-target handling (`0051ff40`), model-30 tribe/shaman/RNG
cleanup, object deletion (`004ef180`) and fight release (`004d4f40`). They are
not replaced with no-ops in a browser adapter; that adapter is still pending.

`scripts/check-native-orders.py` compares **1,952** calls: 1,120 command
encodings, 576 route/attach/remove cases and 256 group commits. It compares
the entire command pool, group bytes, person fields, cursor/active counts and
effect order. Native preparation, work/object/fight effect leaves are supplied;
model-30 cases use tribes without a live shaman, with the counter effect
supplied on the TypeScript side. This is not a comparison of those world
effects. The Node regression follows two followers through assignment,
replacement, final-reference deletion, immediate self-replacement and pool
exhaustion. All 26 Node regressions pass.

Additional exports identify the next integration work. `004ed6f0` is an empty
function, but `004ed640` dispatches to `004d2740`, whose person-state initializer
updates selection counts/flags, resets movement and combat fields, consumes
RNG and selects animations. State 14 sets the selected bit used by group commit;
leaving it decrements the tribe selection count. `00418ce0` and `004f65e0` rely
on that lifecycle. These state transitions and native command execution remain
unported, so mission training words 601–624 are still intentionally unbound.

## Person state initialization and training handoff

`app/person-state.ts` now reconstructs the common body of `004d2740` and states
10 (orders) / 14 (AI selection). Shared initialization resets person flags,
work/formation fields and timers, maintains the tribe selection count, and
draws native randomized speed only when the destination state's flag 512 is
clear. It preserves signed-short speed arithmetic and the speed-double flag.
State 14 still consumes the applicable speed draw before zeroing speed.
State 10 delegates to the required original-order startup consumer; it does
not invent movement from a destination alone. Other initializer bodies fail
explicitly until reconstructed.

`00409d40` preserves an existing training reservation in state 14 or when the
current state-10 command is model 8 with the matching target. This particular
leaf does not reject cancelled commands. `004d47d0` tests the **low byte** of
the queued command index before formation rebuilding in state 10, so command
index 256 is different from index 257 here. These details are preserved and
covered by the native initializer fixtures.

The reservation consumer in `004c8490` changes eligible followers to state 14
and then sets assignment bit `0x800`. Disassembly at `004c85ce` confirms the
write is **byte +0x77**, not the animation/order scratch field suggested by
the old inferred structure names. `reserveTrainingPerson` handles protected
followers as the executable does: their state stays unchanged, but the
reservation marker is still set. `releaseSelectedPeople` reconstructs
`00418ce0` and the movement reset in `004e9b40`; normal trained-class defaults
return to state 10. Special/default states outside the reviewed initializer
domain, including the level-flag shaman state 39, remain unported.

`004eec80` faces selected followers toward an offset from the tribe view
position and angle, using signed coordinate wrap and native angle/step math.
With neither `land_flags_1` bit 8 nor `opened_files_flags` bit 16 set, it releases
the motion reference and sets turn flags/target angle. Either flag instead
assigns yaw directly. The port uses those same two behaviors.

`personAnimationObject` reconstructs `004d3ea0`: state-dependent object rows,
carrying variants, airborne flags, stationary speed, literal state-15/16 object
IDs and the -1 sentinel that preserves an existing animation. It returns
original object identities, not browser animation names. The importer records
nine person model flags/defaults, the first 20 reviewed physics speed records,
and the 234 animation-object entries used by this leaf. Sprite-frame assignment
inside `004d4040` is still a required consumer.

`scripts/check-native-person-state.py` compares **8,288** native cases:
1,536 complete shared/state-10/14 initializer calls, 6,624 animation-object
selections across all 46 states and nine models, and 128 training handoffs
through actual phase 4, 5 and 6. The handoffs run actual native selection,
initialization, shared-command allocation/attachment and selected-person release;
they compare every represented person field, the full command pool, AI phase,
selection ownership/counts, effect ordering and RNG state.

World consumers remain explicit comparison boundaries: order startup
(`00432260`), training-list rebuilding (`00409580`), formation rebuilding
(`004d56f0`), motion-reference release (`004ea460`), animation assignment
(`004d4040`) and, in combined cases, target preparation (`00438730`). Passenger
selection propagation is outside these fixtures. The new exports include
`00432df0` and `0043d510` for the next order-startup work. These checks do not
prove command execution, travel or arrival; mission training words 601–624
remain unbound pending those world consumers.

The angle, planar step and RNG helpers were moved unchanged from `model.ts`
into `native-math.ts`. Both the live simulation and reconstructed person states
use them, keeping state reconstruction independent of the browser world module.
The Node reservation/release regression additionally checks state/count cleanup,
the assignment marker, protected followers and effect order.

## Order startup, building compatibility and configured speed

`app/person-order-start.ts` reconstructs `00432260`, the shared descriptor
logic in `00432df0`, and `0043d510` building compatibility. Training command 8
uses that common logic: it records the building target, initializes command
status and flags, resets motion counters and sets the order delay to eight.
It does not immediately turn the building target into a guessed walking path.
Position commands delegate the original destination consumer, preserving the
different raw-coordinate and packed-cell conversions in the descriptor.
Specialized construction/vehicle/spell command bodies remain required world
consumers, not silent defaults.

Empty order startup changes no fields and consumes no RNG. A present but
cancelled immediate command still causes the startup speed draw; configuration
then rejects it without falling back to the queued command. Building compatibility
has its own rules and can still inspect that cancelled command's target.
An occupant stays for a matching training target, particular firewarrior tower
orders, or order 31; otherwise the native building-exit consumer runs before
flags-2 bit 16 is cleared. Reconciliation for order 28 also requires a live,
compatible target. Vehicle transition and state-33 entry remain explicit world
boundaries; this change does not implement transport travel.

`recoverPersonMovement` reconstructs `004d4f40`, now used when startup releases
a fight assignment: draw speed again, apply the doubling flag, and choose the
native movement/carrying/airborne animation object. `resetPersonMotion` and
`currentPersonOrder` share the actual reset and raw lookup rules with existing
person-state code, without imposing one consumer's cancellation policy on another.

The stronger startup comparison exposed a native-fixture omission: executable
defaults differ from shipped `LEVELS/constant.dat` overrides. For example,
`BRAVE_SPEED` is **70**, while the executable's initial table value is **64**.
`check-native-person-state.py` now decodes the supplied balance file, checks it
against the repository import, and writes its settings using the native
descriptor table's addresses, sizes and percentage flags before execution.
The previous state-14 comparison proved speed-draw RNG consumption but could
not prove the drawn value, because that state immediately zeros its speed;
state 10 previously supplied its startup leaf. This gap is now covered directly.

The updated oracle adds **1,280** startup/building-reconciliation calls and
**640** direct recovery calls across all 20 reviewed physics models, and upgrades
the **128** training handoffs to execute actual native order startup. The entire
script now compares **10,208** cases. Startup fixtures exercise 25 command models
without specialized command bodies, cancellation/empty queues, building decisions,
field resets, target conversion, effect order and configured speed/RNG behavior.
Destination setup (`004e9d80`), adjacent-building lookup (`0040a3f0`), target
compatibility (`00520170`) and building exit (`00409ed0`) are supplied consumers
in those cases. The combined training handoffs no longer intercept `00432260`;
they retain the documented target-preparation, animation and other world leaves.

The new Node regression checks a compatible training occupant, cancelled
immediate-target handling, configured brave speed, fight-release animation,
and empty-order nonmutation. Live browser command scheduling, pathfinding,
travel, training-list/occupancy mutation and arrival remain unfinished; the
original mission training block stays unbound until those consumers are ready.

## Training waiting line and command-8 substates

The verified executable's `00434610` now has a TypeScript reconstruction in
`app/training.ts`, together with its actual linked-list queue consumers
`00409580` (prune/rebuild), `00409b10` (append), `00409bd0` (predecessor), and
`00409c50` (indexed entry/tail). The building's queue head is word `+a2`;
person successors are words `+85`. Queue membership requires a live person in
state 10 or 14, substate 3, with an uncancelled current command 8 targeting the
building. The immediate command takes precedence even when cancelled. Pruning
preserves raw links while traversing only live entries, clears removed people's
membership flag, and sets building activity `0x2000` plus the first changed
position, clamped to 255. A broken final link is not silently repaired. Native
lists are acyclic; malformed cycles are outside this reconstruction's domain.

The controller preserves substates 0–13, including same-call fallthroughs:
approach, join/wait, enter/retry, inside work and idle. Queue slot numbers and
refresh delays are bytes; position lookup sign-extends the slot. A follower
which reaches its queue position stops and faces the preceding slot or the
building entrance. An already-trained specialist can swap places with the
untrained follower behind it on its 16-phase check. Both receive delayed slot
refreshes, and movement restarts consume the original speed RNG draws. The
building's trained person model is imported from descriptor byte `+49` at
`005a7228 + model*76`, not inferred from names or browser building kinds.

The waiting head can approach the entrance only when capacity is available,
the building's entry delay is zero, and the follower is stopped. The controller
sets a 16-tick entry delay and removes that follower from the waiting list.
Entry is staged through the outside and inside points, with separate congestion
and entering counters; blocked entry retries only for queue-enabled building
models. Queue movement can time out or restart after movement flags change.
Goal proximity compares the absolute difference of *separately sign-extended*
coordinates at person `+4f/+51` and `+3d/+3f`. It does not use a wrapped delta;
facing calculations do wrap. Native `004d4ee0` stopping is also reconstructed,
preserving carrying and airborne animation choices without consuming RNG.

`check-native-training-queue.py` compares **1,540** native queue operations
with no supplied leaves, including invalid/dead links, cancelled immediate
commands, non-person entries and changed-position byte clamping. It additionally
compares **2,689** command scenarios across all 14 substates (2,688 single calls
plus one six-tick specialist/trainee handoff), checking people, building fields,
RNG, completion result and ordered effects. Configured balance constants are
loaded through the executable's own descriptor table. A Node regression follows
the specialist swap, delayed refresh, capacity release and cancellation cleanup.

Boundaries remain explicit: `00409710` queue geometry, `004044b0` outside point,
`00404420` inside point, `004e9d80` path request, `004e9dd0` direct destination,
`0040a3f0` adjacency, animation output, motion-group release, cargo allocation,
`00407150` occupant entry and `004da5b0` inside work are supplied consumers in
these controller comparisons. The exported source also records the surrounding
state-10 updater `00432590`, next-command routine `004366b0`, occupant removal
`00407490`, cargo drop `004d58c0`, and path routines `004ec3f0`/`004e9e80` for
continued reconstruction. Live world adapters, pathfinding, occupancy, order
advancement and the original mission's training block remain unfinished. This
checkpoint does not enable an approximate training AI in their place.

## Original footprint masks, entrances and queue geometry

`app/building-shapes.ts` reconstructs the shape consumers `00404420`,
`004044b0` and `00409710`. The supplied `SHAPES.DAT` contains **64** 48-byte
records followed by **1,532** shared mask bytes. The executable's initial
`005ca2ec` is 64; loader `0040c880` relocates each record's pointer at `+44`
relative to the start of that mask buffer. The importer preserves this shared
buffer instead of making independent, padded grids. Geometry probes can cross
a particular shape's extent, and inventing padding would change their results.
Raw shapes and bank-2 object files are recorded in the asset provenance hashes.

Each object record stores four signed shape indices at bytes `44–47`.
The original lookup divides the signed angle by 512 with truncation toward
zero. Shape bytes `2–3` offset the anchor in units of 256; signed bytes `4–5`
locate the inner entrance and `6–7` the outside approach in units of 64.
Building initialization `00403610` aligns anchor coordinates at `+7a/+7c`
with mask `0xfe00`. These are not positions at a constant radius from the
rendered building's center, and the four orientations need not be symmetric.
For the first blue hut at browser (-4,42), the four outer points are
(-3,44.5), (-6.5,41), (-3,37.25), and (0.75,41).

Queue index zero returns the outer entrance. Any nonzero index first aligns
to the footprint edge using signed division by 64 and the native bit masks;
a negative index stops after that alignment. Positive indices walk 128-unit
steps. One probe tests mask bit 1 to turn clockwise, then another tests bit 4
to turn back; both use the absolute wrapped coordinate distance from the shape
origin. Native angle and integer-step helpers are reused. Zero-sized shape
records retain their native behavior; invalid object/angle mappings and probes
beyond the loaded mask buffer are explicit unsupported-domain errors.

`check-native-building-shapes.py` verifies importer output against raw assets,
rejects truncated inputs, executes the actual loader relocation with only file
I/O supplied, and checks **22,752** native inner/outer/queue points across
all **632** object/orientation pairs. Cases include signed queue indices,
positions through 127, and both signed and unsigned map seams. Geometry calls
have no intercepted leaves. The **2,689** training-command scenarios now also
execute the original geometry, replacing the three supplied geometry consumers
from the preceding checkpoint. The existing **1,540** queue comparisons remain.

The live renderer and routing share `buildingObject`, so displayed buildings
and their entrance lookup use one object identity. Building orders, timber
returns and follower emergence use the original outer point. The browser
adapter now measures arrival at that point rather than accepting followers
within a fixed radius of the building center. Its coarse A* allows the final
goal cell to reach the exact door when the old circular obstacle intersects
that cell; this is an explicit pathfinding approximation, not a reconstructed
native pathfinder. A regression commands live followers into huts at all four
orientations and rejects a follower merely standing at the building center.
The complete Node mission flow still passes with discovery, construction,
training and victory. The staged native entry/occupancy consumers, full command
scheduler and non-building shrine approach adapter remain unfinished.

The final Playwright gameplay run also passed discovery, timber delivery,
construction, training, pause, planet rotation, decoded sound and restart with
no browser errors. All 30 Node regressions, type checking, production build and
lint passed (the seven existing image-element lint warnings remain).

## Native occupant admission, visibility and training preparation

`app/building-occupants.ts` reconstructs admission `00407150`, mode changes
`004d80e0`, weight scan `00408d20`, and the cost arithmetic used from `0041b0c0`.
The initial gate checks building activity bit 8 and matching tribes, except
building descriptor flag `0x100000` permits a foreign occupant. The signed
inside-count byte is compared with the descriptor capacity. A full building
rejects ordinary people; a shaman requests an ejection and then tries entry.
Regardless of that count, the incoming person takes the **first empty of six
physical occupant slots** at building `+86`, or fails if no slot is available.
Only successful admission increments the byte count and changes the person.

Training/workshop descriptors (flags 1 or 64) choose occupancy mode 3, which
requests vehicle exit and sets the inside flag while retaining commands and
presentation. Ordinary housing uses mode 0: request vehicle exit, clear orders
with native reference accounting, set inside/hidden flags, then resolve special
tower/shaman placement or hide the person and remove its land-cell membership
when applicable. Mode 4 preserves orders while applying that ordinary hiding
behavior. Mode 1 restores presentation and land membership, obtains ground
height, and resets all three velocity words. The tower-tribe update mask is the
byte at **`0096eace`**, verified from instruction `0040723d`; the metadata field
name alone does not provide its address.

Training admission clears building flags-3 bit `0x1000` and its timer at `+9a`.
It sums the original person conversion weights from descriptor `+31` for live
occupants that differ from the building's trained model. These scans do not
filter tribe or require person class 1. A sum below one trained model's weight
is treated as zero. Nonzero weight sets building activity bit 128, calculates
the cost for the number of conversions, and sets assignment bit 4 on same-tribe
occupants, including occupants already of the trained model. Zero weight clears
those activity/assignment flags but **preserves the old training-cost word**.
Admission finally updates the occupancy indicator, clears activity bit 1024,
and clears the person's saved order location.

The cost function uses signed-short population counts, all six population bands,
native person-model mana tables (human when tribe player type is 2), two wrapped
32-bit multiplications, and truncation toward zero on division by 256. Admission
clamps positive overflow of the resulting cost to 65535 before storing the word.
The live warrior-cost query now shares this arithmetic instead of maintaining
its own band/formula copy. The `0041b0c0` affordability return is not claimed as
a new port here; admission consumes only its calculated cost.

`clearPersonOrders` reconstructs `00436ca0` and is shared by ordinary occupancy
and group commit. The person-state, training-queue and occupant oracles also
share one `configure_native_constants` helper, which verifies the supplied
balance file and applies its overrides using the executable's descriptor table.

`check-native-occupants.py` compares **8,128** scenarios: **1,728** cost
calculations across every person model, population threshold, player type and
signed overflow; **1,024** weight scans; **2,048** occupancy-mode changes;
**3,072** admissions; and **256** composed command-8 admission/interior-stop
scenarios. The composed calls execute native admission, occupant flags, weight,
cost, command cleanup and final stopping/animation selection. Full-building
ejection `00407490`, vehicle exit `00466c80`, adjacent/tower placement, terrain
height, cell insertion/removal, occupancy indicator `0040c4e0`, animation output
and existing work/object/fight order effects remain supplied world consumers.
The separate order (1,952), person-state (10,208) and queue/controller (4,229)
comparisons still pass after sharing their helpers. The new Node regression
checks sparse slot order, foreign rejection, activity/cost retention, shaman
ejection, shared references and restoration of vertical state.

A further boundary is now explicit: `004da5b0` is the workshop-interior movement
path selected by building flag 64 (models 13–16), rather than ordinary warrior
training. Its helper `00409f90` has defined offsets for those workshop models.
Ordinary training instead reaches command substate 12 and then stops in 13;
the building's work/conversion update remains to be reconstructed. New exports
record those workshop helpers and indicator/transport consumers for continued
work. Full live occupant lifecycle, building conversion, native pathfinding and
the original mission training bindings remain unfinished.


## Native occupant removal and containing-building lookup

`removeBuildingOccupant` reconstructs `00407490`; full-building shaman admission
now invokes this routine instead of a supplied ejection effect. A signed inside
count at or below zero prevents removal. The routine selects the first nonzero
physical slot, or the first signed slot matching the requested person's ID,
without the live/class filter used by weight scans. It decrements the byte count,
clears the slot and activity bit 4, and applies actual occupancy mode 1. Training
activity, assignments and cost are rebuilt through the shared admission logic.
`repriceTraining` reconstructs `0040bbe0`, including conversion-count division,
cost clamping and word storage. Unsupported zero-weight training models fail
explicitly rather than silently producing a JavaScript NaN-derived cost.

After the indicator update, removal obtains the original outside point and steps
512 native units sideways at building angle +512. Construction plans (class 9)
use the separately exported `004b9fc0` geometry boundary. It records coarse-cell
centers at person +68/+6a, clears formation slot +82 and calculates wrapped
facing toward the exit. Flags control turning and backwards facing. The routine
sets movement flag 16, building entry delay 12, clears activity 1024, and records
the world turn for building descriptor flag 32. **It does not teleport the person
to the door or create a path.** Spatial insertion/height remain world consumers.

`leaveBuilding` reconstructs `00409ed0`. It first uses the person's packed coarse
terrain cell and masks the building index to ten bits. A nonzero index suppresses
fallback even if the indexed object is the wrong class or does not contain the
person. Only a zero index scans the tribe's linked building list, stopping at the
first matching occupant slot. Native lookup and removal intentionally use
different validity checks; the port preserves those distinctions.

The occupancy oracle now compares **11,200** scenarios. The **3,072** new cases
cover removal, containing-building lookup and repricing, including signed counts,
sparse slots, dead/nonperson records, world seams, backwards facing, terrain-index
masking and construction plans. Previous shaman admission cases now execute the
real native exit, geometry and repricing. Only construction-plan geometry and
existing spatial/transport/indicator/order effects remain supplied. The Node
regression checks real shaman displacement, unchanged position, exit-cell centers,
lookup fallback suppression and repeat removal. The shared shape fixture loader
also replaces the queue oracle's duplicate setup; the separate geometry oracle
continues to verify the executable's actual pointer relocation.

Inspection of `00405b80` identifies the next conversion boundary: native training
allocates replacement people, transfers eligible follow-up orders (or attaches a
shared outside movement order), then removes the old trainees. Partial allocation
rolls back the newly allocated people. Ghost and mana handling have separate
branches. This conversion routine is exported but **not yet ported**; the live
browser still changes a brave's model in place. Full live occupancy/pathfinding,
conversion and original first-mission training bindings remain unfinished.


## Native training conversion, batch rollback and order inheritance

`app/training-conversion.ts` reconstructs `00405b80`. With activity bit 128 clear,
the routine runs its queue-yield check only every sixteenth building phase and
when an occupant exists. The first physical occupant must be the trained model
or a shaman. An untrained non-shaman queue head can eject that occupant. A scan
for any queue member of another model also marks leading trained followers to
restart, sets queue-dirty activity 8192 and requests removal of the same original
occupant again. The second removal is intentionally not a request for a different
occupant; `00407490` handles an already removed person without another mutation.

With training active, `00509290` requests **UI-panel activation/retention**. Its
helpers `005092e0` and `00504060` confirm this is not training sound or work-mana
accumulation: the latter allocates a class-10/model-3 panel object, populates the
158-byte panel record, draws its contents and selects the training panel type.
Those consumers are exported but remain a supplied UI boundary.

Training cost is rebuilt when zero or on the sixteenth phase. Sufficient stored
mana is first clamped down to that cost. Nonzero conversion weight allocates a
shared outside movement order (model 3, flags 32), then counts ghost occupants.
The conversion count is weight divided by the destination model's weight; each
remaining weight unit produces a brave. If this was not a periodic reprice, the
routine reprices again before allocation and checks the new cost. Ghost batches
bypass that second affordability check, not the initial affordability gate.

Each replacement is allocated at the original inside point, with the native
initialization stack containing signed x/y/angle and two zeros, and allocation
flag 1. Any ghost occupant marks **every** replacement as a ghost; local-player
replacements also receive render bit 16384. All replacements must allocate before
old occupants are touched. Failure deletes the successfully allocated partial
batch. The already prepared zero-reference command remains available in the pool.
A successful ordinary batch credits stored mana through `0041a4f0` for computer
player type 1 and then clears stored mana; a ghost batch retains it.

The native order-source index advances past empty slots but **does not advance
past the first nonempty slot**. This is confirmed by the instructions at
`00406281`–`00406356`, not inferred from the pseudocode alone. Every replacement
can therefore inherit the same first occupant's following orders, even when that
occupant already has the trained model and remains inside. Eligibility `0043b120`
looks only after the current cursor, without wrapping, and ignores cancelled
records. Once eligible, copying walks seven following slots with wrap, preserves
empty positions, and attaches even cancelled records. Otherwise the replacement
receives the shared outside order if allocation succeeded. Each replacement gets
movement flag 16. Old live occupants of other models are then removed, their
commands released, and their objects deleted. Finalization zeros the cost, sets
activity 1024, and records the current turn.

`check-native-training-conversion.py` reuses the occupancy fixture and compares
**1,024** complete dispatcher scenarios against the executable. Explicit coverage
assertions verify **112** completions, **52** ghost completions, **42** rollbacks,
**33** computer mana credits, **29** queue yields and **11** exhausted command-pool
paths. Original cost, weight, geometry, exit, command allocation/attachment,
follow-up predicate and reference cleanup execute without intercepted leaves.
Allocation/registration, deletion, mana credit, panel activation, command target
preparation and existing spatial/indicator consumers are supplied. Allocation
arguments and initialization-stack contents are compared, and supplied population
mutations exercise repricing after creation/removal. A new Node regression checks
batch rollback and shared inheritance from a retained trained occupant, including
cancelled records and gaps. All **32** Node tests pass; the separate **11,200**
occupancy and **1,952** command comparisons also pass.

Live browser training still uses its earlier in-place conversion. Connecting the
reconstructed dispatcher to native allocation/counters, person commands, building
occupancy and the first-mission training bindings remains required; this step does
not establish live conversion or full engine parity.


## Full native mana distribution and live first-mission integration

`app/mana.ts` reconstructs `0041a590` and `0041ad70`. Tribe fields now retain the
computer mana pool (`+94d`), pending release (`+951`), incoming amount (`+955`),
charged-spell total (`+959`), previous/estimated rates (`+95d/+961`), release delay
and step (`+a05/+a07`) and all 22 progress counters (`+969 + model*4`). The spell
availability mask and disabled-charge mask come from the 56-byte records at
`0096070a`; charge stocks retain their high nibble. The imported 62-byte spell
descriptors provide charge mode/cost, normal and alternate limits and rate data.
The alternate limits are selected by game flags bit 32; no multiplayer meaning
is inferred for that flag.

Pending mana releases on the native signed timer and step schedule. **Idle-hut
refunds only run when incoming mana is nonzero.** Training huts are collected in
reverse tribe-list order through their `+a0` links. They receive a share of half
the incoming amount, capped at cost/32 and remaining capacity. Negative shares
remove stored mana, and overfunded huts can refund even during a positive share.
The low-intake flag is set only on the native capped branch. All multiplication,
addition, division and byte/word stores preserve original integer behavior.

Computer player type 1 receives the remainder in its clamped mana pool and does
not run the second training pass. Human spell charging shares mana among enabled,
available and not-full spells, performs original stock-cap and special-mode
checks, and redistributes overflow after a spell fills. With no active spell,
unfinished training huts get the second capped pass. Negative incoming mana
reduces existing spell progress across available spells and repeats when a
progress counter hits zero. Equality at the active-count boundary does not spend
a per-spell unit; remaining input is cleared on return, matching the executable.
The query retains the first spell on a highest-cost tie. Charge-rate estimation
and tutorial request branches are also reconstructed.

The oracle executes native stock operations, eligibility, cap selection, queries
and distributor calls without intercepted gameplay leaves. Only notification
output `00499d90` and its reminder predicate `00499970` are supplied. **1,024**
updates and **1,024** queries match, including INT32 extremes and wrapped half-mana
multiplication. Coverage assertions record **170** stock changes, **312** progress
decreases, **282** idle refunds, **168** computer pool changes and **46** notification
paths. New exports show `00499970` permits its reminder only on original levels
6–10 before its flag is set; it correctly returns false for the live first level.

The browser now calls this distributor each turn instead of its separate formula.
It charges only Blast in the first-level adapter, keeps stone-head rewards as
one-off stocks, waits for a generation pulse before refunding idle camps and
retains computer mana instead of spending its remainder on another training pass.
A Node regression exercises these live differences. All **33** regressions pass.
Playwright exercised the actual React/Three.js page: Blast progress matched its
native integer counter (67), the computer pool increased (92), pause stopped turns,
and no browser errors occurred. The screenshot was inspected. Type checking,
production build and lint also pass (seven existing image-element warnings).

Remaining integration limits are explicit: follower mana generation and complete
turn ordering are not newly proved by this distributor check. Live camps still
use one-trainee occupancy and the previous in-place conversion, so their adapter
supplies one-person costs. Initial tribe mana, pending-mana producers, rate-sample
inputs and AI spending are not fully connected. Native notification requests are
retained for later tutorial gating/presentation rather than sent through an
incompatible message allocator. The original batch-conversion and occupant ports
still need that broader world integration.


## Native follower mana contribution and generation commit

`personMana` in `app/mana.ts` reconstructs `0041af80`. Braves (model 2) use the
configured busy value when their inside flag (`flags2 & 0x800000`) or command-status
byte (`+a7`) is nonzero, otherwise the idle value. Models 3/5/6 use the specialist
values with the same gate. Model 7 uses the unsigned mana word in its person
descriptor, imported by `inspect-executable.py`; other models yield zero.
There is no additional building-type/upgrade-level or animation/fighting test in
this routine. Inside training and housing use the same contribution gate.

Model 4 is the **preacher**, confirmed directly by the original constant descriptor
`HUMAN_TRAIN_MANA_PREACH` pointing to `005a714c` (person model 4 +36); the spy
constant points to model 5 at `005a717e`. An early working name was corrected before
commit. A commanded preacher outside a building uses the idle specialist value
when `004df0e0` recognizes its order and assignment bit 64 is clear. That predicate
requires state 10 or 33 and a noncancelled current command of model 17, 31 or 32.
Immediate commands take precedence, including cancelled ones; cancellation does
not fall back to the queued command. Inside occupancy overrides the special case.

`generatedMana` and `generateFollowerMana` reconstruct the mana portion of the
actual tribe rebuild `004ecac0`. Contribution requires person class 1 and object
registration bit `flags4 & 0x20000000`. Ghosts (`flags4 & 0x800`), wild-person model 1
and model 8 are excluded. The original scan adds no independent HP/dead-bit check.
It sums each tribe's contributions with signed 32-bit wrap, then applies the human
factor only for player type 2 (computer factor otherwise) with a wrapped multiply
and signed division by 256. On eligible turns it adds the result to incoming mana,
stores it at tribe `+95d` and clears the estimated rate at `+961`. Game flags bit 32
or a nonzero turn/update-mask intersection suppresses the entire generation commit,
including those rate-field writes. A pulse updates all four tribes, even empty ones.

`check-native-mana-generation.py` compares **2,304** contribution/preacher-predicate
cases across all nine models and **1,024** full native tribe rebuilds, including
**383** mana pulses. The full rebuild executes generation and current-command
queries natively; only local-player UI activity classification `004513e0` is supplied.
Fixtures exercise registration, ghosts, all tribe player types, cancelled immediate
orders, generation gates, zero populations and overflow into existing incoming mana.
The full-rebuild comparison covers mana outputs; it does not claim all rebuilt
counters/list side effects have been ported.

Live generation and the mana-flow display now share these recovered functions.
The former broad busy test (including fighting/animation alone) is removed. The
browser's current three follower classes still adapt work/path/target/guard orders
to command presence, alive units to registration and inside membership to the
native flag. Original person/order integration remains required for exact state
transitions and the remaining classes. All **34** Node regressions pass, including
special preacher orders, ghosts/registration, pulse gates, overflow and the live
combat-animation distinction. The separate distributor/query oracle still passes
**2,048** comparisons. Playwright again confirmed live charging, the computer pool
and pause without browser errors. Type checking, lint and build pass; seven existing
image-element warnings remain.

## 2026-09-07 — Spell affordability, height-dependent range and payment

Recovered `004c2e30` interpolates eight configured 8.8 range multipliers at
128-height intervals, clamps the lookup index at seven and preserves signed
truncation for negative heights. The normal descriptor range is multiplied with
32-bit wrap. A person carrying the inside flag gains one third extra range only
when the raw object indexed by their terrain cell is class 2/model 4/state 2.
Game flags bit 32 selects the alternate descriptor; tribe flags bit `0x80000`
bypasses both paths with `0x0fffffff`. `inspect-executable.py` now imports both
range descriptors and the height table after applying the recognized constants.

`004d1450` updates eight readiness bytes. Each is zero unless a shaman exists,
the entry model is nonzero and its spell cost plus configured entry mana plus
reserved attack spell costs fits the signed retained mana pool. The sum wraps
before comparison. A ready value is the low byte of the native range divided by
512, not a boolean. `004f2f50` reserves three model costs only for the shaman's
nonzero attack group of task type 20; `004f25a0` simply reads the tribe's shaman
pointer. These functions execute unmodified in the new CPU oracle.

Payment type `004c29a0` distinguishes stock/free casts from priced casts; paused
charging does not prevent spending stock. In alternate mode, stock also requires
a nonzero alternate cap. The payment portion of `004f4de0` consumes stock before
allocation, even when allocation fails, preserving the high nibble. Priced casts
pass the descriptor cost through the native initialization stack. On successful
`004c14c0` initialization, `add_mana` queues the negative price into incoming mana
unless tribe flag bit 8 is set. It does not directly change the retained pool.

The actual `0042b660` tribe reset clears retained/pending/incoming mana, then
calls `add_mana(start_mana,0)`. All four tribes consequently start with 30,000
incoming mana in this configuration. The live world now does the same. This
corrects the previous zero-mana initialization and provides the first mission's
early enemy casting budget. With a 10,000 Blast cost and 10,000 entry reserve,
the initial pool supports the scripted first two casts before the original
campaign disables those entries.

`check-native-spell-casting.py` compares **2,048** full range/reserve/readiness
scenarios, **1,024** native payment/stock/debit scenarios and all four native
starting grants. Range/readiness use no supplied leaves. Payment supplies only
allocation failure, projectile initialization and an unavailable notification
slot; actual payment queries, stock mutation and mana addition execute natively.
The successful-initializer comparison covers mana output, not its other world
side effects. The starting-grant check executes actual computer initialization
and compares only retained, pending and incoming mana.

Live player casting and the scene's ring/cursor now share the native range
calculation. Enemy Blast eligibility uses the recovered readiness bytes and
queues the real debit. The existing two-cast campaign regression still passes.
The complete mission test now aims its northern Land Bridge at the nearer dry
shore, within the recovered low-ground range. Tests isolating charge loss/refunds
explicitly remove the starting grant instead of treating its refill as a refund.
A new live regression covers low/high ground, unaffordable enemy casts and the
next-turn debit settlement. All **35** regressions pass.

Remaining gaps: native target scoring and wrapped/coarse-cell distance checks,
AI tick scheduling/cooldowns, full spell allocation/initialization and cast-state
eligibility, AI stock timers and the attack-group/person records. The reserve
routine is verified but the live adapter currently supplies no attack group;
range/payment override flags are unset. Browser inside membership still supplies
the terrain-cell building. These checks establish the recovered arithmetic and
its bounded first-mission integration, not full spell or AI parity.

Playwright confirmed live charging and pause, then held an enemy shaman below
budget before funding a cast and observing its settled pool at 10,015 mana.
No page errors occurred. Build and lint pass (seven existing image warnings,
zero errors), and the export manifest verifies **493** raw C exports.

## 2026-09-07 — Casting lockout and AI usage recovery

`004c2d80` rejects person states 3/22, tribe `+c5e` cooldown, person flags2 bits
1/2 and flags4 bit `0x400`. Computer player type 1 additionally checks tribe
`+5bd`. Tribe flags `+93d & 0x80000` bypass every check. The browser now keeps
casting state per tribe and uses the recovered cooldown gate alongside existing
HP, lift and casting-animation guards. Native person states/flags are not yet
backed by live person records; those input fields remain an explicit adapter gap.

`00461d70` initializes computer attribute 43 (`00960815 + owner*48`) to 12 and
all 22 spell recovery interval bytes at tribe `+53f + model*4` to one. The live
first-mission script receives this default before turn-zero execution.
`004f4de0` copies the configured attribute to tribe `+5bd` after allocation even
if allocation fails. It is a byte countdown, replacing the former shared
six-second enemy melee cooldown in the browser.

`004c14c0` assigns 12 to tribe `+c5e` for player types other than 1 unless
`opened_files_flags & 16`. For player types other than 2 with AI flag `0x40000`,
it increments the spell's usage byte up to the selected normal/alternate cap.
A zero recovery timer starts at interval byte times 64; an existing timer does
not restart when casting again. `004f2100` rejects usage at or above the selected
cap only while this AI flag is enabled. Usage is distinct from one-off stock.

At the opening of `004615f0`, the general AI cast delay decrements if nonzero.
When AI flag `0x40000` is set, each nonzero 16-bit recovery timer decrements with
wrap. Expiry removes one usage count, then restarts the interval only if usage
remains. Zero timers do not reduce usage. Disabling that AI flag pauses recovery
without pausing the general byte delay. These operations precede script execution.
The browser preserves that local ordering.

`00461510` first decrements `+c5e` for all four active (`+c20 != 0`) tribes,
unless land flags bit 2 or load flags `0x200` suppress the whole function.
Special spell mode bit 32 and `level_flags_2 & 0x100000` suppress subsequent AI
processing but not the earlier general cooldown pass. Native `level_flags_2`
is at `00895da4`, distinct from the existing mana notice flags at `00895da8`.
The live first-mission adapter uses its known load/special-mode gates; land,
active/eliminated/disabled-tribe and additional level flags await the common
scheduler. Full `004615f0` and `004d0860` casting selection are not ported here.

The new oracle compares **2,048** full eligibility/usage queries, actual
initializer timer outputs and native AI timer-prefix updates; **512** complete
four-tribe cooldown passes; all four native tribe initialization outputs and
five allocator delay assignments on failure. Only initializer projectile/UI
consumers and allocation failure are supplied. The AI prefix ends at `00461655`;
its remaining world work is not replaced with invented successful results.
The general timer pass executes with zero configured computer processors so
unrelated scheduling does not obscure those outputs.

All **36** Node regressions pass. The existing live two-cast mission check now
also verifies the 12-turn configured separation, and the full mission still
completes. A new regression verifies the player's lockout after animation ends,
expiry on turn 12, usage recovery/recast behavior, paused recovery and the
native override gate. Two impact tests now wait for the real casting lockout
before requesting another spell.

Playwright verified a live funded enemy cast with a retained pool of 10,015,
an AI casting delay of eight remaining turns and zero melee delay, plus charging
and pause without page errors. Build/lint pass with seven existing image warnings
and zero errors. The executable/manifest verifier now checks **497** raw exports.

## 2026-09-07 — Wrapped spell distance and target validation

Native `0049c720` wraps byte-coordinate differences, halves each axis before
squaring, then adds. `004f2fc0` tests a wrapped square radius in byte coordinates
without even-cell rounding. `004503f0` instead measures full 16-bit position
coordinates and returns the integer square root of the sum of squared shortest
wrapped differences. The new shared helpers replace the duplicate defensive-base
metric in follower selection. Its existing oracle still passes **1,870** selection
calls and **256** combined training-controller/selector calls.

`004f3040` compares squared cell distance against `(range/512)^2 + 2`, with
signed multiply/add wrap. It rounds the caster's packed cell even, preserves the
caller's target byte parity and uses the full signed range rather than the
readiness byte. Live enemy casts now use that predicate. Player casting and the
cursor use full-resolution toroidal distance; the visible radius still comes
from the recovered height-dependent range. A new live regression covers an AI
target cell accepted beyond the former truncated-radius boundary and a player
range query crossing the 256-unit world seam. The cropped playable terrain is
unchanged; this is a distance correction, not a full world-wrap integration.

`validateSpellTarget` reconstructs complete `004c24f0`: cursor blocking, alternate
spell mode with no shaman requirement, two-endpoint alternate Land Bridge range,
normal shaman eligibility and override behavior, range, normal bridge occupancy
and target-terrain restrictions, and both tutorial notifications. It preserves
results 1, -1, -2 and -3 and callback ordering. Missing/dead shamans are accepted
under the original override; that override still cannot bridge onto prohibited
terrain. The full validator is CPU-compared but not yet the live UI's full gate:
native cursor state, alternate origin/bridge anchor, person records and terrain
classification still require integration. The live distance portion is integrated.

Instruction review corrected the terrain layout used by the fixture: `c_3` is
at cell offset `+c`, and the category's flags are at `005aa328 + category*14`.
The raw pseudocode's array typing obscures this 14-byte descriptor stride. Ground
category zero has flag 1; water category one has flag 2. The oracle now writes
actual categories and executes the native flag lookup rather than replacing it.

`filterSpellEntries` reconstructs `004d1340`. Inside the native defense area,
nonzero mode entries remain eligible only if their people threshold fits the
sum of three unsigned 16-bit enemy specialist counts. Outside that area, only mode zero
entries survive, comparing against the unsigned enemy total. The threshold is
inclusive. These inputs must come from `004f4030` and the native defense-area
predicate; the live nearest-target heuristic does not yet supply them.

The expanded oracle adds **2,048** native position/cell/proximity/range cases,
**2,048** complete player validations and **2,048** entry filters. Player results
cover **1,230** unavailable, **216** range failures, **94** invalid bridge targets
and **508** accepted targets. Only UI blocking/anchor retrieval/notification and
the defense-area predicate are supplied leaves; range, eligibility, stock caps,
distance and terrain reads remain native. All prior range/payment comparisons
continue to pass. All **37** Node regressions pass, including the full mission.

Further recovered scan evidence: `004d0860` refreshes entry readiness, derives
its scan limit from the largest range and scans 80 cells per call with
`0049c890`. It keeps four packed target slots, groups candidates within square
radius three, and invokes target dispatch on turns divisible by 16 when the
shaman can cast. The original writes a new candidate into every currently empty
slot, not only the first slot. Emergency Blast/Lightning/preacher responses and
world-list order are separate branches. These behaviors remain to be ported;
this turn does not claim complete target scoring, scan cadence or AI parity.

Playwright also verified that the live enemy accepts the coarse-cell boundary
case, waits below budget, spends mana and maintains separate casting/melee delays.
No page errors occurred. Build/lint pass with seven existing image warnings and
zero errors; the executable/manifest verifier checks **503** raw C exports.

## 2026-09-07 — Computer spell cell scoring, area summaries and target queues

`spiralCell` reconstructs `0049c890`: square rings begin northwest relative to
the native coordinate axes, exclude the center, advance in original order and
support four rotations with byte-coordinate wrapping. A closed-form side count
replaces the native per-step loop. Ring boundaries, indices through 65,535,
rotations and coordinate seams are CPU-compared.

`chooseSpellTarget` reconstructs all cases of `004f4680`. Blast and Swarm score
the center and 48 surrounding cells, keeping the first strictly best positive
score. A valid enemy person adds one; allied, protected, invalid-state/model or
disguised people subtract one. Wild-owned people contribute nothing. Dead/inside
flags are not independently filtered by this routine; it trusts the native
cell list. `004de7b0` recognizes spy model 5 with an apparent tribe in the upper
two disguise bits, or the real tribe while the lower six bits are nonzero.

Lightning-family cases preserve the direct-shaman shortcut, require a net
person score greater than five or a completed enemy building, and search 224
neighboring cells. The original returns the input center for a qualifying
neighbor person group, but a building's own even cell for a qualifying building.
Terrain-restricted cases search 24 cells for a location without `0x200` occupancy.
Unconditionally accepted and unsupported spell cases retain the original target
and result. No invented distance recheck is added after choosing another cell.

`summarizeSpellEnemies` reconstructs `004f4030` over the original square traversal.
It excludes allies and flags4 `0x1000`, then groups enemy braves/spies,
warriors/shamans, firewarriors and preachers. Counts wrap at 16 bits; weighted
threat wraps at 32 bits using imported person descriptor byte `+35`. It also
reconstructs the 133% force requirements and optional preacher assessment,
including signed own-population words, pending training, the brave reserve,
request arithmetic and unchanged threat weight when assessment suppresses total.

**Terminology correction:** following this producer proves that the three counts
used by the defense entry filter are enemy combat specialists. The previous
entry incorrectly called them friendly counts. Offense uses total enemies;
defense excludes braves and spies from its threshold. The earlier documentation,
parameter naming and regression label are corrected. The verified filter
arithmetic itself is unchanged.

`scanSpellTargets` reconstructs the general scan portion of `004d0860`.
`004d1420` reset preserves the previous limit. With readiness, the limit is
`4*r*(r+1)-1` truncated to 16 bits; a cursor above it resets only at the next
call. A nonpaused scan always examines 80 cells, even when crossing that limit.
Only the first eligible person in each cell contributes a candidate. Candidate
zero becomes sentinel one; a new candidate fills every empty target slot unless
an existing slot is within wrapped square radius three. Preacher reaction stays
at its original traversal position as an explicit world consumer.

`dispatchSpellTargets` reconstructs complete `004d11b0` using the recovered
area summary, territory-bit test (`cell+f`, owner bit 4..7), entry filters, usage
limit, cell range and target scoring. It discards empty-area slots until the
first area with nonzero weighted threat. That area ends the dispatch even if
no entry casts. Later target slots remain queued. Spell model 11 additionally
requires ground-category flag 1. Allocation is selected at most once and the
processed slot clears even if allocation subsequently fails.

`check-native-spell-targets.py` compares **4,096** ring cases, **1,024** full
scorers, **1,024** full area summaries and **1,024** composed general scans and
dispatches. Scoring executes without supplied leaves. Area assessment supplies
only queued-preacher count and the training request consumer. Native general
scans disable the initial emergency paths, keep the shaman in state 22 and have
no preaching assignment, so the comparison does not claim emergency casting.
Dispatch runs real summary/territory/filter/range/scoring routines, supplying
only final spell allocation. Coverage includes **659** accepted scorer results,
**130** changed target cells, **12** training requests, **657** weighted summaries,
**222** composed casts and **382** dispatches retaining target queues.

Live enemy Blast now uses native cell scoring to choose its allocation target.
A regression verifies retargeting away from friendly people in the initial cell.
The scan/dispatch primitives are ready for the common native world, but the live
search seed, territory classification, native cell-list order, person flags and
emergency responses remain unintegrated. The browser adapter supplies alive,
visible opening-class units and refuses terrain-dependent scoring until native
occupancy flags exist; Blast does not read those flags. All **38** regressions,
including the complete mission, pass. A queue regression covers the zero-cell
sentinel, filling all empty slots, scanning beyond the limit, pause/reset and
retaining later targets after an unusable first weighted area.

Additional native scan cases exercise readiness 255 through the original override
flag, checking the truncated scan limit and reset before scanning. A non-dispatch
turn prevents allocation while that flag bypasses the state-22 eligibility guard.
Playwright verified actual live retargeting to `{x:7,z:-1}` away from the friendly
concentration, plus mana payment, independent cooldowns and pause without page
errors. Build/lint pass with seven existing image warnings and zero errors.
The executable/manifest verifier checks **508** raw C exports.

## Building territory producer and refresh — 2026-09-08

Reconstructed complete `004f6cc0` and `004f6c20` in `app/territory.ts`.
`scripts/inspect-executable.py` imports width tables at `005d56b4`, `005d56bc`,
`005d56c8`, `005d56d8` and category flags at `005aa328` (14-byte stride).
The marker uses native 16-bit building positions and wraps over the full
128×128 cell map. Only category descriptor flag 1 admits a write; category
upper bits, other tribes and lower region bits survive. Radii 5/7/9 select
their tables; every other value selects 11. The two halves are slightly
asymmetric: the positive half repeats the widest row and ends at entry one,
whereas the negative half starts at entry zero.

`00403860` clears territory during building removal, using the computer tribe's
configured defense radius or 11 for other player types. This is a bit clear,
not a reference count: overlapping surviving buildings temporarily lose their
claim too. `004f6c20` ORs claims back when `(turn + tribe*8 + 17) & 127 == 0`.
It visits the full building list without model/state filtering. It also advances
the shared search tag at `005d56b0`, skipping 255 and clearing the 16,384-byte
buffer at `00a64e88` on wrap to zero before setting tag 1. Disassembly confirms
that this address is the buffer itself, despite Ghidra's misleading pointer
type. Search-buffer clearing does not clear territory.

`00502090` is a separate tower-coverage updater: its writes to the lower `ph_2`
bits must not be confused with the upper building-territory bits used by spell
dispatch. That routine and `00403860` remain raw lifecycle evidence, not complete
browser ports. `00461f90` was also exported while tracing the scheduler and
remains unreviewed task-maintenance evidence.

`check-native-territory.py` executes both complete native territory routines
without supplied leaves, comparing **2,048** sequential operations over complete
maps and search buffers. It checks that every unrelated terrain byte remains
unchanged. All **39** Node regressions pass, including asymmetric map edges,
non-ground preservation, overlapping removal, delayed recovery and tag wrap.
Live terrain categories, building lifecycle calls, tower coverage and full spell
scan integration remain pending; this change does not claim new live AI behavior.
Build and lint pass (seven existing image warnings, zero errors); the executable
and manifest verifier checks **513** raw C exports.

## Terrain queue, category passes and opening initialization — 2026-09-08

`app/native-terrain.ts` reconstructs `0044ddf0` and the simulation portion of
`0044df40`. A terrain record's signed height is at +4, cliff/slope byte at +a,
category at +c and shadow byte at +e. `scripts/inspect-executable.py` now imports
the 16-entry category table at `005aa318` and terrain constant at `005aa450`.
The diagonal helper moved unchanged to the existing native-math module so
sampling and rebuilding share it without a model import cycle.

The first pass visits the nine heights in native order, preserving the strict
minimum-index tie rule and initial extrema 0/1025. It updates diagonal, slope,
shadow direction and water flags; flag `04000000` protects the slope byte.
The second pass uses four corner slopes to select the category while preserving
its upper bits. The third repairs zero-height points surrounded by ground unless
land flag 128 suppresses it, then runs requested surface texture callbacks.
Globe texture callbacks follow in a separate pass. Cleanup clears the queue,
dirty bitmap and land flag 128, including when the queue is empty.

Queueing keeps the first texture-update flag for duplicate cells, wraps cell
coordinates, and flushes exactly at 1,024 entries. Radius 64 traverses 129×129
positions and repeats once after flushing, matching `0044e850` initialization.
On the imported first-mission height field this performs **33,282** enqueue
attempts with **226** duplicates. Native terrain repair changes points `(4,121)`
and `(6,121)` from zero to one. `makeTerrain` now samples the rebuilt height
field, so the two browser positions `(0,6)` and `(4,6)` use `1/45` rather than
the artificial seabed value.

`check-native-terrain.py` compares **260** queue/process checkpoints over 66
sequences, including a complete ocean and the imported first mission. It executes
the full native routines with only `004be230` surface textures and `004bdff0`
globe textures supplied, comparing their call ordering along with every terrain
record, pending coordinates/update flags, dirty bitmap, counters and recursion
state. Randomized sequences cover seams, signed height extremes, protected slope
bytes, land flags, duplicate requests and automatic flush boundaries.

All **40** Node regressions pass. Playwright confirmed both repaired heights in
the live game and advancing turns without page errors. Build/lint pass with seven
existing image warnings and zero errors. Native texture/palette consumers,
deformation integration, full map storage in the live world, and the territory
lifecycle/spell-scan connections remain unfinished. `004015f0` (dynamic lighting)
and `0042c130` (category clear) were exported while locating the producer; they
remain raw, unported evidence.
The existing math oracle also passes 680 terrain and 508 projectile comparisons;
the executable/manifest verifier checks **515** raw C exports.

## Live territory, general spell dispatch and shoreline Blast — 2026-09-08

Exported `004c6a20`, `004f4d40`, `004f45c0`, `004c6760` and `004c6680` while
tracing `004615f0`'s order. `castShoreBlast` reconstructs the complete first
routine using its real affordability rule and the existing person scorer,
now confirmed to match `004f45c0`. `004c6760` redistributes building occupants;
`004c6680` creates a response task. These two exports remain unported evidence.

Shoreline Blast checks `(tribe + turn + 7) & 31 == 0`, then strictly requires
mana above Blast cost plus attack-group spell reserves, adding 50,000 when
`tribe+91d` (person count) is below ten. It scans ring indices 24 through 78.
Ground beside a shore category, or shore beside water, chooses the first matching
neighbor in south/north/east/west order and aims on the opposite side of the
enemy cell. The cell must have a positive native person score. Eligibility and
usage gates are rechecked on each candidate; casting does not itself exit the
loop. Normally allocation's AI delay prevents another cast, while override can
permit more. No entry readiness, population threshold or final range gate is
added to this independent native path.

`check-native-spell-targets.py` adds **1,024** full shoreline calls to its existing
**8,192** ring/scorer/summary/scan/dispatch comparisons. The native shoreline
function and every query run unmodified; only final allocation is supplied,
recording the spell/cell and applying its known 12-turn AI delay. Explicit cases
exercise all directions, tie priority, both ground/shore and shore/water rules,
and multiple allocations under override; randomized cases include group reserves,
strict mana boundaries, population, alliances, disguise and protected people.

The live world now owns a full native terrain state, region/search bytes and
four-slot spell scan. On browser terrain-version changes, its even grid vertices
feed native height changes through `queueTerrain`/`processTerrain`; intermediate
browser vertices are not treated as native map points. This remains an adapter
for approximate construction/deformation producers, not a claim of full native
terrain physics. Terrain occupancy flags and texture consumers remain pending.

The AI phase now executes shoreline Blast, scheduled territory refresh, then
general scan/dispatch if the shoreline path did not cast. This replaces the
nearest-opponent casting branch. General casting honors the original mission's
six-person entry threshold and 16-turn dispatch cadence. Defense entries count
enemy specialists rather than braves; offense counts all enemy people. Scanning
continues while the existing browser action guards prevent allocation. Building
removal clears its native footprint; an overlapping surviving claim returns on
the next tribe refresh. Native defense radius defaults to eleven before script
commands apply the first mission's seven.

AI allocation now precedes the turn's mana distribution. A control-world
regression verifies the exact debit despite that turn's follower generation.
The prior one-opponent fixtures were corrected: focused range/payment/scoring
tests explicitly lower their entry threshold, while the campaign regression
retains the real six-person requirement and verifies two allocations on successive
16-turn phases followed by the original script disabling the entries.

All **41** regressions, including the full mission, pass. A new integration
sequence checks five versus six braves, defense specialist counts, native building
territory, overlap clearing and scheduled recovery. Playwright confirms live
five-person rejection and six-person allocation to `{x:7,z:-1}` without page
errors. Build/lint pass with seven existing image warnings and zero errors.
Early emergency responses in `004d0860`, live person flags/cell-list ordering,
attack-group reserve input, the two housekeeping routines and complete global
turn ordering remain unfinished. The browser still uses its existing turn-number
convention; the original outer loop runs tribe processing before incrementing
the simulation turn inside `004ec6f0`.
The shoreline cases record **19** allocations, including one override call with
multiple allocations. The executable/manifest verifier checks **519** raw C exports.

## Complete emergency/general spell controller — 2026-09-08

`processComputerSpells` in `app/computer-spells.ts` now composes complete
`004d0860`, including the early paths and the preacher callback previously left
unimplemented. It reuses native cell scoring, spell payment classification,
eligibility, range/readiness, inside-building geometry, scan and dispatch.

Attribute 32 supplies a byte frequency. Timing uses the original bit masks on
`frequency*4-1`, including non-power-of-two values. With more than Blast cost
plus 50,000 mana, states 25/29 can cast at the shaman's own cell. Otherwise flags
`0x3000` permit the scored Blast response; `0x1000` clears before scoring and
stays cleared when scoring, range or usage prevents allocation. These early
responses return before recalculating entry readiness or changing scan state.

Flag `0x4000` targets the configured enemy shaman on its staggered phase,
checking alliance and the exact `flags2 & 0x82007` / `flags4 & 0x400` exclusions.
Flag `0x8000` checks that tribe's building list on a different phase: completed
model-four buildings with occupants qualify only when the first occupant is
model four or six. That path does not add an alliance check. It targets the
original inside point from `00404420`, preserving list order and returning on
the first in-range tower. Both Lightning paths accept payment type three without
requiring 80,000 mana; otherwise the cost comparison is sufficient even when
payment classification is zero, matching the executable's actual branches.

During the general scan, a preaching model-four person (`assignment & 64`)
tries spell models **2, 5, 3**, in that order. Each requires nonzero payment
classification, sufficient mana, permitted usage and native range. Here a stored
charge does not bypass the mana requirement. Allocation stops that person's
fallback sequence but does not stop scanning; later eligibility queries observe
the allocator's changes. A normal dispatch still follows only on its phase and
when eligible. Missing shamans reset the scan while retaining its prior limit.

`check-native-emergency-spells.py` compares **1,040** full `004d0860` calls,
loading the original shape banks and executing every query, geometry and nested
scan/dispatch routine unmodified. Only final allocation is supplied, recording
the request and applying its known 12-turn AI delay. Coverage records **17**
Blast, **4** Lightning and **1** model-five allocations, **23** consumed request
bits, **16** early casts preserving readiness and **4** preacher-response cases.
Deterministic cases cover each response and stock/mana boundary; randomized
cases vary cast states, flags, masks, alliances, stock/payment modes, usage,
target flags, tower occupancy/geometry and pending scan work.

The live AI now calls the complete controller. A shared browser-person adapter
feeds cell records and the enemy shaman; the stored enemy-tribe field defaults
to zero like native AI initialization. Tower targeting shares the same shape
pose as building entrance routing. Existing browser action guards use the native
cast-block flag until the actual person states/flags are integrated. Native
states 25/29, preaching followers and specialist tower occupants remain dependent
on those unfinished person/class integrations; the full native routine being
ported does not make those live classes complete. Model-five effects, attack-group
reserve input, terrain occupancy and global scheduling also remain unfinished.

All **42** regressions pass. A focused check distinguishes preacher stock/mana
rules from the shaman response and verifies model-five fallback priority. A live
case spends a stored Lightning with zero mana and preserves pending scan work.
Playwright confirms that allocation, stock consumption and target `{x:7,z:-1}`
without page errors. Build/lint pass with seven existing image warnings and zero
errors. `004f52c0` was exported while checking defaults; it only clears AI flag
`0x10` and remains raw initialization evidence.
The executable/manifest verifier checks **520** raw C exports.

## Tribe processor and outer-loop phase correction — 2026-09-08

`app/tribe-turns.ts` reconstructs complete `00461510`. Land flag `2` or load
flag `0x200` suppress the whole processor. Otherwise, its four-tribe pass first
decrements nonzero cast cooldowns for active tribes, including tribes beyond
the configured processing count. Game flag `32` or the separate level-flags-2
bit `0x100000` then suppresses tribe work without suppressing that timer pass.
Configured tribes run in index order. Actual `00419480` permits an active tribe
only when its signed field at `+0x949` is less than 97; the caller also excludes
tribe flags at `+0x941 & 64`. Player type one invokes the computer processor;
other types invoke territory refresh. Eligibility is read during iteration,
so earlier consumers can change a later tribe's eligibility.

The original `004a5590` calls this processor before `004ec6f0` increments the
unsigned simulation turn. Its independent land bit `0x800000` skips tribe work,
including the timer pass, while still running object turns. Land bit `2`
prevents the inner increment. `004a5d40`, exported while tracing that boundary,
updates a separate environmental timer; it is raw evidence, not a live port.

The browser previously incremented first and ran projectiles/rewards before
scripts. It now runs human territory refresh, computer cooldown recovery,
the bound campaign script and shoreline/general/emergency casting before the
object increment. The shared processor supplies all recovered tribe gates.
Opening initialization supplies two active tribes and zero defeat timers;
`00418e30`'s defeat lifecycle is not yet wired in. Native terrain state supplies
the existing land flags; level-flags-2 stays distinct from mana notification flags.

Consequences are verified in live regressions: the opening script observes turn
71 and its result is visible after object turn 72. Marker and spell fixtures
now distinguish the script's input turn from the completed object's turn.
An AI Lightning allocated at turn three gets its first projectile tick during
object turn four; its stored charge is spent before that turn's mana generation.
A reward delivered during an object turn becomes visible to the next eligible
script phase. The real first-mission six-person threshold and two-Blast shutoff
still pass, as do full-mission gameplay and render-rate independence.

`check-native-tribe-turns.py` compares **2,048** complete `00461510` calls with
the original eligibility query unmodified. Only the computer/territory consumers
are supplied; every callback observes all four cooldowns, and selected consumers
disable a later tribe. Coverage includes **97** computer calls, **199** territory
calls, **16** callback mutations and **1,838** passes without tribe callbacks.
An additional **512** actual offline outer-loop traces use a supplied clock,
ready command buffer and command/replay consumers. The native inner gate and
increment run, then remaining object work is skipped via its actual epilogue.
These traces cover zero through three subturns, pause/skip bits and 32-bit wrap;
they do not verify the skipped object consumers or multiplayer timing.

All **43** regressions and the executable/manifest check pass (**522** raw C
exports). Playwright checks the actual React/Three.js game: suppressing tribe
work leaves the object turn and human cooldown advancing; re-enabling it starts
the original tour/message before object turn 72. No page errors occurred.
Build/lint pass with seven existing image warnings and zero errors.
Remaining global scheduling gaps include computer task/housekeeping
integration, per-object class ordering, native defeat/win lifecycle, queued input,
network timing and complete RNG consumption.

## Defeat/victory decisions and live outcome phase — 2026-09-08

`processOutcome` in `app/tribe-turns.ts` ports complete `00418e30`, with explicit
consumers for person release/initialization/damage, camera, defeat effects,
input cancellation, reveal, campaign completion and network results. Original
`004ec6f0` invokes it after incrementing the object turn, before object processing,
unless load flag `0x200` or game flag `32` suppresses it. Its own phase is
`turn & 15 == 0`, with an unsigned `turn > 16` check: the first is turn **32**.

On each eligible call, nonzero signed defeat timers at tribe `+0x949` advance
by 16 only for active tribes and only while less than 96. A normal defeat starts
at one and reaches 97 six phases later, crossing the existing tribe-processing
eligibility boundary. The loop covers all four tribes regardless of configured
AI or campaign counts. Negative timer inputs retain the original signed behavior.

Campaign mode first rejects further player outcome processing once the player's
defeat timer is nonzero. Zero player population loses; flag `0x20000` also forces
loss and submits each player-list person's full signed-short HP as damage after
clearing `flags3 & 0x88000`. This takes priority over the forced-win bit.
Otherwise, opponent indices **1 through campaign-count minus one** are checked,
without a separate active-tribe test. A new zero-population opponent gets timer
one, triggers defeat cleanup and increments the player's signed defeat statistic.
The campaign-count byte is **`0096eac0`**, distinct from the AI processing count
at **`0096eabf`**; both are two for the opening browser mission.

All opponents defeated, or player flag `0x40000`, permits victory. The routine
requests celebration unless the world already has its win bit, replaces the
world result bits (`0x6000000`) with win (`0x2000000`), cancels input, optionally
requests the most recently defeated tribe's camera and sets campaign progress
byte `009608b2 & 1`. It calls `004860c0` with signed-short level number minus one.
Loss replaces the same result bits with `0x4000000`, cancels input and requests
the player's camera and defeat cleanup. Simultaneous campaign extinction loses.

Multiplayer (`landFlags & 8`) instead scans four active, undefeated tribes.
Empty tribes are defeated once. A sole survivor wins; two or more survivors win
only if **every pair is allied in both directions**. Winner tribe flags at
`+0x941` get bit one, preventing repeated celebration. The local world win bit
is set only if no local result already exists; a defeated local player does not
become a winner when surviving opponents ally. The network result consumer always
receives the surviving count and whether a mutual-alliance victory occurred.
The primitive covers this branch; the browser still has no multiplayer transport.

Celebration preserves each eligible person's previous state, calls its release
consumer, writes state **41**, then initializes it. Model eight and people with
`flags2 & 0x100000` are excluded; no extra HP or inside-building filter is added.
`0041b8b0` updates the last-defeated byte at `0089d165` before its other work;
the port retains that prefix so subsequent campaign camera selection matches.
New raw exports `0041b610`, `0041b8b0`, `004af1c0`, `004164b0`, `00450610`
document the boundary consumers. Their camera/sky/cleanup/reveal/network internals
remain outside this port.

`check-native-outcomes.py` executes **2,071** complete original calls across
2,064 fixtures, including an eight-call timer sequence. It compares result and
progress flags, last defeat, signed statistics, all tribe timers/winner flags,
person state/previous state/damage flags and ordered consumer requests, including
the world result bits visible during each callback. The consumers are supplied;
damage and state callbacks do not claim native combat/animation execution.
Coverage records **147** camera, **270** defeat, **202** input-cancel, **30** reveal,
**40** campaign-complete, **502** network-result, **205** person release/init pairs
and **186** damage requests. Tests cover boundary turns, existing results,
forced flag priority, inactive campaign opponents, one-way alliances, no/one/many
survivors, spectator multiplayer, exclusion flags and signed counter wrap.

The live world now uses this phase and result flags instead of immediately ending
when a team's last browser follower disappears. Defeat timers feed the shared
tribe scheduler; camera and campaign-completion requests are retained in world
state. The native population/list producer is still adapted from living browser
followers, and its order/ghost/registration semantics are not fully integrated.
Native defeat cleanup/building collapse, celebration animation, camera playback,
persistent campaign progress and result-screen timing remain unfinished. The
existing browser end screen still freezes subsequent turns, so post-result timer
and object processing are verified only by the primitive, not playable afterward.

All **44** regressions pass, including the complete first-mission discovery,
construction, training and combat scenario. New live cases verify earliest turn
32, forced loss/win priority, empty-building victory, campaign/AI count separation,
one-time defeat statistics, timer progression and caller load/special-mode gates.
The executable/manifest check verifies **527** raw C exports.
Playwright confirms no early result at turn 31, victory at turn 32, cleared
completion state on restart and defeat at turn 48 through the real result UI.
No page errors occurred. Build/lint pass with seven existing image warnings
and zero errors.


## Defeated buildings and damage stages

`app/building-damage.ts` reconstructs `0041b8b0` defeat cleanup, `004ba2c0`
plan work/damage, and `004092a0` building damage processing, with their world
consumers supplied. The collapse accumulation block of `00403280` uses native
RNG and signed-short damage. The importer now extracts building life, damage
thresholds, repair delay and smoke duration from the identified executable.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-building-damage.py /path/to/d3dpoptb.exe
```

The oracle compares **3,584** native calls/prefixes: 1,024 complete defeat
cleanups, 1,024 plan work changes, 1,024 damage calls using the real plan-change
and repair-delay/attacker routines, and 512 building-processor prefixes through
collapse accumulation. It checks signed storage, RNG, stages, missing plans,
overlays, ghost/internal removal, occupant ejection, allocation failures,
computer responder selection and ordered world-consumer requests. The prefix
check stops explicitly at the damage controller; it does not claim the rest of
the building processor. Geometry, allocation, graphics and AI response consumers
are supplied, and their bodies/RNG consumption remain outside these comparisons.

Live defeat now seeds each surviving building's collapse flag and damage from
its model and browser object ID. Subsequent building turns use native damage
thresholds and plan stages, eject occupants on the first major stage change,
request the existing smoke/sound effects and remove exhausted buildings.
Browser IDs/order, the initial full-life plan, legacy combat HP conversion,
smoke rendering and occupant placement remain adapters. Exact plan creation,
ordinary combat/fire/repair producers, AI repair assignment, stage mesh filtering,
face debris and sky effects remain unported. The result screen still freezes
subsequent turns: this change initializes collapse on defeat but does not yet
provide the full visible post-victory destruction sequence.

Six raw exports (`00407860`, `0040b230`, `00498140`, `004ba2c0`, `004ba590`,
`004ba5b0`) document damage boundaries; the manifest now verifies **533** files.

All **45** regressions pass. The new live regression checks defeat-only seeding,
the sky counter, occupant ejection before demolition, native remaining work and
repair delay, smoke/sound requests and final removal. It isolates object turns
with outcome processing disabled to avoid claiming post-result integration.
Playwright also checks defeat seeding, live stage 4→2 work reduction, smoke
requests and removal in the rendered game, followed by the existing victory,
restart and defeat UI checks. No page errors occurred. Typecheck/build pass;
lint has seven existing image warnings and zero errors. The stage check observes
simulation state; mesh filtering and exact smoke visuals are not validated parity.


## Original construction and damaged-building meshes

`app/model-faces.ts` ports the face visibility and alternate texture selection
from `00471c40`. Each bank-2 face's byte at **+0x3b** supplies four visibility
bits and four matching exposed-surface bits. Byte +7 is the texture size field,
not the stage mask. `import-original.py` retains each original face's vertex
count and mask alongside its existing expanded positions and UVs.

For stages 0–3, visible faces either keep their original atlas coordinates or use
tile **250**, texture-size mode 7 and the fixed coordinates initialized by
`0040cde0`: `(0,0), (2097150,0), (2097150,2097150), (0,2097150)` at the imported
32-pixel texture size. Completed stage 4 retains the complete model and existing
normal rendering path. `004030c0` switches buildings being built/repaired to
object kind 10, whose render dispatch uses the staged renderer; completed state
2 restores its normal object kind through `004049d0`.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-building-faces.py /path/to/d3dpoptb.exe
```

The oracle runs **2,096** complete `00471c40` calls and compares **5,479** emitted
triangles against the browser meshes: all twelve currently displayed building
models at four incomplete stages, and triangle/quad fixtures covering every
byte mask. It uses the original bank files with recorded hashes and the actual
`0040cde0` UV initializer. Normals and an in-bounds projection are supplied;
comparison preserves vertex/UV pairing but normalizes triangle order and winding.
This proves face selection and atlas coordinates for the tested assets, not the
original clipping, shading, depth sorting, rasterizer or whole render dispatch.

The live renderer now replaces the generic construction scaffold and the old
35% whole-building visibility threshold with these original face groups. It
uses recovered remaining-work stages for construction and the native collapse
stage for damage, caching separate geometry for every model/stage. Complete
models and shared source data remain intact. Browser construction progress still
adapts remaining work; timber/construction/repair timing is not native parity.
Flying debris, fire and full post-result simulation remain unfinished.

All **46** regressions pass. The existing **3,584** damage comparisons still pass
after sharing the native work-to-stage calculation with the live renderer.
Playwright checks the actual GPU geometry buffers and UVs at all five construction
stages, then damages a completed building and checks the stage change. No page
errors occurred. Captures hide the pause overlay only in the QA page so the mesh
can be inspected. The export manifest now verifies **538** files, including the
staged and complete renderers, UV initializer and investigated boundary routines.
Build and typecheck pass; lint reports seven existing image warnings and zero errors.


## Simulation continues after a result

The offline `004a5590` loop and `004ec6f0` inner gate do not stop when land flags
`0x2000000` (victory) or `0x4000000` (loss) are set. The native pause bit still
blocks the inner increment. The previous browser `status !== 'playing'` checks
in `tick()` froze buildings, effects, defeat timers and fractional-turn carry
as soon as a result appeared. Those checks are removed; command, casting and
building-placement entry points retain their result guards.

`check-native-tribe-turns.py` now includes all four combinations of result bits
in its **512** actual offline outer-loop traces, across native pause/outer-skip
flags, 0–3 subturns and unsigned-turn boundaries. It runs the original inner gate
and increment, skipping the remaining object body through its original epilogue.
These traces verify continued scheduling, not full native object integration.
The script's **2,048** complete tribe-processor comparisons also pass.

All **47** regressions pass. A new live victory/loss regression checks pending
fractional turns, rejected gameplay commands, manual pause, continued defeat
timers to 97, one-time defeat statistics and full removal of the defeated
settlement through the recovered collapse adapter. Playwright confirms that
both real result screens remain usable while world turns advance and buildings
disappear; restart resets the result state. No page errors occurred. This retires
the result freeze described in the preceding entries, but does not establish
complete post-result person behavior or presentation parity.

Further end-sequence evidence is retained as raw exports:

- `0041b6d0` drives the camera transition/return state machine, input lock/unlock,
  and sky-counter decrement/sound requests. It does not pause world simulation.
- `00417d80` plans native toroidal camera translation and rotation using integer
  acceleration/braking profiles. Its camera motion implementation remains to port.
- `004e4f40`, called after outcome decisions, polls campaign reward availability;
  it is not a result-screen timer.

The browser's opaque result overlay, native end-camera movement, celebration
person states, sky/debris effects and persistent progression remain unfinished.
The manifest now verifies **541** raw exports.
Typecheck/build pass; lint has seven existing image warnings and zero errors.


## Native result-camera movement

`app/camera-motion.ts` reconstructs `00417d80` (planning), `00418270`
(movement), `0041b610` (result initiation) and `0041b6d0` (controller).
The ramps come from the executable's `0059bbd0` / `0059bbd8` tables through
`inspect-executable.py`. The port retains signed-short arithmetic, native
wrapped distance and angle helpers, four acceleration frames, eleven braking
rows, synchronized translation/rotation, replanning and draw-mode-2 snapping.
It preserves the planner's retained overshoot sums rather than smoothing them.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-camera-motion.py /path/to/d3dpoptb.exe
```

The oracle compares **256 journeys**, **291 plans** and **7,921 complete
movement calls**, including seam crossings, tiny distances, half-world routes,
rotation boundaries, interrupted routes, instant completion and inactive calls.
The original distance, angle and sine movement routines execute unchanged;
only the globe-update consumer is supplied. All motion fields, schedules,
positions, angles, render flags, water invalidation and callback ordering match.
A second batch compares **256 result initiations** and **12,288 composed
controller/movement frames**, with the actual planner and movement bodies.
It covers overlapping requests, game/replay gates, return phases, input
lock/unlock, interaction-clear requests and sky-counter sound timing. Input,
interaction and sound consumers are supplied at their native call boundaries.

The controller runs before movement in `draw_main`. Phase 0 finishes into
phase 3; it does **not** automatically introduce a dwell or return. Phases 1/2
handle an externally requested return. Sky-counter decrements do not depend on
a simulation turn; cue `0xa2` fires at 16-step boundaries, including zero.

The live scene now consumes outcome-camera requests, moves to the defeated
tribe's opening origin, preserves bearing and locks input during playback.
It cancels an active introduction and clears the interaction mode. The existing
result overlay waits until playback finishes, while simulation and settlement
collapse continue. Defeat-sky sounds use the existing non-positional audio path.
Playwright verified both victory and loss: intermediate movement, exact target,
input release, two sky sounds, delayed result UI, continued turns and clean
restart, with no page errors. All **48** regressions and typechecking pass.

Integration boundaries remain explicit: this uses the existing **24 Hz** browser
presentation clock, first-mission origin adapter and no replay-file mode. The
full native frame throttle, shared camera/flyby ordering, renderer invalidation
store, sky visuals, celebration person states, debris and campaign progression
are unfinished. The result overlay is still a browser substitute. This extends
the previous result-camera investigation; it does not establish full end-sequence
or camera parity. The manifest verifies **544** raw exports, adding movement,
generic camera-request and interaction-cleanup routines.


## Defeat-sky flash

The defeat branch of `00524a30` now feeds `app/sky.ts` and the live renderer.
The nonzero byte counter selects alpha **48, 72, 96, 72** by `counter & 3`.
Color comes from the first entry of each five-byte tribe ramp at `005a89c8`,
using the inline system palette at `00d05528`. With the supplied mission palette,
indices **219, 244, 237, 227** yield RGB **(43,59,155), (163,19,0),
(191,147,39), (35,139,79)**. `import-messages.py` retains executable/palette
hashes and imports these into `app/original-sky.json`.

`00517830` emits one untextured alpha quad. Bounds use viewport x/y/width and
integer `surface_mem_offset / screen_width`; the caller clears render flag bits
`0x18`. `00522570` queues sky before landscape. `0047c7e0` assigns progressively
nearer depths to later commands, and `004f9470` applies each command's depth to
its vertices. The flash therefore stays behind land. `005221e0` establishes
source-alpha / inverse-source-alpha blending. The browser uses a depth-tested
far-plane quad before other transparent objects, with direct palette RGB in the
framebuffer. It does not tint the HUD or foreground geometry.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-sky.py /path/to/d3dpoptb.exe
```

The oracle runs **1,024** native calls, covering all 256 byte counter values and
four tribes with varied signed viewport origins, widths and integer height
remainders. Mode 3 skips the unrelated base-sky/lens branch. There are **no
stubbed callees**: the real `00517830` and `0047d980` allocate the render command.
All four corner coordinates, packed ARGB, command flags, allocation count/size,
zero texture handle, retained vertex fields and caller flag clearing match.
This is command-generation evidence; no Direct3D device is emulated.

Playwright read back real WebGL pixels for every tribe and all four opacity
phases. Sky pixels match source-alpha blending within one byte; a foreground
land pixel stays unchanged, and counter zero restores the original sky. Both
victory/loss camera-and-sound scenarios still pass and restart cleanly, with no
page errors. The standalone oracle is the runnable regression for this branch;
the existing **48** gameplay regressions and typechecking also pass.

Remaining boundaries: live system-palette animation/remapping, other landscape
palettes, native base-sky/lens geometry and hardware fallback paths are unported.
The existing 24 Hz presentation adapter controls the counter. WebGL depth ordering
preserves this effect's layer relationship but is not the complete native polygon
queue or rasterizer. The general sky and result UI remain unfinished. The manifest
now retains **555** raw exports, including the traced draw, quad, queue, depth and
blend routines.


## Victory follower controller reconstruction

`app/celebration.ts` reconstructs the complete `004e0af0` state-41 controller
and its `004e2610` chain-action helper. The nine substates cover entry/cargo
release, individual movement and worship, firewarrior gestures/projectile requests,
circle leaders/followers, chain leaders/followers, vehicle waiting and the shaman's
idle-and-turn behavior. `inspect-executable.py` now imports the three neighbor
weight records at `005d4858` and four six-byte chain-action records at `005d4868`.
The port uses the existing native RNG, angle, spiral-cell and person-speed helpers.
It preserves signed byte/short counters, linked-list ordering, shared animation
phase writes, wrapped destinations and the exact RNG consumption sequence.

`initializePersonState` now accepts state **41** with an explicit celebration
consumer, retaining the original shared cleanup and post-initialization animation
selection. The native comparison exposed an existing scope assumption in training
queue cleanup: the matching-command-8 exception only applies to order state 10;
state 41 must release that reservation. The shared condition now expresses this.
The three dance callers zero-extend their animation-table entries to **bytes**;
Ghidra's `(char)` notation must not be interpreted as signed extension here.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-celebration.py /path/to/d3dpoptb.exe
.tools/decomp/oracle/bin/python scripts/check-native-person-state.py /path/to/d3dpoptb.exe
```

The new oracle compares **2,048 complete controller calls**, **256 complete
chain-action calls**, **40,960 sequential controller calls** across 64 ten-person
64-turn timelines, and **128 composed state-41 initializations** executing the
real celebration controller. It checks every supplied person's tracked fields,
shared RNG and ordered animation, turning, destination, drop, sound, building-exit
and projectile requests. Native cell/object lists and the angle, distance and
movement math execute unchanged. Animation, motion registration/destination,
allocation, sound, building-exit and projectile consumers are supplied at their
call boundaries. Animation timing uses an explicit supplied record (signed hold
-3, delay 2, seven frames), not a claim that every original sprite is integrated.
The final 128 initializer compositions compare the controller's tracked fields;
full shared initializer fields are covered by the separate initializer oracle.

The expanded initializer oracle passes **2,048** state-10/14/41 cases, plus its
existing **6,624** animation selections, **1,280** startup/reconciliation cases,
**640** speed/recovery calls and **128** composed training handoffs. All **48**
gameplay regressions and typechecking pass.

**Live integration is unfinished.** The browser outcome adapter still does not
initialize these native person records. Connecting this controller requires the
shared person state, movement/turning, sprite-object/frame setters and world-effect
consumers; mapping it to a generic looping dance would discard the behavior just
recovered. Native vehicle/passenger handling, complete person physics and object
scheduling remain explicit dependencies. This pass adds reviewed reconstruction
and executable comparison evidence, not visible victory-animation parity. The
existing **555** raw exports already contain these entry points and their helpers.


## Native animation setters, frame updates and celebration composition

`app/animation.ts` reconstructs `004ee700` (raw object setter), `004d4040`
(person setter), `004ee7b0` (animation update) and `004ee770` (the two allocation
lists). `inspect-executable.py` imports 161 object/start/draw pairs at `005a6858`
and 40 eleven-byte descriptors at `005a6af8`. The updater preserves sprite delays,
frame-byte wrap, visibility stamps, footprint request gates, model sequences,
morph timing/completion and the seven terminating effect objects. The setters
retain `f2`, conditionally retain `f1`, and apply the original passenger poses,
selection/visibility flags and tribe rules. These are reviewed ports of the
supplied executable, not recovered source code.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-animation.py /path/to/d3dpoptb.exe
.tools/decomp/oracle/bin/python scripts/check-native-celebration.py /path/to/d3dpoptb.exe --animations
```

The animation oracle compares **1,920 raw setters**, **2,560 object updates**,
**2,048 person setters** and **4,096 allocation-list updates** over eight objects,
including pause and sequential frames. All native animation callees execute;
footprint emission is supplied. Frame counts are reconstructed from the supplied
VSTART/VFRA chains; model sequences use the actual `aniob0-0.dat` bytes. Morph
durations are explicitly supplied at the loaded-table boundary. Valid imported
object/descriptor and model-sequence indices are the checked domain; invalid
native pointers and unloaded table indices are not supported browser inputs.

The celebration oracle's new `--animations` mode executes **40,960 celebration
controller calls** with **81,920 native animation updates**, plus **128 state-41
initializations** using the real native setters. Browser composition calls the
new setters/updater against the same original frame counts. All tracked person
fields, object/frame/palette values, RNG and ordered world requests match. These
fixtures contain ten valid people, including a shaman and firewarrior; movement,
allocation, sound, building exits and projectile consumers remain supplied.
Footprints are disabled through the native level flag in this composition.
The two animation steps per controller turn are an explicit test schedule,
not evidence that native rendering always runs at twice the simulation rate.
The existing broad celebration oracle and all **48** gameplay regressions pass.

Clock evidence: `004a4450` increments `00897981` once per presentation-loop
iteration. `004a4960` runs the animation lists after drawing, with activation and
multiplayer readiness gates; `004ee770` skips both lists on land pause bit 2.
`004b2670` reports window activation, not frame readiness. The main loop waits
on separate deadlines: `0049cfe0` selects 60, 24, 20 or 14 FPS with bit priority
2 > 4 > 1, and `0049cfc0` selects that limiter only for game interface state 2
with a nonzero session rate byte. Otherwise the separate byte at `0089ce62`
supplies the deadline. Main-loop timing, configuration/loading of those rate
bytes and render-stamp catch-up are not yet ported. Updating animation on each
browser RAF or each simulation turn would not preserve this contract.

**Live wiring remains unfinished:** `GameScene.animatePerson` still uses its
legacy age-based atlas frame selection, and the outcome adapter still does not
own native celebrant records. This pass resolves the animation consumer boundary
and verifies controller composition; it does not claim visible celebration or
complete animation parity. The manifest retains **565** raw exports, including
the animation helpers, sprite loader and traced presentation-clock routines.


## Live celebration records and grounded motion integration

`app/live-people.ts` now connects the outcome handoff to `initializePersonState`,
`stepCelebration`, native animation setters and `stepObjectAnimation`. Braves,
warriors and shamans retain the same person record across turns and rendered
frames. Victory releases legacy work/orders, exits buildings, drops carried logs,
and runs the recovered nine-phase controller, including synchronized circles and
chains. The renderer chooses the actual native object/frame rather than a generic
age-based dance. Original dance cycles and normal-palette HFX sprite 23 are
imported; cargo drops request original sound cue 11. The atlas now contains 1,956
composites and exposes all 792 native frame counts.

`app/person-motion.ts` ports the grounded facing prefix of `004e6d00` and the
complete horizontal slope-velocity routine `004e93f0`. Turning rates and velocity
limits come from the configured native physics table. The comparison checks
**4,096 facing calls** (stopping before the first terrain query) and **4,096 full
velocity calls**, including signed widths, angle wrapping, slow turns, slope
bounds, query coordinates and velocity overflow. Height samples are supplied at
the terrain-query boundary; the live consumer uses the previously verified
native terrain-height routine.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-person-motion.py /path/to/d3dpoptb.exe
npm run check
node scripts/check-browser-celebration.mjs
```

All **49 regression tests**, typechecking and the production build pass. Lint
reports seven existing image-element warnings and no errors. The new regression
checks owned record mutation, cargo/sound events, building exits, circles/chains,
no return to legacy work, no loose-log regrowth, and paused/frozen animation.
Browser QA covers all three supported classes, movement, actual rendered atlas
frames, pause, circle/chain transitions and restart without page errors. Visual
isolation confirms the original follower poses render correctly.

**Integration boundaries remain explicit.** Victory bootstraps records from the
legacy units; ordinary orders and native allocation are not migrated. Ground
motion retains the existing dry-land/building collision adapter and direct
remaining-distance shortening; full `004e6d00`, its cone gate, impulses, falling,
obstacle recovery, path groups and cell-list ordering remain unported. External
legacy impulses reconcile position before the next native grounded step. Building
exits reuse the existing native entrance geometry but not the complete occupant
lifecycle. Log drops preserve centering and two jitter RNG draws; native free-cell
search, allocation ordering and loose-log lifecycle remain adapters. Live vehicle
and firewarrior classes are not available. Animation uses a separate paused
24 Hz presentation adapter after drawing; native configurable timing, visibility
catch-up, footprint effects and general object scheduling remain unfinished.
The result overlay and progression are also still browser implementations.

The manifest now verifies **568 raw exports**, adding `004d43a0`, `004e9050` and
`004e9950` as retained evidence for the next motion/lifecycle work. Raw exports
are not claims of reconstructed or integrated behavior.


## Native obstacle probing, recovery timers and building approaches

`app/person-motion.ts` now reconstructs complete `004e9720` and `004e9950`.
Blocked followers probe eleven alternating headings in 170-angle-unit increments,
first at their current speed and then twice that speed. The original signed-byte
recovery counter chooses turn-side changes and retry flags; the successful probe
sets the native steering timer without overwriting an existing positive timer.
A building-cell hit starts the original two-stage exit recovery. Its approach,
111-unit threshold, outside-point transition, support-height reset and periodic
path-retry flags are retained.

`004e7a10` is a **square proximity test, not a cone gate** as the preceding
integration note called it. Its seam fold deliberately uses 65535, and comparisons
are strict. The live remaining-distance shortening now uses this verified gate.
`turnPerson` exposes the native local turning result so the live driver holds
position during a blocked turn and only probes alternatives after turning ends.

`buildingApproachPoint` in `app/building-shapes.ts` ports complete `0040a460`:
choose the nearer inside/outside entrance point using squared toroidal distance,
walk 64-unit steps along their axis until distance stops decreasing, then offset
32 units toward the outside. It shares the imported shape records, entrance
helpers and native integer step/angle math.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-person-motion.py /path/to/d3dpoptb.exe
.tools/decomp/oracle/bin/python scripts/check-native-building-shapes.py /path/to/d3dpoptb.exe
npm run check
node scripts/check-browser-celebration.mjs
```

The motion oracle checks **4,096 cases each** of facing (including the native local
turning result), slope velocity, complete obstacle probing, complete recovery,
and square proximity: **20,480 comparisons**. The obstacle/recovery fixtures
compare every tracked person field, output position, return byte and ordered
height/collision/access/entrance requests. Terrain heights, collision results,
building access and entrance consumers are supplied at their call boundaries;
native math and control flow execute unchanged. Negative building-exit timers
would read an uninitialized native point and are excluded/rejected; signed timer
wrap and negative timers in ordinary timed recovery are covered.

The geometry oracle now compares **30,336** inside/outside/queue/approach points
across **632 object/orientation pairs**, including 7,584 approach points, original
shape-loader relocation and seam boundaries. All geometry callees run natively.
All **50 gameplay regressions**, typechecking and production build pass; lint has
seven existing image-element warnings and no errors. The new live regression
forces a blocked step, checks movement along a free probe, and verifies that
recovery steering/timers survive the next step after clearing the obstacle.
Browser QA now also forces an obstacle detour, alongside celebration/frame/pause,
circle/chain and restart checks, without page errors.

**Remaining boundaries:** the live world still supplies its coarse dry-land and
completed-building collision/occupancy tests, and building-access permission is
an adapter. The native collision classifier `005178d0`, building access `00517f10`,
airborne eligibility `004e7880`, boat lookup `004665c0` and remaining full physics
are retained for the next integration; these raw exports are not verified ports.
Native failed-recovery airborne dispatch, path recomputation, cell-list ownership,
falling, impulses, landing and general person lifecycle remain unfinished.
The manifest now retains **574** raw exports. Full parity is still open.


## Native terrain collision, building access and quarter-cell walk maps

`app/person-collision.ts` reconstructs `005178d0` (step collision), `00517f10`
(building access) and `0044f980` (coastal support). Return codes distinguish
building obstruction, restricted cells, blocked walk bits and unsupported
surfaces. Construction/repair/entry/target-following flag precedence, tribe and
work-target permissions, boat exceptions and building-exit overrides are kept.
The work-target relation uses signed word **+0x92**, confirmed in the actual x86
instruction at `0051803b`; the imported metadata's field name was misleading.
Coastal support uses the original eight reversed-Y mask rows per terrain category
and preserves the returned bit value. The inspector imports these 128 mask bytes
from `005aa32e` with 14-byte record stride.

`app/native-terrain.ts` reconstructs complete `00422bd0` and `00422a60`. The former
selects three terrain corners off the diagonal and four on the diagonal for each
quarter-cell, preserving native minimum/maximum seeds 1024/0. The latter updates
two 8,192-byte, 256×256 walk maps in a wrapped (4r+1)-square region using the two
configured terrain limits. Restricted/scenery cell bits 0x80004 clear walk bits.
The original default pointer at `0096aa74` selects the primary map `0096aaba`;
several path queries temporarily select `0096caba` and restore the primary map.
The checked updater restores that pointer as well. Address references were
located with the repository's `ExportCallers.java` byte-checked workflow.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-person-collision.py /path/to/d3dpoptb.exe
.tools/decomp/oracle/bin/python scripts/check-native-terrain.py /path/to/d3dpoptb.exe
npm run check
node scripts/check-browser-celebration.mjs
```

The new oracle checks **4,096 coastal-support calls**, **8,192 building-access
calls**, **8,192 composed collision calls**, **8,192 quarter-cell height checks**
and **24 complete sequential dual-map updates**, including full-map and wrapped
regions and preservation of untouched bits. Native building/surface callees and
walk-mask terrain calculations execute unchanged. Boat lookup alone is supplied
in the collision composition, and its call count is compared. Valid object
references are the building-access domain; invalid native pointers are not
supported inputs. Signed height extrema and the native min/max initialization
are exercised independently of ordinary map heights. Existing terrain validation
still passes all **260 queue/process checkpoints**, including ocean and original
first-mission initialization.

Live initialization now builds both masks after the original terrain queue;
terrain synchronization refreshes the affected mask regions after heights and
flags are updated. Live celebrants call the native classifier and primary mask
for movement and recovery probes. Their grounded turn bypasses the legacy
height-only death guard; unsupported terrain is handled through the native step
classifier. The new gameplay regression verifies blocked/allowed mask changes
and that the old height cutoff cannot kill a supported native follower.
All **51 regressions**, typechecking and production build pass. Browser QA covers
native detours, original frames, pause, circle/chain transitions and restart with
no page errors. Lint has seven existing image-element warnings and no errors.

**Remaining boundaries:** building occupancy still comes from the browser's
completed-building radius, and legacy object/plan state is adapted into collision
records. Exact native footprint registration, plans, boats, object allocation and
full access-state ownership remain unfinished. The original building-access
routine is verified, but all its ordinary-order consumers are not yet live.
The browser crop boundary remains; rendering is not yet a complete native map.
Native failed-recovery airborne dispatch, falling, impulses, landing/drowning,
path recomputation and general person lifecycle still require integration. The
terrain synchronization producer still begins with the cropped browser grid.
The manifest now verifies **576 raw exports**. Full game parity is unfinished.


## Original building footprint registration and cell shade

`app/building-shapes.ts` reconstructs complete `00403a00`. It traverses the
original bank-2 shape mask for the building's object and orientation, visits bit-1
cells in row order, wraps coarse coordinates and preserves the high six bits of
packed building IDs. Registration writes the tribe owner nibble, building ID,
occupancy bit 0x200 and dirty bit 0x10. Removal clears occupancy; mode 4 clears
terrain-damage bit 0x20000. Other byte modes retain their native behavior,
including ID/owner writes without shade recalculation. Modes 0/1 recompute the
cell's low shadow nibble and every mode requests the native texture region.

`nativeCellShade` reconstructs complete `00450d50`: valid building shade,
construction-stage scaling unless building flag 0x100 is set, then scenery in
cell-list order with the original cap at 15. The inspector imports signed building
shade at model+0x35 and scenery shade at model+0x13. The texture-region consumer
`004bdd40` is retained as a raw export; its lighting and texture-cache work is not
yet integrated into the renderer.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-building-footprints.py /path/to/d3dpoptb.exe
npm run check
node scripts/check-browser-celebration.mjs
```

The footprint oracle compares **632 sequential complete map updates**, covering
every imported object/orientation pair, six operation modes, wrap boundaries,
packed-bit preservation and ordered shade/texture requests. Each checkpoint
hashes all flags, building IDs, owner bytes and shadow bytes across 16,384 cells.
Original shape data is loaded through the existing checked relocation helper.
Shade and texture consumers are supplied for these registration comparisons;
**4,096 separate complete native shade calls** cover real table values, signed
stages, missing/dead buildings, scenery lists and the shade cap without supplied
callees. Raw terrain bytes deliberately contain unrelated bits to verify their
preservation.

The live world owns native `buildingIds` and `owners` arrays alongside its flags
and shadows. A completed-building adapter registers initial buildings, replaces
changed object/orientation/anchor/tribe footprints and clears removed footprints
using the original modes 0 then 4. Synchronization occurs before follower motion
and after object removal. Live native collision and building-exit recovery read
these registered cells, replacing the completed-building radius lookup for those
consumers. Cell shade uses the existing building/scenery adapters; the renderer
still does not consume the complete native shade/texture pipeline.

All **52 regressions**, typechecking and production build pass; lint retains
seven existing image-element warnings and no errors. The integration regression
checks relocation, rotation handling and removal without stale invisible
collision. The detour regression and browser check now begin at an actual native
footprint boundary. Browser celebration/frame/pause/circle/chain/restart checks
also pass without page errors.

**Remaining boundaries:** native plan allocation, partially constructed/special
building registration, stage scheduling and complete object/cell-list lifecycle
remain incomplete. The adapter currently registers completed entries in the
browser building collection and uses the existing object identity/anchor mapping.
General legacy follower orders still use the old route planner; shared native
movement is live for celebrations only. Full cell shade refresh scheduling,
scenery lifecycle, renderer lighting/texture caches, physics and pathfinding are
still open. The manifest now retains **578 raw exports**. These changes do not
establish full game parity.


## Person physics: drift, velocity bounds and landing-state decisions

`app/native-terrain.ts` adds reviewed reconstructions of `0044f750` (triangle
height range), `004ebd10` (slope velocity), `004ebc20` (trough suppression) and
`0044ebe0` (nearby non-land category query). They read the native triangle flag,
wrap at the world seam, preserve the original 1024/0 extrema seeds, and truncate
height differences to signed words before the arithmetic 3/8 shift. Drift probes
four positions 76 native units away and suppresses horizontal components that
would pull an object into a local trough.

`app/person-physics.ts` reconstructs complete `004e78f0` and `004e7980` velocity
caps, `004e7880` unsupported-ground query, `004e9050` airborne marking and
`004e9160` landing/settling decisions. Physics flag 8 chooses triangle slope
instead of the active walk mask. Landing tests use the **candidate position**,
which may differ from the person's stored position before final cell insertion.
They preserve signed squared-speed overflow, ordinary motion reset, animation
refresh, interrupted-combat checks, the class-3 callback and shaman state 39 under
game-state flag 2 at `0089d17c`. State release occurs before the new state is
written and initialized. The inspector imports native vertical/impulse limits,
slope thresholds and physics flags; the live grounded adapter now uses the shared
verified ordinary velocity-cap routine.

```sh
.tools/decomp/oracle/bin/python scripts/check-native-person-physics.py /path/to/d3dpoptb.exe
.tools/decomp/oracle/bin/python scripts/check-native-person-collision.py /path/to/d3dpoptb.exe
npm run check
node scripts/check-browser-celebration.mjs
```

The new oracle compares **45,056 native calls**: 4,096 each for triangle range,
slope velocity, composed drift, ordinary caps and impulse caps; 8,192 each for
unsupported-ground eligibility, airborne marking and settling. Terrain/math
callees execute unchanged, including the neighborhood-category test and real
slope query inside settling. Cases cover signed height/velocity extrema, both
triangle diagonals, seams, every configured physics row, blocked and clear masks,
land-only and mixed-category neighborhoods, distinct stored/candidate positions,
missing/dead targets, state flags and ordered consumer calls. Animation refresh,
state release/initialization, fight consumers and class-3 settling are supplied;
callback snapshots compare the current state and flags at each boundary.

All **52 gameplay regressions**, typechecking and the production build pass.
The affected collision/quarter-cell oracle also passes its 28,672 point/permission
checks and 24 full dual-mask updates after sharing the terrain corner reader.
A helper-name shadowing conflict caught during integration was fixed before the
successful checks. Browser original-frame, pause, circle/chain, footprint detour
and restart checks pass without page errors. Lint retains seven existing image
warnings and no errors.

**The full live airborne loop is still unfinished.** Ordinary velocity caps are
integrated; the new drift, marking and settling routines are reconstructed and
verified dependencies for the complete `004e6d00` driver. Impulse/gravity timing,
collision bounce, damage/sounds on landing, drowning and post-move scheduling
still need composition and live integration. Landing can return a person to
states 10, 36 or 39; those transitions must join the shared live state/order
dispatch instead of leaving a native animation record attached to legacy AI.
`004eadc0`, retained as a raw export, is a substantial path-group/waypoint and
vehicle/passenger consumer. It immediately returns for motion-group zero, the
current celebration bootstrap, but remains required for ordinary orders.
The manifest now retains **581 raw exports**. Full physics and game parity remain
open.


## 2026-09-08 — complete person physics driver composition

Reconstructed the complete `004e6d00` driver in `app/person-physics.ts` and
its `004e9be0` collision bounce. The original can insert a person twice in one
turn: impulse displacement/capping/gravity/bounce/clamping/insertion precede the
ordinary grounded or airborne pass. Grounded falling and airborne falling have
different facing, sound and settling behavior. Airborne landing performs damage,
voice, animation and class-7/model-3 allocation before drift/friction/bounce and
state settling. Final clamping/insertion, support clearing, five-cell reveal
probe and path-group consumption retain their native order and integer widths.

`terrainPointHeight` in `app/native-terrain.ts` reads the stored triangle flag,
including pending terrain edits, rather than recalculating the diagonal from
corner heights. Its return is the signed low word consumed by motion. Live
celebrants now use this query. The existing import/resampling height helper is
unchanged. `scripts/inspect-executable.py` imports configured gravity (+0x12),
friction (+0x14/+0x16), fall damage (`005aa534`, 700) and the building support
field (+0x26). Newly exported `00463750` confirms the impulse clamp ordering.

Validation commands:

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-physics-driver.py /path/to/d3dpoptb.exe
/private/tmp/populous-reference/tools/bin/python scripts/check-native-person-physics.py /path/to/d3dpoptb.exe
npm run check
node scripts/check-browser-celebration.mjs
```

The driver oracle compares **4,096 native bounce cases and 16,384 complete
physics turns**: 8,192 standalone turns and 128 continuous 64-turn trajectories.
It executes original terrain/math, collision/access, steering/recovery, drift
and settling callees. Supplied world consumers compare arguments and ordered
snapshots of every owned motion field. Damage also changes life before later
sound decisions; insertion changes stored position before subsequent motion.
Cases include all 20 physics rows, seams, signed extrema, supported/unsupported
terrain, building permissions/support, blocked recovery, slow turns, impulse
and flight flags, landing/fight transitions and reveal. Native branch counters
assert coverage of impulse, both falling paths, landing, movement, arrival,
failed recovery, turn hold, settling, launch sounds and reveal. The dependency
oracle now passes **49,152 calls**, adding 4,096 stored-diagonal height cases.

**Integration limit:** the full driver is reconstructed, not yet the live
physics dispatcher. Cell-list insertion, object allocation, damage/audio,
state release/initialization, fight checks, building route queries, reveal and
`004eadc0` path groups remain consumer boundaries in the complete-turn oracle.
The continuous trajectories run physics without intervening person controllers;
they are not complete gameplay replays. Live airborne landing must join shared
state/order dispatch before replacing the remaining legacy motion adapter.
An entirely blocked wrapped bounce diagonal throws after a full 8,192-step
cycle; the original never terminates for that invalid world configuration.
There are now **582 raw exports**. Full engine/game parity is unfinished.


All **52 gameplay regressions**, typechecking and production build pass after
the live stored-diagonal query change. Browser victory handoff, movement,
original atlas frames, pause, circles/chains, registered-footprint detours and
restart pass without page errors. Lint reports zero errors and the same seven
existing image warnings. The export checker verifies all 582 manifests/entries
against the supplied executable identity and rejects unknown builds.


## 2026-09-08 — native cell lists and live neighbor ordering

Reconstructed all of `004ee470` (insert), `004ee4f0` (remove), and `004ee580`
(move) in `app/object-cells.ts`. These are doubly linked lists indexed by native
16-bit object IDs. Insertions prepend and set flags2 bit `0x20000`; removals
splice both neighbors and clear that flag while retaining the removed record's
own links. Motion changes lists only when either 512-unit cell changes. It
always copies the position and, with flags3 bit `0x100` but not `0x200`, stores
signed-word displacement in offsets `0x43/0x45/0x47`.

The live celebration adapter now keeps persistent cell heads/links and scans
neighbors in native list order, replacing iteration over the browser's unit
array. Ground movement and building exits update these lists; death/removal,
record replacement and legacy spell movement reconcile through one helper.
Only live native person records are currently registered. Their initial order
comes from the victory handoff, so this does not claim original allocation
order before that handoff or complete membership for other object classes.
The remaining unit/allocator migration must establish that original history.

Validation:

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-object-cells.py /path/to/d3dpoptb.exe
/private/tmp/populous-reference/tools/bin/python scripts/check-native-physics-driver.py /path/to/d3dpoptb.exe
npm run check
node scripts/check-browser-celebration.mjs
```

The cell oracle executes **8,192 sequential native operations**: 1,480 inserts,
1,365 removals and 5,347 moves. It compares all 16,384 cell heads and all owned
fields of 128 persistent objects after every operation, without supplied native
callees. Cases include interior/head/tail splices, reinsertion, unchanged cells,
seams, position-argument aliasing, signed height/displacement and both delta
flags. The full physics oracle now lets **original `004ee580` execute**; all
16,384 complete turns still match, including hashes of every cell head,
neighbor links, membership flags, displacement and ordered remaining consumers.
This removes the earlier supplied insertion boundary from that comparison.

A live regression checks arrival order, same-cell stability, removal of dead
records, empty-world cleanup and restart. Browser QA also checks linked-list
integrity against rendered followers. Existing circle fixtures now teleport the
browser unit through the integration boundary rather than overwriting a linked
native position without moving its cell membership. All **53 gameplay checks**
pass. Full airborne landing/state dispatch, shared object allocation and path
groups remain unintegrated. `004ed8a0` allocation and `004ee300` global-list
rebuild are retained as raw evidence for that work; the export count is **586**.


Typechecking, the production build and browser cell integrity, original frames,
pause, circle/chain, detour and restart checks pass. Lint remains at zero errors
and seven existing image warnings. The manifest checker verifies 586 exports
against the supplied executable and unknown-build rejection.


## 2026-09-08 — recovery controllers and shared landing initializers

Extended `app/person-state.ts` with the original state-36 initialization path
and full `004df220` recovery controller. It faces a valid target, selects the
correct ground/air recovery animation, derives its timer from animation timing,
handles vehicle-dependent speed halving, calls the fight consumer, and returns
the configured next state on expiry or target loss. Flags, signed timers,
frame resets and callback ordering remain native-width operations.

`app/special-battle.ts` reconstructs state-39 setup (`004dfac0`), tribe-relative
placement (`004783a0`) and boundary enforcement (`00478820`). The shared center
pointer is `0096aa70`. Setup forces vehicle exit; non-shamans relocate, reset
height/displacement, allocate class 7/model 32, configure descriptor 44/object
1401 and select tribe palette. Shamans enter substate 3 without teleporting.
Both face the center and stop with the original cargo/airborne animation choice.
Formation width is at least six and otherwise truncated population/8. Negative
ranks consume one RNG draw; rank zero and positive ranks have distinct spacing.
Boundary enforcement preserves the original strict signed squared-distance
comparison and delay/substate gates. This is special battle state 39, not an
approximation of ordinary shaman control.

The rule importer now reads animation descriptors 40–44 and the four palette
bytes at `005a89c8 + tribe*5 + 3`. The animation oracle follows the imported
array length so further evidenced descriptor imports do not silently escape it.
Raw `004783a0` and `00478820` exports bring the manifest to **588**.

```sh
/private/tmp/populous-reference/tools/bin/python scripts/check-native-person-recovery.py /path/to/d3dpoptb.exe
/private/tmp/populous-reference/tools/bin/python scripts/check-native-person-state.py /path/to/d3dpoptb.exe
/private/tmp/populous-reference/tools/bin/python scripts/check-native-animation.py /path/to/d3dpoptb.exe
npm run check
node scripts/check-browser-celebration.mjs
```

The new oracle passes **20,480 native comparisons**: 4,096 each for formation
position, boundary, fight recovery, special setup and composed shared state
initialization. It covers four configured tribes, population/rank extremes,
seams, signed distance overflow, timer/speed extrema, missing/dead targets,
cargo, flight flags, failed allocation and effect initialization suppression.
The composed cases execute real `004d2740` plus `004dfac0`, confirming common
flags and speed RNG before setup and animation refresh after it. Native math,
RNG, cell movement, height on the flat fixture and the effect animation setter
execute unchanged. Person animation, forced vehicle exit, effect allocation/
class initialization and fight remain supplied consumers. Motion release runs
natively with motion group zero. Nonzero group/vehicle behavior and complete
battle gameplay are not covered by this composition.

The existing state oracle now passes **4,096 shared initializers** across
10/14/36/39/41, plus 6,624 animation selections, 1,280 order/reconciliation cases,
640 speed/recovery cases and 128 training handoffs. All 45 imported animation
descriptors pass 2,160 setter and 2,880 update checks, alongside 2,048 upper
setters and 4,096 allocation-list updates. All **53 gameplay regressions**,
typechecking, browser cell integrity/frames/pause/chains/detours/restart and the
production build pass. Lint retains seven existing warnings and no errors.

**Live boundary:** state 36/39 recovery/setup is available to the reconstructed
engine but is not yet connected to the live person dispatcher. The full class-1
scheduler, remaining state/order bodies, world consumers and airborne ownership
still need composition. Full game parity remains unfinished.


## 2026-09-08 — Person preparation, reactions and health

The class-1 loop `004d32b0` calls preparation `004d42a0`, reaction counters
`0051fed0`, airborne eligibility and physics before its state controller. Its
post-state health gate calls `004d43a0`, which first checks drowning `004eeff0`.
These five complete consumers (including interrupted-motion reset `004eefd0`)
are now reconstructed in `app/person-update.ts`.

Preparation preserves status countdown ordering, motion reset, state resumption,
slow-turn animation refresh and pending goal dispatch. Reaction counters preserve
alternate-turn timing and the separate duration expiry. Drowning uses native
triangle height, coastal subcell masks and transport exceptions. Health preserves
callback-sensitive flags, death/drowning transitions, the every-eight-turn healing
byte, signed short overflow, quarter-health flags and state-31 requests. The
healing byte is imported from the configured original person model table.

`scripts/check-native-person-update.py EXE` passes **20,480 native comparisons**,
4,096 per routine, comparing complete owned fields and ordered callback snapshots.
Cases cover random wrapped coordinates, terrain diagonals/categories, flags, byte
and signed-short extremes, models, physics rows and initializer mutations. Native
terrain, coastal masks, animation selection and reset execute; initialization,
upper animation setting and destination planning are supplied. The oracle reads
only AL for `004eeff0`, as confirmed by its native return instructions.

Live celebration consumes interrupted steering, slow-turn countdown/animation,
pending goal requests and reaction timers before motion. All **54 gameplay tests**
and typechecking pass. The real browser verifies live movement, original atlas
frames, pause, circle/chain transitions, obstacle detours, cell integrity and
restart without page errors. Five new raw exports bring the manifest to **593**.

**Remaining boundary:** full preparation state resumption, health and airborne
physics are not yet live; complete class-1 state/order ownership must connect them.
The live goal consumer remains a direct-assignment adapter, not native pathfinding.
Raw nearby person interaction `004e0270` and combat acquisition `004d4690` are
retained as evidence, not claimed as reconstructed or integrated behavior.


## 2026-09-08 — Order completion and live interruption resumption

`00432590` is now reconstructed in `app/person-order-update.ts`. It preserves
current/immediate lookup, cancellation and work-resumption precedence, eight-turn
vehicle checks, the command dispatch table and inline command effects, formation
update order, anchor selection, queue release/advancement and final state choice.
Unported command bodies remain required consumers, including shared native
bodies for models 3/25, 17/31/32 and 19/21. They are not successful no-ops.

`004366b0` now advances circular eight-slot queues, removing canceled entries and
respecting repeat-model commands. Removal may change the current command model;
the reconstruction preserves the original subsequent reads. Fallback route and
vehicle consumers, next-order preparation, configuration and movement recovery
run in their native order. Repeating queues that cannot continue are cleared.
The updater composes with this routine rather than inventing completion rules.

`004e32a0` chooses victory state 41 only under the original result flags and tribe
conditions; otherwise it reads model byte +5. This is distinct from byte +4 used
to resume order processing. Normal followers' configured idle state is 17, not
state 10 or timed-wait state 1. `00402e70` centers the anchor and clears byte +0x82.
Shared initialization now also supports state 1 with its extra RNG draw.

The native oracle passes **16,384 comparisons**, 4,096 each for advancement,
post-order choice, full dispatch and composed dispatch/advancement. It compares
owned person fields, order records, affected objects and ordered consumer
snapshots. Native cell lookup, building correction dispatch, anchor centering,
wrapped overlap, object-validity lookup and survivor count execute. Command
bodies, removal/configuration, path requests, formation and vehicle consumers
are supplied. Shared state checks pass 4,096 initializers across 1/10/14/36/39/41,
6,624 animation choices, 1,280 startup/building reconciliations, 640 speed/recovery
cases and 128 composed training handoffs.

Disassembly resolves two misleading metadata fields in raw `00432590`: command
25 clears the matching class-10/model-16 effect's short at +0x70; command 29 reads
its target's word +0x7a. The TypeScript and oracle use those actual offsets.
Six new raw exports bring the manifest to **599**. Raw `00436870` next-order
rewriting is retained for the remaining queue consumers, not claimed as ported.

**Live integration:** preparation now runs in full for native victory followers.
An interruption enters state 10, follows the empty-order handoff and re-enters
celebration through shared initialization, preserving RNG and animation updates.
A regression and real-browser check exercise this resumption. All **55 gameplay
tests**, typechecking and browser movement/atlas/pause/chains/detours/cell integrity/
restart checks pass without page errors.

**Remaining boundary:** ordinary live order ownership and nonempty queues,
remaining state bodies (including idle state 17), full class-1 scheduling,
airborne physics, health and native path/vehicle consumers remain unintegrated.
This is verified dispatch and victory resumption, not full engine parity.


## 2026-09-08 — Idle approach, resting and original gesture sprites

`app/person-idle.ts` reconstructs `004d6f90`, `004d7330` and `004d73e0`.
Approach initialization preserves stationary-model eligibility, signed proximity,
indexed search and failure behavior, anchor routing, vehicle/building transitions
and preacher command creation. The state-17 controller returns resting state 19
only after slow turning ends and the goal cell matches; interrupted or periodically
blocked anchors request resumption. Search type 2 uses angle zero and range 0..32;
the original allocator clamps its last radius to 31. Indexed search and command
ownership remain supplied consumers, not invented scans or successful no-ops.

The resting controller preserves all substates: finding/checking a slot, moving
and settling, dropping cargo, random turns, stationary rest, facing/reacting to the
shaman and model-specific gestures. Timer widths, same-call fallthrough, two RNG
draws per idle decision and formation repositioning flags are retained. `004d5650`
slot coordinates use explicit shape-offset tables. The slot fields are the same
`formationCell` (+0x80) and `anchorFlags` (+0x82) used by shared initialization and
order anchoring, so there is no second copy of those native words/bytes.

`00518200` resting-cell eligibility checks buildings, restrictions, category flags
and all four quarter-cell walk bits. `004d6b10` pose pauses use RNG **0089bc72**,
separate from simulation RNG **0089d178**. Native instructions also confirm a
peculiarity in resting gesture timing: frame count comes from the fixed animation
source at **005a6adc** (712), while its rate uses the current draw descriptor.
The reconstruction retains that behavior rather than using the current object's
frame count. Animation objects 161–163 are now imported, and shared row selection
`004d3ff0` is reused by idle, movement and stopping.

`scripts/check-native-idle.py EXE` passes **24,576 native comparisons**: 4,096 each
for pose pauses, slot coordinates, cell eligibility, resting initialization,
resting updates and approach initialization. It checks owned fields, both RNGs
and ordered consumer snapshots across flags, widths, slot shapes, allocation
failures, shaman presence/proximity and search outcomes. Native math/RNG, row and
animation selection, height, overlap and motion release with group zero execute.
Slot ownership/search, upper animation setting, insertion, allocation and path/
order consumers are supplied. Offset tables and frame counts are fixture data,
not evidence that original runtime slot-table loading is integrated.

The shared-state oracle passes **5,120 initializers** across 1/10/14/17/19/36/39/41
with state bodies supplied, plus its existing 6,624 animation selections, 1,280
order/reconciliation cases, 640 speed/recovery cases and 128 training handoffs.
The animation oracle covers the expanded object table and retains its 2,160
setters, 2,880 updates, 2,048 upper setters and 4,096 allocation-list updates.
A gameplay regression composes real shared initialization with approach and
resting initialization for a stationary shaman, including original sprite 424.

The original brave (source 712) and warrior (728) gesture sequences were missing
from the atlas. `import-original.py` now extracts both for blue/red followers;
the atlas contains **2,216 composite frames**. A browser check renders those
sequences while paused and verifies their atlas frames before restoring the
simulation. All **56 gameplay tests**, typechecking and browser recovery, frames,
pause, circles/chains, obstacle detours, cell integrity and restart checks pass.
Ten new raw exports bring the manifest to **609**.

**Remaining boundary:** idle states are reconstructed, not yet the ordinary live
follower scheduler. Native indexed search (`0049a2f0`, `0049a3f0`, `0049a5d0`),
original slot-table loading, slot validation/allocation and world ownership must
be composed next. Their raw exports, including slot search/validation, preserve
the evidence. Full physics/health/class scheduling and game parity remain open.

## 2026-09-08 — Wrapped path geometry and native smoothing

The next pathfinding layer is reconstructed in `app/path-geometry.ts`: wrap
candidate preparation/selection, native four-direction line stepping, cached
terrain and vehicle-transition probes, repeated path smoothing and distance/
tribe measurement. The imported direction table comes from `0059bd90` in the
verified executable. Address mappings, memory alias details and remaining
consumer boundaries are recorded in [the decompilation guide](../decomp/README.md#wrapped-path-geometry-and-smoothing).

`scripts/check-native-path-geometry.py EXE` passes **7,168 native comparisons**
across seven modes. Native segment clearance and smoothing execute the actual
line/probe routines; building access and three boat consumers are supplied.
Candidate checks exclude only neighbor flag words written from an uninitialized
native stack local. Defined candidate bytes, full path/result buffers, shared
state and consumer arguments match. Measurement uses terrain region byte +15
and the original active/defeat predicate.

The **61st gameplay regression** composes these routines with route construction,
search control and collection. Across the world seam, an open route reduces to
one endpoint and 16 quarter-cell steps; blocking its first step retains a detour
with two nodes and 24 steps. The obstacle solver supplies that initial path.
Full obstacle solving, route advancement and ordinary follower scheduling remain
unfinished; the new ports do not yet change live follower pathfinding.

## 2026-09-08 — Complete obstacle solver and composed native search

`app/path-solver.ts` ports `00421130`, `004222d0` and `004229a0`, reusing the
verified geometry and postprocessing. It preserves both obstacle walkers,
separate caches/boats, shoreline transitions, corridor checks, merge limits,
secondary results and native counters. The 1,500-step default is imported from
`0059bd8c`. Detailed behavior and limits are recorded in the
[decompilation guide](../decomp/README.md#complete-path-solver-and-obstacle-following).

**4,096 native comparisons** now include complete search with its actual solver,
preparation, selection, smoothing, measurement and collection. The four building/
boat consumers are supplied; endpoint boat lookup executes natively. The existing
**7,168 geometry comparisons** still pass with the shared probe's side-cache
support. Full owned route buffers and state, rather than just success/failure,
are compared.

The **62nd gameplay regression** constructs the original detour around a wall
across the world seam and verifies that a blocked destination yields failure and
a 16-turn cache entry. The same layouts execute in the native comparison. This
removes the supplied obstacle solver from the composed route-construction test.
Ordinary live routing, route advancement, boat/building world consumers and full
person scheduling/physics still need integration; full parity remains unfinished.

## 2026-09-08 — Route advancement, boat eligibility and landing reservations

`app/route-advance.ts` reconstructs complete `004eadc0`, composing native shared
route release. The route module also reconstructs `004ebab0` vehicle-leg checks.
`app/vehicle-routing.ts` supplies original occupancy, disembarking/approach
eligibility, readiness, first-boat selection, alternative landing search and
shared landing-target reservations. Capacity bytes are imported; boat navigation
flags retain their +0x92/+0x94 memory alias. Details and addresses are recorded in
[the decompilation guide](../decomp/README.md#route-advancement-and-vehicle-routing).

**4,096 route comparisons** check complete pool/person/vehicle/passenger state
and ordered world consumers. **8,192 vehicle comparisons** include actual boat
routines inside path probing and original indexed searches, comparing complete
reservation/search buffers. Boarding/disembarking actions and landing geometry
are still supplied to the advancement oracle; building access remains supplied
to the probe oracle.

The suite now has **64 gameplay regressions**. Composed planning/search/advancement
shares a detour between two followers, advances their centered waypoints and
releases each reference at the exact goal. The fixture places followers at
waypoints, so it does not claim full physics replay. Another regression checks
first-boat rejection and distinct landing reservations. Full ordinary live route
ownership and movement integration remain open; the legacy adapter is still used
outside reconstructed celebration. Six additional raw exports bring the manifest
to **644**. Full game and engine parity remain unfinished.


## 2026-09-08 — Original planning serves ordinary live routes

Replaced coarse browser A* with the recovered planner, route builder, complete
search/obstacle solver and postprocessing. The integration consumes live native
terrain/masks/building footprints, original node/request limits and coastal
direction bytes. Corrected reversed human/computer path-limit names using the
tribe initializer: native type 1 is computer, type 2 is human. `004ec6f0` supplies
per-turn search resets and end-of-turn failed-route aging.

The additional whole-cell planning gate `00518070` passes **8,192 native cases**,
including actual native building access and terrain height ranges; adjacency is
the supplied consumer. The existing collision/mask checks and renamed route/search
oracles also pass. The manifest contains **646 raw exports**.

The live mission regression revealed a valid route through low shoreline at
browser `(9,25)`. Native category zero supports that point at height 15, while the
old browser cutoff rejected it. Ordinary ground movement now uses the original
coastal support mask. The Blast airborne/landing adapter retains its old cutoff;
changing that alone does not reconstruct its missing physics dispatcher.

**65 gameplay tests** cover the complete mission, rotated outside-door targets,
cache expiry and pause, query release and low-shore arrival. The browser regression
issues an actual right-click move, verifies arrival without claiming native
animation ownership, then exercises the existing victory/movement/atlas checks.

This is native **path-query integration**, not complete native movement. Temporary
planning records flatten their routes into `Unit.path` and release references.
Ordinary tasks, exact-waypoint following, animation ownership, collision recovery,
full physics and persistent native route/order records still need migration.
The current world has no vehicles; their queries are empty and their actions
remain explicit unsupported consumers. Full engine/game parity remains active.


## 2026-09-08 — Persistent live routes and native waypoint advancement

Ordinary followers now retain native route records instead of immediately
flattening and releasing each order's route. `004eadc0` runs after movement,
following its call site at the end of `004e6d00`; the 224-unit arrival square now
advances live waypoints. Nearby followers share native pool references. Previews
borrow/release ownership, while committed replacement and interruption use the
same release routine. Tree/building candidate searches remain queries.

Shared cancellation covers task release, person combat, casting and Blast,
building transitions, deletion/death and victory. A failed replacement preserves
the existing browser order. The suite has **66 gameplay tests**, including live
sharing, preview reuse, failed replacement, independent cancellation, early
route advancement, final arrival and all ownership cleanup transitions. The
**4,096 native availability/advancement cases** still pass. Browser right-click
QA now verifies retained ownership during motion and release at arrival before
its native celebration/atlas checks.

The routing registry owns only the ordinary routing transition. It does not
claim native state/animation ownership for those followers. The browser velocity
controller and exact final task arrival still need replacement by the original
physics/order dispatchers; collision recovery, vehicles and full-world integration
remain open. No additional raw exports were needed; the manifest remains **646**.


## 2026-09-08 — User priority change: visible fidelity first

The user reordered the active full-parity goal: graphics/rendering, effects,
UI/controls and critical gameplay take priority over less-visible engine systems.
`GOAL.md` now records that order and supersedes the older immediate dispatcher/
campaign targets. The next task is a browser/reference comparison and the largest
visible correction. Decompilation remains part of the project, driven first by
those visible targets or their concrete blockers. Full engine parity, saves and
multiplayer remain in scope; no completion criteria were removed.

## 2026-09-08 — Original projected sky in the normal camera

The normal browser view hid its cloud dome, leaving only a flat gradient.
Recovered `00523720` lens transformation, `00523830` camera-relative motion,
`00517310` grid interpolation, `00517290` screen coordinates and `00517420`
cloud triangle generation now drive two screen-space WebGL layers. Scheduling
follows the existing `00517630` type-2 branch (sizes 256 and 192), with the
initial extra update from `00524a30`. `004b60d0` identifies the three sky textures.
The six new raw exports bring the manifest to **652**.

The importer now retains `data/skylens.dat` (16,848 bytes, SHA256
`4004b11ed6ce1d1240a86588b7bc22abc7d6160f5d048d1b97888ea234ea3b3d`)
as signed integer data and `dsky0-c2.png` as `clouds-high.png`. Executable tables
provide 31 screen points, 42 triangles and the eight floating-point constants.
Camera coordinates are **signed** words here, even though other routines read
the same wrapped storage unsigned. Rotation follows half the heading delta;
cloud drift uses the independent integer millisecond clock ×64 from `0049c9f0`.

`check-native-clouds.py` compares **128 updates and 4,992 allocated triangles**,
running all native callees through `0047d8a0`. State, full lens-grid bytes,
screen coordinates, UVs, fades, device flags and vertex order match, including
heading/coordinate wraps and differing surface sizes. As in projection checks,
the CPU uses MSVC double-precision FPU control (`0x27f`).

`check-browser-sky.mjs` verifies both textures change actual sky pixels while
leaving opaque ground/water pixels unchanged, keyboard rotation, cloud motion
independent of simulation pause, resize and return from overview. Before/after
and rotated screenshots were inspected. The original optional six triangles
cover the **left margin**, not the top; the browser includes them because its HUD
is outside the render surface.

Remaining boundaries: browser viewport sizing, overview dome, texture filtering
and WebGL blending are adapters, not legacy Direct3D raster parity. The clock is
fed from RAF milliseconds rather than the original Windows render loop. Full
palette scheduling and device capability fallbacks are not integrated. Terrain
shading/water and original HUD layout remain the next visible priorities.

## 2026-09-08 — Native terrain texture generation in the live renderer

`004bf860` generates 32×32 **indexed** textures, using bilinear fixed-point
brightness, height and cliff fields, signed displacement and a diagonal
displacement difference for fine shading. Height selects the amplitude table
initialized by `004bd700`, then `BIGF` and `CLIFF` select the final palette index.
Fog fade and accumulated stain shading are subsequent indexed lookups. The old
browser shader guessed height offsets, displacement weights and normal lighting;
that path has been removed from terrain rendering.

`app/terrain-texture.ts` reconstructs those pixel calculations. The cell-lighting
block from existing `004bdd40` supplies brightness. Full native `00401040` and its
`00401790` callee confirm the opening light vector stays `[147,147,147]`.
`004be330` records dispatch to the texture generators and cache behavior. Five
new raw exports bring the manifest to **657**.

The importer packages the original palette, BIGF, CLIFF, signed DISP and FADE
tables as `public/original/landscape.bin` (386,048 bytes); each source file's hash
is retained in provenance. A 1536×1536 RGBA atlas covers the existing 48×48 native
cell crop, reflecting native Y when copying tile rows. Source height, cliff and
brightness changes invalidate every touching tile. Unchanged tiles retain their
pixels, avoiding a full-crop rebuild during each Land Bridge update. Native
height synchronization has its own version: texture refresh follows `landVersion`,
so a browser geometry edit cannot cause the old native texture to be cached as
the new version. Shade-only changes invalidate independently.

`check-native-terrain-texture.py` passes **256 full native texture calls / 262,144
indexed pixels**, with the original amplitude-table initializer, both fog modes
and linked native stain accumulation. Only allocation is supplied; the texture
routine has no stubs. It also compares **256 brightness writes**, stopping before
cache side effects, and **12 opening-map RGBA tiles** from the reflected atlas.
An incremental terrain/shade edit matches a fresh full rebuild exactly. Test
inputs respect the normal terrain processor's zero-cliff/zero-height invariant.

`check-browser-terrain.mjs` verifies the atlas reaches GPU pixels, casts a real
Land Bridge through pointer input, waits for native synchronization and checks
changed texture pixels and partial tile rebuilding. Shade-only invalidation and
browser errors are checked. Opening and bridge screenshots were inspected.

Remaining boundaries: this uses the 32-pixel native generator throughout the
browser crop, rather than reproducing the 16-pixel/cache/LOD dispatcher. The
opening sunlight vector and existing building-shadow fields are live inputs;
dynamic sunlight and complete scenery-shadow lifecycle remain unported. The
pixel routine accepts fog and stain counts, but the live world does not yet
supply their original ownership/scheduling. Atlas filtering and texture-coordinate
insets are WebGL adapters. Water, shoreline rendering, overview and the minimap
remain approximate; next work stays focused on those visible gaps and the HUD.


## 2026-09-08 — native water and full-map rendering

Recovered `004bdcb0` generates the 256×256 indexed water texture from signed
DISP and BIGF. `app/water.ts` reconstructs the complete pixel loop; its caller
owns the resource-ready gate. The live shader scrolls the turn-zero texture by
integer texels, equivalent to the native loop's wrapped displacement lookup.
The original WATDISP table is imported as `public/original/waves.bin` (65,536
bytes), with source provenance retained by the importer.

The point-generation block of `0046cb90`, including the `0046cfc0` shore
predicate, supplies heights and grayscale diffuse values. The shore predicate
uses bit 0x80 of the category's **last mask byte**; direction metadata is not an
interchangeable table. Two wrapped WATDISP samples determine wet-point height
and light. Native `004673b0` selects the water texture for category flag 2 and
multiplies encoded RGB by the point diffuse value. The browser performs that
multiplication after output color conversion. Four new exports bring the
manifest to **661**; raw pseudocode remains distinct from reviewed behavior.

Rendering now covers all **128×128 native cells**, with a 4096×4096 terrain atlas
and the stored native diagonals. This includes the coastal transition beyond
the old z=48 crop, eliminating the visible cut at the southern shore. Land and
water share point heights, including duplicated vertices at texture boundaries.
The separate water plane, guessed sine waves and heightmap-based shore shader
have been removed. Picking uses the same mesh; nine periodic copies remain in
normal view and one in overview. Atlas invalidation still rebuilds only changed
tiles, although the complete RGBA atlas occupies 64 MiB on the desktop target.

`check-native-water.py` passes **32 complete native texture calls / 2,097,152
indexed pixels** and **512 native mesh points**, exercising contiguous and
wrapped rows, all sixteen shore categories, turn wrapping and point flags.
The original shore classifier and point generation execute; only the final
projection consumer is supplied. `check-browser-water.mjs` checks GPU water
changes, vertex animation, 256-turn wrap, pause, shared shore vertices, full-map
extent and overview switching without browser errors. Both opening and southern
shore captures were inspected. The updated terrain oracle passes its existing
pixel/lighting comparisons and twelve full-atlas tile comparisons. Real-browser
Land Bridge and celebration/route/arrival checks pass with the larger mesh.
Typecheck, all 66 regression tests and lint pass (seven existing image warnings).

Remaining boundaries: simulation and deformation still use the existing
cropped/resampled producer, and ordinary orders retain its bounds; rendering the
full map does not complete full-world gameplay. The browser simulation turn
currently feeds both wave and texture clocks, whereas the original texture uses
a separate outer-loop turn. Full native coastal polygon splitting/blending,
fog, palette scheduling, filtering/UV insets and texture LOD/cache dispatch
remain unported. Overview is still a browser projection adapter. These checks
do not establish whole-frame pixel parity. Next priority is the visibly
oversized HUD, original fonts/icons/layout and non-native labels, followed by
controls and critical gameplay feedback.


## 2026-09-08 — compact original HUD and model interaction

Replaced the large text-heavy sidebar with the original minimap surround,
category tabs and selected variants, shaman portrait, class silhouettes,
three-column spell buttons, charge markers and gold panel textures. Chapter
copy, resource summaries, instructional footer and persistent building/shrine
labels no longer cover the play area. Objectives, camera utilities, speed and
help remain accessible in the menu. Original campaign messages remain visible.
The desktop panel scales from a 100-pixel logical width and fits 720- and
1000-pixel-tall windows; this scaling is a browser adapter.

`scripts/import-hud.py` reuses the validated PSFB decoder, importing **398**
HFX/font entries, four border patches and the minimap surround. Artwork and font
source hashes plus executable identity are recorded in `app/original-hud.json`.
The spell definition records at `005a80d0 + model*62` confirm the opening icons
at offsets 16/18: 355/373 for Blast, 356/374 for Lightning and 365/383 for Land
Bridge. Stock/charging state selects the colored or inactive artwork; charge
markers use HFX 54/55/65/66. Original asset dimensions replace arbitrary image
stretching. Interface geometry was compared with `images-2.jpg` and
`populus-3.png`. OpenPop's HFX names and Panel/SpellButton files were inspected
as secondary format/layout evidence; their full game/UI implementation was not
adopted. Existing upstream license/provenance records still apply.

`004fd7c0` loads the sprite font banks. The English branch of `004fe270` clamps
character minus 32 to the bank's available glyph range, issues one glyph draw
and returns its stored width. `00527a30` reads the original width/height directly.
`app/hud-font.ts` and `app/hud.tsx` use those bitmap entries and advances for
follower counts. `check-native-hud.py` passes **606** native glyph selections and
advances across both imported banks and boundary codes. Only the final
`00459d00` raster consumer is supplied; this is not a comparison of its text
projection, tint or compositing. Counts currently use a white browser tint.
Eleven new raw exports bring the manifest to **672**; the larger recovered
panel/font routines remain unreviewed except where behavior above is recorded.

Removing floating labels required retaining their useful interaction. The
existing projected-model picker now resolves both building and shrine meshes,
and both hover and clicks use that shared result. Hover reuses the native name
lookup and original tooltip frame. Forced introduction tooltips take priority.
The immediate hover delay, world-object visibility/occlusion ownership and CSS
text metrics remain browser adapters. Mouse clicks on HUD buttons release DOM
focus so Q/E movement and Space continue working; keyboard-focused controls
retain normal accessibility behavior.

`check-browser-hud.mjs` skips the real introduction, checks panel/button bounds
at 1440×1000 and 1280×720, selects braves, rotates by keyboard after a HUD click,
toggles pause and spell charging, checks building unlock gating, hovers and
clicks the stone-head mesh to assign worship, opens/closes the menu and toggles
overview/shaman focus. It verifies that persistent labels are absent and records
`/private/tmp/populous-native-hud-after.png`. The actual pointer-targeted Land
Bridge check also passes with the new HUD and shared model picker. All 66
regression tests and typecheck pass; lint has three existing-style image warnings.

Remaining UI boundaries: command availability/ordering still follows the live
browser subset, not the complete original slot/control table. Native hover
scheduling, bitmap paragraph layout, font palettes, charge/control dispatch,
minimap rasterization and complete object status panels remain unfinished.
Menu/pause/settings and short command prompts are browser controls. The next
visible priority is selection/targeting and spell feedback, followed by building
activity/destruction; this pass does not establish full interface parity.


## 2026-09-08 — original follower selection arrows

The person branch in `004673b0` draws HFX **53**, a **9×7** downward arrow, above
selected local followers. Instructions `00469415`–`004694f2` gate on the displayed
owner, class 1 and bit 0x80 at object offset 0x7a. The same bit is read by the
campaign's shaman-selected query in `0048cc60` and by the group-command path in
`004359b0`, confirming its selection meaning. These are not the ground circles
previously invented by the browser.

`selectionArrow` in `app/projection.ts` reconstructs this branch. Horizontal
placement subtracts half the scaled arrow width, with native integer rounding;
vertical placement subtracts the rendered **VFRA header height**. Composite
bounds can extend beyond that header because of clothing/weapons, so their image
height is not an interchangeable input. `0042c320` copies the header dimensions
from source VFRA bytes 2 and 3. The importer now retains source frame IDs and
both header dimensions for all **2,216** composited frames, and imports
`public/original/selection.png` from the original HFX bank. Existing input hashes
continue to identify these assets.

The live renderer replaces selected-unit ring geometry with that sprite. It
updates the arrow alongside each person pose, uses the existing native sprite
scaler for shamans/scaled views and keeps ordinary world depth testing. Only
local selected people display it. Browser selection-list ownership still
supplies the native selection-bit input. Death-effect sprites have no selection
indicator. The marker uses nearest filtering, consistent with the other native
unit/effect sprites.

`check-native-selection-indicator.py` executes **1,024** native decisions and
rectangles, including owner/class/selection gates and scaled/unscaled paths.
The original `00476090` scaler executes; only final sprite submission is
supplied. `check-browser-selection.mjs` checks actual GPU changes from visible
markers, group/shaman selection, twelve real walk poses with varying native
header heights, and rejection of enemy-owner indicators. A marker obscured by
world geometry is not expected to change GPU pixels, so the visible-marker test
compares the selected group rather than assuming its first member is exposed.
No depth-test bypass was introduced. Captures were inspected at
`/private/tmp/populous-selection-braves.png` and
`/private/tmp/populous-selection-shaman.png`.

The real HUD/command/worship interaction check also passes; all 66 regression
tests, typecheck and lint pass (three existing image warnings). Seven additional
raw exports bring the manifest to **679**, retaining the circle, health and
sprite-queue routines inspected during this investigation. They are not all
integrated ports. The existing native group-selection oracle is preserved.

Remaining boundaries: live person sprite scaling still supplies the prior
signed unit bucket (+1/-1) rather than the complete native painter-queue depth.
Full ordering, terrain/object occlusion and presentation flags remain unported.
Selection-box graphics, health bars, shadows, spell targeting/range graphics
and full effect timing still use browser adapters. Next work remains on those
visible targets, beginning with spell cursors and travel/impact feedback.

## Original spell pointer feedback — 2026-09-08

`00524cf0`'s standard spell interface draws from **POINT**, not HFX, for the
spell icon. The signed word at `005a80dc + model*62` selects Blast 41,
Lightning 49 and Land Bridge 48. It draws at mouse `(x,y-16)` without the
person sprite scaler. Unavailable targets or readiness other than 3 add
**HFX 589** at the unsigned offsets in `005a810c/0d + model*62`. This differs
from simply changing a ground ring's color.

For normal mode, a valid globe hit and target result -2 additionally draw a
walking person at `(x+31,y-16)`. The descriptor reached through `005a7dff`
selects POINT 80–83; the native outer turn `0089d184` supplies modulo-four
phase. The browser now imports these assets through the existing HUD atlas,
retains their original dimensions, and reconstructs the sprite decisions in
`app/spell-casting.ts`. No new rendering dependency is needed.

`scripts/check-native-spell-cursor.py EXE` executes **2,048** calls to the
original `00524cf0`, covering all 22 spell records, target results, readiness,
globe hit/miss, normal/alternate rules and screen positions. The standard spell
interface is selected; target validation (`004c24f0`), readiness (`004c28a0`),
the shared cursor-blocking query and final sprite submission are supplied.
This proves sprite decisions and offsets for those inputs, not the entire
native UI state machine or rasterizer. Three raw exports bring the manifest
to **682**; readiness/special-mode exports remain evidence, not full ports.

Live cursor feedback shares the existing command target checks through
`spellTargetError`, including a missing/busy shaman, native range calculation,
the browser map boundary and dry-shore rule. Stock remains the browser's
first-mission readiness adapter. A stationary pointer is picked again when
the camera, mode, terrain or viewport changes; leaving the world clears it.
Terrain picking is cached between those changes, avoiding a full projected
mesh scan every render frame. The invented small spell target ring is removed.

`node scripts/check-browser-spell-cursor.mjs` checks real keyboard/mouse input,
all three spell icons, DOM offsets, range animation, no stock, a wet shore, a
busy shaman, camera rotation beneath a stationary pointer, HUD leave, and
both rejected and successful casts. It captures ready/range states at
`/private/tmp/populous-cursor-ready.png` and
`/private/tmp/populous-cursor-range.png`.

Both captures were inspected. The cursor browser check and existing HUD/command
check pass, as do 66 regression tests, typecheck and production build. Lint
reports only the three existing image warnings. The importer retains 423 HUD
sprites/glyphs in the shared atlas.

Remaining visible boundaries: the operating-system arrow, native cursor mode
ownership, special alternate/minimap modes, building/order cursors and counts,
ground tile/range overlays and full spell effects. The walking cursor currently
uses the browser simulation turn; native outer-turn ownership is still open.
The casting circle and building placement ring remain browser geometry. Native
palette scheduling, device-pixel scaling and complete renderer parity are not
established by the cursor comparison.

## Original casting-range halo — 2026-09-08

`00475a70` replaces the invented continuous blue casting circle with **85**
terrain-anchored particle/shadow pairs. The 16-bit phase at `0059d9d0` advances
by 8 per draw, particles are spaced by 24 native angle units, and the last
angular gap is intentionally 32. Each position calls original `004e6a70` with
a signed-short range, wraps the map coordinates, then samples `0044e940`.
The browser reuses `nativeStep` and the already verified `terrainPointHeight`,
including the stored diagonal and pending terrain changes, rather than
recomputing a diagonal or sampling the cropped display-height array.

Each visible point allocates a type-24 body and type-25 shadow. Body frames
are HFX `1466 + ((particle + sprite_animation_counter) % 12)`, 32×32 pixels,
centered horizontally and bottom-anchored. The draw branch `0046b294` selects
AL0; `00516270` derives its vertex tint from the palette index at `AL0[0x2f82]`.
The importer retains that RGB value and the twelve nibble-alpha frames. The
shadow branch selects HFX 70, uses the normal sprite-scaling helper and sits
two screen pixels below the bottom anchor. Its bucket comes from
`clamp((projectedDepth + 0x6ed4) / 16, 0, 3584)` with the native below-64 gate.

`app/spell-halo.ts` reconstructs positions, stored-diagonal heights, phase,
frame selection and bucket calculation. `check-native-spell-halo.py EXE`
executes **256 complete native loop calls**, comparing **21,760** positions,
heights and frame IDs, **43,520** body/shadow queue records and their buckets.
Movement, terrain sampling, phase advancement, frame arithmetic and allocation
execute as original x86. Only range and camera projection are supplied; the
fixture makes points visible. Pool exhaustion and camera clipping are outside
this comparison. Existing projection/scaling checks cover those mathematical
helpers, not the complete painter.

The live range is now a reusable group of original sprites. Selecting a spell
takes priority over HUD hover, while hover alone previews its range, matching
the routine's selected/fallback model lookup. Spell flag `0x8000` suppresses
the halo. Browser UI supplies the hovered model; alternate/minimap origins
remain unported. Range calculation stays shared with real casting. Shared
effect-atlas updates continue to serve ordinary spell effects after the atlas
grows to 2048×4096.

`node scripts/check-browser-spell-halo.mjs` checks all 85 pairs, exact height
anchors, original sprite dimensions, GPU-visible pixels, animation, hover vs
selection priority, camera rotation, pause, absent shaman and cancel. It also
casts a real Blast and checks its impact sprite reaches GPU pixels. Captures
at `/private/tmp/populous-halo-blast.png` and
`/private/tmp/populous-halo-bridge.png` were inspected; the impact capture is
`/private/tmp/populous-halo-impact.png`.

All three captures were inspected. Halo, cursor and existing HUD/command
browser checks pass, as do 66 regressions, typecheck and production build.
Lint has three existing image warnings. The export manifest verifies **685**
functions and retains the supplied executable identity.

Remaining boundaries: animation uses a 12 Hz browser presentation clock;
rotation advances per browser draw. Native clock ownership, special UI gates,
pool limits, complete painter ordering, palette scheduling and raster blend
behavior remain open. Shadow transparency/depth compositing uses the existing
browser renderer. These checks establish the recovered inputs and geometry,
not pixel-identical frames or full range/effect parity. Three additional raw
exports retain the halo and investigated ground-overlay helpers. Ground target
tiles, spell travel/impact spawners and construction/destruction are next.


## Original Blast impact flash — 2026-09-08

The native spell-2 table at `005a80f8 + 2*62` allocates effects
`[5,3,78,38,0]` in `004c1d10`. Effect 38 selects state `0x24`, grounds its
position through `00445c20`/`0044e940`, and calls `004ee700` with draw 30 and
HFX1099. Its nine frames are **1099–1107**, not the previously imported
1180–1193 sequence belonging to effect 62. Descriptor 30 advances `f1` by four
per presentation update; the existing complete `004ee7b0` reconstruction sets
object `0x650` after the ninth frame. `0050a750` separately deletes the effect
object on its ninth simulation turn.

The live effect now owns that native animation record and uses the same
presentation adapter as native people. Rendering honors the terminal object,
original frame sizes and integer horizontal centering, with the artwork's
alpha instead of an additional lifetime fade. Grounding queries the stored
native terrain diagonal. The synthetic expanding Three.js ring was removed:
`0050b740` expands a target scan, not a visible ring. `0050b630` emits sound
`0xa1` for effect 78 before effect 38 emits `0xb2`; both now reach the existing
sound event adapter at impact, in addition to the projectile's earlier cue.

`check-native-blast-flash.py EXE` runs 128 initializations at varied wrapped
positions, the real terrain query and animation setter/updater, 2,688 animation
records and the nine-turn effect dispatcher lifetime. It also verifies native
impact sound order, the light request and imported frame IDs. World registration,
class callbacks, audio/light consumers and final object free are stubbed at
explicit boundaries; native initializer/state selection still execute.
The game regression checks actual deletion on turn nine and preservation while
paused. The existing `check-browser-spell-halo.mjs` now additionally checks a
real Blast impact's GPU pixels, native object/draw, one sprite with no ring,
height anchor, full material opacity, pause, animation termination before
object removal, and cleanup after simulation resumes. The paused impact capture
`/private/tmp/populous-halo-impact.png` was inspected. All 66 regressions,
typecheck, browser check and production build pass; lint retains three existing
image warnings. The export manifest contains 691 functions.

Remaining visible work: effect 3 and projectile trails have a second phase in
`0050bd70`/`0050beb0` that is not yet integrated; effect 5 (`0050c510`) ignites
burnable scenery; effect 78's three physical scan passes remain a browser damage
adapter. Native local terrain lighting is requested by the flash initializer
but is not rendered. Shared native timer ownership, overview sprite scaling,
complete palette/blend and painter behavior remain open. The current 24 Hz
presentation clock and 12 Hz simulation clock are adapters, not evidence of full
frame timing parity. Six raw exports retain grounding and investigated effect
helpers. `00478ee0` concerns landscape restoration, despite a misleading metadata
name, and was not used to implement Blast. Full game parity remains unfinished.


## Original spell trail phases and motion — 2026-09-08

`004bb440` allocates effect 3 behind the Blast projectile and overrides its
initial lifetime to zero. `004baf00` allocates effect 4 along Lightning/Land
Bridge travel, retaining a four-turn first phase. The previous browser adapter
used four frames and a shared four-turn fade for both; it missed the second
phase and movement.

`app/spell-trails.ts` reconstructs `0050bf60`, `0050c380`, `0050bd70` and the
transition in `0050beb0`, followed by state 4 of `0050a750`. Effect 3 starts
HFX314; effect 4 starts HFX322 with `f1 = (class_counter & 3) * 4`. On first-phase
expiry the object advances by four, resets its animation time and enters state
4 for three more turns. The transition preserves render bits `0x4050`, clears
`0x8000`, and selects draw 1 or 29 from the signed palette byte; flag `0x200`
requests deletion instead. Blast jitter consequently transitions on its first
processing turn and dies on turn four. Ordinary spell trails die on turn seven.
The importer now retains all eight original frames in each sequence. Rendering
uses the current object plus native frame offset and artwork alpha, without
an extra opacity fade. The shared native animation adapter drives both phases.

The newly exported `004e7a80` supplies directed trail movement. Its actual
path for fresh effects 3/4 is reconstructed with existing terrain and velocity
cap helpers: Blast's speed 20/pitch zero raises it ten native height units each
turn; fresh effect-4 trails have speed zero. Movement precedes phase expiry,
including the final deletion turn. Other impulse, ballistic/debris and destination
motion branches remain unported here and are rejected rather than silently using
trail physics. Effect-3 allocation advances the separate `0089bc72` cosmetic
random generator once; it does not consume the game RNG used for jitter.

The live world stores that cosmetic generator and a class-counter adapter for
browser effects. **The initial cosmetic seed and complete native class-7 counter
ownership remain approximations**: browser allocations are not the original
mixed-class pool and do not yet include every supporting effect. The recovered
initializer accepts the original counter explicitly, so that allocation ownership
can replace the adapter without changing animation rules. The original 24 Hz
presentation and 12 Hz simulation adapters remain separate; native outer-clock
configuration is still open.

`check-native-spell-trails.py EXE` compares 256 initializations and 2,816 timeline
snapshots against native code: varied terrain/diagonals, all initial frame phases,
wrapped coordinates, speed/angle caps, frozen movement, indefinite lifetime,
palette branches, phase-preserved flags, deletion and cosmetic RNG. Class
callbacks, cell insertion and free are intercepted; actual original terrain,
directed physics, caps, animation, initializer and dispatcher instructions execute.
The existing gameplay regression verifies live Blast rise and zero-turn override,
staggered Lightning poses, seven-turn lifecycle and unchanged jitter game RNG.
`check-browser-spell-trails.mjs` casts all three spells through real input, checks
both phases, texture coordinates and sprite sizes, upward/stationary motion,
pause, GPU pixels attributable specifically to trail sprites, and deletion.
All three paused captures are retained in `/private/tmp/populous-*-trail.png`;
Blast and Lightning captures were inspected. Typecheck, 66 regressions, the browser
trail check and production build pass. Export manifest now contains 692 routines.

This does not complete spell effects: the synthetic Lightning line, native local
lighting, Blast's separate impact trail allocation, scenery ignition and complete
physical blast response remain visible priorities. Overall game parity remains
unfinished.


## Original Lightning bolt geometry and drawing — 2026-09-08

Spell 3's impact table allocates effect 17. `004c21e0` stores a projectile
endpoint displaced `0x600` toward the caster and raised `0x400`, retaining the
clicked destination separately. `00511ef0` grounds that displaced endpoint and
raises it `0x400`; `00511f70` then creates an eight-turn upper HFX1361 flash
(draw 41) and effect 30. The browser previously discarded the displaced endpoint,
put its flash on the clicked ground, and drew a tall sine-generated line.
It now preserves the endpoint, delays the upper flash and sound one turn,
and starts the bolt generator on the following turn.

`app/lightning.ts` reconstructs the geometric portion of `00511ae0`: nine
points/eight segments, native wrapped direction and distance, 128-unit vertical
steps, and jitter radius 200 down to zero. Point zero is replaced by the stored
upper endpoint. Each segment's `00511a60` initializer clamps its start to local
terrain while retaining the original endpoint delta; `0046fc30` projects the
resulting endpoints. The generator creates three successive shapes and consumes
eight game RNG draws each time; its separate saved seed draw does not change the
game RNG. The browser clears segments after their last one-turn lifetime while
the upper flash completes its own lifetime. Damage timing and native supporting
allocations remain separate from this visible-effect reconstruction.

The type-19 draw block at `0046b0f5` emits a textured strip with alpha 200 and
width exponent 3, then invokes `00475350` for recursive screen-space branches.
Those branches use the separate cosmetic RNG, twelve-pixel vertical steps,
width exponent 2 and the native length/brightness recursion. The global draw
alpha is deliberately not restored on return from recursion: native comparison
caught this otherwise subtle brightness difference. `00516500` supplies the
integer-angle strip corners and ceil rounding; the x87 addition retains enough
precision to differ from rounding the intermediate sum to float32.
`004b7de0` creates the 32x32 blue procedural texture. All its ARGB4444 pixels
are recreated, including original `.2/.8` strip UVs sampled at `v=.5`.
The apparent negative texture lookup in Ghidra is a stack-variable inference
artifact: original assembly indexes the palette starting at zero.

The existing Three.js renderer now draws these textured triangles with the
native projected endpoint pixels. Main bolt geometry advances on simulation
turns; screen branches regenerate on draws, including while paused. Native
normal-view projection is reused directly without an NDC round trip before
integer endpoint conversion. Overview projection remains the existing browser
adapter. Texture values bypass an extra color-space conversion in the custom
shader. The synthetic `LineSegments` branch geometry and added lifetime fade
were removed.

`check-native-lightning.py EXE` compares 384 native bolt shapes/game RNG states,
256 complete recursive branch streams/cosmetic RNG states, 1,024 strip quads
and all 1,024 procedural texture pixels. Native trig, distance, terrain,
segment grounding, recursion, ceil and texture loops execute. Damage/fire,
world allocation ownership and final rendering are intercepted at explicit
boundaries. `check-browser-lightning.mjs` casts through real input and checks
upper-endpoint displacement, original flash object/draw, eight segments,
texture bytes, pixels attributable only to the bolt (over 6,000 in the inspected
capture), three shapes, paused simulation with live cosmetic branching,
camera rotation and cleanup. Shape snapshots slow simulation to avoid missing
a turn under browser/GPU load; exact timing is checked separately against native
code and in the gameplay test. `/private/tmp/populous-native-lightning.png` was
inspected against the prior synthetic-line capture. The existing trail check
also passes; its phase observer accepts any of the three remaining turns rather
than assuming the browser always observes the first frame after transition.
Exact phase duration remains checked in the native oracle and gameplay tests.

The suite now has 67 passing regressions, including delayed upper-flash timing,
all three shapes and independent flash lifetime. Typecheck and production build
pass; lint retains three existing image warnings. Manifest contains 699 routines.
Seven newly retained raw exports cover the bolt, texture and draw helpers;
`00512700` is terrain deformation despite its misleading `process_lightning`
metadata name, and is not used for this spell.

Remaining boundaries: original mixed-class allocation order and class counters,
first-turn scenery ignition/crater and physical-shock allocations, complete
Lightning damage/death timing, local terrain illumination, native painter queue
ordering and blend flags, other display pixel formats, and outer-clock ownership.
Current strips use the browser alpha-blend/overlay adapter, so the comparisons
prove recovered geometry and drawing inputs, not pixel-identical whole frames.
Ground target/placement tiles and visible fire/building activity are next;
full game parity remains unfinished.


## Original connected ground overlays — 2026-09-08

The circular building-placement marker has been replaced with the original
BL320 connected tiles, grounded at the native terrain vertices and using the same
bank-2 shape-mask traversal as building occupancy. This is a rendering port with
an explicit browser placement-controller adapter, not complete placement parity.

Evidence from `d3dpoptb.exe` SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`:

- `0046d070` queues each terrain triangle and dispatches marked cells to
  `00474ba0`. Native vertex order changes with terrain flag 1.
- `00474ba0` chooses edges/corners from four cardinal neighbors, then diagonal
  neighbors when all cardinal cells connect. Coordinates wrap at 128 cells.
  The resulting tile index is 0–7 or 15; masks 0x80/0x400 add 48, and 0x100
  adds 64 before the red branch subtracts 16. Invalid vertices use 0xffff2020.
  Terrain flag 1 rotates UVs by three quarter-turns. The second triangle uses
  the opposite UV rotation. Flag 0x800 instead selects tile 242 and the direction
  table at 005a885a. The helper implements that branch; live doorway selection
  remains outside this change.
- `0046eb80` copies the source triangle, reads six fixed-point UV components
  from 005a2f30 and allocates a 68-byte type-8 polygon. `00474ba0` overrides
  its draw flags to 31 and preserves the source triangle's rotation byte.
  Pool exhaustion and absent input triangles are handled by native allocation.
- `0042af10` initializes the UV table to zero or `(32 << 16) - 1` for this
  texture size. Its executable initializer block 0042b076–0042b18b runs in
  the native comparison, avoiding a test-supplied copy of the UV table.
- The draw dispatch's assembly at `0046a7ca–0046a7e2` reads the type-8 tile
  byte at +0x42 and uses `005d2510 + tile*4`. Ghidra's nearby inferred union
  fields/array bases are misleading; the assembly confirms direct bank-2
  indexing. `004b6e60` creates those texture entries from the corresponding
  32×32 BL320 tile; existing `atlas.png` already contains this original artwork.
  Native animated BL320 redirection is in `0044fbd0` and remains unintegrated.

Implementation:

- `app/ground-overlay.ts` reconstructs tile/tint/rotation selection and the
  original triangle/UV arrangement. `scripts/check-native-ground-overlay.py`
  executes **2,624 original calls**, covering all 256 neighboring masks in both
  terrain diagonals and five mask modes, arrows, wrap boundaries, missing
  triangles and pool exhaustion. Both the original UV initializer and allocator
  execute; the reconstructed output matches the original records.
- `buildingFootprintCells` shares the existing native mask-bit-1 traversal with
  `registerBuildingFootprint`, avoiding a second footprint approximation.
  The existing native footprint check still passes **632 complete map/consumer
  comparisons and 4,096 cell-shade comparisons** after the extraction.
- `Scene.updatePlacement` builds a small terrain mesh only when its native cell,
  building kind, validity or terrain version changes. It uses the original
  atlas and exact stored vertex heights, with the renderer's native projection.
  Transient preview flags never mutate simulation terrain ownership. The old
  procedural circle and its terrain-ring updater have been removed.
- `scripts/check-browser-ground-overlay.mjs` uses actual HUD selection and mouse
  clicks. It checks nine hut cells, 54 grounded vertices, atlas UVs, **5,603
  visible GPU pixels**, cell transitions, a camera turn, native red tint,
  rejection of overlapping construction, leaving the world for the HUD,
  successful placement and Escape cancellation. No browser errors. Screenshots
  `/private/tmp/populous-ground-placement.png` and
  `/private/tmp/populous-ground-invalid.png` were visually inspected.

Remaining boundaries: the browser's validator still decides validity for the
whole footprint; native per-cell marking, the plan-preview controller, selected
orientation and entrance arrow, plan allocation and exact anchor ownership are
not integrated. Validity rules still use the earlier construction adapter.
The browser samples the atlas with half-texel insets and uses WebGL depth offset,
alpha blending and sRGB material tinting; native texture padding, filter/LOD,
blend flags and painter order need separate comparison. Native output records
and visible browser pixels do not establish whole-frame pixel parity.
Additional exports `00403f00`, `004b81e0`, `004b8470`, `004b8bb0` preserve the
related foundation/plan investigation; their full controllers are not ported here.

The inspected desktop captures show unit cutouts and building surfaces that need
comparison against isolated original sprite/model renders. Audit these visible
issues before adding more internal simulation ports.


## Reincarnation stone layout — 2026-09-08

The apparent striped unit cutouts were original mesh-30 reincarnation stones
crowding the units. Sprite contact sheets were intact. The renderer had invented
eight radius-2.8 positions and tangent headings. `app/reincarnation.ts` now uses
the eight signed coordinate pairs at `0x5a9f10`: (0,6), (4,4), (6,0), (4,-4),
(0,-6), (-4,-4), (-6,0), (-4,4), in 256-unit coordinates. Each stone is snapped
to a 512-unit cell center, with 16-bit map wrapping.

This is not inferred solely from the god-mode reset at `0x41c140`. Normal shaman
site creation at `0x433a10`, state 3, selects the same table in reverse countdown
order and launches class-8/model-1 carriers. Those carriers request effect 7,
whose initializer `0x50c690` replaces the indexed scenery-class-5/model-12 stone.
`0x4a7d80` snaps the stone and computes its heading from signed wrapped deltas
relative to tribe offsets `0x911/0x913`; terrain height comes from `0x44e940`.
The browser renderer now uses those exact positions, heights and headings and
recreates the geometry placement after terrain updates.

`scripts/check-native-reincarnation.py EXE` runs the actual normal creation state
and stone initializer for 256 centers × eight stones, covering all four tribes,
cell boundaries, wrap seams and both stored terrain diagonals. It intercepts
allocation, registration, object-setting, shadow submission and the separate rise
update; it does not claim to verify those subsystems. Native coordinate, height
and angle code executes unmodified. `scripts/check-browser-reincarnation.mjs`
checks all 16 rendered stone transforms, keyboard camera rotation and grounding
after terrain deformation.

The additional exports `0x4a6480`, `0x4a7eb0` and `0x514240` are investigation
evidence, not new ports. `0x4a7eb0` contains stone rise/sink behavior; `0x514240`
is a separate shaman-placement path. The browser still initializes two static
first-mission sites; creation order/timing, particles/sounds, rise/sink, relocation,
removal and complete tribe lifecycle remain unported here.


## Original building-collapse smoke — 2026-09-08

The browser collapse adapter used a generic `death` puff (HFX1224) at the building
center. Native `0x4092a0` instead calls `0x40b320`, selects a smoke socket from the
current object's rotated shape, and allocates class-7/model-76. The shape record
contains up to six triples at offset 26, terminated by zero in the third byte.
Coordinates use first/third bytes at scale 32, relative to the shape origin and
building anchor. The middle byte is unused by this routine. Shape import now
preserves these sockets; `buildingSmokePoint` reuses the existing shape lookup.

Effect 76 initializes through `0x5119d0`: state 62, HFX1345, descriptor 48,
16/256 x/y scale, palette 7, looping 16-frame animation, and lifetime 96..159 from
simulation RNG. The damage caller then consumes another RNG value and replaces
lifetime with the imported smoke duration plus its low byte. Socket selection,
effect initialization and caller override retain that RNG order in the browser.
No-socket shapes allocate nothing and consume neither allocation RNG draw.

`app/building-smoke.ts` reconstructs `0x50be00`: grow by 16 to 256, hold, shrink
when fewer than 16 turns remain, clear the native flags, re-ground on terrain
invalidation, and remove at expiration. Negative lifetimes remain permanent.
The live adapter uses the shared native animation clock and marks ground changes
from `landVersion` until original effect registration owns invalidation.

Rendering follows scaled-HFX queue `0x46f9e0` and the type-18 branch of `0x4673b0`.
The queue's depth bucket is `(z + 0x6f80) / 16`, lower cutoff 64 and upper cap
0xe00; traversal passes bucket+1 to `0x476090`. Dimensions first multiply by the
signed 8.8 scales, then use the existing resolution/depth conversion when enabled.
Palette 7 selects AL0+7*4096 before `0x516270`; its imported tint is black.
`import-original.py` now includes HFX1345–1360 and this tint, and
`inspect-executable.py` imports descriptors through 48.

`scripts/check-native-building-smoke.py EXE` compares 632 socket/allocation cases
(all 158 objects × four directions), 512 lifecycle/terrain/flag cases, and 512
native sizing/bucket calculations. The animation harness additionally verifies
2,352 setters and 3,136 updater cases across the expanded descriptors.
`scripts/check-browser-building-smoke.mjs` triggers the live collapse adapter,
checks growth, frame cycling, exact grounding, actual GPU contribution (737
pixels in the recorded run), camera rotation, shrinkage and removal. The atlas
change is also covered by the existing browser Lightning check.

Inherited symbols are hypotheses: the function labeled `process_building_smoke`
at `0x5149f0` actually updates expanding terrain rings, whereas the function labeled
`process_small_sparkle` at `0x50be00` handles this scaled smoke lifetime. The new
scenery state exports (`0x4a6f40`, `0x4a6fd0`, `0x4a7170`, `0x4a73d0`) are evidence
for continuing fire work, not implemented scenery parity. Tree ignition/spread,
fire damage, building debris, full plan ownership and native painter/blend order
remain open. This change covers collapse smoke rather than the whole destruction
system.

## 2026-09-08 — original building collapse fragments and impacts

The live damage adapter now implements its `00407860(b,0,1,oldStage,0,1,-1,-1,0)`
debris callback. `app/building-debris.ts` selects lost faces for stages 0–4,
recovers raw original points through the existing model transform, applies the
native per-vertex ground warp and computes wrapped integer centroids/local points.
The importer retains each face's tile index; cap faces use tile 250, and
`005aa218` supplies the tribe-relative texture flag. The renderer reuses the
existing atlas and model matrix, drawing each detached triangle/quad independently.

`00502460` initializes class-10/model-7 fragments; the collapse caller replaces
launch strength and spin. All six initializer RNG draws and four override draws
are preserved. Emission is a generator so each fragment's immediate first update
and any landing RNG execute before the next allocation. The new shared
`moveDirectedEffect` owns `004e7a80`'s directed branch for both debris and trails;
existing velocity limits, terrain queries and model transforms are reused.
`00502660` applies gravity, updates three rotation angles, and emits effect 3 plus
cue 19 on land or effect 65 on water. Native bounce/removal and game RNG match.
Class-10 allocations no longer advance the class-7 animation counter.

Water impacts now initialize through the shared splash adapter with `00513830`'s
ground height, descriptor 44/HFX1304, morph 211, flags and cue 44. Native timed
impacts use an integer turn countdown: floating-point seconds had extended the
16-turn splash by one turn. Presentation still uses the shared animation clock.

Validation: `check-native-building-debris.py` executes 300 original collapse
calls across twelve building models, every stage, rotations, terrain warp and
world seams: 9,755 face records, launch values and local points match exactly;
atlas UVs agree within importer precision. Its 8,192 flight snapshots cover
land/water categories, bounce, removal and RNG; 128 native splash initializations
also match. Terrain category is byte 12 of the 16-byte tile record (the inherited
`c_3` label is not a byte offset). Existing trail comparisons and 2,096 complete
stage-renderer calls still pass after the motion/cap refactors. The real browser
collapse shows 37 textured fragments contributing 3,298 GPU pixels in the recorded
run; flight/spin, camera rotation, impact cues and mesh cleanup pass without errors.

Fallow health/duplication and ox-standard were run for the readability review.
The new motion and debris modules introduce no Oxlint findings after simplifying
drag; the touched NativeModel declaration now follows the preset. Existing large
simulation hotspots and repeated browser-test setup remain explicit debt.

Boundaries: full native face lighting, painter/blend ordering, class allocation
limits/ownership and mixed-class scheduling remain open. Attachment-driven debris,
other emitter modes and scenery fire are not implemented by this slice. This is
collapse-fragment parity, not complete destruction or whole-frame visual parity.

## Scenery fire, burning trees and atlas decoding — 2026-09-08

Lightning now follows the first-bolt scenery branch with original model 5,
ANIBL's nine fire frames, native growth/shrink, embers and expiry smoke. Burning
trees consume four native wood units per turn and shrink with the original
wood-to-scale calculation. Empty-cell fire uses the native 24-turn lifetime;
tree fire uses 76 turns. Full propagation, building ignition and replanting remain
open. Native allocation limits, class ordering, lighting and painter ownership
are still browser adapters.

The browser screenshot exposed an asset-decoding error: flame texels interpreted
as ordinary palette indices appeared green. `004b6e60` and `0042fb30` establish
which tiles instead use AL colors and nibble opacity. The shared object atlas is
now decoded accordingly; all 262,144 texels match isolated native converters.
Fire comparisons also cover 128 initializers/lifetime settings, 10,240 lifecycle
snapshots, 2,400 tree snapshots and 512 facing angles. Browser Lightning ignition
contributes 561 GPU pixels in the checked view and completes smoke/tree cleanup.

Maintainability: fire state uses meaningful booleans instead of native flag
words. Smoke and trail initializers copy coordinates explicitly, preventing a
fire's timer from leaking into smoke and triggering the wrong effect dispatcher.
Browser setup and effect visibility checks are shared. Fallow and ox-standard
were run; legacy complexity/lint debt remains open. See the runnable checks and
precise comparison boundaries in [the decompilation guide](../decomp/README.md#scenery-fire-and-object-texture-alpha).
