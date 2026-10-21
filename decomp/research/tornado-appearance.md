# Tornado column appearance

Base655e5d6. Original EXE SHA2563a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f. This work reads original code as data/disassembly only, never executes it. Retained raw instructions are under tornado-appearance/. Independent original PSFB runs, decoded frame hashes, palette lookup, input hashes and descriptor bytes are in tests/fixtures/tornado-original.json.

0050f270 allocates16 effect41 children. 00509c10 case0x28 initializes state11/draw34/HFX1136, palette4, scaleY256. Each child then receives width scale trunc(512/(ordinal+1)) and fixed object1136+((global counter−ordinal)&15). Draw34 has hold0/step0: these16 resources are fixed birth variants, not a cycling sequence. At80×50 source dimensions native widths are160,80,53,40,31,26,22,20,17,15,14,13,12,11,10,10, all height50 before view scaling. 0046f9e0 queues primitive18, depth bias−128; 0046ae97 scales width/height before view scaling, then integer-half-width/bottom anchors. No arbitrary opacity fade.

Initial children start at the incoming controller height+1440, decrement90 and cumulative RNG jitter; common effect initialization clamps child height to terrain. Subsequent controller visits start at terrain+1440 (active), or terrain+(remaining−8)*90 (dying), with no re-grounding. The repair changes only initial child presentation heights, never parent fields, capture/damage/steering/audio or RNG. The native sprite queue uses current child coordinates; this patch adds no interpolation.

0050f608 and0050fb75 propagate NEXT child's old palette upward on each logical visit. Last child uses water5; otherwise cliff>212:-1, >200:3, >127:-2, else4. 0046af64 selects signed AL offsets;00516270 maps AL[palette*4096+0x2f82] through PAL. The importer preserves nibble-alpha HFX pixels and separately exports the five exact RGB tints. Sprite material tint is separate from texture alpha. Palette colors retain current compatibility-c environment scope, not all original landscape palettes.

Active remaining0 resets24 and enters dying. Each subsequent dying visit positions/recolors then removes the head. Child identity/frame/width is retained, never recalculated from shrinking array index. State11's +0x6c=1 is not a lifespan:0050a750 case10 does not decrement it. Parent deletion owns child lifetime.

The live birth-phase adapter uses persisted world.secondaryEffects.animationFrame (the existing24Hz global presentation clock), not12Hz world.turn or wall/render-frame counts. Mapping historical global presentation cadence onto the modern clock is a compatibility boundary. No shared clock or gameplay scheduler was rewritten. Current active-Tornado saves require new child presentation fields; missing fields are rejected through existing incompatible-checkpoint handling. No older-save fallback or migration is added.

## Isolated assets and scope

scripts/import-tornado.py verifies original HFX/PAL/AL and writes only app/original-tornado.json/public/original/tornado.png. Its --check path is read-only. No shared importer or effects atlas changed. Pure appearance helpers and scene-tornado.ts own the new branch; each child has a separate anchor for correct cell/depth/painter metadata.

Native ground child43/HFX1152–1159 remains absent and OUTSIDE this column-only repair. No unused dust assets are imported. Full Tornado presentation parity is not claimed. Full class7 mixed-allocation scheduling and native pool exhaustion also remain existing boundaries.

## Validation so far

- Scoped importer --check passed.
- Independently decoded retained PSFB runs reconstruct every shipped atlas pixel, with fixed original SHA256 expectations. Test decoder does not call importer or production decoder.
- Fixed variants, exact width-only scaling, palette thresholds and propagation, deletion identities, active save/load/restart and incompatible old-field rejection pass focused tests.
- Existing Tornado initialization/controller, building/wood, throw and refresh-rate tests pass. Original positional expectations remain unchanged, now selecting position fields explicitly alongside separate new metadata assertions.
- Read-only base comparison against655e5d6 tornado.ts:12(seed,elevation)cases,2688 logical visits. All parent/controller fields, RNG, building/scenery/audio callback events and post-first-visit child positions/lifetimes match. Initial child heights are the intentional presentation-only exception; initial parent fields and RNG still match.
- TypeScript/full checks/build/browser NOT YET RUN pending coordinator lanes. No rendered fidelity or hardware performance claim.

Next acceptance: actual Scene GPU resource/UV/width/palette verification through HUD-cast route, source-bound before/after screenshots, phase/tail/save/overlap/water/slope/seam coverage and30/60/120/144Hz irregular schedules. Never treat existing smoke>20pixels browser assertion as original appearance proof.

Follow-on lightweight checks: six new appearance tests now include real cast/projectile arrival with24Hz presentation across30/60/120/144Hz and irregular schedules, fixed variants during pause/repeated time updates, plus existing fourteen Tornado controller/building/throw tests (20 total). Changed TS formatting passes. New helper/scene files pass targeted oxlint. Broad changed-file oxlint remains failed on pre-existing style violations in shared files; it is not represented as a clean lint gate. Orchestration structural check passes. Real browser/compiler/full build remain coordinator-owned pending lanes.
