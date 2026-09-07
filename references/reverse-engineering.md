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
