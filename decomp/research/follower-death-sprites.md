# Follower corpse source identity and animation

## Concrete defect

Accepted application source at `66988092448c00c8471bb61302f082045ef6f975`
used `304`, `312` and `320` as packed `original-units.frames` indices for
the three ordinary corpse poses. Those values are native VSTART source IDs,
not packed atlas indices. In that accepted asset:

| Incorrect packed index | Actual VFRA frame | Existing animation using it |
| --- | --- | --- |
| 304 | 709 | Brave prayer, direction 4, frame 1 |
| 312 | 173 | Brave carrying, direction 0, frame 3 |
| 320 | 181 | Brave carrying, direction 2, frame 3 |

The renderer also constructed identical single-frame entries for all eight
directions, losing native heading/mirroring and all body/transition animation.
This affects Brave, Warrior, Preacher, Spy and Firewarrior corpse presentation,
not merely one mislabeled unit.

## Reused native evidence

`scripts/check-native-reincarnation.py` retains the model-12 controller comparison:
`005029d0` selects `304/312/320/320` for processed phases `0/1/2/3`, using
draw descriptors `14/15/16` for models `2/3/4`. This is prior bounded native
evidence with supplied allocation, sound, terrain and deletion leaves, not a
fresh native execution or full gameplay replay.

The original person table at `005a6d50` maps phase rows `19`, `18`, `20`:

| Model | Phase 0 | Phase 1 | Phase 2 / rise | Draw |
| --- | --- | --- | --- | --- |
| 1, Wildman | 8 | 8 | 248 | 13 |
| 2, Brave | 304 | 312 | 320 | 14 |
| 3, Warrior | 304 | 312 | 320 | 15 |
| 4, Preacher | 304 | 312 | 320 | 16 |
| 5, Spy | 304 | 312 | 320 | 17 |
| 6, Firewarrior | 304 | 312 | 320 | 18 |
| 7, Shaman | 680 | 352 | 360 | 14 |

The retained `shaman-death-support/phase2.asm` independently shows the
model-indexed read from `005a6eb8` (row 20), the animation-object table lookup,
the real object setter, and explicit frame-counter zeroing. The retained
`initializer.asm` copies the source person's model and heading, takes Wildman
model 1 directly to phase 3, and otherwise chooses phase 0 or 3 using
`004eeff0` on the linked source person.

The new [bounded controller excerpt](follower-death-support/controller.asm) and
[provenance](follower-death-support/provenance.json) read the restored canonical
PE as data only. They directly confirm row 19 at `00502a0f`, row 18 at
`00502a9d`, row 20 at `00502b0a`, and the Wildman rise exception below.
The manifest binds the executable, exact byte range, normalized disassembly,
tool and command, and includes the independently read original table records.

Follower sources `304/312/320` contain `8/1/5` frames. Wild source `248`
contains four frames. The restored canonical EXE's `00502bfe..00502c24`
explicitly skips freezing/final-frame assignment when row 20 selects object 108,
the Wildman source 248. `00502cba..00502cd1` additionally rotates a Wildman's
heading by 91 native angle units on each processed rise visit. Its rising
animation therefore keeps looping, unlike the trained followers.
Shaman source, ownership, scaling and tribe offsets remain
with `shaman-appearance.ts`; shared spirits `352/360` must not receive a tribe
offset. The phase-3 hold is the last frame of the selected source, not one
universal packed frame or the Shaman's frame 9.

`004ee7b0` advances descriptor-mode-2 animations on eligible presentation visits.
Descriptor 18 has step 1, while descriptors 13–17 have step 0. Thus Firewarrior
corpse animation has its own authored cadence despite sharing the same source
chains. As in the existing Shaman effect, the native draw-before-advance boundary
requires a displayed-frame latch. The app's existing 24 Hz presentation adapter
is retained; it is not evidence of an unconditional native wall-clock frame rate.

## Bounded repair

The importer adds one `followerSources` catalog from nonempty model 1–6 person
table entries plus independently evidenced direct object IDs:

- `2/3/4`: `004d3ea0` and `004d6e40`, wild-person poses.
- `95/97/98/99`: `0043a4d0`, Preacher sermon poses.
- `161/162/163`: `004d73e0`, Brave/Warrior/Firewarrior resting gestures.

Catalog coverage does not claim that an absent live controller is implemented.
Rows 14 and 24 additionally expose original source 136 and 408 for their existing
native callers; their live renderer correction is a separate integration.

The bounded importer verifies original input hashes, every established
VFRA/VELE layer, piece dimension and decoded RGBA rectangle before writing.
Existing frame/piece indices, animation aliases and rectangles are retained.
New pieces occupy disjoint, verified-empty 32-pixel subslots within the existing
2048×8192 atlas, with explicit atlas coordinates. The catalog retains each
direction's VSTART source, packed frame sequence and mirror flag; each packed
frame retains its original VFRA ID.

`follower-corpse-animation.ts` selects the native row and descriptor at phase
entry, resets the frame counter, latches on the existing presentation visitor,
freezes the last rise frame, and preserves hidden-wait behavior. The actual
death-effect producer and world phase consumer call this helper. The renderer
only consumes state and no longer advances or mutates directions.

Wild land deaths enter the evidenced immediate-rise phase and retain its rotating,
unfrozen pose. All other existing
death eligibility, simulation phase durations, kill credit, spawning, outcomes,
RNG ownership and Shaman presentation stay unchanged.

## Explicit remaining boundary: drowning

Original `004d2740` state 2 selects person row 26, requests splash model 65,
and enters a distinct drowning/recovery controller. `004d5b60` processes that
controller and can transition to ordinary death state 3; `004d5cf0` then creates
model 12, whose initializer starts a drowning corpse at phase 3.

The browser currently kills an unsupported follower immediately and emits only
a splash. Source 416 is shared by drowning row 26 and panic row 25; its old
`drown` alias alone does not establish either controller's timing. Completing
that absent path requires its actual movement/timer/death handoff, not assigning
a guessed source to the current short splash. This repair does not claim
drowning-controller parity, non-reincarnating Shaman parity, or full unit-sprite
parity.

## Regression and verification scope

`tests/follower-corpse-animation.test.mjs` covers source identity, model-specific
draw descriptors, all four player tribes and eight directions, Wildman identity,
the existing presentation visitor and descriptor-specific cadence, pause,
current checkpoint continuation, and a normal Mission 2 Brave attack leading to
corpse phases. Direct effect/health fixtures are labeled separately from that
ordinary combat episode.

The compact `tests/fixtures/follower-corpse-native.json` fixture freezes an
independently decoded original VSTART-to-VFRA sequence and mirror bit for every
direction of sources 248, 304, 312 and 320, plus raw EXE descriptor records
13–18. Its provenance binds the original input hashes and independent readers.
Cadence expectations use those original descriptor bytes, not current rules
as their own oracle. Historical asset-prefix assertions remain unchanged and
add hashes of the complete accepted 5256-frame / 4170-piece prefixes.

Raw table/frame/pixel verification, rendered acceptance, focused tests and
standard gates must be reported from their actual executions. Source authoring
and reused evidence alone are not passing validation or additional parity credit.
