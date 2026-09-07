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
