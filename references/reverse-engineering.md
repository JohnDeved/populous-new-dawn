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

## Building ignition, evacuation and structural damage — 2026-09-08

Lightning now finds a building through the target cell's native footprint instead
of applying a radius-based 57-HP subtraction. `00408cb0` rejects protected models
and already-burning buildings; a locked building retains its state while still
recording a valid attacker. `00408840` initializes a signed 127-turn burn timer
and checks all six fire triples at shape-record offsets 26–43. These use the same
rotated shape origin as other building geometry, but do not stop at smoke's zero
terminator. Successful flames use size+1, flags 5 and lifetime 135, and suppress
the building-owned sound cue. The first slot also requests sunlight, still unported.

`00408ab0` evacuates at timer 119, requests cue 0x53 when eligible above 79, stops
that cue at 79 and removes one 100-unit structural log. Stage changes reuse the
original smoke socket/allocation path with its lifetime override; this branch does
not request collapse fragments. Plan delay and attacker are retained. At expiration,
the building returns to repair state. The live gameplay adapter permits repair
using the existing timber/construction producer, preserving damaged model stages.

Validation: 632 native ignition/socket cases and 512 burn-phase cases pass,
including protected/already-burning/locked states, failed allocations and signed
timer boundaries. Existing native shape (30,336 points), damage, smoke and scenery
fire checks pass after sharing helpers. Seventy gameplay regressions include the
whole ignition–evacuation–damage–repair path. Browser checks verify five correctly
placed fire meshes (2,826 GPU pixels in the recorded view), structural damage,
smoke and cleanup; a fallback owned cue is played and explicitly stopped through
Web Audio. Scenery-fire and collapse-debris browser checks remain green.

Maintainability: `collapse` is renamed `damageState` now that it owns ordinary
structural damage too. Damage initialization, smoke allocation and geometry steps
are shared; defeat reuses existing damage state instead of resetting it. Fallow
health/duplication and focused ox-standard checks were run. Legacy large-function
and lint debt remains; the new code is not evidence that the whole repository is
clean. Native panic movement, sunlight, full plan/lifecycle ownership, exact repair
timing, voice scheduling and mixed-class ordering remain explicit integration gaps.

## Plan rotation, entrance arrows and shared placement anchors — 2026-09-08

The preview previously hard-coded angle zero, omitted the entrance arrow and used
an unsnapped click position for the placed model. Space also paused while a plan
was selected. The original [controls reference](https://ts.popre.net/websites/poptb.com/guide/getting-started/controls/index.html)
identifies Space as plan rotation; executable `004aab80`, command 0x7b, supplies
the exact direction increment/wrap and cue 0x26. Direction lives in each 18-byte
building-icon record at `005a8858`, rather than one shared orientation.

`004b9190` reads the object from the native building descriptor and selects its
quarter-turn shape. Its preview branch marks the outside-door cell with 0x800
independently of occupied cells (bit 1). The first-level hut's doorway cell has
mask 4 or 6, so iterating only the occupied footprint lost it entirely. Door cell
coordinates are signed shape outside coordinates shifted by three, relative to
the same wrapped shape origin. `0046d070` queues arrow-only cells with mask zero;
the existing `00474ba0` port supplies tile 242 and direction-dependent UVs.

The renderer now includes that separate cell and uses descriptor-selected plan
objects. `buildingPlanPose` shares direction and the snapped anchor between
preview, validation and placement. Builder routes use the placed building's
selected orientation before their orders are assigned. Each building type retains
its direction when another is selected. Space rotates while selecting a plan and
plays the imported cue; keyboard auto-repeat does not repeatedly toggle pause.
The target prompt and help explain the binding.

Validation: 632 native preview-geometry comparisons across all 158 imported
objects and four directions, plus 64 complete rotation commands/cue calls.
Territory, per-cell validity, capacity and entrance-access callbacks are supplied
in the geometry check; their rules are not claimed as ported. The existing 2,624
overlay checks and 30,336 native shape/doorway checks still pass. Seventy-one
gameplay tests include building all four orientations, matching preview anchors
and assigned entrance paths. Real browser input checks the entrance itself
(243 visible GPU pixels), all rotations without pausing, invalid clicks, snapped
placement, rendered heading and cancellation. Preview and placed-model captures
were inspected.

Maintainability: a small shape helper reuses the existing footprint traversal,
and the shared plan pose prevents separate renderer/input orientation state.
The browser check now reuses common setup and is formatted for reading. Fallow
health/duplication and focused ox-standard checks were run; existing large-module
debt remains. Full native preview lifecycle, per-cell validity, territory limits,
plan allocation and construction ground changes are still open. This advances
visible controls without claiming complete placement or whole-frame fidelity.

## Shoreline vertex shading and additive terrain light — 2026-09-08

The browser multiplied diffuse into open-water triangles only. Original terrain
triangles also receive the point color from `0046cb90`, including wet vertices
on the coast. `0046c340` converts numeric values below 32 into eight-times-value
grayscale; higher values use white diffuse and a specular strength clamped from
`value*5-160` to 256. Tint channels multiply this strength and shift by eight.
Packed ARGB values bypass conversion and clear specular.

`004673b0` uses tint 0xfdb935 on terrain, while its water branch clears specular.
`004e3bc0` enables D3D render state 29 before submitting its textured batch, then
disables it for subsequent work. `004f9380` copies queued triangle vertices and
sets RHW=1; this confirms the existing affine browser projection rather than
requiring a new perspective-correction approximation. These raw exports preserve
the renderer evidence without claiming its complete queue/hardware pipeline.

The shared `vertexLighting` helper supplies normalized diffuse/specular attributes.
The readable terrain shader applies both after output color conversion, preserving
the original encoded-color arithmetic. The wet shoreline now responds to native
wave shade along with open water. Terrain-light ownership remains separate: no
invented sunlight animation was added to exercise the new renderer channel.

Validation: 1,408 complete native conversions execute without stub consumers,
covering ordinary strengths, saturation, arbitrary tints and packed ARGB. The
full native projection suite still passes after replacing nested conditions and
chained assignment with straightforward control flow. Seventy-one gameplay tests,
type checking, lint and build pass. The browser compares 49,213 changed coastline
pixels against the old omission and 6,817 pixels responding to supplied warm-light
inputs, while water highlights remain zero. Wave animation, 256-turn wrap, pause,
shared coast heights and overview pass. A real Land Bridge cast continues to
refresh changed terrain and shade data without browser errors. Matched-view
coastline captures were inspected.

Maintainability: projection declarations follow ox-standard, the touched module
passes its focused lint, and the water browser check reuses shared setup and is
formatted for reading. Fallow health/duplication was run; large simulation modules
and existing repository debt remain. Native sunlight allocation/propagation,
timing, colored-object lighting and complete raster/filter/LOD ownership remain
open. The native color checks and browser pixels establish this correction, not
whole-frame visual parity.

### Scenery ground shade integration

Reconstructed `00403c10` against the supplied executable. Original scenery
initialization/removal calls it to recalculate shape-covered terrain shade; our
adapter previously only recalculated shade while registering building footprints.
Live trees therefore lacked their native ground shading in otherwise empty cells.
The port shares original shape traversal and `nativeCellShade` with buildings,
imports scenery object/flag descriptors, and refreshes on live tree insertion,
removal or pose changes through `syncLandscapeObjects`.

Validation: 632 complete native scenery setter/real shade-consumer comparisons,
632 existing building footprint and 4,096 cell-shade comparisons; 72 gameplay
regressions plus the parity-tool test. The added gameplay scenario covers two
occupants sharing a cell, depletion, preserved slope bits and regrowth. Browser
comparisons show 26,778 changed ground pixels, then exercise actual Lightning,
fire/shrink/smoke and shadow removal with no browser errors. Before/after captures
are `/private/tmp/populous-scenery-shadows-before.png` and
`/private/tmp/populous-scenery-shadows-after.png`.

Boundary: native texture regeneration is intercepted in CPU tests and the live
browser atlas supplies invalidation; object classes/ownership outside the current
tree adapter, sunlight and model/unit shadows remain open. The lighting parity
checkpoint stays partial; its evidence improves without increasing the score.

### Airborne person shadows and depth-based sprite size

Traced native body queue `0046f080`, shadow queue `0046f850`, painter branch
`0046acf6..0046c185` and person tail `004d3ce7`. Replaced invented ground rings
with original HFX22 shadow art, grounded through native terrain sampling and
shown only for airborne people. Body sizing previously used fixed +/-1 buckets;
it now uses projected depth, the native -300/custom bias and one-based painter
index. Halo shadow scaling also receives the corrected one-based bucket.

Validation: 512 native body/shadow queue comparisons, 1,024 original shadow
rectangle/scaling comparisons and 512 person-tail gate comparisons. Queue fixtures
supply projection with zero velocity; native terrain and sprite scaling execute.
A real browser Blast produces 36 isolated shadow GPU pixels, retains ground
anchoring and removes the shadow on landing. Selection, halo and full native
projection regressions pass. Capture: `/private/tmp/populous-native-unit-shadow.png`.

Full render-position interpolation, mixed painter ordering and all class shadow
ownership are still open. The live flight gate includes the existing Blast lift
adapter until native person physics owns it. This is evidence within two partial
checkpoints, not new verified credit or whole-frame parity.

### Model sunlight, face normals and depth fade

Replaced unlit model textures with the original primary sunlight table and face
shade selection. `00401040` supplies direction (147,147,147), ambient 28 and
strength 15; `00401790` builds the normal table. Retained face +4 normal flags and
+0x30 heading entries from the original files. Dynamic normals follow `0040cd00`
after native scaling/rotation, while static faces select a stored quadrant normal.
The model material applies `004718c0` distance fading and the native diffuse/warm
additive conversion using a shared first-vertex anchor for each face.

Validation: 33 complete sunlight tables, 4,096 normal calculations, 450 complete
ordinary renderer normal/shade passes and 1,024 complete triangle submissions.
Model fixtures supply projection only; normal and transform code executes in the
original. Existing 2,096 stage-face calls/5,479 triangles still agree. Browser
checks compare 41 live model attributes, rotate/resize an instance while retaining
GPU buffers, and compare six actual GPU colors to native-checked shade math.
The inspected capture is `/private/tmp/populous-model-lighting.png`.

Geometry now belongs to each native model instance; fire UV animation and vault
morphs reuse that ownership. Projection setup composes material shader hooks rather
than replacing the model's hook. Full dynamic sunlight and secondary-table
consumers, colored selection overrides, collapse-debris light, painter ownership
and alternate transform modes remain open. The lighting checkpoint stays partial.

The painter trace also identifies twelve mode-0 fire-model faces that never submit
pixels in the original. The importer now omits them, preserving the eight drawable
fire faces. This removes previously rendered picking geometry; complete original
picking ownership remains separate.

### Hover feedback and original shade override

Connected native model hover rules from `004708d0`/`00471c40` to the existing
building/shrine picker. Native gray 200 and white 255 replace face sunlight and
distance attenuation; they do not add to them. Phase comes from unsigned turn
bit 1 (`004a4450`'s presentation update). Eligibility distinguishes ordinary and
construction rendering, ownership, class exceptions and building flag 0x10.

Validation: 512 complete native renderer/real queue comparisons and 256 original
phase-loop executions; real browser hover/control checks measure 5,454 changed
phase pixels and 5,387 pixels against ordinary lighting. Eight GPU color probes
include both override values, and existing HUD/worship interactions still pass.
Screenshot `/private/tmp/populous-model-highlight.png` was inspected.

The browser now refreshes its hovered object when camera, pointer, buttons, input
mode or simulation changes, fixing stale targets under a stationary pointer.
Existing tooltip descriptors supply object class/owner; the full native picking
and modal/all-tribe targeting controller remains open. No additional verified
checkpoint credit is claimed for this subset of command feedback and lighting.

### Original world overview

Replaced the latitude/longitude globe and cloud dome with the original wrapped-map
disc, adaptive mesh, native globe lighting, low-resolution terrain tiles and star
field. `app/globe.ts` is compared with the original routines; `globe-renderer.ts`
owns the separate browser drawing resources. Original HFX building/discovery
icons and native marker colors/shapes restore the overview's flat presentation.
Ground sprites/models/effects stay in one group and restore on return.

Native checks compare 18,532 complete terrain triangles and shades, 4,096 projected
points/visibility pairs, 2,048 inverse picks, 4,176 star positions, 16 complete star
submissions, opening marker palette, 512 drag and 512 parallax updates. The shared
texture check compares 278,528 original indexed ground/globe pixels. Portable
native mesh fixtures join the ordinary test suite. Browser checks measure terrain,
marker and star GPU contributions, native wrapped picking, arrows/drag, parallax,
resize and return; confirmed unit sprites and existing desktop/HUD/terrain/fire
checks pass. Capture: `/private/tmp/populous-globe-v103.png`.

Full transitions and release inertia, original marker rasterizer/queues/eligibility,
colored building footprints, overview effects, all classes, texture-cache UV/fog
and matched original GPU frames remain open. No full overview/camera/raster parity
claim or additional verified checkpoint credit is made. See decomp/README.md for
addresses, mathematical details, regeneration commands and oracle boundaries.


## 2026-09-08: native overview footprints and building symbols

World view now uses original translucent tribe-colored terrain-cell quads and
shares native cell visibility with building-icon eligibility. The recovered
`0041edb0`/`004f1280` decisions, `0042dd50` rim projection and `0042d390`/`0042d5b0`
quad submissions agree on 3,072 projections and 4,096 complete native calls.
HUD metadata now retains the original AL palette indices; alpha is 48/255.
`0041d730` agrees on 384 complete icon-controller cases for models, owner-only
hut counts, tower garrisons, wrapped position and edge sizing through 768px high.
Modern tall viewports deliberately avoid the native signed scale overflow.

Live browser checks cover 36 quads/6,181 alpha-48 pixels, relocation/destruction,
empty/brave/warrior/shaman tower symbols and anchor fog. Existing overview GPU,
input, resize, HUD and ground sprite regressions pass. Capture:
`/private/tmp/populous-globe-footprints-v104.png`. The renderer reuses registered
native building shapes instead of inventing new footprint geometry.

Full concealment ownership, plan/placement producers and their independent blink
clock, vehicle/reincarnation markers, queue/raster fidelity, overview spells,
transition/release inertia and matched original frames remain open. See the
[decompilation notes](../decomp/README.md#overview-building-footprints-and-icon-ownership)
and runnable native/browser checks. Camera/raster remain partial; no broad
checkpoint or known-scope percentage increase is claimed.


## 2026-09-08: overview drag sampling and release glide

Recovered `0042d1f0`/`0042d240`/`0042d380` press, sampled motion and release behavior.
World view now keeps the original constant post-release glide, clears it after
a stationary held frame, clamps flick velocity and rejects grabs outside the
disc. Native continuous position is retained across browser coordinate wrapping.
Keyboard movement resets the glide, as `0041ef30` does through `0042d060`.
Star motion now uses each clamped native step and avoids duplicate application
by renderer refreshes. The raw input wrapper and separate selection/style calls
are exported with explicit unported boundaries.

The native oracle compares 1,664 complete motion/star snapshots; eight sequences
are captured in the portable globe fixture. Browser checks cover right/middle
input, seams, coalesced renders, flick/hold/release behavior, rejected grabs,
keyboard takeover, modal/input/blur gates and reentry. Existing world/camera/view/
navigation and sprite regressions pass. Native outer-frame pacing, input settings
and globe transitions remain open; 24 Hz sampling and platform cancellation are
still adapters. Camera remains partial and the global denominator is unchanged.

## 2026-09-08: overview spell range and original projectile art

Overview now draws the native 32-strip pulsing spell range and unscaled original
spell trails. `0041f370`/`0049bb20`/`00516500` agree on 256 complete circle/strip
calls; `0041ebf0` agrees on 256 phase updates from the sky counter. Simulation
pause preserves the visible pulse and overview leaves the ground halo's phase
alone. The range shares existing selected/hover and input gating.

`0041deb0` plus `0041e5b0` agree on 512 complete effect-cell queue/painter cases,
including original class/model/flags/fog/ownership, animation hold/frame,
bottom-center sizing, sentinel and palette selection. Blast's four attached
HFX1124–1127 tails and loose Blast/other spell trails render from the existing
atlas. `00516270` supplies their distinct AL tint lookup; all casting trails now
retain their tribe. Large ground impact flashes absent from the native overview
queue remain omitted.

Live browser checks cover actual strips and pixels, pause/hover/selection/input,
a real Blast cast, tint, fog/hidden gates, expiry and ground-halo return. Captures:
`/private/tmp/populous-globe-range-v106.png` and
`/private/tmp/populous-globe-trails-v106.png`. Native gameplay state and mixed
painter ownership, other effect/circle classes, tower fans, concealment and
matched original full frames remain open. Camera/raster stay partial and the
known-scope denominator is unchanged. See decomp/README.md for exact addresses,
regeneration commands and oracle boundaries.

## 2026-09-08: native ground/world transition

World view now enters through the original ground-preset zoom and rotation,
then morphs the terrain projection into the globe. Return reverses that sequence
and restores the saved bearing. Enter returns to the retained ground preset;
zoom-in deliberately chooses bird's-eye, as the original command does.

`0041d410`/`0041d450`/`0041d680` agree on 100 complete morph lifetimes. Native
`0041d1e0`/`0041d260` flat callbacks and `0042dae0`/`0042dd50` interpolation agree
on 1,344 projected/picking cases; complete native meshes agree on 93,240 triangles
including transitional lighting. Twenty-four mesh captures and ten lifetimes
are portable regressions. Ground preset-4 transitions extend the original field
comparison to 360 transitions/6,960 frames across all ten native resolutions.

Actual browser checks cover entry/return timing, integer rotation, finite geometry,
paused presentation, input and picking gates, saved-preset toggle, zoom return,
restored bearing and focus interruption. Existing overview motion, range/trails,
footprints and camera-preset checks now wait for the real transition. Captures:
`/private/tmp/populous-globe-morph-v107.png` and
`/private/tmp/populous-globe-return-v107.png`.

The outer UI controller is reconstructed from `00418950` and connected to the
browser's existing 24 Hz presentation/input adapter; it is not wholly CPU-compared.
Original dispatcher side effects/audio, scaled frame scheduling, recentering and
matched whole frames remain open. Nine exports bring the manifest to 850; camera
and raster remain partial with no additional broad-checkpoint credit.


## Original hut families and retained collapse faces — 2026-09-08

`0040b170` selects a building's signed object short at unit+99. Descriptor flag
0x2000 selects one of three hut families with one game RNG draw at 0x89d178:
base object + (random % 3) * 12 + signed tribe * 3. Flag 0x4000 adds signed tribe
to non-hut bases without RNG. All 20 descriptor models, six owner byte values
and 16 seeds each match 1,920 complete native calls, without stubbed callees.
`004050c0` supplies current object + 1 to a replacement on upgrade; `00403610`
initializes the replacement then applies that supplied identity. The browser
retains the family through its existing upgrade producer. Full replacement
allocation, decoration RNG and global initialization order are not yet ported;
this does not establish the exact opening family sequence of an original run.

The importer now includes objects 107–142: three families, three levels, four
tribes (55 total mission models). One stored building identity is shared by
rendering, footprint/entrance lookup and collapse. The scene rebuilds on identity
or damage-stage changes. Legacy browser state without an identity preserves its
previous family. New assets use the existing verified bank-2 source hashes.

Expanding collapse checks exposed a root-cause importer error: mode-zero picking
faces were discarded, but `00407860` still allocates them and consumes RNG.
Models now retain all faces and their texture modes. The shared display predicate
omits mode zero except when `00471c40` substitutes a visible construction cap.
`00470160` retains the same distinction for fragments. Invisible debris continues
its physics/impact/RNG lifetime without a drawable mesh. Lighting follows the
same filtered face sequence. Native comparisons now cover 1,050 collapse calls,
30,665 faces, 8,192 flight snapshots, 128 splash initializations, 2,216 construction
calls (17,948 queued triangles before mode-zero raster filtering), and 990 model
lighting passes. Existing native shader, normal and sunlight comparisons pass.

```sh
python scripts/check-native-building-objects.py /path/to/d3dpoptb.exe
python scripts/check-native-building-faces.py /path/to/d3dpoptb.exe
python scripts/check-native-building-debris.py /path/to/d3dpoptb.exe
python scripts/check-native-model-lighting.py /path/to/d3dpoptb.exe
node scripts/check-browser-building-objects.mjs
node scripts/check-browser-building-debris.mjs
```

The browser variant check renders every one of the 36 models, checks finite
geometry, live identity replacement and 29,415–57,743 changed GPU pixels.
Portable gameplay checks retain family selection, non-mutating shape/display
queries, upgrade identity and capped versus uncapped picking-face behavior.
Complete hut activity/upgrade scheduling, all other models and original matched
full-frame rendering remain open; graphics.variants stays partial.

The fire UV animation adapter uses the filtered drawable face sequence too;
its Lightning/tree-fire browser check confirms animated original UVs, actual GPU
pixels, grounding, shrinking trees, sound, smoke and cleanup. The expanded live
hut-collapse check observes four invisible fragments and verifies their groups
have no drawable children while ordinary faces remain textured and moving.


## Native hut birth flow — 2026-09-08

Reconstructed `00404c80` and compared the complete routine with the supplied EXE:
2,304 controller cases, 188 allocations and 2,304 completion-clock initializations.
The recovered flow replaces world-turn breeding and instant housing with local
building phases, native sockets, a redirected/snapped exit and visible newborn
motion. Original entrance flash and player birth audio are integrated and checked
through browser GPU pixels and an actual PCM source. Native person ownership and
wild-person/class-9/allocation paths remain open. See [the controller evidence
and reproducible commands](../decomp/README.md#hut-birth-controller-and-entrance-feedback--2026-09-08).


## Timber-gated hut upgrades — 2026-09-08

The original gathers before upgrading, with 75% maturity and a 128-building-turn
fetch phase; the browser previously gathered only after changing the building.
Reconstructed the decision clock and entrance-cell wood accounting, then connected
them to visible resident hauling and original log sprites. The replacement begins
at the native 100 work and keeps its hut family. Native decision and wood-count
oracles plus a full live reconstruction check now cover this integration. Successful
native allocation and resource/order scheduling remain open. See [the evidence
and commands](../decomp/README.md#hut-maturity-and-timber-staging--2026-09-08).

## Reached-source timber work and visible tree shrink

The original dispatch subtracts three from command IDs: `004340a0` is fetch
command 7. Its harvesting substate establishes twenty-turn brave tree work,
three-turn loose-log pickup, row-6 work animation, cues 1/10 and native transfer
limits. The original `004a79f0` scale consumer now also drives harvested trees.
See [the timber evidence and explicit controller boundaries](../decomp/README.md#timber-harvesting-pickup-and-tree-size--2026-09-08).
Native comparisons cover 1,860 calls; portable and browser checks retain the full
visible upgrade sequence. Automatic construction scheduling and replanting are
still open, so this does not establish full timber economy parity.

## Native tree growth and delayed replacement

Tree growth now uses per-object phases/rates from `004a6f40`. `004a79f0` depletion
requests feed `004a8370` and the complete `004a8440` indexed replant search; failed
sites retry after 256 turns and successful saplings start at 100 wood. Native
comparisons cover growth, allocation records, search/terrain/collision and retry
state, with full-delay live tests and browser GPU growth/shade checks.
See [tree growth evidence and remaining ownership boundaries](../decomp/README.md#tree-growth-and-delayed-replanting--2026-09-09).


### Tree visibility beside buildings

The original cell dispatcher `0046ec80` submits ordinary tree models without a
building-distance test. Native call-boundary and browser regression evidence is
recorded in [the decompilation notes](../decomp/README.md#trees-beside-buildings--2026-09-09).
Removed the browser radius filter that hid a shipped first-mission tree outside
the adjacent hut footprint. Full painter/raster visibility remains partial.


### Native spell-panel feedback

Recovered `0049daf0`/`004a1dd0` button frames, hover glyphs and markers, layered
charging fills and `004c2fe0` mana-cost slot order. The browser now uses these
through a compact presentation helper and original artwork. See
[the native comparison evidence](../decomp/README.md#spell-panel-artwork-and-charging--2026-09-09).
OpenPop's `SpellButton.cpp`/`Panel.cpp` were consulted as secondary layout leads;
implementation and comparisons use the supplied executable. Existing upstream
license/provenance records apply; no upstream implementation was copied.

### Native shaman health

Traced `004a0050`, its packed control record and `0042adc0` palette initialization.
The native frame and fill replace the CSS health approximation. Original control
geometry differs from the secondary OpenPop layout; the shipped executable is
used. See [health-meter evidence](../decomp/README.md#shaman-health-meter--2026-09-09)
for CPU, source-pixel and browser comparisons and remaining ownership limits.

### Original complete-model culling

`0046d970` supplies the signed screen-area test used by `004708d0`; construction
`00471c40` instead keeps both windings. The browser now distinguishes the two in
its shared original-model factory. See [native/GPU evidence](../decomp/README.md#ordinary-model-face-culling--2026-09-09).
The existing distance-fade instructions remain unchanged; broader lighting and
painter ownership are separate open work.


### Animated shaman portrait

`0049fe70` supplies original frame geometry/background states; `00450e60` reuses
current directional animation with the standing shadow suppressed. The scene
now shares its resolved world frame with the HUD canvas. Native and browser
pixel comparisons, pose overflow and remaining resolution/control limits are
recorded in [the portrait evidence](../decomp/README.md#animated-shaman-portrait--2026-09-09).


### Local terrain lights

Recovered the fifty-source pool, wrapped 7×7 cell contributions, falloff, private
flicker, movement and removal in `004010b0`–`004015f0`/`004ee190`. Original Blast
and fire requests now feed the existing terrain diffuse/specular renderer;
building fire respects its first-socket light flag. See [native and browser
lighting evidence](../decomp/README.md#local-terrain-lighting--2026-09-09).

### Building ground response and sinking

The original `00408080` foundation controller and `00503550` sinking object now
have native comparisons and live browser consumers. See [the decompilation
record](../decomp/README.md#buildings-on-deforming-ground--2026-09-09) for addresses,
reproduction boundaries and retained gaps. Shared height stepping and debris
emission avoid separate approximate terrain-damage effects. Run:

```sh
.tools/decomp/oracle/bin/python scripts/check-native-building-terrain.py PATH/TO/d3dpoptb.exe
.tools/decomp/oracle/bin/python scripts/check-native-building-sinking.py PATH/TO/d3dpoptb.exe
.tools/decomp/oracle/bin/python scripts/check-native-building-debris.py PATH/TO/d3dpoptb.exe
node --test tests/building-terrain.test.mjs
node scripts/check-browser-building-terrain.mjs
```

## 2026-09-09 — shared Blast/collapse wave and native follower flight

`app/blast-wave.ts` reconstructs `0050b630`/`0050b740` and the alliance
helper `00416d70`; `004da080` now supplies shared person damage in
`app/person-update.ts`. Source identity is the manifest's D3D executable
SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The type-2 indexed search intentionally retains repeated cell visits and the
native friendly flag's lifetime across object classes. Range-scaled impulses,
vertical force, allied final-pass/five-visit cap, shields, signed life storage,
building damage accumulation and remaining/radius progression retain native rules.

Blast and reason-1 terrain collapse allocate the same hidden three-turn force
controller and cue 0xa1. The visual Blast flash remains a separate object.
Live flight reuses `stepPersonPhysics` (`004e6d00`) for velocity caps, slope force,
gravity, bounce, spin, landing damage and settling. The renderer uses native height;
landing, debris and fire share effect-3 spark allocation. Ordinary browser orders
resume after settling. Airborne bodies survive negative life until landing.

The first real-browser attempt exposed a missing imported pose: animation row 2
is distinct from row 12's airborne pose. The importer now reads launch identities
from native tables and appends their frames/pieces. All prior 336 fixture poses
and 2,672 piece hashes remain identical; 56 launch fixtures and 220 original pieces
extend coverage. No old golden expectations were silently rebaselined.

Checks: `scripts/check-native-blast-wave.py EXE --record` compares 256 complete
native wave passes and 512 direct damage calls (64 of each retained for Node).
`scripts/check-native-physics-driver.py EXE` compares 8,192 full driver snapshots
and 4,096 bounce calls. `scripts/check-native-sprite-layers.py EXE --record` compares
7,068 native layer submissions, 2,892 original RGBA pieces and 392 durable poses.
`tests/blast-wave.test.mjs` checks live three-pass allied launch, native motion,
landing and subsequent command acceptance. Existing immediate-Blast assertions
now wait for the documented native wave passes.

Limits: live ordinary allocations still supply approximate mixed-class/cell order;
scenery shake rendering, native first-hit building feedback, panic/vehicle consumers,
complete person state dispatch, reveal/path-group ownership and native allocation
limits remain open. These checks do not establish whole-game or whole-frame parity.
The global known-scope checkpoint score remains 17/96 (17.7%); discovery stays open.

Validated desktop integration: actual mouse Blast, three wave passes, pause,
original launch pose (145 changed GPU pixels), native height and shadow, both
impact cues, original landing spark and cell cleanup. Expanded sprite GPU checks
pass 392 poses/290 frames/93,898 colored pixels with the served atlas hash;
healthy building settling, 49-face collapse and sinking/tilt regressions still pass.
`npm run check` passes 133 tests, TypeScript and parity consistency; the production
build succeeds and 950 exports verify. Focused ox-standard has no errors (existing
warnings remain), changed-app ESLint passes; Fallow reports 84.7 maintainability,
2.8 average complexity and the existing three import cycles/unused dependencies.
Full-app legacy lint and engine ownership debt remain open.

Final flight audit also connected wild followers' state-8 landing initializer in
`004d2740` through the shared state initializer. The existing native oracle now
covers 5,632 initializers including 512 additional state-8 cases; live wild followers
land and survive without an unsupported-state exception. Complete wild movement
and lifecycle remain outside this initializer's verified scope.


## Terrain texel-center sampling — v134

The original close-land triangle dispatcher `004673b0` supplies inset UV
endpoints when smooth filtering is active: half a texel at either edge. The
browser previously sampled each atlas tile's outer edges. Land now has a separate
UV attribute with the original 32-pixel tile endpoints; world coordinates still
supply the scrolling sea. Terrain diagonals, heights and palette pixels are retained.

`scripts/check-native-terrain-uv.py EXE` executes the original dispatcher up to
Direct3D triangle submission and checks 64 cases: 16/32-pixel textures, eight UV
orientations, smooth filtering and the raw-coordinate option. The portable fixture
is tied to the executable SHA and compared on every native run. The GPU terrain
check validates all cell endpoints and detects 336,038 changed pixels against
edge sampling. The existing 80-sample material calibration now writes the separate
land UV attribute and still verifies the same expected palette colors.

This verifies triangle endpoints, not hardware rasterization or the complete
texture cache. Cache fallback, other graphics settings, globe/model UV ownership,
clipping and matched whole frames remain open. No broad parity checkpoint is closed.


## Camera-sized sky and defeat flash — v135

`00517630` copies the current camera horizon into the sky surface height, emits
the full-UV backdrop quad over that height, then submits both type-2 cloud layers.
The browser had stretched the backdrop and cloud geometry across the full window.
Both now use the live camera horizon, including every zoom-transition frame.
Zero-height skies have no visible area. Backdrop texture filtering now follows
the existing encoded-palette bilinear path. `00429f90` separately clamps the
ordinary ground-view defeat-flash surface to the viewport; the flash shader now
uses the resulting rectangle instead of discarding its height.

The extended `scripts/check-native-clouds.py EXE [--record]` executes nine complete
outer dispatches and retains original backdrop bounds/UVs and 756 cloud triangles,
including zero horizon. It also executes the nine flash-surface updates. Existing
128 lens updates/4,992 triangles and 1,024 native defeat-flash allocations pass.
`tests/fixtures/sky-horizon.json` is executable-bound and rechecked on native runs.
The portable check compares captured cloud coordinates/fades with the existing port.

Browser checks cover 12 view/size states, all zoom frames, backdrop and both cloud
layers, zero horizon, real keyboard rotation, pause-independent cloud motion and
overview return. The normal-view height comparison changes about 398,000 pixels.
The isolated flash shader draws 527,000 pixels inside its native rectangle and
zero outside. The filter calibration now covers 96 palette-color samples including
the backdrop. Camera QA selects the battlefield canvas explicitly so a tooltip's
canvas cannot make its locator ambiguous.

Scope: original type-2 sky in the current ground-view adapter. Other sky modes,
full draw-mode/viewport ownership, device blending and matched whole original frames
remain open. Ordinary-view horizon screenshots supersede the earlier unused-preset-1
capture; no speculative terrain bound or distant-model lighting changes were made.
The full game goal remains unfinished, with discovery open and no new verified
checkpoint credit.


## Native visible-cell boundaries — v136

Recovered `00467130`'s ground-row traversal and its `0046d070` cell loop. A cell
uses the following vertex row's bounds, and the column span is half-open. The
browser instead used the current row and included the end column. It also reduced
positions to half-map precision before determining the cell: odd camera coordinates
could shift an exact boundary into its neighbor. Visibility now determines the
512-unit cell first, with separate wrapped object and unwrapped terrain-copy paths.
`RenderView.visible`, picking and the shared GPU visibility shader use these rules.
An obsolete fractional-center uniform and unused model-world calculation were removed.

`scripts/check-native-visible-cells.py EXE [--record]` executes native frame setup,
row traversal and complete cell enumeration. Vertex projection and object consumers
are intercepted, terrain polygon generation is bypassed through the native graphics
flag/class branch, and execution stops before frame postprocessing. It compares
64 traversals, 135,021 visited cells and all 1,048,576 cell-membership decisions
across four resolution groups, four presets, eight headings and wrapped centers.
The executable-bound portable fixture additionally checks four subcell positions
and unwrapped equivalents. The new raw export brings the manifest to 951.

The real shared shader and CPU view agree with 1,216 native-captured boundary
probes. GPU probes deliberately fix screen projection so an offscreen point cannot
hide a wrong visibility decision. Live scenery survives four rotations/rebuilds;
ground interaction covers picking, four placement rotations, invalid rejection,
placement and terrain invalidation. All 392 sprite poses/290 frames/93,898 colored
pixels still match the existing atlas fixtures. The scenery regression now recreates
close proximity explicitly: subsequent native building-anchor corrections had moved
its original tree/hut pair outside the obsolete filter's radius.

Scope: visible-cell membership, not full original occlusion. Cell concealment/reveal,
object-specific flags and pool ownership, painter/depth ordering, native picking
and matched whole frames remain open. Distant model darkening remains native;
this change does not claim that the far silhouettes have been resolved. Next compare
the native concealment/reveal gates in the playable first-mission views.


## First-mission fog audit — after v136

The supplied first mission remains fog-free: header byte 98 is zero and native
loader forwarding/selection preserves that setting. The new
`scripts/check-native-first-mission-fog.py` verifies the header hash, original
forwarded banks/flags, 768 fog-selection cases and the live world's initial flags.
See `decomp/README.md` for exact instruction spans and the loader-scope limit.
There are 958 verified exports. No runtime change was warranted; distant object
silhouettes now require painter/depth comparison. Full reveal/concealment ownership
remains required for other modes and missions.


## Mixed polygon order — after v136

New complete native queue/batch/triangle captures cover 70 queues and 1,036
triangles. They establish reverse insertion ties, constant raster depth and
terrain/model bias placement. The corresponding browser diagnostic finds 30,231
interior pixel differences across six controlled overlaps. Exact routine/hook
scope and commands are recorded in `decomp/README.md`. Full renderer integration
remains open; this evidence does not add verified game-parity credit.


## Minimap terrain, wrapping and markers — 2026-09-09

Reconstructed complete `004206e0` height/cliff palette lookup, `00420100`
camera-cell wrapping and `0041fce0` sine-table quad rotation. Sixty-four native
cases compare 1,816,872 indexed pixels, unchanged row padding and 256 UV vertices.
The renderer shares this transform with marker placement and geometric click
inversion; the old fixed 96-unit crop and invented colors are removed.

`004202d0` and `005255b0` supply marker palettes, snapped coordinates, inherited
point sizes and original HFX circle artwork. Sixty-four complete controller cases
cover four tribes, wild people, visibility/fog gates, size inheritance, scale
shifts and blinking discoveries. Buildings inherit the previous marker size; the
first size is an uninitialized native local. The browser explicitly seeds one
pixel until a person or stone establishes it. Mixed-object allocation order,
visibility ownership and discovery-object production remain adapters; this is
not complete minimap marker parity. Native input command ownership is also open.

Twenty-four browser captures at six resolutions through ultrawide/4K compare
actual terrain/wrapped RGBA and submitted Canvas transforms. Original buffers
are used for comparisons within 256×256; larger canvases retain the verified
scroll with dense rows as a documented modern-display correction. Real clicks,
seam travel, terrain invalidation, focus journeys, HUD controls and unit-sprite
regressions pass. Final D3D sampling/padding and frame layout are not certified.

`0049d070` uses the scaled 100×96 control at callback record `005cb4f9`, selecting
`005cab30` for ordinary desktop resolutions. `004a1f50` places HFX 690–693 as
fixed-size corners and tiles HFX 694–697 between them. The current stretched
circular surround is therefore still a layout adapter. This finding is retained
for the modernization audit rather than claiming full HUD completion.

The conversion optimization and modern-display correction are measured and
qualified in [modern-performance.md](modern-performance.md). New parity features
are paused while the existing implementation undergoes that broader audit.

## Person render-position interpolation — 2026-09-09

`0046f080` starts a person body at current position minus the signed displacement
at +0x43/+0x45/+0x47. With flags3 bit 0x100, unpaused land, a nonzero presentation
counter difference and a nonzero measured frame rate, it adds displacement times
`measured turns * elapsed presentation frames / measured frames`. Body height
also includes signed support height at +0x1c. `0046f850` uses the same horizontal
interpolation, then samples terrain for the shadow. `0049c9f0` estimates the two
rates from counter differences once per second. Newly retained `004ed700` writes
the presentation stamp at +0x18 **after** the class controller returns.

The existing `004ee580` cell-list reconstruction writes signed displacement when
flags3 0x100 is set and 0x200 is clear. Its 8,192 sequential native comparisons
still pass. The new `check-native-unit-interpolation.py` executes 1,024 complete
body/shadow queue pairs, supplying projection and the shadow-height consumer.
814 cases have exact integral coordinates; continuous fractional browser positions
remain within one native coordinate unit of the original integer truncation in
the other 210 cases. Four original person-dispatch tails verify stamp ordering;
the person controller itself is supplied in those four calls. A 64-case fixture
retains executable-tagged original projection inputs for portable checks. There
are now 972 hashed address exports.

The browser's `UnitMotion` observes each completed simulation turn, including all
catch-up turns, and interpolates its retained endpoints using elapsed simulation
time. It keeps fractions at modern refresh rates instead of reproducing the old
last-second FPS estimate, counter rounding or overshoot. Snapshot and output
positions are reused; no per-frame person-position allocation is required by the
renderer. It does not initialize native person records or change sprite selection.
Spawning, building entry/exit, class/team conversion and explicit out-of-turn
placement bypass stale history. Pause holds the displayed position.

Sprite layers, airborne shadows, selection arrows, health bars and tooltips use
the displayed body position. Shadows sample ground at the interpolated X/Z.
Painter ordering and the fragment visibility gate retain the person's authoritative
cell, matching `0046ec80`'s source-cell dispatch before the queue interpolates its
projection input. Pointer selection uses the displayed bounds, including airborne
sprites with no terrain behind them; the former terrain-first return prevented
those clicks from reaching selection.

This is the original interpolation **curve** with a modern elapsed-time adapter,
not a recovered complete outer scheduler. Native per-class interpolation flags,
every displacement writer/multiple-move case, native support-height ownership for
all states, original presentation counter phase and complete allocation/dispatch
remain open. Current browser controllers provide whole-turn endpoint snapshots.
Command processing, simulation timing, RNG, collision and combat positions remain
authoritative and unchanged. Visual interpolation spans the previous completed
turn; it is deliberately not prediction of the next turn. The original first draw
can already have a nonzero counter fraction; the modern phase starts at the actual
turn boundary. See [the modernization audit](modern-performance.md) for measured
response times, pixel/control checks, performance and the remaining limitations.


## Integrated follower panic and fire trails — 2026-09-09

`00408ab0` ejects burning-building occupants at counter 119, clears flag2
0x10, writes 24 to byte +0xa4 and enters state 26 if unprotected. Terrain-only
collapse/sinking (`00406f40`) evacuates without those panic or fire writes.
`004d2740` initializes panic with animation row 25, speed 110, timer 64,
random heading, deselection and route release. Shared native turning and ground
movement run before the state controller; no second movement loop was added.

The class-1 dispatcher subtracts one before switching: state 26 is case 0x19.
Its block `004d3832`–`004d3ae1` requests owned cue 0x51, decrements a signed
16-bit timer, and on expiry chooses the original default state and resets the
anchor outside a building footprint. The 64 initializer therefore lasts 65
controller steps. Browser completion releases the sound flag; all three original
samples (sound-253/254/255) are preloaded. A live Web Audio probe caught a missing
preload that request counting alone had hidden. It now requires real source
starts with nonzero PCM, completion/replay and at most one active voice per person.

Byte +0xa4 is now named `burnTrail`, replacing the misleading `panicTimer`.
Complete emitter `004d9200` allocates class-7/model-3 each turn and model-10 while
the byte exceeds eight, at current height +16. Both get flags2 0x4000 and flags3
0x100; the byte decrements even if allocations fail. A 24-turn emission produces
24 sparks and 16 bright particles, independently of the panic duration.

Correction to the earlier research entry: person +0x43/+0x45/+0x47 contains signed
**motion deltas**, not previous positions. `004ee580` writes those deltas and
queue `0046f080` subtracts them to recover the start point before interpolating.
Particles copy the deltas. Factories `0050bf60` and `0050c410` supply states 3/9,
objects 314/1120 and four-turn lifetimes, then share the existing second phase.
The existing renderer interpolator samples these endpoints between native turns;
phase lifetimes and sprite clocks remain independent of display FPS.

Evidence: `check-native-person-state.py` now covers 6,144 initializers, including
512 panic cases. `check-native-person-panic.py` compares 512 controller blocks and
512 complete emissions (all counter bytes, signed wrapping and failed allocations).
`check-native-spell-trails.py` compares 384 factories and 4,224 phase snapshots.
Portable regressions replay captured native outputs and run real Lightning/hut
ejection in all four orientations, through 5/30/60/120/144/240 Hz and irregular
frame schedules. The headed browser check verifies original panic poses, both
particle types contributing pixels, fractional movement, audible voices and cleanup.

Boundaries: initial door placement remains an adapter; complete native ejection
placement, nearby-person ignition in `00408840`, fire propagation, full ordinary
person orders and mixed-class first-draw scheduling remain open. `004d92b0` is
separate temporary-tribe restoration, not panic. Panic returns to the existing
ordinary-order controller at its original state-transition boundary. This is a
bounded fire-response integration, not complete fire or person-engine parity.


## Nearby followers react to building flames — 2026-09-09

Connected the person-cell traversal inside `00408840` after each successful flame
allocation. Its linked-list walk selects class 1, the building's exact tribe,
and person descriptors without flag 0x100 (the original byte +0x31 bit 0).
This excludes shaman/angel models. Unprotected people enter state 26 through the
existing initializer; protected people retain their state but still consume RNG
and receive `(random & 7) + 8` trail turns. Each socket repeats the traversal;
deduplicating people or using a distance radius would change RNG and behavior.
Failed allocations skip the person traversal entirely.

The browser builds an event-local cell index, reusing the existing ordinary
allocation ordering used by Blast. Ordinary people are bootstrapped only into
temporary records; only an actual panic transition takes over their sprite and
movement controller. The bounded native loop is in `ignitePeopleInFireCell`.
Full persistent mixed-class membership/order, tower interior membership and
native allocation limits remain unported adapter boundaries.

Expanded `scripts/check-native-building-fire.py` to execute 512 complete fire
initializers against populated mixed-class cell chains, alongside the existing
632 ignition/socket and 512 burn-controller comparisons. Cases cover all six
allocation-failure bits, repeated sockets, person models, tribes, protected states
and RNG. This oracle intercepts the person initializer; the separate person-state
oracle verifies that initializer's flags, animation, RNG and movement reset.
Portable captures preserve the original results, not outputs generated by TS.

Both airborne and grounded people now share the same panic controller after
physics. An airborne regression checks one decrement per turn and the original
settling transition, then releases the temporary native pose back to ordinary
orders. The evacuation-only flag-16 clear was removed from the shared panic
initializer: nearby ignition must preserve that preexisting flag.

Live Lightning checks distinguish lethal direct-hit cells from other flame cells.
People in the latter panic before the building reaches its occupant-ejection
counter. Source playback, original poses, both personal particle types and expiry
are tested through the actual browser spell input.

Continuation finding: `removeBuildingOccupant` in `app/building-occupants.ts`
already reconstructs `00407490`, including occupancy mode 1 (`004d80e0`) and the
512-unit sideways exit/anchor/facing calculation. Reuse it for live evacuation.
The current browser `evacuateBuilding` still teleports to `buildingDoor`; native
removal leaves XY unchanged, restores height/cell visibility and supplies the exit
anchor instead. Complete live occupancy state/slots and terrain-collapse movement
must be connected without replacing the reviewed native helper with another copy.


### Live occupant exit placement (2026-09-10)

The live door teleport contradicted the already reconstructed `0x407490` and
mode 1 of `0x4d80e0`. Shared `restoreBuildingOccupant`, `buildingExitPoint` and
`faceBuildingExit` now serve both the complete occupancy reconstruction and live
release. XY stays unchanged; restoration clears hidden/training flags, restores
land membership and terrain height, and zeros signed **motion deltas**, not
physical velocity. The exit anchor and facing retain rotated shape geometry,
16-bit seam wrapping, backwards-facing behavior and the native default-state bit.

Occupancy person names now agree with live people: `h`, `displacement`,
`anchorX/Y`, `anchorFlags` and `heading`. The native oracle keeps its explicit
memory offsets and translates at that boundary. No duplicate exit-angle formula,
synthetic occupancy world, frame callback or new dependency was introduced.

Live task cancellation shares the exit for damage, fire, terrain collapse,
training, upgrade fetching and reconstruction. Celebration retains its separate
native sequence: release tasks, drop carried logs, restore the occupant, clear
bit 16. Burning evacuation also clears bit 16 before starting state 26 and sets
the separate 24-turn trail counter. Ordinary collapse does not ignite people.

Validation: all 11,200 occupancy comparisons and 1,024 training-conversion cases
still match the supplied executable. `check-native-occupants.py EXE --record`
records 538 portable restoration/placement captures; expected values come from
native memory. Live tests cover four building kinds in four orientations,
ordinary/retained sprite ownership, cell-list uniqueness, physical-velocity
preservation, command cancellation, panic and celebration. The real Lightning
browser scenario records all six first exit turns without a door jump.

Scope remains bounded: the live unit list supplies ordinary membership; full
six-slot admission, entry queues/delays, training repricing, command ownership,
allocation order and mixed-class cell chains are not integrated by this change.
Ordinary people do not acquire a persistent native animation record just to exit.

## Live staged hut entry (2026-09-10)

First-mission housing now consumes the existing complete command-8 controller
(`00434610`) rather than hiding followers at the outside door. Native order
startup establishes its target and original walking object; outside arrival,
interior steering, alternate-turn 112-unit admission square and full-capacity
rejection retain the native controller's ordering. The existing mode-0 occupancy
routine clears the scoped command reference and removes the visible person from
its native cell only at admission. Live animation ownership returns to ordinary
units on completion, cancellation, panic or handoff to unavailable-hut work.

The path integration exposed a missing call layer: `planPersonDestination` fills
the planned destination but its `004e9d80` wrapper establishes the first steering
target. `planLivePath` now uses that complete wrapper, with its existing no-vehicle
world. Shared ground movement serves entry, panic and celebration; preparation's
existing steering-recovery tail handles delayed re-planning. Training's duplicate
facing math now uses `faceBuildingPoint`, and its person fields use the shared
`counter`/`heading` names, with memory labels confined to oracle adapters.

The class-2 admission clocks are recovered from `004032e0..004032f2` and
`0040335f..004033a3`. The new native comparison executes those two blocks with
1,024 byte/flag/counter combinations and records portable captures. It excludes
the damage work between those blocks and does not claim the complete class-2
scheduler. Entry delay, congestion timeout, count and flag updates run once per
live building turn. Existing comparisons passed 1,540 queue operations, 2,689
command-8 cases, 11,200 occupancy cases and 1,024 conversion scenarios after the
shared field/facing changes. All 975 tracked exports pass identity/hash checks.

Portable integration checks cover all three hut sizes and four orientations,
simultaneous capacity, movement into the interior, original animation object,
command reference release, cancellation, panic, re-planning and unavailable-hut
handoff. Identical 5/30/60/120/144/240 Hz schedules preserve positions, RNG,
admission state and sprite clocks. The real browser right-click check observes
309 rendered sprite pixels while entry remains visible; three followers then
become hidden inside the native threshold without any step exceeding 0.369
browser units. All 172 portable checks pass. Browser regressions also passed
392 sprite poses plus shadows/selection, construction, birth/PCM, upgrade, fire
through completed repair, and celebration through route release/restart.

Boundaries: this integrates house models 1–3. Ordinary commands still belong to
the browser and entry owns a scoped two-record command pool; global exhaustion,
order ownership, six-slot ordering and indicator allocation are not certified.
Occupancy identities still derive from the live unit list. Burning/incomplete
hut availability retains the browser's existing work handoff. Complete class-1
interruption/terrain/fight scheduling, vehicles, training queues/conversion and
tower admission remain open. Tower socket routine `00404540` was exported and
reviewed: shape triples and model/socket offsets determine XY, terrain height
and clipping. That discovery is retained for the next admission integration;
it has not been substituted with a guessed tower height.

## Live first-mission warrior training (2026-09-10)

The warrior hut now uses the same reviewed command-8 entry as housing, with the
original five-person capacity, linked queue sockets, congestion counters, head
admission delay and first-empty physical slot. Queued warriors yield to an
untrained successor through the original controller; callback destinations and
animation updates now act on the supplied person, including that successor.
Cancellation removes the actual command reference and rebuilds the queue while
its person record is still available. Departures preserve the remaining slots.

Mode 3 of `004d80e0` retains commands and cell membership and does not set the
render-hide bit. Training residents therefore retain their original idle sprite
source inside; the existing painter handles building occlusion. Mode 0 house
residents still hide and clear their commands. The shared entry module was
renamed `live-building-entry.ts` to reflect both consumers. Native conversion's
per-building phase now uses the shared `counter` name instead of `tickPhase`.

The one-person mana/cast adapter is replaced with persistent native activity,
training cost and stored mana feeding `distributeMana`. `00405b80` converts the
whole funded weight into replacement people, with original cost bands and
queue/refund/removal ordering; it no longer changes a brave's type in place or
invents a hut-birth flash. The native level-flag-32 development gate now also
suppresses live conversion. Original exit orders are allocated/shared through
the reviewed 800-record command allocator and released at the ordinary movement
handoff. The full mission test exercises discovery, building, funding, training,
spell gifts, assault and victory with the replacement warrior identities.

Conversion exposed a missing world consumer: `00438730` corrects movement order
3 before attaching it. The reconstruction preserves its unchanged-record early
return, flag merge, toroidal coastal correction, and building correction using
the original input cell even after coastal movement. `004ec630` is newly exported;
its `004655f0` category lookup and sine movement execute natively in the new
1,024-case comparison. Only the separately verified building outside-point lookup
is supplied. Captures are retained in `tests/fixtures/movement-order.json`.
The source export is tied to the existing executable identity.

Portable training integration checks cover four building orientations, five
visible residents, three queued followers, native queue-point tolerances,
cancellation/chain preservation, physical slot reuse, already-trained priority,
whole-batch replacement and exit movement. Render schedules at 5/30/60/120/144/240
Hz produce identical RNG, positions, admissions and shared references. The browser
check issues a real right-click, measures 685 rendered queue pixels, observes
five replacement identities with original warrior walking frames and their
5.71-unit exit journeys. Hardware conditions are recorded in the performance
reference; this is a gameplay integration check, not proof of every training class.

Remaining ownership boundaries are explicit: browser allocation/registration has
no native allocation-failure limit; the shared building command pool is not yet
the ordinary command dispatcher. Conversion hands its exit to the existing
ordinary route adapter after preserving the native shared-reference operations.
Following arbitrary user command tails, all specialist schools/classes, ghost and
special occupancy paths, complete mixed-class scheduling, training indicators
and native panel behavior still need live integration. Source resident identity
is reconciled with `u.inside` at legacy/load boundaries; this is not a claim of
complete engine slot/allocation ownership.

Validation for this integration: 1,540 native queue operations, 2,689 command-8
cases, 11,200 occupancy comparisons, 1,024 conversion scenarios and 1,024 new
movement-order cases pass. All 976 exports pass executable/hash verification.
The 392-pose GPU sprite suite, shadows/selection, staged housing, celebration,
hut upgrade and complete fire-repair browser regressions also pass.

## Floating warrior-training feedback (2026-09-10)

`draw_ui_panel` at `00504bc0`, effect kind 5, supplies the original five-person
occupant row, selection marks, charge layers, dismantling-button artwork and
pointing tail. The logical width is 120 pixels; height is 62 without a charge
bar and 68 with it. Occupants are read from physical building slots, skipping
holes; icons are HFX `73 + person model`. The selection marker tests the actual
person selection byte at `+0x7a`, not cargo or assignment. Empty slots use HFX75.
The hardware mask bank (`00516370`, `0047dda0`, `004f95a0`) supplies colored
silhouettes. The native default ghost value is 85: empty icons have alpha 85,
the pointing tail uses inverse alpha 170, and the hardware rectangle producer
`00516890`/`00516a00` emits alpha 171 for panel backgrounds. Frame lines remain
opaque. The distinction is retained in the browser canvas.

The original presentation phase block `004a470b..004a472d` derives the dismantling
blink from game turn bit 1 and insufficient-mana blink from bit 2. Browser
render frequency does not advance these phases. `00509000` gives ordinary
class-2 buildings zero additional panel anchor height; the displayed tail follows
the projected building position. Browser CSS applies the same uniform HUD scale,
preserving artwork proportions on wide screens. The full original effect/panel
positioning and animation controller is not yet integrated.

`check-native-training-panel.py` runs 384 complete kind-5 draw calls and the real
hardware rectangle producer; final GPU submissions and palette setters are
supplied. It exercises empty/full/mixed occupant rows, physical holes, selection,
charging, insufficient-mana visibility and dismantling artwork phases. 276 draw
traces match entirely. 108 high-cost traces differ only in the intentional charge
overflow correction below. Portable tests retain every capture. Browser checks
compare 24 original-art canvases (195,840 pixels, at most one color byte of
premultiplication rounding), actual five-person admission, cached bitmaps, camera
rotation, five desktop sizes through 4K, blocked-input hiding and destroyed-building
cleanup. The shared spell charge helper still passes all 763 native spell-button
comparisons.

### Compatibility correction: training charge overflow

Native drawing shifts the 16-bit stored mana and cost left by 12, then performs
signed 32-bit products while expanding the layered bar. At cost 8192 and above,
layer divisors can wrap; high stored values also overflow the final width product.
For example, cost/stored mana 65535 produces a one-pixel main fill in the native
120-pixel panel instead of filling its 114-pixel interior. The browser uses wide
JavaScript arithmetic in the shared `chargeFills` helper. It retains the original
layer palette/geometry in the non-overflow domain and preserves bounded,
monotonically increasing main fill through all 65,536 stored-mana values. This
fix changes only visual feedback, not funding, training thresholds or timing.
Native erroneous captures remain in the fixture; they are not rewritten as if
this were exact legacy behavior.

### Open contextual-panel scope

This increment is read-only training feedback. The scene observes local training
activity and hover; it does not claim the original class-10 effect allocation,
32-slot panel pool, hover lifetime, fade/stacking, drag/input controller or dynamic
palette/ghost changes. The dismantling and occupant button artwork is present;
its commands are not wired yet. `0047b460` contains the input path (its inferred
jump tables need instruction-level verification). The inspected dismantling branch
emits tribe command `0x40` with a requested toggle and building ID. Do not replace
that command with an invented immediate dismantling rule. Keep native panel input,
its actual command consumer and tower socket/clipping admission as the next
visible/core-gameplay targets. Other panel kinds, buildings and specialist schools
remain in the open parity inventory.


## Training occupant controls and command correction (2026-09-10)

The executable bytes correct an initial interpretation of `0047b460`'s broken
Ghidra jump tables. An ordinary friendly building-occupant left-click emits
**tribe command 0x2a, arg1 6, arg2 person ID** at `0047b7f8`; it does **not** emit
0x43 or remove a resident. Modifier bit 1 emits 0x61 with a toggle determined by
the clicked person's selection byte and the building ID. `004a9d90` maps left/right
Shift scan codes 0x2a/0x36 to the modifier bits normalized by `004aa1c0`. Control
and Alt alone therefore retain the single-person action. A right-click requests
camera focus (`00417ca0`) and person-panel opening (`00504590`), without changing
selection. Accepted panel clicks emit UI cue 0x6a. Input suppression, invalid event
codes, land flag 0x800 and a busy temporary command buffer retain their native gates.

`check-native-training-selection.py` executes all 384 combinations through the
original input routine, including a physical slot hole, right-click coordinates
and emitted command payloads. Only the hostile-building predicate and terminal
UI/audio/camera consumers are supplied. No recovered jump table is guessed.

The original `process_tribe_cmd` (`0043e8e0`) supplies single-person toggling and
six-slot group selection. Selecting calls the real eligibility leaf `004e3430`:
flags4 (+0x10) bit 128 blocks selection, while bit 0x800 is allowed for this input mode.
Single selection sets selectionFlags bit 128 and flags3 bit 0x10000000; group
selection clears the latter. Deselection clears selectionFlags bit 128 and
flags3 bit 128. Other bits remain intact. The clicked member determines whether
the whole group is selected or deselected, including mixed selections; unrelated
selected units remain selected. 2,048 native command cases compare all these fields
against the small shared `selectTrainingOccupants` helper. UI-mode setup
(`0047a550`) and secondary selection voices (`00489c40`) are supplied consumers;
passenger recursion is outside this ordinary training-building scope.

The live panel now exposes ordinary desktop buttons over the original canvas
occupant slots. Display order skips empty physical slots, but actions retain
actual unit IDs. Enter/Space and focus outlines provide keyboard access. Single
and Shift actions update the existing selected-unit roster and native fields;
right-click uses the existing interpolated native camera controller. Browser QA
covers selection/deselection, preserved external selections, blocking, keyboard
activation, right-click focus, five desktop scales, physical holes, and actual
selection-to-movement orders. A released trainee stays at its current XY before
walking along the existing route; remaining trainees keep training. No invented
panel ejection rule was introduced.

The building button is **dismantling**, not a generic evacuation toggle. Its
command 0x40 calls `0040a0c0`, rewrites appropriate approach/work orders to person
command 10, and sends existing occupants onto that shared order. Command 10's
`00497a30` performs approach, work, timber recovery and departure; `00498140`
ensures the linked construction plan. The earlier artwork field `ejecting` is
renamed `dismantling`; historical native draw payloads are unchanged. These
controllers remain the next gameplay integration, rather than being replaced
with immediate removal/destruction.

Remaining boundaries: original command buffering/turn dispatch, complete
selection-state ownership, secondary selection voices, opening the contextual
person panel, native hover/pressed tint, panel effect allocation/lifetime/fading,
dynamic palettes, dismantling, other panel types and special/passenger occupants.
The live selection roster and ordinary movement adapter remain explicitly shared
with existing browser input. This bounded completion does not claim those systems.


## Live dismantling and corrected selection eligibility (2026-09-10)

The earlier selection oracle mislabeled +0x10 as flags2. Live flags2 is +0x0c;
flags4 is +0x10 and flags3 is +0x14. This could wrongly block turning residents.
The shared helper now reads flags4, and the expanded 2,048-command oracle varies
both words independently. A live portable regression verifies turning bit 128
allows selection while command-eligibility bit 128 blocks it. The checklist was
reopened before correction; the earlier 512-case claim did not prove this mapping.

`app/building-dismantle.ts` reconstructs the complete person-command-10 controller
`00497a30` with named phases. It reuses the original shape sockets, command
eligibility (`00436b90`), RNG, movement recovery, work animation row, timers,
repair holdoff and capacity-limited timber transfer. `check-native-dismantling.py`
compares 2,048 complete native calls including person fields, RNG, consumer order,
plan timber and model stages. Route, allocation and removal consumers are supplied;
this is not an end-to-end original executable gameplay replay.

The activation/cancel reconstruction (`0040a0c0`) rewrites matching shared orders
and restarts state-10 workers. Its initial packed payload uses the **inside** shape
socket; subsequent command initialization uses the outside socket. Another 128
original calls compare that rewrite across four orientations, including target
lookup from terrain and cancellation. These calls deliberately contain no
residents: the ordinary six-slot assignment path uses existing reviewed order,
state and occupancy helpers and is covered by live tests. Special structures and
the original seventh following object word remain unported.

64 original panel input calls establish command 0x40, target ID, enable/cancel
payload, feedback and blocked/busy/suppressed gates. The real desktop button
uses the cached native HFX art; eight additional hover/pressed captures bring
panel checks to 392 full calls, 284 identical draw traces and 108 limited to the
previously documented charge-overflow correction. 32 browser canvases compare
261,120 RGBA pixels against those source-art submissions.

Live entry now initializes the original person state before starting orders,
instead of leaving selected entrants in state 14. This matters when dismantling
reassigns queued braves. Construction registration excludes dismantling orders
and buildings so repairs cannot consume those workers. The existing shared plan
owns wood/stage mutation. Controlled removal suppresses the generic death flash.

Portable scenarios cover five residents plus three queued workers, shared-order
references, no teleport, original work phases, all eight timber units recovered,
three or more model stages, cancellation, reassignment, four orientations and
identical state/RNG at 5, 30, 60, 144 and 240 Hz. Actual browser right-click entry
and button activation exercise visible workers, original sprite-frame ownership,
staged removal, timber recovery, cancellation and panel cleanup.

Remaining scope: full native allocator/command-buffer/command-completion ownership,
class scheduling, special structures and their extra slots, other building panels,
contextual controls for an incomplete building after cancellation, and original
plan allocation/terrain preparation. The incomplete-plan panel is not yet present,
so cancellation is usable but its UI restart path remains open. Ordinary troop
selection voices/person panels and occupant hover tint remain unfinished; the
new hover/pressed artwork applies to the dismantling control only. These bounds
keep the broad repair and HUD checkpoints partial.


## Guard-tower admission, sockets and held occupants (2026-09-10)

The live command-8 entry controller now admits braves, warriors and shamans to
ordinary guard towers. The prior browser eligibility gate incorrectly restricted
towers to braves. Entry retains native capacity one, routing, admission and ground
cell membership, then initializes state 21 through the shared person initializer.
Original occupant animation row 13 plays once and holds; its duration comes from
the requested animation's frame chain and selected descriptor, including the
native byte wrap. This avoids substituting the current vehicle/visibility object.

`00404540` reads six X/height/Y sockets per shape. Its first three sockets apply
`004047b0` corrections from the original `data/smoke.txt`, indexed by model and
orientation. The importer now preserves both tables. The extracted text hashes to
`48d460819cdbc7d32ae7253150752c3d2ea641b07d797d0914525545f5e19cb1`;
provenance records it with the other user-supplied assets. New exports `00404640`
and `004047b0` bring the checked manifest to 991 functions.
`check-native-building-sockets.py` compares all 3,792 original socket calls across
158 objects, four orientations and six slots, including integer wrapping and
signed corrections. The parsed loader table and deterministic terrain heights
are supplied; lookup/correction geometry executes in the original executable.
The native text parser itself is not replayed by this oracle.

The old occupancy field called `clip` was actually the existing person display
height at +0x1c. Both paths now share `supportHeight`. Original body projection
adds its signed value to ground height; tower admission changes the display
position without moving the person to an airborne cell. Occupancy freezes physics.
On an ordinary movement-order handoff, the browser retains the offset until the
next simulation turn applies the shared native support rule. A guard tower has
no active-physics support height, so that resumed turn clears it. Departure keeps
XY rather than teleporting the follower to a doorway. Destruction also releases
the person record, occupancy and offset.

Expanded native evidence: 6,656 state-initializer calls (512 new state-21 cases),
2,048 occupant animation calls, and the existing admission/removal matrices.
Shared regressions pass 30,336 building approach/socket geometry cases, 12,288
idle initialization/rest/approach cases and 16,384 full physics turns. The state-21
oracle supplies occupancy, animation, motion-release and preacher-test consumers;
those tested leaves do not establish the full native scheduler. The animation
oracle executes the complete original pose routine with real source frame chains.

Portable integration covers blue/red towers, four orientations and all three
live classes, one-person capacity, source pose/hold, real cell membership,
non-teleporting exit, destruction and identical simulation/RNG at 5–240 Hz.
The headed browser check uses actual right-click entry/exit, detects 751 occupant
sprite pixels through the lattice, and checks the original pose and height.
Four camera bearings were visually inspected. A higher-view occlusion probe
measures 42 occupant pixels with the tower present and 987 with its mesh hidden;
no forced foreground rendering or guessed height correction was added. Earlier
high-view samples had no exposed pixels. These checks establish live visibility
and physical occlusion, not an exact original raster comparison at every camera.

Remaining scope: guard-tower contextual selection panels, specialist attacks and
spells, preacher/firewarrior/spy classes, tower territory/reveal bookkeeping,
AI reassignment and order-location counters, original command completion/global
allocation ownership and complete native scheduling. The state-21 live controller
currently handles the held pose; broader occupied-person behavior remains open.


## Construction-plan panels and live worker reassignment (2026-09-10)

`00504060` selects panel kind 1 for class-9 construction plans. Kind 8 on an
incomplete building itself has no worker/timber content: reusing the completed
training panel was the wrong representation. `00504bc0` reads the plan's worker
slots at +0x6a, linked building at +0x92, structural timber at +0x96, worker count
at +0x9a and model at +0x9e. Native model tables supply worker capacity and timber
capacity. The browser displays those rows with the existing original HFX palette,
frames, physical-slot compaction, selection marks, missing-timber blink and tail.
HFX40 and its two small palette masks join the existing shared HUD atlas.

`check-native-construction-panel.py` compares 630 complete original draw calls:
all ordinary model entries 1–16, worker counts/slot holes, linked and unlinked
plans, empty/partial/full timber, warning phases, dismantling and control
hover/pressed states. Only final palette/line/fill/sprite consumers are supplied.
The worker enumeration and drawing decisions execute in the original function.
The source-HFX browser comparison checks 32 canvases and 470,208 RGBA pixels,
allowing one byte for Canvas alpha rounding. Portable tests retain all captures.
Occupant hover/pressed tint is not part of this bounded artwork claim.

A native defect is preserved in the oracle and corrected in the browser: for an
**unlinked** plan with more than seven worker slots, measurement reserves one
worker row while drawing two. The browser allocates 28 extra logical pixels;
all original draw submissions, width and positions stay identical. This prevents
the lower timber/tail region from being clipped. Linked plans already measure
their two rows correctly. The canvas correction earns no additional parity credit.

The original input handler `0047b460` resolves ordinary worker slots through the
plan, but resolves control slot -1 through its linked building before sending
command 0x40. An expanded oracle passes 128 plan input cases, with single-person
command 0x2a/flags 6, group command 0x61, right-click focus/person-panel consumers,
linked-building target, activation/cancellation, busy buffer and blocked gates.
Both native plan group-selection states execute through `0043e8e0`. The existing
2,048 selection eligibility comparisons remain green. Browser controls share the
same reviewed selection/dismantling helpers and restore ordinary movement orders;
native command buffering, secondary voices and person-panel opening remain open.

Construction workers still use a browser work-task adapter, so the shared
activation handler now applies original dismantling reassignment to those tasks
as well as native entry orders. It reuses task cleanup and command-10 startup,
preserves XY and cargo, and clears construction registration. This fixes workers
remaining in construction after the panel requested dismantling. Incomplete
hut, warrior hut, guard tower and temple scenarios cover selection, activation,
cancellation and eventual removal after restart. Native command-10 comparison
still passes 2,048 complete calls and 128 activation/cancellation calls; it does
not certify complete native construction-order allocation/ownership.

Live browser checks exercise right-click construction assignment, worker click,
Shift group selection and keyboard activation, active-builder reassignment,
cancellation held across real simulation turns, restart, full dismantling and
panel cleanup. Five desktop geometries cover 1440×1000 through ultrawide/4K.
A focused or hovered control remains usable during cancellation; blocked input
and overview still hide the panel. Panel visibility uses activity/hover/focus
until the native panel pool/lifetime is reconstructed. Other panel types, initial
plan allocation/removal, specialist occupants, dynamic palettes, scheduler and
full contextual-control ownership remain unfinished.


## Ordinary guard-tower occupant controls (2026-09-10)

The guard tower's original descriptor selects kind 7 in `00504060`. Its capacity
is one, with no birth/upgrade side bars. `00504bc0` shares the single-row occupant,
selection mark, dismantling control and tail artwork with kind-5 training panels.
The browser now uses one `occupantPanel` renderer for both supported capacities,
with a 48×62 logical tower canvas. Existing original sprites and palette masks
suffice; no new image, atlas or alternate icon design was introduced.

`check-native-tower-panel.py` executes 168 complete original draw calls, including
empty towers, all ordinary class icons, selection, physical slots 0/5, original
control hover/pressed states and dismantling blink phases. Only final draw/color
consumers are captured; no layout decisions are supplied. Forty-two actual browser
canvases match 124,992 original HFX RGBA pixels within one byte of alpha rounding.
The input oracle adds 72 complete original input-to-selection command paths for
braves, warriors and shamans across all six physical slots, exercising both
single and group selection through the native command handler. Earlier training
and plan-input matrices remain unchanged and passing.

Live tower panels now expose the existing selection, camera-focus and dismantling
handlers. They show an occupied tower during activity and an empty tower on actual
mesh hover. Selection alone leaves its person inside; an ordinary movement order
restores movement without an XY teleport. The original control can cancel or
activate dismantling, and a brave can dismantle the empty tower to removal.
Mouse, Shift group selection, Space activation, right-click focus, input masking,
five modern desktop geometries, bitmap caching and cleanup pass in the browser.

The new occupied-tower dismantling scenario exposed an unconnected state-initializer
consumer: leaving state 21 can call `004d56f0` to rebuild resting slots. The entry
adapter now invokes the existing `rebuildRestingSlots` reconstruction over its
native cell list. No no-op or alternate exit state substitutes for that call.
The existing oracle passes 2,048 rebuild cases plus 6,144 cell/valid/find cases,
16,384 indexed-search operations and 44 startup slot positions. Live tests cover
all three follower classes: each leaves when reassigned; only a brave accepts
and completes the dismantling work. This does not complete resting-slot ownership
for ordinary browser people or the global person scheduler.

Remaining boundaries: native panel allocation/lifetime, person-panel opening,
secondary selection voices, occupant hover tint and dynamic palettes; enemy tower
panels, specialist tower attacks/spells, territory/reveal, AI reassignment and
complete command/state/allocator ownership. The linked building and held-person
mechanics remain separately tracked; a working control panel does not certify
full tower gameplay or the complete native renderer.

### Ordinary melee decisions and busy opponents (2026-09-10)

`00518fb0` permits a ready fighter to hit an opponent who is not ready. For choices
0–3, the opponent must be within a squared native distance of 129600 from its own
assigned fight slot (exclusive boundary, wrapped coordinates). In a fight with
more than two participants, even choices use state 4 (special, no retaliation)
and odd choices use state 3 (strike, simultaneous retaliation). A target which
has left state 25 uses state 4. Two-person fights do not use the busy-fighter path.
Ready opponents retain the existing class-specific choice thresholds. The later
attack-entry branch only changes the defender's facing and recoil state when the
defender is still ready; an ongoing action must survive an opportunistic hit.

`app/melee.ts` names these choices without translating decompiler locals. The
live battle adapter now computes the extra slot distance only for choices that
can use it and keeps the existing simulation RNG draw order. Damage still uses
both pre-hit HP values. No rendering cap, display-frame counter, new dependency,
unit scan, or persistent object allocation was introduced for this decision.
The helper's leaving-target branch is compared but ordinary browser battle
cleanup still removes participants who have left; global exit/order handoff
remains unverified. Original full fight timing, movement and effects are not
claimed complete by this change.

`check-native-melee-decisions.py` executes the original `005193d4..0051947e`
decision block with supplied choice/opponent selection and real `0051e3d0` slot
geometry and `00450450` squared-distance calls. It compares 30,240 cases across
all three live classes, 2/3/4 participants, every slot, all 16 choices, ready,
busy and leaving targets, reach boundaries and wrapped coordinates. It does not
replace calls within the compared block. The block boundary is explicit: this
is not a comparison of the whole fight controller or its subsequent damage.
The executable identity is checked by the shared `native_cpu` loader.

`tests/melee.test.mjs` covers live damage/retaliation and preservation of busy
state/facing, the exclusive range boundary, movement-order interruption and equal
outcomes at 5/30/60/144/240 Hz. Existing duel and four-person fight regressions
also pass. The headed browser check renders special/strike attacks for braves,
warriors and shamans while defenders retain their strike animation. The existing
392-pose GPU oracle checks the unchanged original sprite frames/layers.

Modern performance evidence: `performance/2026-09-10-melee-decisions.json`, Chrome
153/ANGLE Metal/Apple M5, 1440×1000 DPR 1, six staged three-person fights on flat
terrain. Across 1,678 active-fight frames, callback CPU p50/p95 is 1.5/2.0 ms,
callback gaps 3.6/3.7 ms (maximum 7.1 ms), maximum 104 draw calls. Browser callback
cadence is not physical display FPS. This is a feature acceptance measurement,
not a paired speedup or a whole-game performance claim. Combat decisions remain
on the simulation clock while presentation remains uncapped.

Quality: all 196 tests, TypeScript, formatting and the production build pass.
The new decision module passes ox-standard without findings. Fallow remains at
85.7 maintainability, average cyclomatic complexity 2.7 (p90 5), 12 dependency
cycles. Existing `model.ts` lint debt (type declarations and chained assignments)
is still open; this check does not certify repository-wide lint cleanliness.

### Melee action clocks and native knockback integration (2026-09-10)

The ordinary fight adapter now advances explicit turns remaining. In `00518fb0`,
attack substates 2/3/4 initialize their timers from the authored animation object
and decrement on entry. Defender substates 5/6 initialize only when that defender
is visited, so member ordering matters. Expiry changes the next state without
running approach in the same visit. Completion sounds follow that expiry. The
browser retains the displayed attack/recoil pose until the next phase selects
another animation. Shaman recoil lasts seven turns; ordinary knockback recoil
lasts four; the original level flag 0x40 suppresses ordinary attack knockback.
There are no rendered-frame counters or refresh-dependent timers.

Substate 7 now enters the existing shared native physics driver. Its RNG draw,
impulse direction/strength, slope correction and flags follow the original.
The two-turn counter changes the animation; it does not end sliding. The fighter
remains in this phase until the native airborne/impulse flag clears, then the
fight center moves to the original 512-coordinate cell center after all members
have been processed. `004ec6f0` confirms fight controllers precede ordinary unit
physics, matching this integration order. Friction, drift, falling, bounce,
landing, support height and settling use the existing common physics code instead
of a second planar recoil implementation.

Two adapter handoffs were necessary. First, ordinary combat HP remains authoritative
between turns; the impulse adapter now imports it before physics so a hit against
a sliding opponent cannot be undone by its previous native snapshot. Second, new
impulse records join the shared cell list before their first physics move, including
replacement of an older record. The prior end-of-turn reconciliation alone could
leave a cross-cell impulse moving an unregistered record. Both changes also apply
to the existing Blast path; its live shadow/selection regressions pass.

Evidence:
- `check-native-melee-timing.py`: 405 traces through the original fight controller,
  all three live attacker/target classes and substates 2–6, entered and retained
  states, positive/zero/negative/wrapped signed timers, original animation setters
  and source VFRA/VSTART duration data, transitions and completion sounds. Group
  membership/relocation, damage and final sound/render consumers are supplied.
  An additional 384 original substate-7 entries compare RNG, velocity, retained recoil frames and recovery
  flags across 32 directions, four seeds and all three live classes. Its height
  consumer is flat; this initialization check does not certify the entire group
  lifecycle or physics world.
- `check-native-physics-driver.py`: 16,384 full physics turns, including 128
  64-turn trajectories, plus 4,096 bounce cases; all recorded driver branches
  exercised. `check-native-person-motion.py`: 4,096 cases each for native facing,
  slope velocity, obstacle probes, recovery and proximity. Existing world-consumer
  boundaries remain stated by those oracles.
- `tests/melee.test.mjs`: flat/slope settling, animation completion before sliding
  ends, fight recentering, cell-list ownership, hits during recoil, order handoff,
  shaman/level-flag suppression, and equal outcomes/native animation state at
  5/30/60/144/240 Hz and irregular frames. Tiny floating clock residues are checked
  below 1e-9 before comparing state, as in the existing game-clock checks.
- `check-browser-melee.mjs`: original special/strike poses for every live class,
  preserved busy defender poses, actual downhill recoil beyond its animation
  timer, return to approach and no browser errors. Existing 392 GPU pose,
  Blast-shadow and selection-arrow checks pass. All 200 tests, TypeScript and
  formatting pass. Fallow remains 85.7 maintainability, average cyclomatic 2.7
  (p90 5), 12 dependency cycles. New melee code passes ox-standard; existing
  adapter/model lint debt remains tracked rather than certified clean.

Modern acceptance profile: `performance/2026-09-10-melee-recovery.json`, headed
Chrome 153/ANGLE Metal/Apple M5, 1440×1000 DPR 1, six staged three-person fights.
1,677 active-fight callbacks: CPU p50/p95 1.5/2.1 ms, callback gaps 3.6/3.8 ms,
maximum gap 7.1 ms, maximum 104 draw calls. A subsequent ramp scenario records the
actual recovery trace. This is a feature acceptance sample, not a paired speedup
or a whole-game/display-FPS claim. Shared modern rendering and uncapped interpolation
remain unchanged; the native motion rules run only on simulation turns.

Still open: full fight allocation/validity, native approach/recovery speed RNG,
terrain-mask relocation, death/statistics and all damage modifiers, generic hit
visual replacement, complete command/AI ownership and global person scheduling.
At the ordinary browser/native pose handoff, the existing elapsed-turn pose supplies
the retained frame; full persistent native animation ownership still belongs to
the global person integration. Substate verification does not complete these wider
mechanics.

## Native fight-site placement (2026-09-10)

`0051e4b0` rejects center flags `0x206` and coastal category flags `0x3c`,
then optionally rejects another class-10/model-8 object in the same cell. The
fight itself is excluded by identity. Four radius-180 probes, spaced 512 angle
units apart, use the complete `005178d0` person collision routine. The envelope
has four points even for a two-person fight.

`00519d10` first moves a fight out of a building footprint using `004044b0` and
the masked building ID. This happens on every visit. Other invalid sites trigger
search only on a forced visit or when the class-counter low five bits are zero.
The type-2 indexed search traverses rings 0–8 in the authored angle-dependent
order. Candidates are native 512-coordinate cell centers with toroidal wrapping.
It releases the search slot and moves to the first valid candidate; exhausted
searches and allocation failures retain the existing fight. The old browser
radial/every-turn search and blocked-fight cancellation are removed.

The live adapter calls forced placement on creation, shares terrain masks,
building geometry and the indexed-search pool, and indexes other fight centers
once per relocation visit. Sequential calls see earlier groups' relocated cells.
It does not add per-render work or a new update loop. Height interpolation is a
pure terrain read that is irrelevant to validity; only a chosen destination is
sampled. The native oracle compares final coordinates, height and all search-pool
bytes across 2,048 cases, running original collision, building geometry, height,
search and cell movement without replacing any consumers. Coverage includes
all categories, blocked masks/flags, self/other object classes, toroidal edges,
force/counter gates, successful/failed searches and pool exhaustion. Height calls
fall from 33,817 to 814 for identical results.

Portable/live checks cover intervening turns, periodic relocation, building exit,
failed-search retention, occupied cells and pool exhaustion. The browser checks
also retain the existing combat sprites and slope recoil tests. A paired warmed
Node workload of 3,072 site searches drops median CPU from 2.247 to 1.923 ms;
this measures search cost, not frame-rate improvement. The separate headed
combat sample records 1,678 active-fight callbacks at CPU p50/p95 1.4/2.0 ms,
RAF gaps 3.6/4.3 ms (max 7.2 ms), maximum 104 draws, Chrome 153/ANGLE Metal
Apple M5, 1440×1000 DPR 1. No heavy tools or edits overlapped profiling.
See `references/performance/2026-09-10-melee-placement.json`.

Boundary: the primitive receives the controller counter; the live adapter still
supplies world turn. `004ed8a0` seeds per-object counters from per-class allocator
state, while `004ec6f0` visits fights before incrementing ordinary object counters.
Full mixed-class allocation and scheduler phase remain unported. Newly exported
`0051de60` also shows target-first membership/center, an initial `random % 360`
angle and forced placement. Only the placement call is integrated here; member
allocation/order, initial angle/RNG and prefight handoff remain open. Native
approach movement, complete damage/effects, command dispatch and campaign attacks
are not claimed complete by this bounded placement requirement.

## Melee approach and ready-slot transitions (2026-09-10)

`00519183..0051935f/0051947e` in `00518fb0` handles approach and ready phases
before attack selection. Every approach visit calls `004d4f40`, drawing configured
speed and selecting the cargo/airborne movement animation. Arrival compares signed
coordinates independently with an inclusive eleven-unit tolerance; the subtraction
itself does not fold the seam. Arrival moves to the exact slot/terrain height,
changes to ready and stops via `004d4ee0`. Outer fighters face the center and
release their motion route. If an already-ready fighter's slot has moved, it
switches to approach without drawing speed or issuing a destination until its
next visit. Direct destinations use the existing `004e9dd0` port.

The browser retains a native person for combat motion. Fight controllers set
destinations before the ordinary unit loop runs shared preparation/reaction and
`004e6d00` physics. Constant straight-line movement and radial building clearance
are removed. Native collision masks, slope speed, recovery, velocity limits and
cell-list splices now govern approach. The same person survives attack/recoil
handoff; HP remains synchronized with the existing damage adapter. End-of-turn
cell reconciliation no longer overwrites its native height. Rendering uses that
height and the shared interpolation/presentation clock, with original movement
and carrying animation objects.

New export `005184e0` establishes `0x200` arrival clamping and `0x200000` combat
facing. These flags are needed by both approach bootstrap and knockback bootstrap.
A regression found that omitting them from the latter caused endless circling
after recoil. The shared constructor now supplies them; the knockback native
fixture includes those established state-25 flags before entering substate 7.
This does not claim the full class initializer, including selection, special
models and preceding world cleanup, is integrated.

Evidence:

- `check-native-melee-approach.py`: 4,096 original control-block cases with real
  speed RNG, slot geometry, terrain height, cell movement, route release and
  animation setters. Compares flags, phase, animation fields, destinations,
  route bytes and random state; group/index inputs are supplied and the block
  stops before attack selection. A further 96 × 16-turn comparison composes
  original control/preparation/reaction/airborne eligibility/physics and matches
  the **actual live adapter** across classes, cargo, slopes and restricted cells.
  Reveal/path-list consumers are supplied; allocation and global scheduling remain
  outside this contract.
- Existing timing/knockback and full physics oracles pass: 405 action traces,
  384 impulse entries, 4,096 bounce calls and 16,384 native physics turns.
- 207 portable tests pass, including eight-direction arrival without circling,
  delayed pursuit of a moved slot, restricted-cell blocking, retained cell/HP
  ownership, post-recoil resumed fighting and 5/30/60/144/240 Hz plus irregular
  replay. The isolated command handoff test removes nearby contacts first.
- Headed browser checks render original walking/carrying/arrival objects for all
  three live classes, alongside attacks and slope recoil. Sprite/shadow/selection
  and nine Scene-cadence interpolation regressions pass.

The physics adapter builds the celebration/order context only when a state
consumer requests it. Removing eager per-person cell reconciliation yields equal
whole worlds in a 64-person × 24-visit paired workload: median 8.211 versus
4.859 ms. This isolates reconciliation overhead, not old-release or display FPS.
The separate headed combat sample has 1,679 active-fight callbacks: CPU p50/p95
1.5/2.0 ms, p99 4.6 ms, maximum 6.7 ms; RAF gaps p50/p95 3.6/4.1 ms, maximum
4.5 ms; maximum 104 draws. Chrome 153/ANGLE Metal Apple M5, 1440×1000 DPR 1.
No heavy tools/edits overlapped that sample. Raw evidence:
`references/performance/2026-09-10-melee-approach.json`.

Still open: original prefight/group creation, per-class counter phase, initial
membership/angle RNG, full damage modifiers/effects and command/AI ownership.
The legacy contact scan can immediately reacquire an opponent after a move order;
compare original command interruption and prefight dispatch before changing this
behavior. Full engine, all classes/campaign missions, saves and multiplayer remain
unfinished. This requirement covers approach/motion, not complete combat.

## 2026-09-10 — engagement eligibility, range and wrapped cell boundaries

Reviewed supplied-executable `004d44e0`, `004d4690`, `0051ff60`, `0051e5e0`,
`0051eab0` and `00520480`. This resolves the old assumption that the blue tribe
reacts within three world units and the red tribe within eight. Both use the same
class/command rules. Ordinary movement command 3 selects range 1: after rounding
the radius to an even high-coordinate byte, the scanner checks only the current
512-unit terrain cell. Idle brave/warrior range 5 scans five cells per axis.
Consequently a nearby enemy across a cell edge need not interrupt movement, while
a farther enemy inside the same cell can be detected. This is not an unconditional
right to retreat; opponents can initiate combat too.

`app/melee-engagement.ts` expresses eligibility and range in named TypeScript
operations. Cancelled commands are ignored by eligibility; range still reads them
unless flag 32 marks an automatic order. State, assignment, airborne, vehicle,
command phase and class flags gate scanning. Firewarrior range includes original
altitude factors and tower addition (compared at the primitive level; that class
is not integrated into the playable browser roster). Descriptor extraction now
includes command range mode and person idle/ordered ranges and scan masks.

The live adapter applies those gates/bounds on four-turn brave/warrior visits,
consumes pending scans and preserves the original shaman command restriction.
Both tribes can pursue automatic targets; explicit attack orders do not wait for
a scan visit. Reused class mappings remove a nested conditional in the existing
person bootstrap. No new package, render clock or animation timer was added.

`check-native-melee-engagement.py` passes 8,192 complete original eligibility/range
calls, including callback count, command cancellation, state/phase edges, all eight
person models and altitude boundaries. Ritual availability and adjacent-tower
lookup are supplied consumers. Another 4,096 calls execute the complete native
`0051eab0` with one eligible enemy and no buildings/fight objects: wrapped edges and
whole-cell membership agree with constant-time modular bounds. This proves the
area predicate for that domain, not a complete target-selection controller.

`tests/melee.test.mjs` checks both tribes, adjacent-cell movement, same-cell detection,
idle pursuit, alliances, pending scans, explicit attack and native inhibition;
whole live worlds agree at 5/30/60/144/240 Hz and irregular schedules. The old group
fixture now starts on a detection visit instead of assuming every turn scans.
211 tests, typecheck, format and the new primitive's oxlint pass. Browser checks
cover the live moving-warrior pose and immediate explicit engagement, combat/recoil/
carrying poses, 392 GPU sprite poses, Blast shadows and selection. Fallow reports
85.6 maintainability, average cyclomatic 2.7/p90 5; twelve existing cycles remain.

Performance evidence is in `performance/2026-09-10-melee-engagement.json` and the
modernization audit. The 96-person recurring-scan workload is separate from the
staged combat sample. An unwarmed synthetic scene had a 76.5 ms outlier; retain it
as a measurement limitation, not proof of steady gameplay performance.

**Unfinished:** ordinary movement still supplies command 3 without native global
order ownership; world turns supply scan phase. Current targets follow the browser
array and existing contact/pursuit controller. Original automatic order 21 allocation,
shared same-cell responses (`00520480`), mixed buildings/fight objects, full target
filters/priorities, ritual ownership, special scanners, global scan inhibition and
command restoration must be integrated before complete engagement is verified.
The new group-validity and ranged-visibility exports are research, not ports.
Lifecycle remains partial; no requirement or parity percentage credit was added.


## 2026-09-10 — mixed combat targets and attacker reservations

Recovered complete ordinary selector `0051c4c0`, fight-admission query `0051dcc0`,
reservation writer `0051fe40` and plan predicate `004baab0`. The complete threat
scan `0051eab0` now also covers mixed fight/building/plan objects, water categories,
alliances, disguise and specialist eligibility. Person rank/damage and building
attacker limits are extracted from the supplied executable, not hand-authored.

`app/combat-targets.ts` collects at most 64 candidates in wrapped row/cell/list
order, deduplicates building footprints and uses stable distance sorting. Bands
are `(distance - nearestDistance) >>> 9` for **every** record. A misleading Ghidra
alias initially suggested a changing base; whole-native execution disproved that
interpretation. Within a band, joinable fights precede people, buildings and plans.
An available unreserved candidate wins before the saturated fallback; full fights
have their separate forced-order fallback. Admission tests count three tribe slots
and compare class ranks. Reservations preserve native byte wrapping, flags and
48/32-turn values; ordinary countdown reuses `stepPersonReaction`. Native class-10
fight records do not run that countdown.

`check-native-combat-targets.py` runs **2,048 complete threat scans and 2,048 complete
selectors**, with all native callees and no behavioral hooks. It compares target ID,
returned class and every object's reservation fields, and asserts no RNG advance.
Coverage includes seams, odd/rectangular areas, stable ties, dense 64-object caps,
all five result types, both player types, all live/specialist person models,
reservation saturation, plans and group admission. Portable original outputs in
`tests/fixtures/combat-targets.json` replay without the executable. Native exports
retain their executable identity and hashes in the manifest.

`app/live-combat.ts` integrates the recovered query without manufacturing native
sprite records. It preserves native chain order where already owned, adapts
ordinary idle/movement states, lazily reads building footprints and commits chosen
target reservations. Shared building/person model mappings avoid a new runtime
import cycle. Source admission determines automatic-order flags; a detected person
does not indiscriminately enable building attacks. Existing attack targets survive
between scan visits, including close buildings, instead of repeatedly reserving
and attacking only on detection turns.

Live tests cover closer-target choice, saturation/fallback/countdown, mixed
buildings/people, fight priority, squad distribution and persistent building attack.
Whole-world outcomes agree at 5/30/60/144/240 Hz and irregular schedules. A browser
squad assigns three warriors to the nearer shaman and one to the next while
retaining original walking frames and sprite ownership. Existing combat/recoil,
392-pose GPU, Blast-shadow and selection checks remain passing. Isolated sorting
and headed crowd/combat measurements are in the modern-performance reference.

**Limits and next work:** the primitive's admission test is not actual group member
replacement/splitting. Browser groups still cap at four and adapt group membership,
center, initial angle and counter phase. `0051a2a0`'s complete area-order controller
has many pursuit/attack phases; `0051e150` creates model-9 prefights before actual
melee, while `0051de60` creates model-8 groups target-first with an RNG heading.
`00520300`, `0051c110`, `00438af0`, `0051ddc0` and `0051f750` are retained research,
not claimed ports. Next connect actual command-21 allocation and `00520480` same-cell
sharing through the existing order pool and preserve prior work on completion.
Specialist selectors (`0051ce50`, `0051d0b0`), special plan variants, full mixed-class
cell/allocation ownership, allied/special lifecycle effects and complete campaign
attacks remain open. The bounded query requirement is verified; melee lifecycle
and the full engine are not. No native original-source recovery is claimed.


## 2026-09-10 — automatic alert ownership and coastal dispatch

Recovered ordinary `0051e5e0` and same-cell `00520480` in `app/combat-orders.ts`.
Detection precedes allocation; a full order pool still returns the detected threat
without changing any follower. Successful allocation prepares command 21, marks
the source for reinitialization, attaches the immediate command and shares that
single record with matching same-cell class/model/tribe/state/command-status people.
Recipients already holding an immediate order are skipped. The special-source flag
requires the same recipient flag. Sharing does **not** rerun recipient eligibility.
Normal queues stay intact and reference counts are owned by the existing helpers.

`check-native-combat-orders.py` passes 1,024 **complete original initializer calls**,
with all native callees and no behavioral hooks. Inputs include all four detection
results, mixed persons/fights/buildings/plans, shore categories, allocator wrap/full
pools, existing ordinary immediate orders and matching/nonmatching cell peers.
All tracked person fields, every byte of the 800-record pool, allocation counters and RNG
are compared. Owned spell/fight/work cleanup is outside this fixture domain and
remains a required world consumer. Another 1,024 complete `00438730` calls verify
command-21 coastal preparation, wrapped centers, radius retention and the
identical-record early return. Portable executable captures cover both routines.

`004d4690` now has a reviewed shared dispatcher in `app/melee-engagement.ts`.
Periodic visits set a pending bit; consumption clears it before level flag
`0x02000000`, range and eligibility checks. Preacher, shaman, firewarrior and special
responses select their original distinct scanner. The live ordinary query uses
this dispatcher, including the previously ignored campaign suppression flag;
unported specialist response bodies no longer fall through to ordinary melee.
Explicit attacks continue through their existing command path. The ordinary live
adapter still supplies world-turn scan phase and does not overwrite native counters.

The expanded engagement oracle compares 8,192 original eligibility/range/dispatch
cases (all five dispatch outcomes and consumer call counts) plus 4,096 complete
person-only area traversals. Ritual/tower lookup, firewarrior readiness and dispatched
response bodies are supplied consumers in this dispatcher check; the separate
ordinary initializer check above executes its native body and callees fully.

Live command-21 preparation now moves coastal alert centers by the original
one-cell landward correction. The adapter includes the newly exposed outer ring;
each actual scan retains its exact native square and 64-candidate cap. A portable
and browser scenario detects an enemy in the original cell but correctly selects
from the corrected inland cell. Coastal point calculation is shared with movement
orders; their 1,024 original preparation regressions remain passing.

Tracing `004366b0` exposed misleading old callback names: `0043d2f0` tries the saved
**vehicle**, then `0043d0e0` tries the saved **friendly building**. They are not a
saved-path replay. Corrected `advancePersonOrder` and its native oracle names;
16,384 advance/idle/update/composed comparisons still pass. The saved-building
routine chooses entry for an intact building or construction for an incomplete
one and checks class eligibility; the saved-vehicle routine validates capacity,
reachability and distance. Exports are retained for the next ownership integration.

**Still unfinished:** the live target adapter has not attached the new shared
response records or preserved ordinary work queues through fight entry. Replacing
that lifecycle requires the real command-19/21 body, startup/advancement and world
cleanup consumers, including saved vehicle/building requests. Do not implement a
browser task/path snapshot as a substitute. `releaseTasks` currently clears the
legacy work state on fight entry. Native scan placement after state/health dispatch,
per-object phases, specialist bodies and full prefight/group lifecycle are also
open. The new initializer is primitive-level evidence; lifecycle stays partial
and this work earns no additional verified requirement credit.


## 2026-09-10 — moving-target pursuit destination refresh

Reviewed `00439850`, called by command-19/21 person and fight pursuit in
`0051a2a0`. The previous live adapter followed the old destination until its
route emptied, then requested another route. It now updates during the chase.
For radius 224, refresh occurs when either signed coordinate differs from the
stored goal by **at least 168** (`trunc(radius/2)+56`). This is an axis test, not
Euclidean distance; signed-short endpoints are compared without wrapping the
difference. Small target movements preserve the existing route. The shared
`pursuitDestinationChanged` helper lives with existing native route primitives;
the ordinary adapter still uses `planLivePath` and preserves sprite ownership.

`check-native-pursuit.py` executes 4,096 original already-entered, grounded,
valid-target pursuit calls and observes the destination consumer. Cases cover
four radii, both axes, threshold neighbors and signed-coordinate boundaries.
Only `004e9d80` is intercepted to record and apply its requested destination:
this verifies the refresh decision, not its route-planner consumer or the full
controller. Existing native route ports remain the planner evidence.
Portable/live tests cover unchanged-route identity, updates before reaching the
old point, a second target relocation, ordinary command replacement, and identical
5/30/60/120/144/240 Hz outcomes. Browser tests verify the refreshed goal and the
actual original walking sprite, alongside squad priorities and coastal dispatch.

**Open:** complete pursuit entry/RNG/speed, 64-visit timeout and failure handling,
arrival/prefight consumers, housed/vehicle targets and normal command restoration.
The surrounding legacy contact radius/movement adapter is not established as
full command parity. These native exports also retain building/plan arrival and
fight helper evidence for the next integration; export alone earns no credit.
Lifecycle remains partial; no new verified requirement is claimed.

The routing readability cleanup also passes 18,432 native release/attachment,
reuse, point, vehicle and destination comparisons plus 8,192 failed-cache/build/
composed-plan comparisons. These retain the documented supplied-consumer scope
of `check-native-person-routes.py` and `check-native-route-build.py`.

## Outdoor encounter before melee (2026-09-10)

Recovered `00518630` phases 4–8 now run in `app/melee-encounter.ts` for ordinary
outdoor brave/warrior/shaman encounters. `0051e150` supplies the immediate first
visit, attacker approach/defender wait and state-29 ownership; `00518480` supplies
ordinary grounding. The attacker approaches at the `004d5010` running speed
(physics-record offset +6), not walking speed +4. The defender faces and waits;
row-10 attack duration controls row-11 stagger, two separate RNG draws produce
the slope impulse, cue 13 accompanies completion, and reapproach waits for the
defender to settle. The wait helper `004d4da0` uses idle rows 21–23. `0051de60`
supplies defender-first membership, defender-centered placement and RNG % 360
angle when the encounter hands off to the existing fight controller.

Both skip-intro and ordinary melee knockback suppression read **gameFlags** at
`0089d17c`, not the separate browser levelFlags field. Confirmed instructions:
`00518856` and `005195de` test byte `[0089d17c], 0x40`. The old knockback adapter
used the wrong field; a regression now varies both independently.

Evidence:

- `check-native-melee-encounter.py EXE`: 4,096 complete outdoor controller calls;
  native animation, running-speed RNG, facing, route and slope callees execute.
  Terminal deletion/fight allocation and sound submission are observed consumers.
  Signed positions/timers, 315-unit proximity, cancellation, flags, poses, RNG and
  ordered sound agree. 142 portable captures are retained for ordinary tests.
- `check-native-person-state.py EXE`: 7,680 shared state initializers, now including
  25/29; specialized world bodies remain supplied consumers. Additional 6,624
  selectors, 1,280 startup cases, 640 speed calls and 128 training handoffs pass.
- `tests/melee-encounter.test.mjs`: nine playable class pairs, no premature damage,
  physical displacement, sound, defender-first handoff, cancellation and identical
  state/animation/sound trajectories at 5/30/60/120/144/240 Hz and irregular timing.
- Appended brave/warrior stagger and three idle gestures for blue/red owners;
  shaman gestures reuse original standing source. All old frames/pieces retain
  their indices/content. Native sprite comparison covers 8,568 complete draws
  (2,856 frames × three owner paths) and all 3,201 original RGBA pieces. The GPU
  regression expands from 392 to 520 reviewed poses; shadows/selection also pass.
- `check-browser-encounter.mjs --headed`: original opening/stagger/idle poses,
  actual live displacement, sound and completed fight; its first-hit atlas-upload
  guard detects the rendering stall described in modern-performance.md.

The native oracle does not execute full initial allocation, terminal fight
creation, building stages 1–3 or global scheduler phase. The live adapter retains
browser IDs/dispatch and existing admission limits. Queue restoration, mixed-group
replacement/splitting, specialist classes, housed/vehicle targets and full melee
lifecycle remain unfinished. Only the explicitly bounded outdoor encounter
requirement earns credit; discovery remains open. The export manifest has 1,026
entries, adding `00518480`.

## Fight reinforcements, replacement and splitting (2026-09-10)

`0051ddc0` now supplies ordinary live group admission instead of the old
four-person cap/reversal shortcut. The existing `availableFightSlot` port of
`0051dcc0` is shared with target selection: reject unrelated tribes, return 255
for specialist dispatch, fill the first empty slot while fewer than three members
of this tribe are present, otherwise replace the first weaker friendly model.
This is a rank comparison, not nearest-person or lowest-health selection.
`004a3920` clears the displaced person's group/work target and sets recovery flag
16; it does not delete the native normal command queue.

`0051df90` counts both tribes in six persistent slots. If each has at least two
members, it takes the **last occupied slot of each tribe** for a new fight. The
new group's membership order follows the parent tribe order, its angle draws
RNG % 360, both people reset to approach, and the parent's center ID becomes zero.
Allocation failure instead releases both selected people without drawing RNG.
Both branches clear those slots and decrement the original count by two.

`app/melee-groups.ts` keeps the recovered controller independent of browser
presentation. The live adapter retains six original slots and derives a compact,
center-first processing list. Reordering that list no longer corrupts later
admission/replacement/split decisions. `00518fb0` selects/recenters on the next
group visit; the old test that expected immediate recentering on admission was
corrected to this observed call order. The center ID also makes a split's reset
and a newly allocated fight's first recenter/half-turn explicit.

Evidence:

- `check-native-melee-groups.py EXE`: 4,096 complete `0051ddc0`/`0051df90` calls,
  with real slot selection, replacement-release helper and RNG. Person entry and
  allocation are observed world consumers. Compare all member/group fields and
  consumer ordering, holes, ranks, protected members, specialist sentinel, all
  four tribes, allocation failure and count/angle/RNG. 133 portable captures.
- Five live/portable tests cover three-per-tribe rejection, first weaker replacement,
  native release fields, last-slot pairing, distinct groups, retained membership
  through center changes and 5/30/60/120/144/240 Hz plus irregular replay.
- `check-browser-melee-groups.mjs --headed`: eight fights receive reinforcements,
  replace weak allies, and split into sixteen fights. Original visible poses and
  no browser errors; staged membership captures and measured hardware frames are
  retained in `performance/2026-09-10-melee-groups.json`.
- Shared target selection rechecked against 2,048 native detectors and 2,048
  native selectors. Existing melee/recoil/approach and outdoor encounter checks
  retain their independent coverage.

The manifest now has 1,027 exports, adding `004a3920`; `00519a70` was re-read and
retained unchanged. Its full raw-slot cleanup, distance release, signed group
references and reservation adjustments still need direct reconstruction/tests.
The live release adapter still does not restore original command ownership;
marking the native person's recovery bit alone does not implement that lifecycle.
The browser group allocator is unbounded, global class-counter/cell-order ownership
is unfinished, and specialist classes remain primitive-only. Full melee stays
partial; this step earns no additional whole-lifecycle credit.

## 2026-09-10 — original held-key follower health gauges

The former selected/damaged-person horizontal boxes were browser placeholders,
not original geometry. Native `004673b0` block `00468e1c–00468e8a` requires render
flag 8, class 1, local ownership and signed health below maximum; person flags3
`0x1000` or flags4 `0x800` suppress it. Its anchor is projected person position,
with Y reduced by truncation of the already-scaled pose height ×24/32.

`00525450` submits a 4×24 background, four one-pixel bevel edges and a 4-pixel-wide
white fill of `trunc(health*24/(maximum || 1))`. Executing `00516500`, `005166c0`
and `00516a00` through their final quad submission confirms the complete 6×26
extent, palette entries 154/157/150 and native-initialized white entry 130. Default
background alpha is 171/255 (`256 - 005da07c`, initially 85). Border/fill are opaque.
Native GPU quad coordinates, rather than Ghidra's inferred line endpoint types,
were used to generate all 25 ordinary fill states in `public/original/unit-health.png`.

Default input records at `005d6238/005d6244` bind scan 0x28 (physical Quote key) to
command 100 on unmodified press and 101 on release with any modifiers. Both need
an active level. Native `00489470` and `004aab80` execute in the oracle, including
preserving unrelated render bits. Browser focus loss clears held input; forms,
modal UI and scripted input suppression retain normal browser protections.

`app/unit-health.ts` contains the readable visibility/anchor/fill rule. Scene
rendering shares the ordinary sprite projector, fractional person position, atlas
UVs, authoritative cell gates and painter ordering. Atlas merging replaces six
native primitives with one quad and preserves its translucent background; it does
not introduce a canvas overlay or a frame-dependent animation. The palette atlas
is shared across people, preuploaded during loading and kept alive through person
removal. Existing shared-texture disposal now checks actual cache ownership.

Reproduce with:

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-unit-health.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/unit-health.test.mjs
node scripts/check-browser-health-bars.mjs
node scripts/profile-unit-health.mjs
```

The native oracle compares 2,048 render-branch decisions and complete eligible
quad streams, 32 default key lookups and associated real health commands, plus
150 native quads for the 25-frame atlas. Only GPU queue submission and the
Windows CRT ceil entry are supplied; native line angles, arithmetic, palette
selection and drawing functions execute. `--record` recreates the atlas and 96
portable cases. Browser checks compare 3,900 pixels with at most one byte of
alpha-blend rounding, live press/release/modifier behavior, friendly/damaged gates,
five desktop/DPR layouts and shared atlas lifetime. The 520-pose sprite, shadow
and selection regression checks pass unchanged.

Limits: this is the default held-key display, not right-click query health/activity
icons, building gauges, rebound input profiles or all mixed-class painter ownership.
The atlas covers valid living-person health 0..maximum; corrupt/negative-life
rendering and nondefault global ghost-alpha modes are not claimed. No new full
interface or combat-lifecycle gate is marked verified.

## 2026-09-10 — native fight cleanup, center selection and recovery

`00519a70` resolves six persistent members and retains allocated, living people
whose signed group reference matches and whose state-table flags include combat
bit 16 (states 11/12/14/25). Invalid allocated members lose their reference;
removal clears group reservation bit `0x100000` and decrements a nonzero byte
reaction timer. Deleted/unallocated records are not written. The squared wrapped
XY distance must exceed `0x400000` to release someone: exactly eight browser
units remains valid, but an additional 1/256 on the other axis can cross it.
Signed 32-bit overflow of the sum also matches the executable.

Persistent slots and the compact output array are distinct. The native distance
pass clears the persistent slot using its **compact index**, even after earlier
removals left holes. Its single forward compaction pass does not retry consecutive
holes. The pure port retains both behaviors. The native copy reads one trailing
stack word; the oracle supplies zero there, and the browser adapter filters zero
IDs before processing rather than dereferencing absent people. This memory-layout
artifact is not a reconstructed object ID or a claim of arbitrary-stack parity.

`005199f0` picks the last member of the first tribe unless that tribe has more than
one member, then picks the last member of the other tribe; two-person groups use
index zero. The returned center key comes from the corresponding persistent slot,
while the position/processing swap uses the compact person. Center changes retain
the original half-turn and relocation. Group actions only run for state 25 even
though cleanup permits airborne/reaction states.

The terminal tail of `00518fb0` clears references through the first `count`
persistent slots, calls `0041b550(winner,0,1)` and deletes the group. Statistic zero
uses signed 32-bit addition; neutral winner 255 does not increment a tribe. The
person dispatcher subsequently runs `00518560`: a missing/deleted group selects
the model's default state (model 7 uses 39 when game flag 2 is set), subject to the
outer protected-transition bit. Live recovery reuses `initializePersonState`,
including its original flags, animation selection and RNG. Releasing an airborne
fighter's browser assignment now also clears its retained physics reference.

Reproduce:

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-fight-cleanup.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/fight-cleanup.test.mjs tests/melee.test.mjs
node scripts/check-browser-melee-groups.mjs --headed
```

The oracle compares 4,096 complete cleanup calls without replacing callees, 488
center choices, 512 terminal group dispatches with the real statistic function
(only object deletion supplied), and 324 state-recovery decisions. Portable native
captures and live tests cover death, exact separation boundaries, interruption,
protected recovery, single winner credit, resumed player commands and identical
RNG/state at 5/30/60/120/144/240 Hz plus irregular frames. Shared person-state
initializers (7,680 native cases) and reinforcement/splitting (4,096) still pass.
The browser verifies original survivor idle/walk frames, existing melee/recoil,
reinforcement and split scenarios, without browser errors. Its isolated attack
fixture now isolates people together with their groups: temporarily removing
other live groups otherwise correctly triggers recovery for their people.

1,032 exports are recorded, adding `0041b550`. This is **not** full ordinary queue
restoration: the existing browser order adapter resumes after native state
initialization. Real command-19/21 ownership, allocation limits, global mixed-class
visit/counter phase, building encounters and specialist classes remain open.
Cleanup still runs at existing browser turn boundaries; primitive wrap coverage
does not remove the current live terrain-crop limit. No additional complete melee
lifecycle percentage credit is claimed.

## 2026-09-10 — complete attack-order pursuit dependencies

Continuing the real command-19/21 migration, `app/combat-pursuit.ts` now reconstructs
three complete native dependencies, rather than just the previously integrated
destination-refresh predicate:

- `00439850`: assignment-bit entry, recovery speed/animation/RNG, destination and
  wrapped facing; target allocation/deletion and vehicle eligibility; signed
  16-bit timeout; destination refresh and arrival; blocked-route result overriding
  prior outcomes. Results are moving/arrived/lost/blocked (0/1/2/3). The caller
  initializes the timer. Zero decrements to -1; it is not a pre-decrement timeout.
  Arrival uses strict signed-axis comparisons against radius+56. Entry facing
  wraps coordinate differences, while destination/arrival comparisons do not.
- `00520300`: selected-target motion setup. Ordinary classes recover movement and
  request vehicle travel toward the command position. Ranged followers face their
  target, check firing readiness and either stop, retain moving-vehicle motion,
  abandon a nearby/unusable pursuit or recover movement. Assignment bit 8 clears
  before any consumer; original consumer order and RNG remain intact.
- `00438af0`: attack-area eligibility. Vehicle readiness, explicit target versus
  packed-area center, destination override, per-axis area extent, the original
  flag-4 range and ranged-class circle length all retain their distinct behavior.

`fightWaitingPosition` in `app/melee-placement.ts` reconstructs complete `0051f750`.
It searches a 448-native-unit ring around the fight in alternating 64-angle steps,
starting toward the arriving follower. Pass one excludes any other object at the
exact candidate XY. Only after all 32 positions fail does it draw one random
starting angle; pass two permits occupancy. Both passes retain original collision
checks. Failure returns the fight center. This is a position query, not movement.

Evidence:

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-combat-pursuit.py /private/tmp/populous-reference/native/d3dpoptb.exe --record
/private/tmp/populous-reference/tools/bin/python scripts/check-native-melee-placement.py /private/tmp/populous-reference/native/d3dpoptb.exe --record
node --test tests/combat-pursuit.test.mjs
```

The new pursuit oracle executes 4,096 calls per dependency (12,288 total), comparing
all tracked person fields, return results, RNG and ordered consumer snapshots.
Original recovery/stop animation selection, facing and RNG execute directly;
animation submission, destinations, vehicle/ranged readiness and range lookup are
supplied world consumers. It covers all nine model records, flags, signed timer
and coordinate boundaries, missing/deleted targets, cancellation/failure precedence
and cargo/airborne animation selection. Entering with a missing raw target pointer
is a native invalid-memory path and is rejected explicitly by the TS port.
333 portable captures retain the executable identity.

The expanded placement oracle executes 1,024 waiting queries in addition to the
existing 2,048 placement/relocation cases. No native consumers are replaced: original
terrain, collision, trigonometry, object-cell traversal and RNG all run. Cases
include wrapped coordinates, restrictions, walk-mask failures, a first candidate
occupied by another object, and all 32 first-pass positions occupied. Portable
waiting captures retain coordinates and RNG without copying irrelevant height data.

The original waiting search calculates a height for each candidate, then passes it
to `005178d0`, which only reads XY. No subsequent consumer observes that candidate
height. The modern query skips those calculations: **0 versus 16,401** height queries
for the 1,024 equivalent waiting cases. This is an operation-count proof, not a
hardware timing or full-frame speedup claim.

These are reviewed dependencies for the original order controller, **not yet live
command ownership/restoration**. `0051a2a0` is the shared command-19/21 body; its
Ghidra switch labels in `00432590` are offsets from command 3, not command IDs.
Its phases cover search (0), fight approach/wait (1), person pursuit (2), building
attack (3), plan approach/destruction (4/5), housed-person approach (6), retry wait
(7), busy-encounter wait (8), ranged attacks (10/11) and special-target wait (12).
Fight approach uses action phases 34/38/39/40; building attack uses
23/30/31/37/46/52/53. The full body and queue/world consumers must be composed before
replacing the live adapter. Reuse the existing shared `buildingOrders` pool and
person-order startup/update/advance primitives; do not add a second combat pool or
saved browser-task replay. No complete lifecycle credit or visible change is claimed.

## 2026-09-10 — attack-order fight/person approach and retry phases

`app/combat-approach.ts` reconstructs ordinary branches of `0051a2a0` using the
existing pursuit, movement-stop and wait helpers:

- Fight targets (substate 1): approach, unavailable-group positioning, alternating
  inward/outward facing, native jitter and idle gestures, member-count changes,
  reservation release and join/retry decisions. Action phases are 34/38/39/40;
  byte +0xaa caches the observed member count. Position entry may decrement the
  timer in both pursuit and the enclosing phase, as the executable does.
- Person targets (2/6/8): alliance/life rejection, periodic housed-target probes,
  pursuit/contact, temporary building ownership during housed approach, and waiting
  for a busy encounter before retargeting. The shared wait still executes when the
  target becomes available, preserving RNG and consumer order.
- Retry (7): entry initializes the wait and then visits it again in the same call,
  preserving render bit 16 across the first visit. Expiry returns to target search.

The original idle-gesture routine `004d4da0` is now shared with outdoor encounters
in `person-state.ts`. It draws RNG only for standing objects and preserves the
signed-byte duration. There is no second animation clock or copied wait routine.

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-fight-approach.py /private/tmp/populous-reference/native/d3dpoptb.exe --record
/private/tmp/populous-reference/tools/bin/python scripts/check-native-melee-encounter.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/combat-approach.test.mjs
node scripts/check-browser-encounter.mjs --headed
npm run test:sprites
```

The new oracle executes **12,288 visits** to the real command body: 4,096 fight,
4,096 person and 4,096 retry cases. Original pursuit, idle, wait, animation selection,
facing and RNG execute; every tracked person/group field and ordered consumer
snapshot is compared. Inputs cover ordinary braves/warriors/shamans, signed timer
and coordinate boundaries, cargo, reflected facing, unavailable fights, invalid
person targets and housed/busy targets. 397 portable captures retain executable
identity. The outdoor encounter regression separately passes 4,096 native visits.

World destination/path planning, availability, waiting-position query, cell move,
height, motion release, housed-building approach, final joining, encounter creation
and retarget selection are supplied consumers. Outer common flags and final
join/retry/retarget dispatch are comparison-harness glue, not a completed controller.
The housed query is compared only within its supplied contract; building-entry
mechanics are not thereby verified. Automatic command-21 periodic retargeting is
not exercised by these command-19 visits.

**Integration remains open:** search/start, building/plan attacks, automatic retarget
scheduling, world consumers and real shared queue startup/update/completion. These
branches are staged; the live adapter still owns ordinary attack orders. Do not
claim complete command ownership/restoration or increase lifecycle credit. The
live change in this version is the equivalent shared idle routine. Browser combat
poses/physics/sound/handoff and the original sprite regression are checked.


## 2026-09-10 — attack search, march aggregation and automatic retargeting

`app/combat-order-search.ts` reconstructs command 19/21's front half of `0051a2a0`,
through target dispatch at `0051a8db` or its early return at `0051be34`. It handles
common alert/entry flags, approach-point selection, ordinary movement recovery,
firewarrior manual/automatic differences, scan scheduling and retry visits. Existing
random speed, animation selection and retry helpers are reused.

Search runs on entry or the four-visit counter phase. Ordinary people update an
eight-record march table keyed by both order payload words; an existing entry still
updates when the table is full. Counts wrap as bytes, minimum distance is retained,
and new entries require wrapped distance strictly greater than 2,560. Assembly at
`0051a56b`, `0051a58b` and `0051a5d4` identifies the participation byte as **+0x1e**.
The initially inferred +0x7c offset was wrong; comparison caught it before release.
The animation stamp is separate (+0x18). Record storage uses an ordinary bounded
array rather than reproducing packed unaligned byte writes in TypeScript.

Selection maps fight/person/building/plan target types to phases 1/2/3/4; firewarrior
person/building phases become 10/11. Missing automatic targets trigger a second
selection centered on the person's current coarse cell, with even engagement
radius. Active automatic orders scan radius zero every fourth visit, including the
same visit that first chose a target. This periodic scan replaces the pending
restart decision, even when it finds nothing. Completion and restart stay separate
until the attack phase/tail; combining them would change native behavior.
`retargetCombatOrder` is shared by these local scans and available for busy-target
retarget integration. No-result handling remains the caller's native rule.

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-combat-search.py /private/tmp/populous-reference/native/d3dpoptb.exe --record
node --test tests/combat-order-search.test.mjs
npm run check
```

**8,192 native front-half executions pass**, comparing tracked person fields,
ordered consumer snapshots, simulation RNG, alert, every march record and both
pending results. Inputs cover models 2–7, commands 19/21, entry/counter scheduling,
retry, cargo/airborne/passenger poses, signed timers, boundary distances, zero/full
march tables, count wrap, selection/fallback failure and target types. Original
recovery speed, animation setter, wait, idle and RNG execute. A valid stationary
vehicle object supplies passenger animation lookup. Wild/angel/unused model records
with invalid ordinary animation rows are outside this command test domain.
283 portable captures include all six tested models and multiple-selection visits.

The oracle deliberately stops before target validity and attack dispatch. It
supplies `0051c110` approach points, `00438af0` area eligibility, `0051c3c0` target
selection, `00520300` selected-target preparation, range, destination and motion
release. Those call contracts are checked, not their full world integration.
Command 28's special-target branch and the attack phases are not certified by this
comparison. Search is staged and has no live game effect until the remaining
controller and actual shared queue consumers are composed. No lifecycle credit.


## 2026-09-10 — complete attack approach-point query

`findCombatApproachPoint` in `app/combat-order-search.ts` reconstructs `0051c110`:

- Explicit target orders retain the current position for missing/deleted/unallocated
  targets. A target in a building uses that building's original outside entrance;
  otherwise the target position is used.
- Area orders first choose their coarse-cell center. The wrapped rectangle scan
  tests whether any cell lacks building occupancy. A fully occupied rectangle uses
  the building at the rectangle's first cell, not necessarily the center building.
- With an open cell somewhere in the rectangle, native whole-cell collision tests
  the center. A blocked center searches original type-2 rings 0–16 and chooses the
  first allowed cell. It preserves indexed-search allocation, repeated ring points,
  terminal state and release bytes. No search slot returns kind 1 with the original
  center; an allocated but exhausted search returns kind 0 with that center. A
  building entrance returns kind 2. These outcomes are deliberately distinct.

Existing `pathCellBlocked`, indexed-search helpers and `buildingOutsidePoint` do
the work; there is no alternative collision implementation or new search pool.
Area flags repeat after 128 coarse cells on each toroidal axis. Scanning at most
one lap eliminates repeated pure occupancy reads while retaining the first-cell
fallback and every collision/search/entrance result.

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-combat-approach-point.py /private/tmp/populous-reference/native/d3dpoptb.exe --record
node --test tests/combat-approach-point.test.mjs
npm run check
```

**1,024 complete native queries pass, with no consumers replaced during comparison.**
Original target lookup, adjacent-building lookup, shape entrance calculation,
whole-cell collision, terrain height bounds, indexed search and pool release all
execute. Setup supplies the shape loader's file-I/O leaves, then removes those hooks;
actual native shape relocation and original `MWSEARCH.DAT` are retained. Read-only
observers record outside-point and height calls. The oracle compares result point,
kind, ordered calls and all 192 search-pool bytes. Inputs include commands 19/21/28,
missing/deleted targets, rotated/edge building entrances, coordinate wrap, signed
heights and limits, person permission flags, forbidden terrain, completely occupied
areas, maximum radius bytes, exhausted pools and fully failed searches.

147 portable captures retain executable identity and all three outcomes (85 kind-1,
43 kind-0, 19 kind-2). A portable operation ceiling also guards the one-lap bound.
For 103 fully occupied area cases, original assembly at `0051c1de` performs **277,001
occupancy probes**, while the modern scan performs **73,225**. Comparison confirms
equivalent observable query state. This is a bounded operation-count result, not a
hardware timing or whole-engine speedup claim.

The query is still staged with the attack-order front half; it does not complete
live queue ownership or building/plan attacks. Next reconstruction notes: plan attack
phases 4/5 require enemy class 9 and a zero signed word at **+0x92** (assembly
`0051b6b6`), not the plan kind byte +0x9e. Their approach dependency is `00438db0`;
plan entrances are `004ba130`/`004b9fc0`, with kind-10 exit collision selection.
Building phase 3 still includes ordinary approach/occupant handling and special
model-19 positioning. These branches must be implemented before claiming the full
ordinary command body. No additional melee-lifecycle credit.


## 2026-09-10 — construction-plan entrances and attack phases

`buildingPlanInsidePoint` / `buildingPlanOutsidePoint` in `building-shapes.ts`
reconstruct complete `004ba130` / `004b9fc0`. Plans store a packed starting cell
(+0x68), shape index (+0x9b) and kind (+0x9e), distinct from completed-building
anchors. Ordinary plans use signed quarter-cell entrance offsets directly. Kind 10
tries four consecutive rotated shape exits, requiring no building ID and a passing
original resting-cell collision/walk-mask check; failure returns the starting-cell
origin. Existing imported shapes and collision rules supply the geometry.

`approachCombatPlan` in `combat-pursuit.ts` reconstructs complete `00438db0`:
entry clears the assignment bit, selects native plan-entry permission, obtains both
entrances, and chooses direct versus planned destination at the strict 312-unit
signed-axis threshold. Wrapped facing precedes ordinary movement recovery and its
RNG/animation. Arrival is checked only on even person-counter visits, with a strict
112-unit signed-axis threshold. These comparisons intentionally differ from wrapped
facing and Euclidean distance.

`attackCombatPlan` in `combat-approach.ts` reconstructs `0051a2a0` phases 4/5:
invalid class, allied ownership or nonzero related-building word +0x92 cancels.
Approach entry sets a 64-visit signed timer and action 3; negative timeout cancels,
and arrival enters phase 5 on the next visit. Attack entry stops movement and reads
the low byte of the original row-7/row-4 object-table entry. Assembly uses a zero-
extended byte, despite the decompiler's `char` expression. It bypasses the generic
airborne row remap, then uses the real upper-body animation setter. Empty-handed
attack resets f2 and copies the signed descriptor hold into f1; cargo retains its
own pose. Assignment bit 128 and an 18-visit timer are set after animation.
Losing the occupied plan cell cancels before decrement; timer expiry requests
`004b9190(cell, 0, 0, 0, 3)` unless flags4 bit 0x800 suppresses destruction. Either
expiry outcome restarts target search.

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-plan-attack.py /private/tmp/populous-reference/native/d3dpoptb.exe --record
node --test tests/plan-attack.test.mjs
npm run check
```

The oracle runs 2,048 calls for each entrance, 2,048 complete approach calls and
2,048 whole command-19 visits initialized in plan phases: **8,192 individual calls**.
It also runs **128 consecutive 19-visit sequences** from valid approach entry through
attack expiry/restart, totaling **10,624 native calls**. Every tracked person/plan
field, RNG, ordered consumer snapshot and intermediate sequence state agrees.
Models 2–7, all 64 ordinary shape records, four-exit plans, coordinate wrap, blocked
exits, walk masks, cargo, reflected/airborne flags, invalid/converted/allied plans,
lost cell ownership and signed timer boundaries are covered. Portable evidence has
364 captures, including seven sequences and explicitly retained suppression cases.

Original entrance geometry, adjacent cell checks, resting collision, walk masks,
angle calculation, recovery speed, upper-body animation and RNG execute natively.
Only route destination setters and final plan destruction are supplied during
comparison; loader file-I/O hooks are removed after original shape relocation.
Common controller flags and restart dispatch in the comparison harness are not a
new live controller. Sequence counters are advanced explicitly by the harness;
whole-game scheduling and render interpolation are not certified by these sequences.

**Still open:** actual world plan destruction and associated ownership/effects,
completed-building phase 3, ranged phases 10/11, shared command lifecycle and live
queue restoration. The tested destruction request is not proof that the world
consumer is complete. These are staged mechanics with no new live visual claim or
whole melee-lifecycle credit.

## 2026-09-10 — completed-building attack phases

`combat-building.ts` reconstructs building-target substate 3 of `0051a2a0`:
entrance approach (30), entry (31), occupant challenge (37), strike positioning
(23), timed strikes (46), and model-19 positioning/continuous attack (52/53).
The controller retains entry flags, signed 64-visit approach timers, even-counter
arrival checks, the delayed 16-visit occupant challenge, and randomized 8–23-visit
strike bursts. Defender removal clears flags2 bit 16 before requesting encounter
mode 1. Invalid/allied targets and failed removal restart search. Entering an
attacked building reveals invisibility through the original visibility mask and
sound request. Saboteur special attacks clear disguise to the attacker's tribe.

The approach helpers `00438f20`, `00439030`, and `00439480` now use shared movement
recovery/facing and original shape entrance geometry. Building entry and plan
entry differ only in collision permission (4 versus 1), so they share one private
implementation. Positioning uses the building table's word at +34, verified in
assembly at `0051b1b0`; this is the already imported `buildingWorkRadius`.

`shakeBuilding` reconstructs `00407810`: burning buildings ignore shaking; first
entry clears the render bit and resets tilt/roll, while repeated hits renew the
signed duration without resetting the pose. `damageBuildingByPerson` reconstructs
`00409140`: level protection/building immunity suppress damage, otherwise the
signed damage accumulator receives **person table byte +22 shifted right two**.
This is not melee fight damage. The importer now retains this table. Attacker
ownership, first player attack alert, packed alert cell and tribe flag are preserved.
Structural damage application and destruction still belong to building updates.

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-attack.py /private/tmp/populous-reference/native/d3dpoptb.exe --record
/private/tmp/populous-reference/tools/bin/python scripts/check-native-plan-attack.py /private/tmp/populous-reference/native/d3dpoptb.exe
node --test tests/building-attack.test.mjs tests/plan-attack.test.mjs
```

**16,305 native executions** agree: 6,144 whole command-19 visits initialized in
building attacks; 4,096 entrance/position/damage/shake helper calls; and 64 sequences
with 6,065 visits across all seven action phases. The check compares person/building
fields, damage alerts, tribe flags, RNG, ordered consumer snapshots and intermediate
sequence states. 361 portable captures retain seven sequences. Models 2–7, signed
coordinate/timer boundaries, ordinary/airborne/cargo animations, protected damage,
invisibility, defender availability/removal, and burning/already-shaking buildings
are exercised. The complete previous 10,624-call plan oracle also passes after
sharing entry code. Five newly exported helpers bring the manifest to 1,037.

Original geometry, trigonometry, animation, movement recovery, RNG, shake, damage,
reveal and disguise logic execute natively. **Supplied consumers:** route destinations,
defender query/removal, encounter dispatch, audio and motion-reservation release.
Sequences advance the counter and put the person at its goal between visits;
they certify phase ordering, not real path traversal or whole-game scheduling.

One deliberate compatibility correction: model-19 free-position search detects a
full repeated coordinate cycle and cancels when every visited point is occupied.
The original loops forever in that case. Valid searches retain identical positions
and RNG; a separate portable regression checks termination within 65,536 probes.

**Integration remains open:** real `0051e300` defender traversal, occupant removal
and building encounters, plan destruction, ordinary command composition and shared
queue/world ownership. Ranged phases 10/11 remain unimplemented. These staged
branches do not alter playable combat or earn full lifecycle credit. Compose the
ordinary controller next; avoid further unrelated helper work before live ownership.

## 2026-09-10 — original streamed music and environmental audio

The latest user direction moves music and ambient sound ahead of further combat
integration. The live game now plays the original long music recordings, adaptive
percussion sections, ordinary environmental beds, tree/bird accents and the globe
soundscape. The existing sound button enables the shared AudioContext. Settings
provide master/music gain, and game pause, menu, mute, restart and disposal own
background playback as well as effects.

### Assets and format evidence

`import-music.py` validates the supplied executable and bank identities, extracts
all ten percussion banks (29 stereo PCM samples plus ten timing descriptors) and
all five `popdrones22.sdt` recordings. The drones are MPEG-2 Layer II, not PCM:
flag 37 and MP2 frame headers explain why the earlier PCM importer rejected them.
Track durations are approximately 230.35, 320.63, 284.11, 307.15 and 360.91 seconds.
The [PopSoundEditor author's format documentation](https://toksisitee.github.io/blog/pop-sound-editor)
independently confirms MP2 music versus PCM sound/drum banks. Its GPLv3 source was
consulted as reference; no implementation code was incorporated.

The first drum entry has flag 131 and **no PCM payload**. The following bytes are
the next entry's header. Native `005707c9` tests bit 128 and reaches the timed-silence
constructor `00577880`; `00577920` advances its byte count without copying samples.
The importer retains this entry as duration metadata, avoiding header noise and
unnecessary silent WAV files. All 29 ordinary drum WAVs round-trip byte-for-byte.

The supplied MP2 recordings are transcoded with pinned imageio-ffmpeg 0.6.0 /
FFmpeg 7.1 to fast-start AAC/M4A at 160 kbps for native browser streaming. This is
a **lossy compatibility transcode**, not a claim of decoded PCM identity. Source
bank/payload hashes, original decoded PCM hashes, encoded output hashes, exact
frame counts and tool version are retained in `original-music.json`. Browser
metadata durations differ from decoded originals by less than 0.0003 seconds.
Corrupt bank counts/offsets/truncation/unsupported encodings fail before use.

### Music and ambience behavior

`Music` follows `0048b500` gameplay selection: audio RNG chooses drone 2–5 and
percussion bank 0–9. The menu recording (1) is imported and browser-tested; complete
original frontend-mode ownership remains open. `nextDrum` reconstructs the
percussion selector in `0048c230`: quiet silence, activity section 2, combat section
3 with section 4 every fourth combat phrase when available, and the original
release flags. Its native descriptor flags/variation byte match 4,096 executions.
The comparison stops after descriptor selection, before driver submission; it does
not certify the original streaming driver.

`ambientLayers` and `ambientAccent` reproduce ordinary-landscape weighting,
original five-entry exchange order (including reordered ties), top-three layer
selection, and tree/gull/overview probabilities from `00489a30` / `00489770`.
4,096 native calls compare the returned layer order/weights, accent requests and
RNG. Hardware leaves and cue creation are supplied. Cue gains/sample variants come
from the existing original cue table, and accent variation uses the original
sample→gain→pan order. Special lava/hell landscape substitutions and shield ambience
remain open.

**Live terrain inputs now use the rendered ground queue:** `0046e930` tracks
minimum/maximum terrain buckets; `004673b0` counts triangles only when
`bucket + 1 < min + floor((max - min) / 2)`. Earlier notes called these “far”
polygons; the predicate selects the lower-depth part of the submitted terrain.
Category low nibble → terrain flag bit 2 identifies water; signed original cell
height below 513 identifies lowland, otherwise highland. The original counters
are copied to the audio inputs by `00467130`.

`TerrainAmbience` accumulates these classifications while the existing painter
processes accepted terrain faces. It reuses projection, clipping, toroidal copies
and buckets, including raised-ground bias. The audio input timer requests a
snapshot at 4 Hz only while enabled, and the next rendered frame updates that same
snapshot. Unrequested render frames do not collect counts. The previous 81-cell
camera-neighborhood scan is removed. Native special renderer flags, exact whole
original scene membership and temporal ownership remain open; this is ordinary
first-mission terrain input parity for the submitted list, not a full-frame claim.
Visible-tree eligibility remains an adapter; `0046ec80` still requires full object
ownership. Music activity is now owned by simulation visits as described below;
ordinary attack target selection and full native command ownership remain partial.

`check-native-terrain-ambience.py` executes 256 whole native queue/draw lists with
8,070 triangles, retaining portable captures. Cases include empty/equal-depth
views, raised bias, signed height thresholds and categories with high bits.
The browser check independently reconstructs accepted terrain lists from geometry
and painter GPU depth slots. Replaying them through native `004673b0` agrees on
all counts. The same captures compare previous/current pixels and depths without
changes, and measure paired CPU painter cost. Texture-cache records are supplied
and GPU submission is replaced in native execution; full original frames are not
emulated. Reproduce both ordinary and ultrawide browser inputs with:

```
node scripts/check-browser-terrain-ambience.mjs --record
/private/tmp/populous-reference/tools/bin/python scripts/check-native-terrain-ambience.py /private/tmp/populous-reference/native/d3dpoptb.exe --browser references/performance/2026-09-10-terrain-ambience.json
POPULOUS_AUDIO_WIDTH=3440 node scripts/check-browser-terrain-ambience.mjs --record
/private/tmp/populous-reference/tools/bin/python scripts/check-native-terrain-ambience.py /private/tmp/populous-reference/native/d3dpoptb.exe --browser references/performance/2026-09-10-terrain-ambience-ultrawide.json
```

Active ordinary layers now update their gain every 50 ms using
`004895c0` byte truncation, without replacing or overlapping the current sample.
`0048a900` applies this update even when a playing cue leaves the top-three list;
it continues silently when its environmental weight reaches zero. The globe cue
33 returns before driver gain submission in `004895c0`, so its initial gain stays
until the sample ends. Only absent top-three cues start, matching the active-cue
gate in `00489770`; source completion permits the next variant. The browser keeps
one handle per ambient cue, and old ended callbacks cannot remove a replacement
after reset/mute. Native voice arbitration remains open.

An additional 4,096 executions of complete `004895c0` with driver submission
disabled compare output-volume bytes across all five ordinary cues, weights 0–511
and base volumes 0–127. The checker retains 241 sampled gain cases alongside the
existing percussion/ambient captures. This is evidence for the volume arithmetic;
driver dispatch ownership is established by code inspection, not emulated driver
calls. The browser check crosses lowland→water→lowland and verifies zero/restored
gains on the **same** playing voices, the unchanged globe gain, and replacement
survival after asynchronous completion of a stopped voice.

### Modern timing and validation

The drone streams through a media element routed into Web Audio. Only the selected
bank's short percussion clips decode. Percussion uses `AudioContext.currentTime`
with look-ahead scheduling; the original silent entry's exact duration stays on
the same clock. Accents use a fixed 24 Hz presentation cadence, independent of
rendered frames. Stalls skip expired audio starts instead of emitting a catch-up
burst. Pausing freezes both the audio context and media position and stops the
background timer; resuming retains positions. Mute preserves music position,
stops effects/ambience and the scheduler. Restart stops sources and resets playback;
disposal closes the context, clears buffers and releases the media source.

```
/private/tmp/populous-reference/tools/bin/python scripts/import-music.py /private/tmp/populous-reference/native --check
/private/tmp/populous-reference/tools/bin/python scripts/check-native-background-audio.py /private/tmp/populous-reference/native/d3dpoptb.exe --record
node --test tests/background-audio.test.mjs
node scripts/check-browser-background-audio.mjs --record
node scripts/check-browser-display-audio.mjs
```

The real-UI Chromium check confirms non-silent output from all five streamed
recordings, all 29 drum decodes/durations/channels, live camera environment changes,
percussion scheduling, exact paused positions, resume, independent music gain,
non-overflowing settings controls, mute/re-enable, reset and disposal. The retained
report is `references/performance/2026-09-10-background-audio.json`. This proves
browser signal and lifecycle, not a human listening comparison or hardware FPS.
Tests also preserve percussion timestamps at 30/60/120/144/240 Hz and irregular
schedules, with a separate stale-start regression. Existing 200-cue/64-voice cleanup
and DPR checks pass. Music playback earns its bounded requirement; full adaptive
ownership and complete audio lifecycle remain partial.


## 2026-09-10 — simulation-owned music activity

The browser no longer infers music activity from current sprite/action labels in
`GameScene.soundEnvironment`. `World.musicActivity` is cleared at the start of
each object turn, following `004ec6f0`, and retained while the game is paused.
Native writers show that battle music starts **before** the first strike:

- `00518630` sets 2 when both encounter participants exist, have different tribes,
  and either belongs to the player, before processing their state-29 actions.
- `00518fb0` sets 2 when visiting a valid state-25 player participant in an active
  roster, including approach and ready phases. Other retained reaction states do
  not enter this branch.
- `0051a2a0` raises 0 to 1 for a player attack command; it never lowers 2. The live
  target-processing branch supplies this intent until the native shared command
  queue is integrated. This last ownership boundary remains an explicit adapter.

The existing native encounter oracle now compares the music byte as well as
poses, timers, motion, RNG, sounds and terminal behavior for **4,096 full calls**.
Inputs cover previous activity, same-tribe cancellation and non-player encounters.
The fight timing oracle now includes music activity in **405 multi-visit traces**
through `00518fb0`, with player and non-player involvement; its existing supplied
roster, relocation and damage consumers remain documented limits. All 384 recoil
initializations still pass. Portable encounter captures retain the new field.

Live tests cover distant attack activity, immediate encounter/battle activity,
quiet-turn reset and pause retention. The 5/30/60/120/144/240 Hz and irregular
encounter regression now also compares the music state. The real-browser check
creates a controlled opening encounter, observes activity 2 before any damage,
waits for the live audio scheduler to receive it, then verifies the next quiet
turn reaches activity 0. No direct write to the tested audio activity is used.
Original percussion descriptor selection and sample playback remain covered by
the existing audio tests. Complete attack-order, frontend and stream-transition
ownership are still unfinished; this does not certify the whole music checkpoint.

## 2026-09-10 — tree ambience follows the native listener

`0046ec80` counts ordinary scenery models 1–6 in visited cells, after its
hidden/already-drawn and model-pool checks but before face projection. Its call
to `0048b2c0` is an audio distance probe despite the community queue-related name.
The probe copies the player camera position, moves it -4096 native units along
the camera heading through `004e6a70`, then uses the wrapped squared XY distance
from `00450450`. Distances above `0x9000000` return -1; the caller masks the low
two bits and accepts only positive results. Thus distances 0–3 also fail.

The browser now applies that rule to actual tree models in visited cells during
the existing painter traversal, before face culling. This replaces the separate
world-tree scan and its projected-depth visibility shortcut. The boolean result
stops further distance checks once a qualifying tree is found; no random calls
are skipped. Sampling retains the existing 4 Hz request cadence, independent of
rendered-frame rate, and adds no persistent tree list or second scene traversal.

`check-native-scenery-visibility.py` retains 1,440 cell-dispatch checks and adds
4,096 complete native cell visits with the real distance probe, including radius
boundaries, the near-listener mask, toroidal seams, headings and player tribes.
241 portable captures retain the results. Its `--browser` option replays actual
tree candidates from `check-browser-terrain-ambience.mjs`: six camera views at
1440×1000 and six at 3440×1000 agree, including views containing distant tree
candidates that must not enable tree ambience. Render pixels and painter depths
remain unchanged in every view.

Retained headless Chromium CPU measurements compare the pre-ambience painter,
current unsampled painter, and current sampled painter. Medians were
1.3/1.3/1.3 ms at 1440×1000 and 2.7/2.5/2.5 ms at 3440×1000; p95 values were
1.5/1.5/1.5 and 2.9/2.7/2.6 ms. These are noisy CPU-only timings, not a hardware
FPS or speedup claim. Reports retain individual samples and browser versions.
Native object allocation/list ownership, original whole-scene membership, exact
audio-input cadence and special landscapes remain partial. Native replay supplies
the browser's candidate membership and model consumers, not an original GPU frame.

## 2026-09-10 — original Land Bridge terrain and ground trails

Land Bridge previously scanned the cropped browser grid, raised a smooth strip,
excluded building footprints and placed one sparkle at the destination. It now
uses `0050ee00`, `0050f010` and `0050ecc0` directly on native terrain. The first
visit records the wrapped major axis, cross-axis stride and endpoint height
increment. Each following visit processes four vertices per cross-section in
order (0, +1, +2, -1), including both ends, sampling the starting-cell height
again. Target heights have a minimum of 90; the per-visit difference is capped
by `LAND_BRIDGE_MAX_CHANGE` (256), divided by the remaining duration, and clamped
to 0–1024. The spell can lower existing ground. The controller removes itself on
visit 63 with the shipped duration of 64. Same-cell casts retain the original
repeated row visits; axes and coordinates wrap across the map seam.

Every vertex visit emits original effect 3, with its initial remaining count
overridden to two. The existing native trail initializer, movement, animation and
second phase supply the visible sparks; the isolated destination sparkle is
gone. Terrain writes feed the recovered redraw queue, terrain processing, walk
masks and object notifications. The compatibility grid is resampled after native
writes, keeping picking and existing route adapters on the rendered surface.
New effects created during an effect processor pass wait for the following turn;
the array loop retains its initial length rather than allocating a copy.

`check-native-land-bridge.py EXE --record` runs **96 complete original lifetimes,
6,048 turns**, comparing every terrain height, controller field, ordered trail
position and notification. Inputs include both axes/signs, diagonal and same-cell
casts, seams, half-world distances, negative heights and heights above 1024. Raw
exports and 10 portable complete captures are retained. Trail allocation and
terrain consumers are supplied in these isolated controller comparisons.

`check-browser-land-bridge.mjs --record` casts through actual keyboard/mouse input,
observes ground trails (3,540 attributable GPU pixels in the retained run), checks
all 63 controller turns, terrain refresh, and final cleanup. Passing its report
to the native check with `--browser FILE` executes the original terrain queue and
processing too: all live height fields and controller states agree. The full
first-mission scenario passes. Full bridge outcomes agree at 5/30/60/120/144/240 Hz
and an irregular schedule containing stalls.

The additional effects exposed an existing packed-handle bug: browser IDs grow
without bound, but terrain reserves ten bits for building references beside its
lighting bits. Houses allocated after ID 1023 could not be found by route queries.
Building creation now chooses an unused ten-bit ID once the browser counter
exceeds that range, checking all live object classes to avoid aliasing. A retained
regression allocates multiple buildings after ID 8192 and exercises terrain
registration and routing. This is an explicit browser allocation adapter, not a
claim that full native object allocation or capacity handling has been ported.

Terrain deformation now reuses geometry attributes and existing scenery models
instead of rebuilding their allocations each turn; trees/logs and reincarnation
stones update their ground positions. The browser check compares actual pixels
against the pre-change rebuild from `f1d7cba42eb0afe2a2f4fad9441269a81697b426`.
Paired CPU rebuild medians were **3.8 → 1.2 ms**, p95 **4.3 → 1.3 ms**, over 40
retained samples per implementation after warmup. This is a headless Chromium
rebuild measurement, not hardware FPS or a whole-frame speedup claim; the report
also retains slower complete presentation timings and their limits.

Full cast/target and alternate-anchor ownership, original mixed-class allocation
and processing order, route invalidation and complete object consequences remain
unfinished. Flatten and Erosion remain missing. The parity ledger now separates
verified Land Bridge height evolution from those explicit remaining requirements;
this does not complete the terrain-spell checkpoint.

## Lightning strike and electrocution (2026-09-10)

The previous browser adapter killed and removed people as soon as the projectile
arrived. `00511f70` instead allocates the upper flash and bolt generator, then
visits the target cell. Only class-1 people are eligible; model 8, the casting
tribe's model-7 shaman and flags3 `0x20000`/`0x8000` are excluded. Its inclusive
`killed <= LIGHTNING_NUM_KILLS` permits seven victims with the shipped constant 6.
There is no life-positive gate. `004da0d0` attributes damage only when victim and
attacker both have tribes. State lock `0x100000` prevents entering state 44, not
life removal or attribution. The browser now invokes this controller during upper
flash dispatch rather than immediate projectile arrival.

`004d2740` initializes state 44 through the common cleanup/RNG/animation path,
sets speed zero and locks the state. In `004d32b0`, visit 2 chooses animation row
27 and visit 18 clears the lock and enters state 3. Import now retains 28 animation
rows and all 168 object-table entries up to the adjacent descriptor table. The
native ordinary electrocution pose uses source 776; shaman/wild model entries use
their own native rows, rather than an invented shared pose. New frame/piece slots
append: all 2,856 prior frames, 3,201 piece slots and established animation cycles
remain identical. All 3,216 resulting atlas pieces match the original RGBA.

The generator's first `00511ae0` visit also creates a class-7/model-1 wave, after
building/scenery ignition. It writes remaining 3, radius 2, maximum 5, range 1280,
horizontal 140, vertical 98, spread 2, friendly fire and scatter enabled, even in
the special load mode. This reuses `createBlastWave`/`stepBlastWave`, including
original allied final-pass rules, impulse physics and damage. Newly allocated
waves begin on the following browser simulation turn. Native corpse/status and
full mixed-class list scheduling remain unverified adapters. In particular the
remote/player state-42 shaman branch is not implemented by this slice.

Live people remain rendered through state 44, including while airborne; landing
must not discard their state. Input/order gates exclude zero-life or locked
people across click/box/HUD selection, movement, guarding, construction and casting.
Death at state-3 handoff still uses existing browser corpse/reincarnation handling.
Ordinary person cell order and allocation limits remain explicit unfinished work.

Validation:

- `check-native-lightning-strike.py EXE [--record]`: 256 original strike lists
  (including allocation failures), 2,304 actual state-44 dispatcher calls and
  first-generator wave fields. Allocation, common physics/status and state-entry
  consumers are supplied; target rules, attribution, phase branch and table lookup
  execute natively. Durable captures are not produced by TypeScript.
- `check-native-person-state.py EXE`: 8,192 shared initializers, including 512
  state-44 cases, plus existing animation/order/recovery checks.
- `check-native-sprite-layers.py EXE`: 8,808 full original layer draws and every
  atlas piece's original pixels; 576 durable pose/direction captures.
- `tests/lightning-strike.test.mjs`: staged real cast, protected target, retained
  victims, original pose, separate scatter wave, survivor flight, selection/order
  rejection and cleanup. Outcomes/phase histories agree at 5/30/60/120/144/240 Hz
  and irregular schedules. Updated first-mission expectations retain the visible
  electrocution lifetime instead of demanding immediate disappearance.
- `check-browser-lightning-strike.mjs`: actual keyboard/mouse cast, original
  source-776 pose contributing 287 GPU pixels, separate wave, survivor flight and
  removed unit/mesh. Existing bolt geometry, sprite layers/shadows/selection checks
  remain in place.

Modern implementation: reuse the retained layered-sprite atlas/batching, existing
fixed-turn person physics and uncapped presentation. Allocate native adapters only
for people in the struck cell. No additional renderer, shader or per-render
simulation scan was added. Recorded headless Chromium measurements at 1440×1000
are simulation median 0.10 ms/p95 0.40 ms and presentation median 6.5 ms/p95 10.5 ms;
these describe this workload, not hardware FPS or a before/after speedup. The small
atlas append is 5,284 compressed bytes. See the checked-in performance report.


## Blast arrival and launch handoff — 2026-09-10

The reported gap was traced through `004ec6f0` (main loop), `004ed700` (class
visit), `004bae30`/`004bb440` (projectile), `004c1940`/`004c1d10` (waiting spell),
`00509c10` (effect initialization) and `0050a750`/`0050b740` (wave visits).
Ordinary Blast has no inline projectile payload at +0x7c. Its parent spell waits
for projectile deletion before allocating effects 5, 3, 78 and 38. Arrival snaps
the head to the target and deletes four attached tails; the head survives until
its next visit. Effect 78 enables scatter after the ordinary wave initializer.

`check-native-blast-impact.py EXE [--record]` executes the original active-list
traversal with a newer projectile, waiting parent and older enemy/friendly people.
Relative visits: arrival 1 keeps the head; visit 2 deletes it and allocates impact
with cues 0xa1/0xb2; visit 3 applies enemy impulses; visit 5 applies allied impulses.
Both impulses precede the corresponding person visit. The oracle supplies prepend
allocation, unlink deletion and unrelated world consumers; only wave/flash/tail
allocations succeed. Person bodies record impulse eligibility without integrating
motion. This proves the bounded order, not complete allocation, mixed-list
scheduling, person motion or original wall-clock rate. Existing wave/physics
comparisons provide separate evidence. Six portable snapshots and the event log
retain the executable identity.

The browser previously expired all five attached sprites at arrival, without
moving the head to the destination. Now the head reaches its endpoint and survives
that turn; tails expire as before. Live Blast also enables the recovered scatter
flag. No simulation turn or friendly launch gate was shortened. `ProjectileMotion`
reuses the follower interpolation curve and existing turn observers for the five
attached sprites. This is an elapsed-time presentation correction, not a claim
that all native projectile render flags/counter phases have been recovered.

`tests/blast-impact.test.mjs` compares the integrated arrival/first-launch timeline,
endpoint, tails and scatter; equal elapsed samples at 5/30/60/120/144/240 Hz and
irregular schedules retain identical worlds and displayed positions. Separate
checks cover smooth intermediate positions, pause, wrapping, new sprites and
explicit placement. Native person flags in the fixture indicate the first impulse
has occurred, not continued airborne duration. The browser check casts through
real keyboard/mouse input, sees 114 arrival-head pixels, 21 distinct positions
across 40 high-refresh frames, unchanged paused position and the same launch order.
See `references/performance/2026-09-10-blast-impact.json` for bounded CPU cost.


## Live building assault, defence and command recovery — 2026-09-10

Connected the recovered building-target branch of `0051a2a0` to live targeting.
Attackers now use original entrance/inside geometry and collision permissions,
random strike positions, row-6 work poses, cue 1, per-visit damage accumulation and
structure shaking. This replaces the 4.3-tile distance/direct-HP shortcut for
completed buildings. The existing damage controller owns structural logs, stage
loss, smoke and debris. Plans retain their older adapter pending full command
composition; automatic detection still uses the existing live candidate adapter.

`00518630` now includes building encounter phases 1–3: enter and wait inside,
then the defender's backward ejection along the inside-to-outside vector. Its
six-turn handoff, signed decaying impulse, building-cell test, facing and render
flags lead into the existing outdoor encounter. Attacker processing precedes the
defender; phase changes are visible within the same group visit. Native geometry,
entry/wait, poses, slope impulses, RNG and phase logic execute in the expanded
8,192-case comparison. Planned destinations, cell insertion, sound and terminal
fight/deletion are supplied consumers; no complete allocator/physics claim is
made by that oracle. Portable captures include all building phases. The independent
building-attack comparison retains 16,305 calls including 64 sequences.

Live occupied buildings use the six-slot admission order and existing occupant
restoration/exit helpers. Mode-1 encounters preserve the building ID and eject the
defender before the outdoor fight. Ordinary completed huts/camps/towers are the
current live target set; damaged-plan defender scans, special buildings and other
classes remain open. Building controller prefix `00403280` restores defence
eligibility every 32 visits and advances signed shake lifetime with counter-based
±2 tilt/roll. 1,024 native prefixes compare these fields together with collapse
RNG/damage, before the native damage processor. The renderer reuses existing
model tilt/roll projection, shading and painter geometry.

The building attack allocates an actual command-19 area record in the existing
800-slot pool. `startPersonOrders` configures it; fight entry preserves that same
reference, and native fight recovery restarts it. A surviving attacker resumes the
building assault instead of standing idle after defeating its resident. Player
replacement, target loss and death release the reference, including interruption
inside an encounter. This is bounded command ownership: complete command-19/21
search/sharing, other queued movement/work, vehicles and normal advancement remain
unfinished. It does not fabricate a saved browser task/path to replay.

Combat entry now reuses its owned person record. The shared Blast adapter likewise
reads that fight record, preserving native protection/status flags while retaining
the existing legacy allocation-flag adapter. Lightning protection and survivor
impulse checks remain green. Panic/flight recovery retains owned command records.

Portable integration checks cover all three playable attacker types destroying a
hut through native damage, original phases/poses, defended challenge/ejection,
same-record resumption, cancellation/death/target deletion and 5–240 Hz plus irregular
render schedules. Browser input reaches the same sequence; original strike and
shake pixels, pause, defender ejection, fight, resumption and cancellation pass.
Full allocation/list order, generalized selection/command dispatch, all original
building classes and complete game parity remain open. Next visible work is the
user-requested groups, footprints, selection/deselection and 3D drag selection.

## 2026-09-10 — original follower footprints on the terrain

`004ee7b0` calls `004bf630` on each eligible mode-2 animation visit for objects
0, 40, 72 and 216, unless rendering is held, visibility gating rejects the visit,
level-flags-2 bit 0x10000 or level-flags bit 8 disables the producer. These are
terrain stains, not separate foot-shaped sprites. Shaman objects do not qualify.
The four coordinates are `(x,y)`, `(x-16,y)`, `(x-16,y-16)`, `(x,y-16)`, wrapping
unsigned 16-bit axes. `004bf740` retains a 65,536-slot circular allocation cursor
and native per-cell FIFO lists. A cell at 1,500 marks reuses its oldest mark.
On reuse of an occupied cursor slot, the original removes the *head of that
slot's owning cell*, which need not be the requested slot after saturation.
There is no elapsed-time fade: later allocations displace old history.

`004bf860` collects the cell's stains in a 32×32 mask. Each mark adds three, capped
at twelve; the palette remap starts at 00970ae0 (fade-bank row 32). Each texel
covers 16 native coordinates. `004be330` also has a 16×16 variant with doubled
texel coverage; that alternate cache path remains outside our close-terrain renderer.
The existing globe 8×8 routine does not consume these marks.

`app/footprints.ts` keeps the exact native history and maintains unsaturated
per-pixel counts, so removing an old mark reduces shading correctly even after
repeated traffic. Saturation is applied at draw time. State is plain data so
structured cloning preserves replay comparisons. Marks belong to the world;
terrain edits recompute their colors without discarding the history. Native
animation sources call the emitter directly. Remaining browser-owned ordinary
walk/carry states supply eligibility at the same elapsed 24 Hz animation cadence.
No simulation RNG, unit sprite frame or movement rule is changed.

Evidence:
- `scripts/check-native-footprints.py EXE [--record]`: **18,904 complete calls /
  75,616 allocations**, with no intercepted native calls. Compares complete
  history/list memory at eight checkpoints; checks original cache notifications.
- `scripts/check-native-terrain-texture.py EXE`: **256** native ground/globe
  texture cases (**278,528 indexed pixels**), actual linked-stain accumulation,
  cliff/fog remaps and twelve opening-map reflected atlas tiles.
- `tests/footprints.test.mjs`: portable executable-bound history, density versus
  actual retained lists, saturated-update suppression, partial/full atlas equality,
  real movement at 5/30/60/120/144/240 Hz, pause and producer disabling.
- `scripts/check-browser-footprints.mjs`: actual right-click movement and **236**
  changed ground pixels. Partial and full GPU uploads yield **zero differing bytes**.
  A paired upload measurement is recorded in the performance notes.

Boundaries: complete native animation ownership, offscreen visibility catch-up,
outer graphics scheduling/settings, alternate 16-pixel cache and save/load remain
unfinished. `0047acb0`/`0047ae00` were exported while tracing the queued selection
work; they are unreviewed evidence, not claimed selection ports. Group resting
slots, movement ownership and native 3D selection are still the next priority.

### Live ordinary resting groups (2026-09-10)

`app/live-resting.ts` now composes the recovered `004d6f90` approach,
`004d7330` initialization, `004d73e0` resting controller and `004d5120` /
`004d5420` / `004d56f0` slot search/validation/rebuild with actual terrain,
shared indexed search, retained cell lists, route allocation, sprite animation,
timber drops and sound. Followers occupy the original one-to-six-person shapes,
settle for ten turns, face the ring center, play original gestures and close gaps
when another member leaves or dies. Shamans use their special stationary rest.
Search exhaustion retains the native wait -> ordinary orders -> retry sequence.

A completed browser task initializes the native state after its legacy visit;
physics starts next turn. Ordinary routing retains person status while using its
existing animation controller. Building entry takes the same person record;
builders detach their record before their older position adapter updates it.
This prevents duplicate terrain-list insertion and preserves shield/protection
flags during rest-to-movement handoff. Outdoor target eligibility moved from
separate spell adapters into the common bootstrap; this is preservation of the
existing live boundary, not a claim to complete original object allocation.

Validation reran 16,384 native indexed-search operations, all 44 slot offsets,
8,192 cell/slot/search/rebuild cases and 24,576 pose/geometry/collision/initialization/
rest/approach cases. These compare the original executable and explicitly supplied
consumers; they are not a whole-game recording. Portable live checks cover groups
of 1–6 and 12, exact positions/slot ownership, departure/death compaction, pause,
protection retention, exhausted searches and 5–240 Hz/irregular replay. Actual
browser right-click orders show original poses and shrinking rings; all 576 GPU
sprite poses, ground shadows and selection-arrow regressions pass. Construction,
spells, panic, combat, celebration and the complete first-mission test also pass.

Existing tests now account explicitly for the four approach/rest speed draws of
two idle shamans; the original Blast eight-draw and Lightning forty-draw particle
budgets remain checked. A fire victim is introduced at bolt arrival so its prior
idle movement cannot move it outside the tested flame cell. Departure checks
still require release of the old route while permitting the new resting route.
The campaign route probe uses an actually trained warrior once all braves train.

Remaining scope: ordinary group destination dispatch still uses the browser
command adapter; selected-person state 14, modifiers/deselection and native 3D
drag selection are next. Full movement/avoidance, airborne terrain recovery,
specialist/vehicle resting, native allocation limits and full queue ownership
remain unfinished. These boundaries keep `movement.groups` partial.

### Staged marching formations and movement arrival (2026-09-10)

`app/marching-formations.ts` reconstructs `00501000` and the geometry, recruitment,
leader search and slot maintenance at `00501700`, `005018c0`, `00501ab0`,
`00501c00`, `00501e90`, `00501ff0` and `00502060`. Moving followers recruit
compatible same-tribe/model units using the original indexed terrain search and
retained cell order. The controller owns two twelve-slot layouts, catch-up speed,
leader-paced advance, blocked/departed member removal, column compaction and
walking gestures. Normal recruitment stops before the twelfth slot. Temporary
formation steering (`004e9e50`) preserves the route's actual destination.

`app/person-orders.ts` also reconstructs complete movement completion `004336c0`
and payload arrival `0043bb60`: four-turn cadence, raw versus packed destinations,
model radii, vehicle cell centering and signed/seam boundaries. Geometry and
arrival tables are reproducibly extracted by `scripts/inspect-executable.py`.
Shared toroidal squared distance, indexed search, animation rows and movement
recovery are reused rather than copied into a second movement engine.

Evidence against executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`:

- `scripts/check-native-marching.py EXE`: 2,048 geometry calls, 2,048 controller
  calls, 128 sequences of sixteen controller visits and 4,096 recruitment calls.
  Actual native search/cell order, search pool bytes, RNGs, animation-row choice,
  movement recovery, geometry and temporary steering execute. The upper animation
  setter, object removal and group allocator are supplied consumers, including
  allocation failure. This does not verify the native class-10 initializer.
- `scripts/check-native-move-arrival.py EXE`: 16,384 calls across both arrival
  routines, without intercepted native consumers.
- `tests/marching-formations.test.mjs`: 160 retained marching cases (including
  multi-visit sequences) and 512 paired arrival cases, bound to executable identity.
  Typecheck and all 275 portable tests pass.

These ports are staged, not live gameplay. Ordinary browser commands still send
selected followers to a shared goal through the existing task/path adapter.
Next recover class-10 initialization/dispatch (`00500e20`, `00500ec0`) and connect
the shared person order pool, route steering and actual physics to the controller.
Check rest/selection handoff, cancellation/death, sprite ownership and elapsed-time
replay in live play before granting credit. Native object scheduling/allocation,
avoidance, specialist/vehicle ownership and complete group lifecycle remain open;
`00433800` is an unreviewed follow-person export, not a claimed port. No new parity
credit, browser-visible change or performance improvement is claimed here.


### Live ordinary marching orders and formation handoff (2026-09-10)

`app/live-movement.ts` now composes those recovered routines with the actual
shared `buildingOrders` pool, native route records, person physics, retained cell
lists and original sprite animation. One command-3 record is shared by followers
in a ground order. Native startup supplies speed and eligibility; recruitment
uses same-tribe/model searches, marches in original slots, catches up stragglers,
removes departures and hands completed followers to native resting states.
Panic retains its real command and its newly restored route. Interruption/death
release references; exhausted command allocation preserves existing orders.

Common command startup is shared with building combat. A departing tower follower
now copies the physics-owned support offset back to presentation. Rest-to-walk
keeps the actual person and protection flags; native walk/gesture poses replace
the old browser walking adapter. Automatic enemy detection still runs before
ordinary movement. Formation stepping includes entry/building-owned people so
an order handoff cannot mark a living occupant's record deleted.

The already-retained `00500e20` initializer has no additional action for a fresh
state-zero class-10 marching allocation; `00500ec0` handles other internal states.
This does not establish native allocator limits or global class scheduling. The
live adapter visits formations after people and allocates unbounded browser IDs.
It retains the existing unreachable-order preflight; ordinary work, pursuit and
combat still have legacy transitions, and full queued-order restoration,
rerouting/avoidance, specialist/vehicle behavior and native selection stay open.

Validation: the original marching and arrival comparisons above pass again;
`npm run check` passes 279 tests. `tests/live-movement.test.mjs` verifies shared
references, multiple groups, distinct positions, original walking poses, pause,
new destinations, death, panic resumption and resting handoff, plus identical
mechanics/footprints/poses at 5/30/60/120/144/240 Hz and irregular schedules.
Existing cancellation assertions now require command 3 and its native walk pose
instead of no native person/animation; released old records remain asserted.
Building/tower/work/training and the complete first-mission regressions pass.

`check-browser-marching.mjs` exercises actual right-click movement, original
visible sprites, groups, interruption, pause and resting. Resting regression,
576 GPU sprite poses, shadows and selection arrows also pass. Its `--profile`
option records the renderer and full-scene CPU/frame timing for 200 followers;
the measured run used SwiftShader and cannot certify hardware refresh rates.
See the modern-performance notes for the paired collision-snapshot measurement.
# Ordinary player deselection — 2026-09-10

The original default input records at `005d6574` and `005d6580` map right-button
release and Escape press to input action `0x83`, guarded by `004ff460` (UI mode
12 or 16). `process_cmd` (`004aab80`) emits tribe command `0x1e`; it does not emit
a movement order. Targeting modes have their own cancellation binding (`0x7c`).

The complete `00444f60` command path calls `00435c10`, which copies selection bit
7 into bit 0 for every tribe person, clears the pending tribe command scratch via
`00436ff0`, then clears person selection bit 7 and flags3 bit 7. Existing person
states, route ownership, commands and other bytes remain untouched. Vehicle
passenger recursion is visible in the export but is not yet integrated in play.
The browser has no pending native tribe command scratch queue to clear yet.

`scripts/check-native-deselection.py` executes 576 default binding/predicate cases,
the full input-action dispatch, and 512 complete ordinary command calls covering
2,048 person records and every possible selection byte. Only UI refresh is supplied
at the command boundary. All other person bytes are checked, including state and
orders. Portable captured flag cases live in `tests/fixtures/deselection.json`.

Crucial ownership correction: player selection is not state 14. Complete command
`0x2a` execution over all 46 initial person states leaves the state and order bytes
unchanged. `004c8490` explicitly uses state 14 for AI training reservations. The
existing browser bootstrap incorrectly chose 14 and flags3 bit 7 from the displayed
selection roster; it now preserves only the actual selection marker. This does
not remove the real state-14 initializer used by AI consumers.

Live right-click/Escape now cancel an active tool first, then deselect. Empty-mode
right clicks leave the previous-selection bit alone. The shared input helper
clears all retained native/work representations once, preserving their orders;
right dragging still rotates. Ground/building orders use left click. Existing
building-panel right-click focus and spell-card right-click charging remain intact.
Tests cover continued marching/resting and 5–240 Hz/irregular replay. The dedicated
browser check covers actual inputs and selection-arrow removal at 1440×1000,
3440×1440 and 1920×1080; sprite, footprint and marching regressions remain required.

Unfinished: the complete left-click dispatcher distinguishes commands `0x2a` and
`0x7b` using a native setting. The replacement branch preserves other selected units
when clicking an already-selected person without the modifier. Default modifier
records use Ctrl for the `0x6f` press action; Shift has separate actions. The current
browser left-click/Shift shortcuts, HUD selection, full input buffering, voices,
vehicles and world-projected drag selection still need integration. Do not force
state 14 or pause ordinary work to imitate a selection pose. `004d6b10` is the shared
state-11/12/14 gesture controller, not proof that player clicks enter those states.

Validation: 283 portable tests, typecheck/build/format and 1,074 export hashes pass.
Actual browser marching, resting, footprints, selection arrows, 576 sprite poses,
building attack/fire, housing/training/towers, panels, dismantling and victory/restart
pass with left-click orders. Older checks now assert retained native movement records
and capture restart ownership before the first legitimate resting turn. Separate
dismantling cases remove their own surviving followers so the next building click
does not accidentally select one. Fallow still flags existing controller complexity;
ox-standard still reports pre-existing type-style/nested-expression debt. This input
change adds no per-frame work and makes no hardware FPS or performance-gain claim.


### Default ordinary player click selection (2026-09-10)

The runtime default differs from the bare executable image: `0042bfa0`
(`clear_level_global_vars`) sets `00895da8 & 0x10000`. This selects tribe command
`0x7b` on ordinary click release, rather than the alternate `0x2a` mode. The full
reset executes in the check; palette/globe/auxiliary reset consumers are intercepted.
The shipped mouse binding records at `005d6478/84/90` resolve through `00489470`:
left press actions `0x6e/0x6f` differ by Ctrl, and release action `0x71` uses the
modifier captured at press. Shift and Alt are ignored for choosing these bindings.
`004fef20` permits idle/selected UI contexts; `004fefa0` permits drag/person-release
contexts. Separate Shift-building/vehicle predicates are exported but not yet ported.

`004aab80` captures the friendly person ID at press, emits click sound `0x6a`, and
enters person UI mode 15. Releasing over another hover target still submits the
pressed ID and Ctrl bit. With an existing selection, Shift or Alt+Ctrl instead
enters order mode 16, allowing orders through a friendly sprite. `004de610` prevents
selection of people inside a particular native building state; browser direct
sprite picking currently excludes all inside occupants and retains panel selection.
The default on-foot bridge is implemented; full alternate modes are not claimed.

The complete `0043e8e0` tribe command `0x7b` behaves as follows:

- New eligible person: Ctrl adds; otherwise clear the tribe selection before adding.
- Already-selected person: Ctrl removes; unmodified click preserves the entire group.
- New ineligible person (`flags4 & 128`): preserve the previous group.
- Selecting sets selection bit 7 and clears keep-work flag `0x10000000`.
  Removing clears selection bit 7 and flags3 bit 7; it does not copy bit 7 to bit 0
  as global deselection does. Unrelated flags, orders, states and motion survive.
- `00489c40` single voices: model 4 uses `0x57`, model 5 `0x56`, shaman 7 `0x18`,
  other classes `0x58`. Warrior `0x43` was incorrect: it is a two-person group cue.

`app/person-selection.ts` shares the flag operation with existing training panels.
The live bridge updates active native records without allocating new simulation
owners. An initial eager bootstrap exposed invalid resting ownership during the
complete first-mission test; selecting a legacy person must only change its roster
selection until a real controller handoff constructs movement state. That root cause
is covered by a regression asserting unchanged legacy unit objects and continued
shared orders. Removed the guessed 2.1-world-unit selection fallback: click ownership
now comes from the displayed sprite bounds, with the target and Ctrl latched at press.

`scripts/check-native-person-selection.py` executes 1,024 full tribe commands over
4,096 person records, checking every byte outside the five selection/flag bytes is
unchanged and comparing TS flags and native single voices. It also verifies runtime
default initialization, 288 original modifier binding cases and 16 press/release
combinations including modifier release and changed hover. Only downstream UI/sound
consumers are captured for commands; eligibility, person writes and voice decisions
execute natively. `check-native-training-selection.py` retains existing panel rules.
`tests/person-selection.test.mjs` covers group flags, legacy ownership and continued
native orders. `check-browser-person-selection.mjs` clicks actual sprite bounds at
1440×1000, 3440×1440 and 1920×1080 at 2× DPI, checking Ctrl latching/add/remove,
group preservation, warrior voice, Shift orders, unchanged movement and arrows.

Performance boundary: selection scans only on input, using the existing unit roster;
there is no new per-turn/per-frame selection pass, dependency, animation clock or
render cap. It retains existing interpolated sprite picking coordinates. These checks
prove selection semantics and ownership, not hardware frame rate or exact native
painter hit ownership. World-projected drag geometry, native drag/press transitions,
alpha/occlusion/mixed-class picking, full HUD and passenger ownership, buffered input,
focus consumers, alternate setting modes and group voice scheduling remain unfinished.
The existing screen rectangle temporarily uses the corrected Ctrl-add modifier;
that does not constitute native 3D drag selection parity.

Validation: 285 portable tests, typecheck, build, formatting and 1,079 export hashes
pass. Original deselection and training-panel comparisons pass. Browser sprite
clicks, right-click/Escape, selection arrows, 576 GPU sprite poses, airborne shadows,
training and tower admission/exit pass. The new selection module is ox-standard
clean; whole-repo ox-standard retains existing debt and Fallow reports existing
controller complexity (maintainability 85.4). No hardware performance gain is claimed.


### Camera-oriented world drag selection (2026-09-10)

`00443d30` consumes recorded input `0x6a` (start), `0x6b` (update), `0x6c`
(release). Start copies a world XY into tribe offsets `8b3/8b7/8bb` and latches
Ctrl in `8b1`. Update preserves the last valid point when the pointer is absent.
Both camera-aligned components clamp to 10,240 native units (40 map units).
Release packs camera and diagonal angles into ten bits each (half-angle precision)
and the diagonal length into twelve bits (eight-unit precision), then emits tribe
command `0x6d` or additive `0x79`. Rendering retains the unquantized endpoint.

`004440a0` builds four clockwise corners. `00444430` unwraps crossed map seams;
`00444270` computes the inclusive cell scan with an eight-unit low-side margin.
`004445d0` accepts either inclusive triangle. The browser uses the same bounded
geometry and native cell bounds rather than a screen rectangle or a guessed radius.
Its double-precision cross products avoid unrelated signed-overflow artifacts;
the bounded native cell query restricts admission, including degenerate thin drags.
`app/drag-selection.ts` expresses this as readable geometry using existing native
angle, distance, sine and movement helpers, not decompiler temporaries.

`004449d0` traverses those cells, then checks owner/class, `004e3430` eligibility,
`004de610` building exclusions and `004de680` an entry-stage exclusion. It clears
existing selection only after the first eligible hit. Thus an empty drag keeps the
previous group. Selected person flags use `004458d0`; orders and animation states
are unchanged. `00489c40` emits specialist voices, then the ordinary group cue.
The live bridge covers ordinary outside braves/warriors/shamans. Full native mixed
cell allocation and cell-chain ties, passenger expansion, occupant entry exclusions,
last-hit speaker position and complete HUD selection ownership remain open.

`004adbb0` changes a held person press into a drag when the hovered person changes;
a held ground-order press changes past 256 native units on either axis. Its seam
arithmetic uses 65,535 minus the absolute signed-short difference. This is retained
in the input threshold, independently of the 65,536-period geometry. Ctrl remains
latched at mouse-down. The browser samples drag picking on changed render/input
state and once at release; it adds no frame-count animation or fixed presentation cap.

`scripts/check-native-drag-selection.py` executes 1,024 full start/update/release
transactions and compares endpoints, commands, 4,096 corners, cell bounds and 13,312
point tests. Cases include rotated camera bearings, seams, clamped spans,
zero-length, thin and tiny drags. Another 128 complete native area commands compare
1,024 live person flags and group voice sequences, checking every other person byte
is unchanged. 110 complete `004adbb0` updates compare order-to-drag thresholds around
both signed seams. UI refresh, playback and command-buffer consumers are captured;
geometry, eligibility, flag updates and voice decisions execute natively. Portable
captures and live ownership tests are in `tests/drag-selection.test.mjs`.

`00422fc0` constructs a terrain-clipped selection mesh; `00423900` submits fill
polygons using atlas tile 15, white diffuse 32 and native alpha. `004673b0` type
`0x1c` separately draws tile-23 edges and tile-31 corners with an eight-pixel
screen extrusion. These consumers and their terrain clipping helpers are exported.
The browser now uses the original tile-15 RGBA in `app/drag-overlay.ts`, clipped in
world coordinates inside the existing terrain shader. Terrain curvature and ground
height follow the rendered triangles; buildings/units retain their normal drawing.
The CSS selection rectangle is removed. Exact native fill UV/tessellation, border
and corner extrusion, near-horizon suppression and mixed painter ordering remain
partial. The shader fill is not claimed to reproduce the full native raster output.

Modern implementation evidence: `00422fc0` clears 39,214 bytes of temporary pools
per draw before building/clipping/projecting selection geometry. The shader needs
only an active flag and eight corner-coordinate uniforms; it adds no mesh, vertex
upload or draw call. Browser comparisons toggle the fill in the same scene and
verify unchanged draw-call counts with changed terrain pixels. This removes that
CPU pool/geometry work structurally; it is not a measured hardware FPS gain.
`references/performance/2026-09-10-drag-selection.json` records software-renderer
checks at five camera bearings, desktop/ultrawide, a wrapped seam and a 2×-DPI device
(the existing renderer pixel-ratio budget remains visible in the measurements).

The browser test clicks actual projected terrain and verifies two-person selection,
Ctrl addition after releasing Ctrl before the mouse button, group voices and empty
area retention. Its synthetic dry-land setup must clear shoreline categories:
otherwise the native water updater correctly replaces its height with waves and
invalidates the test's fixed-height target projections. No engine picking guard or
selection tolerance was added to hide that fixture mismatch.

Validation: 287 portable tests, typecheck, production build, formatting and 1,098
export identities pass. The new geometry, overlay and selection modules are
ox-standard clean. Native drag comparisons and actual browser drag checks pass;
sprite clicking, deselection, selection arrows and all 576 GPU sprite poses retain
their regression checks. Whole-repo lint debt and the raster/ownership gaps above
remain open. No hardware FPS improvement is claimed.

### Native selection borders and corners (2026-09-10)

`004673b0` type `0x1c` copies two projected endpoints for edges, or one for a
corner. It extrudes eight screen pixels down/left/up/right. Corners combine two
successive axes. The renderer submits two triangles using original atlas tile 23
(edges) or 31 (corners), sampling the lower half of each texture. The 21-bit UV
endpoints retain their sub-texel difference from normalized 0/1 coordinates.
`app/drag-border.ts` reconstructs these quads and texture coordinates directly;
`scripts/check-native-drag-border.py` compares 256 native submissions across all
four orientations, fractional coordinates and points outside the viewport. The
texture-cache placement and GPU boundary are intercepted, not the geometry or UV
calculation. Both triangles are captured with the actual six-argument callee cleanup.

The complete `00424320` perimeter splitter is also executed for 512 bounded
segments, including wrapped seams. Cell-side intersections use float32 slopes and
half-unit rounding. Both diagonals are crossed every 512 native units; their
arithmetic adds a quarter unit to Y, with the corresponding X adjustment. The
native x87 control word is set to the MSVC runtime's double-precision mode, as in
existing projection checks. JavaScript comparisons preserve these actual rounding
rules instead of inferring evenly spaced edge samples. `00423700` confirms that
new perimeter/center vertices use the existing original terrain height calculation.
The live border projects these sampled heights through the existing native camera.

`00425060` assigns orientation flags relative to the drag quadrant. `00422fc0`
suppresses the border when either side's squared length is at most 1024. The live
renderer uses those corner/edge directions and the same small-span boundary.

Modern implementation: all edge/corner triangles share one mesh and the existing
atlas. Buffer capacity grows only when required and subsequent updates reuse the
same arrays; only populated ranges upload. Idle frames hide the border entirely.
There is one additional draw during a drag; the fill continues to use the existing
terrain draw. Original rendering submits two triangles per edge/corner through its
polygon list. This is a structural batching improvement, not a hardware FPS claim.
The browser check records draw counts, visible border pixels and buffer reuse,
including the original first mission's uneven terrain. CSS-sized projection keeps
the eight-pixel feedback legible at high DPI without tying it to animation frames.

Remaining raster boundaries are explicit: the border currently samples the matching
terrain copy's painter depth, rather than reproducing the separate native selection
buckets and mixed alpha submission order. Exact clipped triangle-list ownership,
near-horizon suppression and the fill's original four-triangle tessellation/UVs are
still open. Those affect overlapping objects and steep/horizon views; the complete
selection-feedback requirement remains partial. No overall parity credit is added
for completing only this part of that requirement.

Validation: 288 portable tests, typecheck, production build, formatting and 1,099
export identities pass. Both drag modules are ox-standard clean. Native drag and
border comparisons pass. Browser drag checks cover five bearings, ultrawide/high-DPI
screens, a wrapped seam, original first-level slopes and idle removal; sprite clicks,
deselection and 576 GPU sprite poses retain their passing regressions. The original
terrain sample uses 390 border vertices in 12,288 bytes of retained buffer capacity.

### Selection mesh, raster order and modern batching (2026-09-10)

`00422fc0` is now captured through its complete mesh-generation pipeline, including
`00423390`, `00423e80`, `00424320`, `00424ab0` and `00424900`. The oracle captures
vertices before projection and triangle lists at the two `00423900` boundaries;
projection and queue consumption are supplied separately. `app/selection-mesh.ts`
uses explicit cell/quarter adjacency, shared grid vertices, boundary membership and
angle-sorted polygon fans. It preserves original allocation/fan order without porting
register names or fixed scratch-pool layouts. 512 full native meshes match, including
rotations, wrapped seams and the unusual shortest-cell scan used by very thin drags.

One intentional repair is proven by native output: `00424900` writes the last
triangle of a seven-point polygon into the same slot as the previous triangle,
then overwrites it. The original loses triangle (0,5,6). The browser completes the
fan, preventing the resulting hole. The fixture records this missing native triangle
and its insertion position separately; comparisons do not silently bless the changed
output. One of the 512 captured cases exercises this repair. This is a rendering
correction; selection admission, simulation commands and RNG are unchanged.

`app/selection-raster.ts` reconstructs complete `00423900` queue production. Unlike
ordinary terrain, its bucket uses the maximum vertex depth, subtracts 352 before
shifting, and applies the 13-bucket category adjustment afterward. Shared left/right/
bottom outcodes gate submission; the third vertex has the original strict right-edge
comparison. The signed screen area controls fill visibility. Back-facing borders
are suppressed past bucket 2240, and corners move eight buckets forward and consume
their flags once across shared vertices. 512 native queues compare all emitted
records and buckets. No queue-construction callees are replaced in that oracle.

`00467130` queues selection after the world traversal. The shared painter now adds
selection at that point in insertion order, retaining the original per-record order
and each border's two-triangle order. `SelectionOverlay` uses the existing original
terrain height and unclipped `0046de00` camera reconstruction; actual point projection
remains covered by the existing native projection oracle. The full tile-15 UVs are
captured at the `004673b0` type-1b GPU boundary for 64 cases. Edges/corners retain the
existing 256 native submissions and 512 perimeter comparisons.

The former terrain-fragment fill and borrowed-terrain-depth border are removed.
They could not represent the native clipped triangle UVs or selection's own depth
order. One atlas mesh now holds the complete selection. Topology is cached while
its corners/camera remain unchanged; geometry and index buffers retain capacity.
The painter batches consecutive selection triangles and splits only when another
transparent command must appear between them. This preserves alpha composition
without issuing a draw for each triangle. No fixed presentation rate is introduced.

`scripts/check-browser-drag-selection.mjs` compares the batched renderer against
one draw per selection triangle in the same frame. Every GPU byte matches across
five camera bearings, ultrawide and high-DPI displays, including a wrapped seam.
The measured cases need 1–3 selection draws instead of 139–267 individual draws.
The original first-level slope test also retains buffers and checks actual pointer
selection, Ctrl latching, empty-area retention and idle removal. Measurements are
in `references/performance/2026-09-10-selection-raster.json`; they establish draw
counts and output equivalence, not a hardware FPS improvement over the earlier
approximate shader. That comparison baseline is stated explicitly.

Remaining boundaries: zero-area native texture fallback, extreme span/pool-capacity
behavior, alternate filter/render configurations, and final complete original-frame
comparisons. These remain in the partial feedback requirement. The current tests
prove the reconstructed default mesh/raster paths and their browser integration;
they do not establish complete interface or engine parity.

Validation: 290 portable tests, TypeScript, formatting, production build and
parity-ledger checks pass; all 1,101 decompilation export hashes verify. The new
selection modules pass oxlint. Browser checks cover actual click/deselect/orders,
576 sprite poses, native drag interactions and batched/unbatched pixel equality.


### Construction selection owns the active person (2026-09-10)

A live construction worker was reproducibly admitted through its panel despite
`flags4 & 128` on its actual builder record. The panel adapter used an entry
record when present, otherwise `createLivePerson`; for builders that second path
constructed a temporary person with default eligibility. The roster changed, but
the active worker never received the native selection/mode writes. Earlier panel
integration checks only asserted the roster, so they did not detect this mismatch.

Building panels now reuse `selectionPeople`, as ordinary click/drag selection does.
The adapter retains an existing worker record even when its animation is supplied
by another path, and keeps legacy selection ephemeral until a simulation handoff.
It does not create movement ownership merely for selection. Native commands 0x2a
(flags 6) and 0x61 still use the existing `selectTrainingOccupants` reconstruction;
no order, construction, routing, animation or RNG rules are changed.

The original executable comparison passes 384 panel input cases, 2,048 complete
selection commands, 128 plan input cases, both plan group states and 72 tower
input-to-command paths. The new construction regression starts actual workers,
checks blocked admission, single/group flag writes and external-group retention,
and verifies unchanged simulation state, command pool and RNG. Actual browser
click/Shift checks exercise active worker flags at five sizes from 1440x1000 to
3840x2160, alongside keyboard selection and dismantle/cancel/restart/removal.
All 291 portable tests, typecheck, formatting and production build pass. Ordinary
sprite clicks (including ultrawide/2x DPI) and tower panel input/exit regressions
also pass.

This corrects a live ownership defect within existing partial selection scope;
full person panels, vehicle/passenger expansion, command buffering, hit ownership
and native focus/audio ownership remain unverified. No extra parity credit or
hardware performance claim is assigned to this correction.


### Native person inspection panels (2026-09-10)

The default right-button press record at `005d6598` emits action 114 when
`004feed0` accepts neutral input mode and active world picking, with no keyboard
modifiers. Release action 115
clears the held flag. `0047ae00` / `0047b1d0` opens an owned person's panel;
`004adbb0` keeps it refreshed while held or while the pointer remains on the
inspected object. This is separate from selected-group right-release deselection.
A building-occupant right-click calls `00504590(person, 1)`, bypassing the inside
building redirect and starting the visible panel phase directly.

`004369f0` supplies up to eight order icons: a valid immediate order first, then
seven circular queue slots (eight if no immediate order was admitted). Cancelled
records and empty slots do not emit an icon. Command 7 flag 8 switches its icon to
37; command 22 targeting a live model-1/2 vehicle switches to 32. The descriptor
icons are now reproducibly imported from `005a7db9 + model*22`; they are not a
hand-authored mapping. The traversal also preserves the original reset of an
out-of-range byte cursor to slot zero.

Kind 2 of `00504bc0` supplies the six-pixel health column and centered command row,
with a reserved eight-icon panel width, native frame colors, HFX 25–39 glyphs,
palette-150 shadows and HFX 52's translucent tail. An empty queue uses icon 39.
The shared HFX atlas now includes these original masks. `00504920` supplies the
three-stage 3/20/3 presentation lifetime, held refresh and removal. `00509000` /
`005090f0` place the panel above the person's initial sprite height. The browser
uses the rendered unit position between simulation turns, so the attachment moves
smoothly on higher-refresh displays; indoor people use their retained native height.

The browser now opens these panels with neutral right-click inspection and with
building-occupant right-click focus. Selection and movement ownership are unchanged.
`app/person-panel.ts` contains the readable command/layout/lifetime rules;
`app/object-panels.ts` owns their small DOM canvases and presentation integration.
Unchanged health/orders reuse the canvas. Ten identical updates produce zero
`drawImage` calls versus thirty when bypassing the cache, at desktop, ultrawide
and 2x DPI. This is an operation-count comparison, not a hardware FPS claim;
`references/performance/2026-09-10-person-panels.json` records the workload and limits.

`check-native-person-panel.py` executes 512 icon traversals and 512 complete panel
draw calls, 32 complete lifetime sequences, both shipped right-button bindings and
36 context-predicate cases plus 1,152 complete modifier/context binding lookups.
Only terminal drawing, effect placement/allocation and
deletion consumers are supplied for the respective checks. Portable captures are
bound to the verified executable. 64 browser canvases match source HFX/native draw
submissions within one byte of alpha rounding. Real right-click inspection,
selected-group deselection, an actual movement command, pause/expiry, canvas reuse
and proportional desktop/ultrawide/high-DPI layout pass; the original first mission
was also inspected visually. Existing ordinary click/deselect and tower input,
focus, exit and dismantling regressions pass. All 293 portable tests, TypeScript,
formatting, new-module lint and 1,109 export hashes pass.

Remaining scope is explicit: command-icon input, native bitmap
transition effects, panel hover/pressed tint, full allocation and mixed-panel
ownership, concealed/enemy/vehicle inspection, precise mixed-object hit selection,
all-view panel occlusion and native outer timing/settings. The current DOM canvas
shows the original static artwork during the lifetime stages; it does not claim
the transition raster effect. Legacy work without native order records is still
outside complete queue display parity. No new verified coverage is assigned to
these partial contextual-panel and mixed-selection requirements.

### 2026-09-10 — person-order destination controls

`00438950` resolves live object payloads; `004389c0` supplies raw or packed-cell
fallback points. `0047b460` maps person-panel right-click to camera focus, UI cue
106 and target inspection or destination marking. Pointer-left does not issue a
command or navigate. `check-native-order-focus.py` executes 175 target resolutions
across all 35 descriptor types and 256 complete panel inputs, supplying only the
terminal camera/audio/panel/marker consumers in the input comparison. The portable
capture is bound to the original executable hash.

**Deliberate UI correction:** native drawing traverses the immediate order and
rotated queue, but native input indexes physical queue slots. With cursor 3, the
first displayed icon belongs to order 4 while clicking it focuses order 1. Browser
buttons bind the actual displayed record ID and revalidate ownership on activation.
This changes navigation only; queues, simulation and selection remain untouched.
Keyboard Enter/Space expose the same action through native HTML buttons. Removed
browser targets are safely ignored for object-only orders, while cell fallbacks
remain usable. This does not reproduce stale native pool reads or infer missing
building/wood fallback geometry.

`PersonPanels` reuses the native main-sprite submissions for button geometry and
keeps its canvas plus eight reusable buttons in one proportionally scaled wrapper.
Hover and keyboard focus retain the existing elapsed-time lifetime; camera focus
uses the shared native camera-motion implementation. Existing canvas caching is
retained: ten unchanged updates still cause zero drawImage calls, versus thirty
with invalidation, at all three tested viewport/DPI combinations. This is the same
software-renderer operation-count workload recorded in the person-panel performance
artifact, not an FPS certification. World lookup happens only on activation.

Browser checks cover the advanced queue cursor, immediate object orders, pointer
left/right, keyboard focus, hover retention, modal/stale guards, unchanged queues
and selection, and unlatched world pointer state. Desktop, ultrawide and 2x DPI
remain covered alongside the source-HFX pixel comparison and paused expiry.

Still open: `004afff0`'s model-61 interest marker and its second point-focus audio
submission, linked worship/other-class target panels, full panel ownership,
hover/pressed tint and bitmap transitions. Owned person targets open their existing
panel; other supported live targets currently receive camera focus only. Vehicle
world ownership and deleted-object fallback geometry are not claimed. These are
bounded additions to partial HUD/selection requirements, so no whole-checkpoint
credit or artificial percentage increase is assigned.

Validation for this slice: 294 portable tests, TypeScript, formatting, focused
oxlint, production build and 1,111 export hashes pass. The 64 panel canvases retain
838,656 source-HFX/native RGBA pixel comparisons within one-byte alpha rounding.
Existing ordinary click/modifier/voice and deselection/order-preservation browser
regressions pass; the original first-level view was also visually inspected.

### 2026-09-10 — original order destination sparkle

Point-order focus now calls the recovered `004afff0` behavior: class-7/model-61
secondary allocation, grounded position minus 160 native height units, lifetime
four, and a second UI cue 106. Object-target focus does not create a point marker.
The initializer `00509c10` switches on **model minus one**: model 61 selects state
48, draw 46 and HFX1294–1299. The adjacent model 62 uses different artwork and a
different processor; it is not the destination effect. `0050a750` switches on
**state minus one**, deleting this state on the fourth processor visit.

The existing `effect()` owner, original-animation adapter and sprite renderer
supply the implementation. No extra atlas or texture clone is needed: the six
frames already exist in the hit sequence and match the original nibble-alpha HFX
bytes. The animation uses the elapsed 24 Hz adapter and four simulation visits
use the existing 12 Hz turn clock. Pausing freezes both. `004edbd0` does not
increment the shared class counter, so browser inspection likewise leaves the
gameplay effect counter unchanged. Full native allocation/index/list ownership
and outer clock/settings remain separate unfinished requirements.

`check-native-order-marker.py` executes the original emitter, complete initializer,
terrain interpolation, animation and effect processor across 128 points, including
wrapped coordinates and varied terrain. Only allocation, class lifecycle callbacks,
UI audio and final free are supplied. 2,688 animation states, four-visit deletion,
UI cue and all six source/atlas frame byte comparisons pass. The small portable
capture is executable-bound; render-rate replay covers 5–240 Hz and irregular
frames with exact removal visits, frozen pause state and unchanged RNG/counter.
The existing renderer is reused for the type-1 descriptor; complete mixed painter
allocation, palette changes and all-view occlusion are not newly certified here.

Actual browser order-icon clicks create visible GPU pixels and both UI cue requests
without changing the queue or gameplay counter. Desktop, ultrawide and 2x DPI
checks cover pause, all four visits and GPU-object disposal. Remaining contextual
scope includes linked worship/other-class target panels, hover/pressed tint, bitmap
transitions and complete ownership; those remain partial in the parity ledger.

The recorded rendering comparison is
[order-marker rendering cost](performance/2026-09-10-order-marker.json): one shared-atlas
sprite adds one draw call and two triangles, with zero new GPU textures across all
three viewport/DPI cases. These are software-renderer operation counts, not a
hardware frame-rate claim. The existing person-panel input regression and Blast
initializer regression pass. All 295 portable tests, TypeScript, formatting and
1,114 export hashes pass; the marker's visible sparkle was inspected in-browser.

### 2026-09-10 — worship inspection artwork and standing slots (not yet live)

The kind-3 stone-head and kind-13 vault branches of `00504bc0` share worship and
recharge progress, follower glyphs, selection arrows and the original tail. The
new `worshipPanel` uses the existing HUD atlas and canvas painter. 260 complete
executable draw traces cover required counts 1/2/4/7/8/9/16, empty/partial/full
rosters, enabled/recharging heads, zero/half/full work, shaman-only heads and the
vault's command-33 shaman lookup. A failed lookup inside the native worship count
draws a faded brave; an unused recharging slot draws two opaque silhouettes. The
second row uses brave placeholders even for shaman-only heads, as the original
separate row branch does. Hover/pressed tint and exceptional trigger settings are
not covered by this bounded artwork reconstruction.

The native height result omits the second row for these panel kinds. Its actual
draw submissions extend 28 pixels below the reported extent. The browser layout
allocates those extra 28 pixels while retaining exact submissions and width;
this prevents canvas clipping without changing mechanics. `check-browser-worship-panel.mjs`
captures all 260 canvases. `check-native-worship-panel.py --browser` compares
1,739,264 RGBA pixels against independently decoded source HFX/palette artwork
and native draw submissions, allowing one-byte canvas alpha rounding. The gallery
was visually inspected. These are artwork checks, not live display/input or FPS
certification.

`00429ad0` initializes fifty worship offsets in alternating left/right arcs,
starting with three places at radius 448 and increasing the arc size by two and
radius by 256. It uses integer angle steps and the existing native sine helper.
`0043c600` rotates those offsets by the head's quadrant around its coarse-cell
center, searches each native cell list and admits the first exact-position,
same-tribe person with zero signed-short speed. It does not test work assignment
or a nearby radius. `worshipPositions` reuses the existing fixed-point movement
helper; 600 positions across all four rotations, map seams and interior coordinates
match the real initializer and roster lookup. Another 1,800 lookups exclude moving
people, including speeds whose low byte is zero. Slot ordering, cell-list ties and
the complete admission/order controller still need live integration.

64 original `0047b460` input cases confirm ordinary head clicks emit command 42
with flags 6 and a person ID; Shift emits command 113 with select/deselect state
and the head ID. Right-click requests cue 106, native camera focus and the person's
inspection panel. Blocked and occupied command buffers retain their contents.
These are executable input evidence, not a claim that the browser controls are
connected. Next recover the standing-slot admission/controller and replace the
existing proximity roster before connecting the panels to live worship.

The identical pixel oracle from four existing panel checks is now shared in
`scripts/panel_pixels.py`. Person, training, construction and tower native checks
still pass against their retained browser captures (170 canvases, 1,694,976 pixels),
including construction's existing height correction and the unchanged one-byte
alpha tolerance. All 296 portable checks and TypeScript pass. No gameplay credit
or overall parity increase is assigned to these unintegrated reconstructions.

### 2026-09-11 — original worship command and place search (integration pending)

`0043c340` searches from the head's current slot cursor through slot 49, first
rejecting exact-position stationary people other than the searching person, then
allowing occupied positions on its second pass. Both passes still require route
feasibility; neither wraps back to positions before the cursor. An initial route
probe targets `004a8e70`'s approach position, one cell in front of the head's
coarse-cell center. Failed candidate probes clear the path-failure flag; failure
of the initial approach probe retains the route builder's flag. Success returns
the point, slot and pass (1 or 2). `findWorshipPlace` shares `worshipPositions` and
the existing native math helper rather than duplicating the offset table.

`check-native-worship-place.py` executes 1,024 real place searches and endpoint
corrections on ordinary dry terrain. Only route feasibility is supplied. Complete
query ordering, flags and outputs match, including self-occupancy, stationary
enemies, moving people, non-person objects, full exhaustion and wrapped coordinates.
The new `004ea6b0` export includes building, coastal and vehicle endpoint correction;
those branches are **not newly verified** by these dry-terrain comparisons. They
must be connected through the correct shared route consumers before live parity
can be claimed; substituting a radius or the ordinary route planner is insufficient.

`stepWorshipPerson` reconstructs command 27 (`0043bcc0`) for a target validated by
the enclosing command dispatcher. Its four phases are approach, place admission,
prayer animation and a paused prayer pose. Original signed-coordinate thresholds,
counter masks, shaman admission, occupied-place retry, movement restart and
sound 82 requests remain explicit. Free-slot admission writes a sixteen-visit
head timer and advances/wraps its cursor. Exact arrival snaps to the chosen place,
zeros velocity/speed, releases the route, and changes `turnAngle` from a target
coordinate into the angle toward the head. It does not immediately assign the
rendered heading. The `+0x57/+0x59` target is distinct from the route's `+0x53/+0x55`
destination; executable comparisons caught that inferred-field ambiguity.

Prayer delays draw 8–23 visits from `0x89bc72`, the separate presentation RNG,
then decrement once on entry. They do not consume `0x89d178` gameplay RNG.
`check-native-person-worship.py` compares 4,096 complete command-body calls with
controlled route/placement/movement/presentation consumers, real native occupancy,
signed ranges, frame gates and RNG. It checks command fields, head cursor/timer,
callback order, termination and unchanged gameplay RNG. These are isolated
controller comparisons, not composed live physics, animation or frame-rate proof.

Portable captures retain varied branches rather than sampling only a repeating
phase. `tests/person-worship.test.mjs` covers the search and controller against
those executable-bound results. All 298 portable tests pass. The live migration
must still attach native command-27 records, share raw route probing and endpoint
correction, implement head cursor expiry, use the real cell-list roster and connect
the panel controls. The earlier rendered-panel checks remain valid; this turn adds
no shipped visual feature and no verified gameplay credit.


### 2026-09-11: live first-mission spell-head worship

Command 27 now shares the existing order pool, person startup/update/removal,
physics, route ownership and animation renderer. `live-worship.ts` supplies the
reconstructed controller's actual world consumers. `planLivePath` exposes its
existing raw route builder for feasibility probes without attaching or releasing
current movement; probe endpoints retain native byte wrapping. `004ea6b0` now
matches 2,048 building/coast/vehicle comparisons, including odd input bytes and
ordered correction consumers. The other nine 2,048-case route suites still pass.
293 executable-bound correction captures are portable.

Head visits (`004a8b00`, model 9 without pending terrain initialization/morph)
decrement the slot timer and reset its cursor at zero. All 1,280 byte-timer/slot
cases match the executable. The roster follows `0043c600`: first same-tribe,
stationary class-1 person at each exact position, in cell-chain order. Browser
work markers no longer determine the panel roster. This delivery also applied that
roster to rewards; the next entry corrects that mistake with the distinct native
reward-admission branch. Native
physics retains position/height, slot arrival clears route ownership, prayer uses
original objects 64/744 and the separate pose RNG, and sound 82 loads all four
already-imported original samples through existing owned Web Audio playback.

Two integration defects were corrected. Route advancement and cell reconciliation
were rounding an authoritative native height through the browser terrain surface;
a one-unit discrepancy could repeatedly restart falling and stall movement after
the vault. Native owners now keep native height, resampling only for externally
changed position. The second is an explicit modern timing correction: the fixed
24 Hz animation clock can wrap past a six-frame prayer's final frame between
12 Hz command visits. The final prayer frame is retained until the controller
observes it; its native phase-3 delay and pose RNG remain unchanged. This bounded
animation handoff keeps the prayer/pause cycle independent of rendered FPS; it
does not establish complete native render/visibility scheduling parity.

Validation: 4,096 native command-body cases, 1,024 native slot searches, 1,280
native head visits and 20,480 shared route comparisons; 303 portable tests,
including the complete first mission, actual shared-order interruption/death,
panic recovery, exact roster, height, prayer pause and 5–240 Hz/irregular replay.
`check-browser-worship.mjs` checks real head clicks, seven distinct places, original
rendered prayer frames, pause, four decoded original sounds, playback and cleanup.
`check-browser-sprite-layers.mjs` retains 576 GPU poses / 430 original frames and
served-atlas identity. Build and typecheck pass. Existing repository-wide oxlint
issues remain; new worship code has no lint errors. No hardware FPS improvement
is claimed from these headless correctness checks.

Scope remains partial: the first-mission command admission retains the existing
route preflight so unreachable heads preserve previous orders. Full native
state-33 failure/retry and command-buffer admission are not yet integrated.
General shaman-only trigger objects, vehicle worship, vault command 33, original
head terrain initialization/morphs, allocation/class scheduling, full sound
arbitration, and contextual-panel selection/focus controls remain open. The
worship panel painter is still preparation, not a live panel. These boundaries
must not disappear behind a full campaign-worship or selection parity claim.

### 2026-09-11: live stone-head inspection and corrected reward admission

Ordinary spell heads now open their original contextual panel on neutral
right-click and through person order-icon focus. `ObjectPanels` extends the existing
person-panel owner instead of adding another lifecycle, painter or render loop.
Head model height comes from signed object-record word +40 divided by two
(`00509000`); model 45 is 656 native units above the head's ground anchor.
Head panels retain their own lifetime when a person panel opens. Original artwork
and the native cue 106 accompany single selection, Shift group toggle and
right-click person focus. Selection changes the real person flags while preserving
orders, RNG and selected people outside the roster. Blocked people stay excluded.

This corrects an error in the previous delivery: exact standing slots are the
`0043c600` panel/group-selection roster, not the `004fb270` reward roster. Timed
ordinary heads sample an oriented, wrapped coarse-cell square, requiring class 1,
a valid tribe, state 10/33, nonzero substate, zero speed, no flags4 bit 0x800 and
an uncancelled active command 27. This branch does not require an exact slot or
compare the command's target ID. Counts are retained between sampling visits;
reset clears them. The first-mission adapter still consumes the player's count.

`scripts/check-native-worship-admission.py EXE` executes 1,536 complete timed-head
visits with real cell chains, four tribe counts and current/queued orders. Only
presentation consumers are intercepted. It also executes 256 original command-113
selection cases (supplying the roster but retaining native eligibility/flag writes)
and 55 model-height consumers using original object records. `--record` writes
executable-bound portable captures. The existing native panel geometry/art oracle
is unchanged. Live tests distinguish off-slot reward contributors from idle
exact-slot panel occupants and check modal/blocked/outside-selection behavior.

`check-browser-head-panel.mjs` uses real model hit tests and pointer actions,
verifies selection/focus and untouched queues/RNG, checks independent panel life,
and resizes through ultrawide and 2x-DPI geometry. Replacing the first icon with
an identical-model, identical-selection person must update the button target;
person IDs are part of the panel update key. The existing person inspection/order
focus browser regression also passes after the shared-owner rename. Panel lookup
stops after its visible slots are filled; group selection still visits the full
fifty-position roster. See the performance note for the measured bounded query.

Still open: vault command-33 and building-anchor ownership, general/zero-target/
shaman-only triggers, multi-tribe winner and conflict handling, per-object counter
phase, bitmap transitions and complete input/command-buffer ownership. The first
mission uses ordinary spell-head panels; this is not full worship or mixed-class
selection parity. Continue the user's groups/selection/3D-drag queue.

Validation at delivery: all 306 portable tests (including full first mission and
worship FPS replay), typecheck, parity metadata, production build and 1,119 native
export hashes pass. The changed worship/panel TS modules pass targeted oxlint;
pre-existing repository-wide lint issues remain outside this slice.


### 2026-09-11: building-aware drag admission

`004449d0` does not reject every person recorded as inside a building. Its class-1
branch calls `004e3430` with the override enabled, then `004de610` and `004de680`.
Thus flags4 bit 128 blocks admission, while bit 0x800 alone does not. A person with
flags2 bit 0x800000 is excluded when the building in their terrain cell is a model-4
completed tower. A state-10/substate-13 person is excluded when their actual current
order is uncancelled command 8 and that cell's building has descriptor flag 1.
Other training phases are eligible. Order target IDs and browser `inside` metadata
are not substitutes for the native terrain lookup. `0040a3f0` reads the cell's
0x200 flag and masked low-ten-bit building index.

`canDragPerson` keeps those gates readable in the existing selection module.
`selectArea` now uses authoritative native position and actual land-list membership
for registered people. Unregistered legacy people retain the previous occupancy
adapter until their object ownership is migrated. Selection still does not create
native simulation owners. Polygon/clamping, first-eligible replacement, empty-area
retention, Ctrl addition and voices keep their existing implementations. The same
change avoids two browser-position/terrain-height conversions per native person.

`check-native-drag-occupants.py EXE [--record]` executes 1,024 complete area commands
with 4,096 people, real cell chains and original tower/training/current-order lookup.
Inputs vary land membership, hidden/blocked flags, packed terrain indices, building
state, phase, cancellation, all eight command cursors and distinct immediate orders.
Only UI refresh and final sound playback are supplied. Selection flags and voices
match; every other native person byte is unchanged. Portable captures additionally
assert unchanged browser orders, units and RNG. A real training-entry test proves
phase 12 is selectable despite occupancy, then phase 13 is excluded without
interrupting training.

`check-browser-drag-occupants.mjs` performs actual terrain drag input during those
entry phases and against a full camp with two queued people. Native order records
and RNG remain unchanged; screenshots retain the original sprites and queue.
The existing full drag browser check passes five camera bearings, map seams,
Ctrl/empty-area behavior, ultrawide/2x-DPI, original sloped terrain, and exact
batched/unbatched selection pixels. The 200-person release microbenchmark and
these headless GPU results are retained in
`references/performance/2026-09-11-drag-occupants.json`.

This delivery does not complete mixed selection: vehicle/passenger objects and
selection propagation, complete native cell traversal and voice-speaker ordering,
HUD/modal/command-buffer ownership, alternate input/render modes and the remaining
full-game scope stay open. Continue those visible controls, with clean TS and
uncapped presentation as constraints.


Review also retained the legacy fetching-builder position adapter: inactive
construction poses cannot supply the current hit location. A portable regression
keeps a fetching builder selectable at the browser position without acquiring a
native owner or relocating the saved construction pose. Final validation passes
all 309 portable tests, typecheck, parity metadata, production build and 1,119
native export hashes. The new selection helper passes targeted oxlint; existing
repository-wide lint issues remain outside this slice.


### Original HUD follower selection and focus (2026-09-11)

`004a0f00/004a1090` dispatch ordinary class/total left buttons through `00450f30`:
click adds one (`7d`), Ctrl adds `MULTIPLE_SELECT_NUM=5` (`72`), and Shift adds the
class (`53`) or all non-shamans (`48`). Shift takes precedence; Ctrl is ignored
for the shaman. Existing selections survive. `00451720` searches unselected,
unreserved people in assignment bands `[0,2,4,3,1,5,6]` (original bytes at
`0059cd94`), within 6,144 toroidal position units of the camera cell center.
The first populated band wins; distances truncate before strict comparison and
list order breaks ties. With nearby mode disabled, `004518c0` falls back to the
nearest eligible unselected person globally. All-selection includes reserved
people but rejects flag 128. The five-person command submits no selection voice;
single and all commands reuse the existing native voice rules.

`004a1010/004a1120` send right clicks to `004de810`. Initial focus is nearest;
subsequent clicks cycle through the tribe list and wrap, with a separate remembered
identity for each class. Shift permits reserved people. Native camera focus and
`00504590(person,0)` open the person panel without modifying selection or orders.
The browser safely falls back after removal of a remembered person rather than
following the executable's stale-pointer dereference. The HUD adapter reads active
native positions and retains dormant-builder browser positions; selecting legacy
people never creates a native simulation owner.

`check-native-hud-selection.py` executes 1,024 complete commands / 12,288 people,
1,024 focus cycles, 144 real left callback/producer combinations and 12 right
callbacks. Only UI refresh, playback, camera movement and panel display are replaced
at consumer boundaries. Selection flags/voices match and all other person bytes
remain unchanged. Fixtures capture 84 selection and 84 focus cases for portable
checks. Live browser checks exercise repeated clicks, both modifiers and precedence,
class/total/shaman controls, focus cycling/panels, Escape, pause, input gating and
marching-order preservation at three desktop sizes, including ultrawide.

This is category-0/on-foot HUD behavior. Full specialist/vehicle/passenger owners,
category-specific controls, assignment priority writers, exact native tribe-list
allocation/ties, input consumption/buffering and full keyboard/settings ownership
remain unverified. The portrait/H combined select/focus shortcut is unchanged and
not credited as a recovered native binding. Runtime selection uses elapsed-free
input operations; no render-frame work, FPS cap or replacement simulation owner
was added. Modern Ctrl-click compatibility and CPU measurements are documented
in `modern-performance.md`.

### Mixed world picking (2026-09-11)

`004673b0` resolves person, model and ground hits in native painter order, rather
than nearest ray distance or the browser unit-array order. Ordinary person hits
use the current VFRA header rectangle (inclusive edges, independent of sprite
alpha), original shaman/view scaling, render flag 128 and `004de610`'s completed
cell-tower exclusion. The broader drag-only training predicate is not a pointer
predicate. Model triangles truncate screen coordinates; ground triangles and
model bounds round to nearest, ties to even. Ground hits clear object ownership.

`00475550` submits type 21 after a model's faces: rounded whole-model bounds,
with the maximum depth plus 0x7000 determining its bucket. A matching type-6 face
consumes its candidate; later faces of that same model cannot reclaim ownership
after an intervening person/ground hit. Mode-zero faces still participate even
though they never draw. Both `004718c0` and tribal-texture `00471a80` produce type
6; tribal artwork does **not** exempt a face from picking. The native construction
renderer `00471c40` also submits type 6 and reverses rear-facing triangles.

`check-native-world-picking.py EXE [--record]` executes 1,024 complete mixed queues,
256 complete person rectangle/scaling cases, 24 tower/cell gates and 256 complete
bounds-producer calls. Only raster consumers/cache maintenance are intercepted;
the actual ownership, rectangle, scaling and predicate branches execute. Portable
captures retain 64 mixed queues, 32 rectangles, 32 bounds and all 24 occupant cases.
`capture-browser-models.mjs` now includes CPU picking geometry from real meshes;
`check-native-live-models.py` compares it with full original model rendering,
including invisible faces and type-21 bounds. The final capture covers 12 views,
368 model instances and 7,430 rasterized triangles; this is individual completed
model submission evidence, not complete mixed-world traversal proof.

`ScenePicking` reuses the painter's source identity/order, applies these hit rules,
and feeds unit selection, world hover/inspection and object orders. Model geometry
is cached until camera, geometry, pose or stage changes. Terrain projection is
cached separately, but hit depth is always resolved from the current painter so
paused building occupancy changes cannot retain stale ground ordering.

Modern differences are deliberate: remove the native three-candidate ring overflow
and use safe JS-number edge products at modern viewport sizes. No invisible picking
faces enter a GPU draw. Native object allocation/list order for non-person classes,
full model eligibility flags, all construction deformation/caps, vehicle/passenger
input, locked-target/alternate modes and command-buffer ownership remain open.
`004762b0` was exported while tracing this path; it is the building deformation
producer, not a picking helper, and receives no new parity credit here.

## 2026-09-11 — preserve clicked command targets

`00437010` classifies hovered people and the pointed terrain cell; `00437750`
chooses a contextual command and `004380f0` validates it. `004aa8b0` transports
its payload, `00444f60` decodes it and `00435780` encodes the person order.
Enemy-person command 28 and friendly-building command 8 retain the exact object
ID. Ordinary friendly-person hits fall through to terrain-cell context. Enemy
buildings choose command 19, an **area** order: its encoded position is the pointed
cell and its range occupies the other word. It does not encode the building ID.

`check-native-command-target.py EXE [--record]` executes 144 complete classifier,
priority, eligibility, transport-producer and encoder sequences: two tribes,
three selected classes, both building owners, two overlapping enemy types,
friendly-person fallthrough and three order categories. Only UI/audio consumers
and final transport are intercepted. Native building footprint checks execute with
original shape data. The fixture records executable identity and complete packets.
Portable live tests exercise category 0 target choice; they do not certify queue
categories or the full native area-attack lifecycle.

The shared browser command handler now accepts the picked ID; pointer release
preserves building/head identity instead of converting it back to a coordinate.
Exact hits cannot be stolen by nearby objects or array reordering. Removed IDs
leave the existing order intact. Ownership is relative to the selected tribe;
terrain building context no longer also assigns a nearby person as an enemy.
Actual browser clicks cover overlapping enemies beside a hut at desktop/ultrawide
sizes. Full terrain-cell classification, contextual wheel/forced modes, special
classes, enemy-building area dispatch and queue ownership remain open.
`00437750` and its footprint predicate `0043d7d0` are retained as evidence, not
claimed as complete TypeScript ports.

## 2026-09-11 — contextual group orders and occupied cells

`command-context.ts` reconstructs the automatic non-ghost branch of `00437750`.
Its repeated eligibility loops reduce to the original command descriptor's person
mask intersecting the selected class mask. Guard/forced shaman/person/tree/vehicle/
spy/plan/building/flatten/head/area priorities retain their original order, including
firewarrior-only and spy-only choices. The retained manual wheel candidate and
ghost-only branch are separate, unfinished owners. Native unsupported-class choices
are compared as primitives; this does not add those unit classes to live play.

`check-native-command-context.py EXE [--record]` executes 8,400 complete original
priority calls without hooks, with isolated bits, interacting flags and single/mixed
classes. `check-native-command-cells.py EXE [--record]` composes native `00403a00`
footprint registration with complete `00437010` hover classification/priority in
3,888 cases: four rotations, both owners, wrapped/unwrapped anchors and all three
opening classes. Only texture refresh is intercepted. Native shape traversal,
shade, footprint challenge queries, context and priority execute. The bridge then
compares live registered cells and chosen commands; move eligibility/execution is
outside that comparison. Portable fixtures retain 472 priority and 648 cell cases.

`live-command.ts` integrates ordinary person/building/head decisions. Ground uses
the registered cell's building ID; nearby enemies require the same coarse cell.
Ordinary head cells and vault shapes replace the old three-unit circle. Picked
objects retain explicit identity, including friendly-person terrain fallthrough.
The registered cell owner decides invalid synthetic overlapping buildings, not
array proximity; the previous overlap test now asserts that owner explicitly.
The order adapter filters members with original descriptor masks. Its existing
native marching/building/worship and partial attack controllers retain execution.

The live adapter does not yet classify all tree/vehicle/forced/spy/guard objects,
contested/damaged building states, or the ghost-only/manual branch. Full mixed-class
cell-chain order and head eligibility are still incomplete. In particular, command
19 uses the existing attack adapter; neither its complete area lifecycle nor full
contextual command-buffer ownership is certified here. No complete checkpoint
credit is claimed. Actual browser clicks beside a hut now move the follower group,
while the hut face still orders entry; overlap, selection/HUD and drag checks remain.

## 2026-09-11 — move validity before command acknowledgement

Correction to the preceding contextual-priority notes: `00437010` computes tribe
bit 4 by checking selected people for **flags4 bit 0x800**, the ghost bit. It is not
an occupant/inside predicate (building occupancy is flags2 bit 0x800000). Existing
native training conversion/ghost comparisons and person-order eligibility use
this same bit. The alternate `00437750` branch therefore means ghost-only selection;
it has not been integrated. Current notes/source labels are corrected; old ledger
snapshots remain historical evidence rather than being silently rewritten.

`004380f0` command 3 calls complete `00518200` at the coarse cell center. Building
bit 512, restricted-cell bit 4 and missing quarter-cell walk bits reject the click.
Coastal category bits are admitted unless tribe flag 32 requests strict land;
unsupported water is admitted only without strict land and with tribe flag 64.
The latter is assembled from selected transport ownership, not building occupancy.
The current live world has no vehicle owner, so it cannot acquire that exception.

`moveCommandAllowed` reuses the already reconstructed `restingCellCollision`.
The live command context checks it once before order allocation, path queries or
person changes. `command` reports input acceptance separately from later route or
allocation success; accepted but unreachable inputs retain acknowledgement, while
rejected inputs no longer reach `GameScene.orderSound`. This follows `004aa8b0`,
which sends no tribe command, marker allocation or acknowledgement for a disabled
context. Full command-buffer ownership and route-failure feedback remain separate.

`check-native-move-eligibility.py EXE [--record]` executes 5,120 complete validator
and input-producer sequences over all 16 terrain categories, both cell flags,
partial/full quarter masks, strict-land/transport flags and wrapped coarse-cell
boundaries. Native collision and decision code run; transport, marker allocation,
UI refresh and audio are recorded consumers. All accepted cases attempt command,
marker and cue; all rejected cases do none. The 1,024 portable captures check
eligibility. A live eight-person regression compares the entire world after blocked
cell and quarter-mask clicks, restoring only the injected obstruction for equality.
Actual browser clicks at desktop/ultrawide sizes check preserved orders, marker/audio
queues, silence on rejection and restored input after clearance.


## 2026-09-11 — marching formations steer before person physics

Existing export `004ec6f0` proves the phase: four tribes in numeric order, each
formation list at tribe+0x88d using object+8 next links, skipping class zero, call
`00501000`; then encounter/fight lists; then primary allocated objects using +4
next links, nonzero-state admission and incremented byte counters before `004ed700`.
Guard/world work follows, then the secondary allocated list and tribe-list rebuild.
The pause branch bypasses these processors. Both list traversals cache next before
calling their processor. Groups recruited during a person's visit therefore first
run in the following turn.

`check-native-formation-phase.py EXE [--record]` executes the complete native inner
loop in 256 two-turn scenarios. Leaf processors are supplied and recorded; original
pause/phase/list traversal and counters execute. The first person visit prepends a
new formation, proving its next-turn admission. Randomized tribe lists, inactive
classes and counter wrapping are covered; 32 traces are retained for portable tests.
This probe does not execute world processors, allocation or the list rebuild; the
existing marching comparison separately executes the complete original formation
controller (2,048 geometry, 2,048 controller, 128 sequence and 4,096 recruitment cases).

`model.ts` now calls the live formation adapter after outcome work and before object
work, instead of after followers. The adapter visits tribes 0–3, preserving each
tribe's retained order, and skips inactive groups. Its shared person map is still
built once per turn. No native linked-list emulation, sorting or new allocations
per group are introduced. `formation-phase.test.mjs` compares the native phase
traces against live ticks and observes genuine 24-person formations: no steering
on their creation turn, and subsequent steering before member-counter increments.
Actual browser orders, original walking poses, pause, retargeting and resting
handoff pass. The broader mixed-class allocated order, list rebuilding, deferred
freeing, object limits and complete world scheduling remain unfinished.


## 2026-09-11 — native obstacle retry reaches the live path planner

`004e9720` obstacle recovery and `004e9950` timed recovery raise flags2 bit
0x80000000. Complete preparation `004d42a0` clears it and, unless flag 128 suppresses
target steering, calls **planned** destination wrapper `004e9d80` with the retained
goal at person+0x4f. It does not call direct wrapper `004e9dd0`. Three live preparation
consumers had supplied the direct wrapper; building entry/attack preparation instead prematurely
released the route and reused input validation. Both alter native reuse/fallback.

`planDestination` now contains the existing native planner composition, shared by
input/query `planLivePath` and preparation `replanLivePath`. Preparation preserves
flags and route ownership through the native planner, then refreshes the existing
live person/path display records. It does not create a command, re-acknowledge the
order, force planning eligibility, reject a failed search like new input, or clear
a route just attached by the planner. All five preparation sites now use this owner;
explicit direct destinations used by resting/celebration state logic remain direct.

`check-native-person-routes.py` adds 2,048 complete preparation→planned-wrapper→planner
comparisons to the existing 20,480 route cases. Native release/attach/reuse, request
gates and pool mutations execute; path construction/advance, building/coastal/vehicle
consumers remain supplied as in the existing oracle. Retry presence, suppression,
path-disabled flags, reuse, reserved records, limits and failed construction are
covered. This establishes the call composition, not complete physics/world parity.

The live regression adds a hut after a 24-person group has accepted its order. Real
collision raises retry flags; the next physics turn must retain a planned route,
which the old direct-steering adapter fails. All 24 people get around the hut,
settle and release their original shared order and routes. Complete histories,
people, RNGs and footprint cursor agree at 5–240 Hz and irregular frames. Browser
checks use real desktop/ultrawide clicks and verify visible original sprites after
arrival. A paused fixture must render its reset world before clicking so its painter
and camera matrices match the new scene; this was corrected in the browser harness.
Full terrain invalidation, vehicles and complete mixed-class movement remain open.

The shared `moveLivePerson` ground adapter now advances retained route waypoints
after position updates and before each state controller. Building/resting callers
no longer duplicate that work; panic/celebration receive the same path advancement
when preparation replans. A coincident-waypoint regression requires exactly one
advance per ground visit, and existing entry/resting/transition regressions remain.


## 2026-09-11 — remove the early movement crop and share native world heights

The native world is 128×128 coarse cells with 16-bit wrapped positions. Live ordinary
orders were still rejected by `supportsFollower` outside ±47 browser units, and the
shared ground-motion adapter injected collision 3 there. These were early browser
crop guards, absent from native `004e6d00` physics and its existing compared collision
consumers. They are removed; original terrain support, building access and recovery
remain active. The full native renderer and existing route/slot coordinates already
support the rest of the world.

`nativePosition` now queries complete `0044e940` height sampling through the existing
`terrainPointHeight`, after the compatibility grid's versioned synchronization.
Scene placement, ordinary sprite grounding and live person height use this same
source; effects' explicit supplied heights still take precedence. Synchronization
reads compatibility grid vertices directly rather than recursively asking for a
native position. Its version is marked current before height notifications, which
may themselves query positions. The small compatibility grid remains an input
adapter and is not expanded or copied for full-world queries. A pre-existing spell
range test edited that grid twice without updating its version; it now announces
both edits like runtime terrain writers do.

`check-native-person-physics.py` additionally compares 4,096 complete executable
height results with the live browser/native coordinate round trip across random
full-map heights, stored diagonals, signed coordinates and seam edges. Existing
raw height/slope/drift, velocity and landing comparisons also pass. The portable
world movement test drives six people across each former crop boundary and both
directions across X/Z seams, then checks unique resting slots, bounded wrapped
steps, complete order/route cleanup and identical 5–240 Hz/irregular histories.
It also verifies native out-of-crop height edits, periodic coordinate aliases,
sprite grounding, preserved water rejection and compatibility-edit synchronization
without overwriting the rest of the world. Actual desktop/ultrawide clicks cover
crop/X-seam/Z-seam routes and original visible sprites. The existing 576-pose GPU,
selection-arrow and real Blast shadow/landing regressions pass.

Ordinary movement extent is now independently verifiable; full-world simulation is
still partial. Legacy `height`, `walkable`, `surface`, `worldPoint` and marker-height
compatibility consumers, some placement/bridge/reincarnation queries, other class
controllers and planar interaction/distance adapters retain separate work. No
claim to full-world commands, vehicles, all collision modes or complete scheduling
follows from this bounded integration.

## Player ground waypoint sequences (2026-09-11)

The original left-release bindings distinguish ordinary action 126 and Ctrl
127. `004aab80` forwards the staged flag to `004aa8b0`; Alt inverts the
`004999d0` keep-selection setting and Shift sets packet bit `0x40000`.
The native initializer's default keeps selection. The input packet is
`0x37 + cursor` while staging or `0x57 + cursor` when finishing. Slot seven
forces completion. The deeper `00444f60` trace corrects an initially plausible
but wrong interpretation: Ctrl does **not** hold an unexecuted plan. Every click
immediately appends a shared order and restarts selected people's current order.
An ordinary click ends staging; the eighth click also deselects, even with Ctrl.

`00435780` encodes the point at native 256-unit subcell centers. At cursor zero,
`00435c40` clears selected people's circular queues and immediate orders.
`00435cb0` allocates one shared record, scans from each selected person's cursor
for its first empty slot, applies model/ghost eligibility, prepares and attaches
that record, and accumulates voice counts. A full person queue uses the immediate
slot; exhaustion does not overwrite retained orders on a continued sequence.
`00435c10` snapshots selection into bit zero; `00436ff0` clears staging metadata
on completion. `004358f0` advances frontend count/cursor and `004386d0` resets
the manual context choice. Inline focus writes, actual voice arbitration and
preview-marker ownership are not covered by the new append helper.

`appendPersonOrders` matches 2,048 complete native append calls, including shared
references, circular slots, immediate replacement, class/ghost eligibility and
exhaustion. The existing encoding/ownership comparisons still pass: 4,000 total.
Preparation and work/spell/fight/object/voice leaves are supplied, not claimed as
complete native world execution. Forty portable captures retain native pool SHA-256,
person writes and ordered consumer calls. Another 64 complete `00444f60` packet
and `004358f0` cursor cases verify ground flags, Shift, Alt and the eighth-slot
limit. Another 576 lookups execute the shipped release bindings and their native
context predicates. The supplied leaves isolate packet control from already
compared append ownership. Four fresh Ghidra exports bring the manifest to 1,137.

Live ground sequences use the existing eight-slot order pool, route planner and
marching controller. At arrival, native `004366b0` now reaches
`configurePersonOrder` (`00432df0`) and `recoverPersonMovement` (`004d4f40`);
it does not incorrectly rerun startup's extra speed draw. `00436870` rewrites
only command 31, which remains unsupported in this live adapter. Shared startup
context avoids duplicating its world consumers. Real desktop/ultrawide Ctrl
mouse clicks, release-time modifier changes, Alt deselection, arrival order and
original standing sprites are checked. Portable sequences cover immediate motion,
shared ownership, final deselection, interruption, pool exhaustion and identical
turns/RNG/poses/footprints at 5–240 Hz and irregular frames. Existing 576 GPU sprite
poses and selection/Blast shadow regressions pass.

This is ordinary ground-waypoint scope. Non-ground commands retain their previous
controllers and finish/reset the browser staging cursor; mixed building, worship,
attack and transport queues still need native ownership and handoffs. Whole
player dispatcher timing, all settings, special classes, full selection changes
and frontend waypoint previews remain open. Ordinary non-staged legacy commands
also retain their prior preflight/allocation semantics. Do not call the full
order checkpoint complete.

Modern implementation: no second waypoint array, per-render work, extra renderer
pass or new dependency. Order changes run on input and existing simulation turns;
presentation remains uncapped/interpolated. `scripts/bench-ground-waypoints.mjs`
records the added work on Apple M5 / Node 24.18.0: appending to 200 moving people
has 1.454 ms median / 1.644 ms p95 across 50 samples after 20 warmups. A separate
600-turn complete scenario has 0.303 ms median / 4.894 ms p95 / 15.041 ms maximum,
and releases all orders/routes after arrival. Raw samples are in
`references/performance/2026-09-11-ground-waypoints.json`. These are CPU costs of
new behavior, not equivalent before/after speedups or hardware browser FPS claims.
Fallow reports maintainability 85.5; the touched live movement adapter passes
ox-standard. Preexisting person-order type-style diagnostics remain outside this
bounded change.

## Ground command feedback wiring (2026-09-11)

`004aa8b0` emits the model-61 flash for accepted input when neither pointed-object
slot is populated. It centers the packed click on a 512-unit terrain cell, uses
secondary class-7 allocation, lowers the effect by 160 native height units and
sets four processor visits. UI cue 106 is emitted even if marker allocation fails;
rejected input skips the packet, marker and cue. Object slot 1 takes precedence
over slot 2 and suppresses the ground flash. Pointed-object highlighting and its
five-visit frontend target expiry remain separate, unfinished rendering work.

The scene's accepted-order branch now calls the already implemented original
marker effect and UI cue. It does so for ordinary and Ctrl ground clicks, including
accepted input whose later order allocation fails. No effect is created for
pointed objects, selection clicks or rejected movement. `commandMarkerPoint` keeps
native coarse-cell rounding in one readable helper; order-icon focus retains its
original unrounded point behavior. Existing voice acknowledgement follows the UI
cue. This does not claim complete native voice arbitration or command buffering.

`check-native-move-eligibility.py` executes 5,120 full eligibility/input calls and
32 additional complete input-controller marker/target cases. Allocation is a
supplied failing leaf, so the latter also proves unconditional accepted-input cue
behavior. Native frames, attachment and four-turn lifecycle retain their earlier
marker fixture coverage. Actual desktop/ultrawide input checks verify visible
original GPU pixels, rejected-water silence, and a flash/cue while the order pool
is exhausted. All 334 portable tests pass. Existing marker rendering checks cover
ordinary/ultrawide/2x DPI, pause and four-turn disposal.

Modern implementation reuses the existing HFX atlas, effect clock, geometry and
renderer: no new textures, passes, animation timers or dependency. Paired
marker-hidden/visible rendering adds one draw call and two triangles while
retaining 11 resident textures; the ordinary desktop check measures 119 changed
pixels. `references/performance/2026-09-11-command-feedback.json` records all three
views. These headless GPU counters demonstrate the actual bounded rendering cost;
they are not hardware FPS or equivalent before/after speedup claims. The touched
command-context helper passes ox-standard.

## Pointed-person corner brackets (2026-09-11)

New export `00475860` emits eight six-pixel corner segments per layer around
`unit_index_1`'s retained sprite bounds. Ordinary hover has two layers. A matching
acknowledgement target uses four layers on even sprite-animation phases. The
ordinary phase is `15 - abs(frame % 12 - 2 * (frame % 6))`; division is unsigned,
including animation-counter wrap. `004b0080` clears the acknowledgement target
after five frontend visits, from `draw_main` before the input/renderer pipeline.

Crucially, the phase is not a directly displayed palette index. The controller
sets tint-table pointer `al0_mem + 0x2000`. Complete `00516270`, `00415f70` and
`005166c0` conversion reads AL offset `0x2f00`, resolves initial palette index
129 to RGB (229, 220, 214), and uses `phase * 16` as the alpha byte. Stopping at
the index produced incorrect dark brackets; full native terminal-color traces
caught and corrected that before publication. Asset hashes for the palette and
AL table are retained in `app/original-pointer.json`.

`check-native-pointer-brackets.py` executes 1,024 complete bracket/controller/color
paths with only final `00516500` line submission supplied. It compares every line,
RGB and alpha, signed bounds, no-pointer gating, normal/click phases and unsigned
counter wrap. The real five-visit expiry executes independently. Portable captures
retain 56 draw cases. Live hover/click/leave tests cover native hit-bound alignment,
pale SVG pixels, pulse/acknowledgement geometry and 5–240 Hz elapsed expiry at
desktop, ultrawide and 2x DPI. All 335 portable tests and the mixed-object picking
and real ground-waypoint regressions pass. Export identity now covers 1,138 files.

The scene shares `ScenePicking.personBounds` with hit testing. Picking passes its
existing viewport rectangle, avoiding a new layout query for every follower. The
native 16/32 individual line submissions become one cached SVG path; unchanged
geometry/phase does not rewrite path attributes. The headless Chromium 153
comparison records 188 nontransparent SVG pixels and one path, with approximately
0.5–0.7 microseconds per cached update in the recorded 1,000-call checks. See
`references/performance/2026-09-11-pointer-brackets.json` for raw views and limits.
This is a bounded implementation cost, not a hardware FPS or native raster-speed
claim. Exact D3D endpoint/overlap compositing remains unverified.

Modern timing uses 5/24 seconds from the actual input timestamp, reusing the
project's 24 Hz reference presentation cadence rather than counting rendered
frames. Higher display refresh cannot shorten the feedback. Exact original
outer-loop pacing, pause dispatch and all settings remain open; sprite pulse
uses the existing animation clock. This delivery covers ordinary person hover
and click/accepted-order feedback, not complete building/object highlight
ownership, all input contexts, localized/system palette changes or persistent
waypoint previews. Full controls parity stays partial.

## Worship queue handoff and staging-preview correction (2026-09-11)

`004ad9a0` captures camera/context metadata into sixteen-byte staging slots using
`004199c0`. The record includes tribe camera coordinates, height, screen position,
angle, view mode and flags. `004358f0` marks/advances slots and may call
`004199b0` to restore one. However, **004199b0 and the 00438ae0 preview hook are
literal RET instructions in the supplied D3D executable**. The CPU verifier now
asserts those entry bytes. Four reviewed exports bring the manifest to 1,142.
These routines do not justify the previous assumption that persistent waypoint
artwork is missing. That assumption is withdrawn; other untraced rendering or
input consumers are not declared complete by this finding.

`00444f60` finishes a sequence when its command descriptor contains 0x2000,
including worship model 27. This overrides the frontend Ctrl packet. The native
oracle now advances the frontend cursor **before** applying the simulation
packet, matching their actual causal order; those operations commute for ordinary
ground commands but not forced-final commands. All 256 combinations of four
command models, eight slots and Ctrl/Shift/Alt match native flags, final cursor
and deselection. Vault model 33 is included in the pure packet comparison, not
claimed as a migrated live vault lifecycle.

The live shared append path now accepts ordinary stone-head worship, retains
prior ground/building commands, and assigns the browser work marker only when
worship becomes current. Warrior replacements inherit the same head order through
the existing conversion path. No new queue, renderer, animation clock or library
was introduced. Original model-27 payload preparation is compared against 128
actual live append records by `check-native-movement-order.py`; the native routine
executes completely. The common startup and person-worship controllers remain
shared with the previously compared implementations.

`tests/live-worship.test.mjs` adds retained-route/person identity, forced finish,
Shift/Alt behavior, training-to-head inheritance, actual prayer/rewards and exact
turn/pose/RNG/footprint replay at 5–240 Hz and irregular schedules. All 343 portable
tests pass. `check-browser-worship-waypoints.mjs` checks real Ctrl ground/head
clicks at 1440×1000 and 3440×1440, completion with selection retained, all seven
original prayer sprites (1,394 changed GPU pixels) and rewards. The existing
mixed-building browser regression also passes. Seven-person simulation visits
have 0.1 ms p95 under coarse headless browser timers; raw samples and renderer
identity are retained in `performance/2026-09-11-worship-waypoints.json`. This is
new-behavior CPU timing, not a speedup or hardware FPS claim. No per-render queue
processing is added. Fallow maintainability remains 85.5; touched live movement
passes ox-standard. Complete work/combat/vehicle orders, settings, native global
allocation/dispatch and untraced command-context behavior remain partial.

## Combat interruption preserves shared orders (2026-09-11)

The live reinforcement adapter created a fresh person and cleared the recruit's
orders. That contradicted `0051ddc0`: native admission initializes the existing
person in state 25, writes its fight ID and retains its order slots. `0051e150`
does the same for both state-29 encounter participants. `004ed6f0`, the intervening
empty-state hook, is a no-op. `004d32b0` dispatches both states 25 and 29 through
`00518560`; recovery therefore also applies when an opening encounter is cancelled.
The browser previously applied that recovery only to state 25.

`scripts/check-native-combat-queues.py` executes 1,024 native admissions/encounter
setups with real class, person and combat initializers. It checks eight slots,
immediate orders, cursors and every byte of the shared order pool before/after.
Sprite installation, encounter allocation/immediate visit and UI notification
are supplied leaves, explicitly listed in the script. Three playable models,
eight cursors, empty/populated slots and immediate orders are covered. This is
not a complete native battle replay. Existing group, initializer and cleanup
comparisons also pass: 4,096 admissions/splits, 8,192 state initializations,
4,096 cleanups and 324 recovery decisions, plus their related checks.

Live combat now transfers the existing person from movement/entry into the fight
and restores the correct work adapter on return to state 10. The existing training
queue rebuild is shared by both initializers. A waiting trainee leaves the physical
line when combat starts, retains its command and rejoins the line afterward.
No copied task snapshot, second queue, dependency or presentation clock was added.

`tests/mixed-combat-orders.test.mjs` covers new/cancelled encounters, reinforcement,
replacement, splitting, movement tails, hut entry, prayer poses, real overflow
training lines, player cancellation and death/reference cleanup. Simulation,
RNG and poses agree at 5/30/60/120/144/240 Hz and irregular schedules.
`check-browser-combat-queues.mjs` issues actual Ctrl mouse waypoints, retains their
identity through a fight, checks the resumed original brave walking frame and
269 changed GPU pixels, pause and completion at 1440×1000 and 3440×1440.
Raw Chromium/SwiftShader measurements are in
`performance/2026-09-11-combat-queues.json`: 0.1–0.2 ms p95 simulation visits with
coarse timers. Zero medians reflect timer resolution. No hardware FPS or speedup
claim; this change reuses records and existing simulation ownership, with no new
per-render work. All 348 portable tests and the production build pass. Fallow
maintainability remains 85.5 with the existing 20 cycles. The three touched TS
files have 182 ox-standard diagnostics versus 184 at the baseline, with no new
diagnostic kinds/counts; existing lint debt is not claimed clean.

Explicit command-19 area selection/queue completion, command-21 sharing, other
work/transport and native mixed-class scheduling remain partial. In particular,
the retained building adapter still derives its target from the original area
cell. It must eventually use native search/restart/completion rather than clear
all orders when the first building disappears. No whole-lifecycle parity credit
is awarded for this interruption fix.

### Reachable manual area attacks and group arrival voices — 2026-09-11

The live shared queue now accepts ordinary command 19. A building click writes
its packed cell center and a zero extent, not the clicked object's ID in the
radius word. `004380f0` reads the staging extent bytes; `004380f0`/`004aa8b0`
packet layout and `00438730` preparation retain the area semantics. Both 19 and
21 use the same coastal correction, including unchanged-record flag retention.
The updated native preparation oracle compares both models in 1,024 full calls;
its existing 1,024 complete automatic response allocation comparisons still pass.

The live controller composes the recovered `0051a2a0` search, pursuit, fight/person,
building and plan branches. Invalid targets restart the manual area scan; they do
not consume the order. Native completion advances the same shared tail. Target
snapshots are built during scans, not rendering or each active strike. Building
classification now uses actual plan ownership: an unbuilt preparation is class 9,
whereas partial construction is class 2. `0051ff40` reservation release is shared
by fight restart and command cancellation. Existing automatic building admission
starts with its already selected/reserved target, preventing double reservation;
full command-21 allocation/sharing still needs live integration.

Validation includes six followers sharing ground → area attack → ground, natural
hut destruction, distinct destination positions, target replacement with a person,
retained encounter ownership and tail recovery, cancellation/reference release,
and ordinary plans/partial structures. Existing occupied-building ejection/resume
and all playable attacker cases pass. Original `0051e150` mode 2 selects the housed
encounter entry phase for both participants; complete housed-target lifecycle and
special classes remain unverified beyond the recovered helper boundaries.

`00520250` consumes up to eight march summaries after `main_loop_outer` in
`004a4960`. Distance below 1,536 selects cues 45/46/47 for counts 1/2/3, otherwise
48. Removal shifts the following rows but the original loop still advances its
index. `004d32b0` decrements person byte +0x1e after its state body; this is separate
from sprite animation state. The new oracle executes 1,024 three-visit lists and
1,024 reservation releases, hooking only audio output. Portable captures retain
thresholds, count edges, list compaction and reservation duration.

**Modern timing choice:** arrival audio admission runs once after each fixed
simulation turn. The native consumer sits in the old frontend loop; running it on
uncapped browser renders would change the number/order of compacted-list visits.
5–240 Hz and irregular replays verify identical simulation, queues and voices.
No render-frame counter, new texture, audio resource or per-frame target scan was
added. Existing motion/routes, animation assets and sound playback are reused.
The shared combat motion adapter also removes duplicated path setup.

Native comparisons rerun: search 8,192; pursuit begin/step/area 4,096 each;
fight/person/retry visits 12,288; approach queries 1,024; building attack/helper
calls 16,305 plus 64 sequences. These validate their documented helper boundaries,
not a complete original executable game-loop replay. `npm run check` passes 355
tests. Real browser Ctrl/mouse input at 1440×1000 and 3440×1440 preserves all three
shared commands, visibly attacks (139 changed sprite pixels from an unobstructed
camera bearing), pauses, destroys the hut and regroups. The prior building-combat
check retains shake/ejection/recovery checks, viewing the attackers from the other
side of the hut after the new native path/RNG puts the initial pose behind it.
576 GPU sprite poses, Blast shadows/landing and selection also pass.

Performance evidence is in `2026-09-11-area-attack.json` and
`2026-09-11-area-attack-cpu.json` under `references/performance`. Browser six-person
turns have ~0.2 ms p95 with a coarse timer/SwiftShader. Five 200-person, 600-turn
Node replays all destroy the hut and release every order, with 0.23–0.38 ms median
and 5.13–5.27 ms p95 complete turns. The first pass includes JIT warmup. These are
CPU measurements, not hardware FPS or a before/after improvement claim. Fallow
maintainability remains 85.5 with 20 existing dependency cycles; the changed area
adapter has no ox-standard diagnostics and the touched-file diagnostic counts do
not increase over the baseline. Existing repository lint debt remains.

**Open boundary:** `004d9650` (state 33) is exported but not reimplemented. It owns
failed-route staged searches and later retry/health behavior. Existing player
attack reachability admission is retained before changing orders, so unreachable
replacement clicks preserve valid queues. This is an existing adapter limitation,
not verified original admission. Full failed-route recovery, area-drawing extents,
automatic command 21, special plans/structures, ranged/vehicle classes, native
mixed-class cell ordering and all work/transport handoffs remain open. Ordinary
plan deletion still uses the live building-removal owner; native class-9 allocation
and destruction effects are not certified. These bounded deliveries add evidence
to partial lifecycle requirements without adding duplicate parity points.


### Failed-route group recovery and audible responses — 2026-09-11

This supersedes the previous state-33 open boundary and command-19 preflight
workaround. `person-route-recovery.ts` reconstructs complete `004d9580` and
`004d9650`: stop/idle row and route release, recent local-command voices, tutorial
request, initial ground/building checks, staged search modes, byte counters,
128-counter retry cadence, tribe-dependent timeout and signed life decrement.
The life protection bit belongs to **load flags at 0089c665**, not the separate
level-flags-2 global. The command-age counter is **0089d184** and last issued turn
is **0089bc22**. Common state initialization now dispatches state 33 for both live
ordinary followers and building-entry owners.

The existing planner context is shared by ordinary destination setup and retry
wrapper `004ea920`; retries correct copied quarter-cell endpoints and pass the
native search option. Successful recovery releases the old route, clears failed
search cache, uses **reserved attachment 004ea400**, then initializes the default
state. This preserves the same person, current command and shared tail. Manual
command-19 admission now allows failed routes to reach this controller. Read-only
path previews still borrow/release routes without changing current orders.
No new timer, dependency or per-render retry loop was added.

`004d9580` requests global cue 225 (ordinary followers) or 226 (shaman) for a local
command less than three unsigned turns old. Scene playback bypasses positional
attenuation for these notifications. Previous arrival cues 45–48 were emitted but
**not preloaded**, so the earlier voice delivery did not produce audible playback.
The six cues now preload eleven distinct original PCM clips. An isolated real
Web Audio check verifies decoded assets, active sources, nonzero output and global
225/226 dispatch with gain 1/pan 0 even far from the camera. Native voice arbitration
and tutorial UI are not claimed; requests reuse the existing deduplicated notice
queue, renamed `tutorialNotices` to describe both mana and route requests.

Validation:

- `check-native-route-recovery.py`: **8,192** complete native initializer/body calls,
  including ordered consumer calls, every owned field, byte/short boundaries and
  the unsupported-ground/default-state branches. Route construction, class
  initialization, slope/building lookup, audio and tutorial consumers are supplied;
  this is not an original full-game-loop execution.
- Expanded `check-native-person-state.py`: **8,704** common initializers, **6,624**
  animation choices, **1,280** order startup/reconciliation calls, **640** speed
  recoveries and **128** composed training handoffs pass. Path-search comparison
  covers another **8,192** endpoint/boat, collection, search and composed calls.
- Five portable recovery tests replay native captures and check six blocked
  followers retaining attack/ground references, land reconnection, resumed attack,
  destruction and arrival; replacing/deleting a blocked person releases orders;
  building-entry ownership resumes the same person and completes admission.
  Full replay/RNG agrees at 5/30/60/120/144/240 Hz and irregular intervals.
- `check-browser-route-recovery.mjs`: real Ctrl attack/ground input at 1440×1000 and
  3440×1440, stopped and visible group, pause, land reconnection, resumed destruction
  and complete tail arrival. Audio validation uses actual loaded clips. Evidence:
  `performance/2026-09-11-failed-route-recovery.json`.
- **360** tests/typecheck pass, production build succeeds; **576** GPU sprite poses,
  Blast shadows/landing and live selection regressions pass. Touched-file
  ox-standard diagnostic counts match the prior baseline; the new recovery helper
  has none. Fallow maintainability remains **85.5**, with **20** existing cycles.

`node scripts/bench-area-attack.mjs --blocked` records five deterministic 200-person,
600-turn CPU replays, disconnected until turn 120. Every pass destroys the target
and releases all command references. Median turns are **0.19–0.28 ms**, p95
**5.18–5.54 ms**, maximum **28.42–30.70 ms** including retries/combat; input takes
**4.46–7.54 ms**. The first pass includes JIT warmup. This is simulation acceptance,
not rendered-frame cost, hardware FPS or a paired speedup claim. The full timings
and CPU/runtime are in `performance/2026-09-11-route-recovery-cpu.json`; peak turn
cost remains relevant to later frame-time profiling.

Remaining: full native command buffering/last-input ownership, all automatic-21
and specialist/vehicle consumers, area drawing, full health/death lifecycle and
terrain-change behavior across every state. State-33 life changes are reconstructed,
but complete person health/corpse scheduling is not certified. `00499d90` tutorial
admission/display is inspected, not ported; queued requests do not establish that
UI. Other non-staged legacy command admission still uses its prior adapter.
These add evidence to existing partial lifecycle requirements without duplicate
parity credit; the user's group/footprint/standing/selection priorities remain active.


### Audible selection groups and pointer acknowledgement — 2026-09-11

`00489c40` selects one voice per present specialist class, then shaman, then
ordinary followers, using distinct rows for one/two/three/four-plus people. The
browser selected those cue IDs already, but the manually maintained audio preload
list omitted ordinary group cues **68/69**, specialist cues **70–75/86/87**, and
pointer acknowledgement **106 (0x6a)**. `Soundscape.playSample` therefore returned
without producing audio. This corrects earlier claims of audible pointer/order
feedback based only on queued/callback events.

`person-selection.ts` now has one native count/class voice table. Single/group
selection and exported `SELECTION_CUES` use it; `audio.ts` includes those rows and
0x6a before enabling sound. Existing sample-key deduplication prevents duplicate
fetch/decode when cues share a recording. No lazy first-click fetch, gameplay
clock change, new dependency or separate selection rule was introduced. The
existing ordinary/shaman order acknowledgements retain their own cues.

Compared with source `39095c999b5b8d0dab932922e76c46e7220406cc`, the eleven previously
omitted cue IDs require **13** additional unique WAVs totaling **223,256 bytes** of
stored assets. Total preloaded buffers rise from **195 to 208**. Browser selection
and pointer cues together reference **25** decoded buffers, **1,822,948 PCM bytes**
at the observed **48,000 Hz** AudioContext rate. These are asset/decoded-buffer
measurements, not wire transfer, whole-process memory, frame time or a speedup claim.
Mute/re-enable keeps the same AudioBuffer identities.

Validation: **1,024** complete native person-click commands (4,096 records), **288**
modifier bindings and **16** press/release dispatches pass. The HUD oracle passes
**1,024** commands (12,288 people), **1,024** focus cycles, **144** left callbacks
and **12** right callbacks, including original voice choices. The portable
selection regression checks all single/group class rows and actual preload/assets.
**361** tests/typecheck and the production build pass. Both touched TypeScript
files have no ox-standard diagnostics; Fallow remains **85.5**, with **20** existing
cycles. Browser person-selection tests cover desktop, ultrawide and 2× DPI without
changing movement orders or selection ownership.

`node scripts/check-browser-selection-audio.mjs` enables real browser audio and
isolates it from background music/ambience **after audio activation has completed**.
Real drags select one through four ordinary followers plus shaman and produce
nonzero signal with the expected active voice. A held sprite press isolates audible
0x6a, release plays the selection voice, Shift-HUD selects a five-person group with
its capped voice, and Ctrl-five selects silently as in the original. Eight
specialist count cues are checked through the real Soundscape and native selector;
this does **not** create playable preachers/firewarriors. All variant buffers exist,
output is nonzero and mute/re-enable reuses buffers. Evidence is
`performance/2026-09-11-selection-audio.json`.

Full specialist classes, native sound priorities/interruption, source arbitration,
tribe-list speaker order and complete selection/command buffering remain open.
No whole lifecycle is newly certified and no duplicate parity points are added.


### Queued dismantling and mixed follower eligibility — 2026-09-11

A marked friendly hut/camp/tower now accepts command **10** within the existing
Ctrl sequence. Previously it entered the legacy work branch and reset the staged
queue. The shared order/person owner now handles ground → dismantle → ground,
including original timber recovery, removal and handoff into the retained tail.
No browser task replay or duplicate dismantling state machine is added.

The reconstructed `00438730` packed-cell preparation is shared as
`prepareCellOrder` for commands 10/19/21. Command 10's object ID is retained in word
`a` and coast correction updates packed location word `b`; area attacks retain
radius word `b` and correct center word `a`. Unchanged records preserve flags.
Existing combat callers are renamed without changing their model-19/21 behavior.

Before changing live controllers, queued input now applies the native descriptor's
person-model mask. Otherwise the new brave-only command could release a selected
warrior's current orders before the original append routine rejected that warrior.
Actual shared append still performs its native admission. This is the ordinary
on-foot adapter; future transport/ghost consumers retain their separate scope.
Existing `adoptLiveOrders`, entry dispatch, `stepDismantling`, native cancellation,
queue advancement and timber ownership perform the work unchanged. The work frame
is original sprite object **88** for a blue brave; animation-table row 6 is not the
person's `animationMode` field or its imported source-object ID.

Validation:

- `check-native-combat-orders.py`: **1,024** complete automatic response initializers
  still pass. Direct preparation expands to **1,536** full native calls, including
  **512** command-10 calls, coastal categories, unchanged records, wrapped locations
  and preserved object/radius payloads. Portable captures include the new cases.
- `check-native-orders.py`: **4,000** native encoding/route/reference/group/append
  comparisons, **384** player packet/cursor cases (now also models 10 and 19) and
  **576** actual release-binding/context/modifier lookups pass.
- `check-native-dismantling.py`: **2,048** native controller calls with real shapes,
  work timing, movement/animation/RNG and timber/stage mutation; **128** activation/
  cancellation calls include shared record rewrites and state-10 restart flags.
  Route, world allocation and removal consumers remain supplied as documented.
- Four added portable integration tests cover three braves plus an ineligible
  warrior in all orientations, same person identity, exact timber recovery,
  complete order cleanup, queued entry becoming dismantling, cancellation, removed
  targets, replacement and death. Full world replay agrees at 5/30/60/120/144/240 Hz
  and irregular intervals. **365** tests/typecheck, production build, **576** GPU
  sprite poses, Blast shadow/landing and live selection regressions pass.
- `check-browser-queued-dismantling.mjs`: real Ctrl ground/work/ground clicks at
  **1440×1000** and **3440×1440**, retained identities, distinct warrior queue,
  native work sprite pixels, pause, target removal, all followers arriving and
  complete timber/order accounting. Four camera bearings retain normal building
  occlusion: the first worker contributes **23** pixels at bearing 0 and **20** at
  3π/2, and is occluded at the other two bearings. The check does not hide the hut.
  Evidence: `performance/2026-09-11-queued-dismantling.json`.

`node scripts/bench-area-attack.mjs --dismantle` reuses the existing CPU harness
for five 200-brave, 600-turn ground/work/ground replays. All remove the hut, survive
and release every command. Median turns are **0.28–0.45 ms**, p95 **5.15–6.25 ms**,
maximum **8.66–18.48 ms**; the first pass includes JIT warmup. Issuing the three
commands takes **6.99–12.42 ms**. Measurements are complete simulation turns with
no rendered-frame/FPS or paired speedup claim. The final recorded replay ran after
the browser check stopped. Raw timings/runtime/CPU are in
`performance/2026-09-11-queued-dismantling-cpu.json`. Browser four-person turns have
~0.2 ms p95 under a coarse timer and SwiftShader. Current touched-file ox-standard
diagnostic counts equal the baseline; existing lint debt remains. Fallow is **85.4**
(previous **85.5**) with **20** unchanged cycles.

Still unfinished: construction command 6 and native class-9 plan/worker ownership,
unbuilt/special structures, transport/ghost orders, all person/tribe scheduling,
command turn buffering and complete mixed-class work queues. Legacy non-staged
work admission is not newly certified. Existing whole dismantling evidence gains
queue integration coverage, not duplicate parity points; full game parity remains
active.

## 2026-09-11 — construction command ownership before live queue migration

`app/construction-order.ts` reconstructs the outer `00495520` command-6 controller.
`00436be0` is newly exported and hash-registered. Its circular empty-slot search
and `00436b90` eligibility are shared with existing group append/commit code in
`person-orders.ts`; existing command encoders and reference ownership are reused.

Executable findings that constrain the live migration:

- A class-2 building resolves its signed plan ID at **+0x82**, rewriting the shared
  order target. The worker registers against the distinct class-9 plan, not the
  building. The plan's constructed-building link is **+0x92**. Ghidra's inferred
  union field names do not establish either offset; both were checked in x86.
- The initializer clears command phase and work target, registers same-tribe
  workers using descriptor capacities, and sets the resting anchor from the plan.
  Duplicate registration succeeds without adding a second worker slot.
- A full crew or missing building plan attempts to allocate a movement command
  to the *original* target's outside point. It uses the first empty circular
  person slot. A full person queue does **not** use its immediate-command slot.
  Allocation precedes the slot search, so a full person queue can still advance
  the allocator and clear an unreferenced record. Pool exhaustion preserves the
  existing queue. Neither path erases the follower's later orders.
- Missing/deleted work targets finish this command; advancement/release belongs
  to the common order dispatcher. Each task transition clears assignment bit 8,
  marks the plan dirty, writes the new task, and sets the task-entry bit. Entry
  clears the original structure collision bits. Tasks 5/6 return to task 2.
- Unsupported task values reach indeterminate native stack data. The TS port
  throws instead of imitating that undefined-memory path. Valid cursors are 0–7;
  initial targets are allocated plans/buildings. Deleted work targets are tested
  on subsequent visits, without claiming stale-object memory reuse parity.

Run:

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-construction-order.py /private/tmp/populous-reference/native/d3dpoptb.exe --record
node --test tests/construction-order.test.mjs
/private/tmp/populous-reference/tools/bin/python scripts/check-native-orders.py /private/tmp/populous-reference/native/d3dpoptb.exe
```

The first check compares **4,096** executable visits across eight ordinary
building descriptors/four orientations, partial/full/existing crews, foreign
ownership, eligible/ineligible/ghost-only followers, linked/missing plans,
removed work targets, queued route normalization, full/wrapped pools and all
valid task branches. Native eligibility, crew registration, allocation, slot
search, attachment, reference counts, anchor geometry and task-1 approach,
arrival, speed/RNG and failed timber allocation execute. Native tasks 2–9 are
supplied return/state consumers; route submission, final animation/audio and log
allocation are intercepted. Complete order-pool hashes, person fields, crew slots,
plan signals, RNG and ordered callbacks match. Portable samples use stride 17,
which preserves both successful allocation and exhaustion cases (stride 13 would
accidentally select only the generator's exhausted pools). The test asserts its
branch coverage as well as comparing captured values.

The shared-helper refactor also retains **4,000** original order comparisons,
**384** player packet/cursor cases and **576** native input bindings. Fallow stays
at **85.4**, with **20** existing import cycles. This change introduces no new
renderer, simulation clock, queue replay or dependency; no performance improvement
or live construction parity is claimed. The reviewed wrapper is not yet installed
in the live construction adapter. Separate plan allocation/lifetime, task-7
hauling and persistent native person/path ownership must be composed first.

Validation of this checkpoint: **366** portable tests, TypeScript and production
build pass; export verification checks **1,146** identities. The new TS module
has no ox-standard diagnostics; the shared file retains exactly its 12 existing
diagnostics. The real browser's desktop/ultrawide queued-dismantling regression
also passes after the shared-helper refactor, retaining work sprites, queue
identity, timber and cleanup. Its rerun is saved in
`references/performance/2026-09-11-construction-order-queue-regression.json`;
SwiftShader timing is not a hardware FPS claim or a construction integration
check. No new playable construction behavior is published by this checkpoint.

## 2026-09-11 — original construction hauling controller

`app/building-fetch.ts` reconstructs task 7, `00496750`, with named phases and the
existing entrance, facing, animation, wait and distance helpers. Its resource
approach `004392a0`, timed recovery `004394e0` and occupied-entrance clearance
`00439740` are composed with the task body. `reserveTimber` in `app/timber.ts`
reconstructs `004a8e20`. The latter starts a reservation when the worker begins
approaching the resource; it is not an arrival acknowledgement. Five new exports
are identity-registered: `004394e0`, `00439740`, `00493910`, `00493f10`, `004a8e20`.

Run:

```
/private/tmp/populous-reference/tools/bin/python scripts/check-native-building-fetch.py /private/tmp/populous-reference/native/d3dpoptb.exe --record
node --test tests/building-fetch.test.mjs
```

**9,216** executable visits compare every defined phase plus default branches,
six ordinary building descriptors/four orientations, class-9 plans and class-2
sites, existing/absent constructed buildings, removed targets, failed routes,
full/partial cargo, signed timer boundaries, reservation saturation/byte wrap,
and different person models/physics/turn phases. The real native entrance geometry,
approaches, waits, distance/angle/RNG, resource reservation and capacity-limited
`004a7860` transfer run. The test observes ordered route/pose/cue/search/transfer
calls and compares person fields, worker phase, site flags/search index/work,
resource wood/reservations and final RNG.

Boundaries: `004935c0` search refresh, `00493910` search results and `00493f10`
cell lookup are supplied consumers. Route submission and final animation/audio
are intercepted. Native transfer runs, but its scenery resize/depletion and plan
work callbacks (`004a79f0`, `004ba2c0`) only apply the supplied amount in this
comparison; their complete world effects are not certified here. Ordinary class-2
sites in the captures have no vehicle-production capacity. Full dock/vehicle
transfer and dynamic world allocation remain open. Portable capture selection
retains uniform samples plus distinct phase/event outcomes, and the test asserts
that search, retry, reservation, delivery and both facing draws remain covered.

Details recovered through executable mismatches:

- Hauling calls **`004391a0`**, the wait that also draws a new facing on the
  32-turn boundary. It does not use non-turning `00439240`. An unavailable-resource
  retry on that boundary can therefore perform two separate facing/RNG draws.
- The return-to-entrance square test is **`00432da0`**, which compares signed
  coordinates directly. It is distinct from the wrapped `004e7a10` overlap test.
  Existing `nearBuildingPoint` is reused; the native difference across the signed
  32768 boundary is included in comparisons.
- Starting a failed resource route changes phase to retry, but the same visit
  still decrements its timeout and calls approach again. That second result can
  change the phase to harvest or lost-target return. An early-return shortcut
  would diverge from the original.
- Reservation resets the resource timer to 64, increments its byte count, and
  marks it reserved at `max(1, trunc(signedWood / 100))` shares. Already-reserved
  objects remain unchanged; the native byte wrap is retained. Timer expiry and
  reservation-aware resource selection belong to scenery/search ownership.
- Delivery initializes an eight-turn wait and returns task 2 on completion.
  The outer command wrapper owns task-entry/dirty-plan signaling and eventual
  order advancement; hauling does not discard the queued tail.

The next integration dependency is the original **120-entry, 24-byte shared
resource-search cache** at `0093a7a0`, not the unrelated sixteen-slot indexed-search
pool already used for footprint traversal. `004935c0` reuses the same entrance
cell's cache, updates the requesting person/tribe, and preserves its allocation
and pending-work counters. `00493910` distinguishes pending, absent and exhausted
searches and traverses cached candidates in native order. `00493f10` selects the
first scenery entry with descriptor flag 4 in the entrance's native cell list,
subject to the original player/fog gate; it does not sort by distance. The live
nearest-tree sort remains approximate. Do not wire no-op cache consumers into
the recovered task and call construction ownership complete.

This checkpoint introduces no renderer/clock/dependency change and claims no
performance gain. The fetch controller is not yet wired into live construction;
separate plan identity/lifetime, resource cache scheduling and persistent native
person/path ownership remain necessary before publishing that behavior.

Validation: **367** portable tests, TypeScript, production build and parity report
consistency pass. Both touched TS files have no ox-standard diagnostics and pass
format checking. Fallow remains **85.4** with **20** existing import cycles;
export verification checks **1,151** registered exports and original tables.
The recovered code is exercised by native comparisons and portable captures;
no live browser integration or new published gameplay is claimed by this commit.
