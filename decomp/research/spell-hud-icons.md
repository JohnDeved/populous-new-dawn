# Spell and build-menu HUD artwork: bounded mapping audit

**18 September 2026; inspected source `ac0e9852f8d1bf2d25457d68cdb26bb23ed5896e`**
(the research-only descendant of main `bb5980c`). Issues76/77 cover icons;
issue78 covers visibility/discovery. The tables below preserve that audit baseline. The six-frame implementation
section describes the narrow repair added afterward; building and visibility
findings remain separate and unresolved. No native control-state execution is claimed.
The ongoing default149 work and its unresolved timing producer remain separate.

## Spell descriptor identity and source pixels

The existing [spell-button evidence](../README.md#spell-panel-artwork-and-charging--2026-09-09)
identifies62-byte spell descriptors at `005a80d0 + model*62`, with ready, inactive
and hover HFX indices at offsets16/18/20. A new static check of the canonical EXE
confirms **all20 shipped spell triples** against current `original-rules.json`.
It independently decodes the referenced HFX sprites and compares the54present
sprite crops to `public/original/hud.png`; all54match the original RGBA bytes.

| Spell | Native model | Ready / inactive / hover HFX | Current artwork |
|---|---:|---|---|
| Blast | 2 | 355 / 373 / 391 | All three original crops match. |
| Convert Wild | 17 | 370 / 388 / 406 | Match. |
| Hypnotise | 7 | 360 / 378 / 396 | Match. |
| Ghost Army | 9 | 362 / 380 / 398 | Match. |
| Land Bridge | 12 | 365 / 383 / 401 | Match. |
| Lightning | 3 | 356 / 374 / 392 | Match. |
| Flatten | 15 | 368 / 386 / 404 | Match. |
| Erosion | 10 | 363 / 381 / 399 | Match. |
| Swamp | 11 | 364 / 382 / 400 | Match. |
| Firestorm | 8 | 361 / 379 / 397 | Match. |
| Earthquake | 14 | 367 / 385 / 403 | Match. |
| Angel of Death | 13 | 366 / 384 / 402 | Match. |
| Volcano | 16 | 369 / 387 / 405 | Match. |
| Tornado | 4 | 357 / 375 / 393 | Match. |
| Magical Shield | 19 | 408 / 409 / 410 | **Missing; Unicode circle substitute.** |
| Invisibility | 6 | 359 / 377 / 395 | Match. |
| Armageddon | 18 | 354 / 372 / 390 | Match. |
| Bloodlust | 20 | 411 / 412 / 413 | **Missing; Unicode star substitute.** |
| Teleport | 21 | 371 / 389 / 407 | Match. |
| Swarm | 5 | 358 / 376 / 394 | Match. |

The demonstrated Bloodlust defect is not a confused world-effect sprite. Its
original descriptor is correct, but [HudSprite](../../app/hud.tsx) explicitly
renders a text `✷` when frames411–413 are absent; the same fallback renders `◌`
for408–410. None of those six frames exists in the shipped HUD atlas metadata.
At that audit checkpoint the original sprites were decoded to ignored previews
only. The following implementation installs those exact six resources, not
replacement artwork. The broad importer was not run.

Current [spellButton](../../app/spell-button.ts) chooses ready for charging or
nonzero stock, inactive otherwise, and hover overrides that choice. Selection
changes the border, not a fourth spell-icon frame. The retained normal-state
comparison records permanent borders821/830/839 and reward borders510/519/528;
stock54/gift65 and empty markers55/68 or66/67 are separate sprites. Charge tracks,
fill layers, world VFX, spell cursors and reward markers must not be substituted
for the main HUD icon.

**Coverage limit:** the historical763-call comparator supplies enabled/populated
control slots and covers seven spell models, not every newly supported spell or
locked/discovery state. The present20-triple/54-crop check extends identity/pixel
coverage, not native interaction or final browser raster equivalence. Inactive
artwork is not necessarily the original undiscovered/question-mark state.

## Building mapping is a distinct, partially resolved table

The current page renders only three generic IDs for eight build entries and
changes no icon identity for hover/selection/lock. All three crops contain genuine
original pixels; that alone does not prove that each building uses the right one.

Static data references to retained renderer `0049d690` identify66-byte records
beginning at `005cc471`, with a renderer pointer at+16. The raw values at+12 and
+30 are useful candidate icon/model associations, as shown below. **The transfer
from these packed records to runtime control fields is not yet verified**, so
these are labelled candidates rather than accepted building-to-frame mappings.

| Shipped entry | Current frame | Candidate packed row | Frame / model words at+12/+30 |
|---|---:|---|---|
| Hut | 1028 | `005cc471` | 1028 / 1 |
| Guard Tower | 1029 | `005cc4b3` | 1029 / 4 |
| Temple | 1029 | `005cc4f5` | 1030 / 7 |
| Spy Training Hut | 1030 | `005cc537` | 1032 / 5 |
| Warrior Training Hut | 1030 | `005cc579` | 1033 / 6 |
| Firewarrior Training Hut | 1030 | `005cc5bb` | 1031 / 8 |
| Boat House | 1030 | `005cc5fd` | 1034 / 13 |
| Balloon Hut | 1030 | `005cc63f` | 1035 / 15 |

The [retained renderer](../generated/0049d690.c) consumes runtime control+`0x4f`
as a base HFX index. In its ordinary branch, disabled uses base+9 and hover/focus
uses base+18. Border selection is separate. Additional control-type branches draw
other markers; their presence is not proof of a spell question-mark association.
The current build-menu page instead uses only1028/1029/1030, with CSS active and
disabled states. Exact per-building normal/hover/disabled mappings require the
packed-row→runtime control producer and handler chain, including the callbacks
near `0049d9b0`, `0049da00`, `0049da20` and `0049da40`.

A bounded read of those callbacks was safety-status rejected before execution;
it was not retried via another tool or native run. No building-icon change is
justified solely by equal-looking artwork, category-tab IDs, world model numbers
or the candidate table. The current grouping and missing variant policy are
concrete implementation gaps; final association and rendered acceptance remain
open.

## Mission1: fresh visibility, discovery and casting are not interchangeable

A read-only current-world check reproduces the named late spells without any old
checkpoint. Original `levels/levl2001.hdr` has word0 **`0xfff40007`**. The imported
56-byte header prefix matches those supplied original bytes exactly. Intersecting
that mask with supported spells yields current player mask **`0x00340004`**.

`campaignSpellModels(1)` yields models1,2,3,12,18,20,21, combining header bits with
campaign reward links. The actual page roster is Blast, Land Bridge, Lightning,
Armageddon, Bloodlust and Teleport. The three late spells start with zero shots
and zero gifts but are classified permanent by the current header-bit adapter.
Cloning/restoring that world and constructing a fresh Mission1 after Mission16
produce the same observed roster. **Stale later-mission state is not required**
for the defect; this is not a claim that every restart/browser-load path was run.

The current policy lives in [mission-data.ts](../../app/mission-data.ts),
[world-state.ts](../../app/world-state.ts) and the page's `spellRoster` filter.
The filter is mission-membership OR nonzero stock; buttons toggle the target mode
without a native undiscovered/locked state machine. Selection is therefore not
proof of casting permission. The original header bits do not by themselves prove
that mode2 spells should be displayed with an icon before obtaining stock.

The user's reported **obtainable-but-undiscovered question mark** must remain a
separate state from unavailable/hidden, visible-disabled, ready, charging and
selected. The native discovery/slot producer, exact placeholder frame/bank,
hover/click semantics and acquisition transition are unresolved in this bounded
audit. The historical spell-button harness supplies control-slot state rather
than proving those producers. A new read of the complete original button path
was blocked, and no output from that rejected operation is credited.

Do not fix this by hiding all locked spells, globally removing the three late
spells, changing original headers, or treating a zero-stock inactive icon as the
question-mark state. A future repair needs the native slot/discovery conditions
and mode2 stock policy, followed by fresh/restart/checkpoint/later-mission tests
without changing legitimate grants, mana or RNG.

## Six-frame implementation, without repacking existing assets

The dedicated [append importer](../../scripts/import-spell-hud-icons.py) now adds
only408–413 below the old atlas. Its width remains1024; height grows410→436. Every
old RGBA pixel, including transparent and unreferenced pixels, is preserved exactly.
All1737old rectangles and every prior metadata value are unchanged except height;
six new28×25rectangles occupy y411. No border, font, pointer, panel, category or
world asset is regenerated. The Unicode fallback alone is removed from HudSprite.

The source/output drift is intentional evidence: the old broad importer already
lists408–410, while its shipped atlas lacks them. Running it could repack or change
unrelated outputs. This narrow path treats the existing atlas as authoritative,
pins canonical HFX/palette hashes, and either appends all six frames or verifies an
already-complete installation without writing. Partial imports and differing
installed sprites are rejected. No shared provenance field is changed.

The [focused checker](../../scripts/check-spell-hud-icons.py) compares against an
explicit Git base, checks every old crop and the entire old image, compares all
six source RGBA blocks, reproduces the output in an isolated project, tests byte-
idempotence/check-only behavior, and rejects same-length corrupted originals,
partial state and an altered installed sprite. The focused tests exercise original
frame selection and authored Mission16 availability without injecting stock/unlocks.

A dedicated [browser check](../../scripts/check-browser-spell-hud-icons.mjs) uses
the real Mission16 startup and cards, actual left/right clicks and hover, and
served-image crop hashes. It freezes simulation, not spell availability. Ready,
selected, inactive charge-paused and hover artwork are observed through current
shipped controls; this is not a claim about the unresolved native locked/question-
mark policy. Exact run results, screenshots and commit bindings belong in the PR
receipts; existence of the check alone is not a passing browser claim.

`python3 -B scripts/import-spell-hud-icons.py GAME_ROOT --check` validates an
installed atlas; omit`--check` to apply the six-frame append.
`python3 -B scripts/check-spell-hud-icons.py GAME_ROOT --base BASE --report NEW_JSON`
reproduces the preservation checks. Broader issue76 artwork/behavior audit and
issues77/78 remain open; this slice fixes only the demonstrated six missing frames.

## Minimal next reservations and evidence limits

For issue76, the implemented output delta is exactly `app/original-hud.json` and
`public/original/hud.png` for HFX408–413, with the fallback removal described above.
Broader selected/locked/discovery semantics remain outside this six-frame repair.
Existing spell descriptor associations require no guessed replacements.

For issue77, resolve the packed building-control producer first, then reserve
only the verified per-entry/variant policy and any specifically missing frames.
For issue78, resolve discovery/visibility versus stock/casting first, with a
separate policy reservation. Do not use an icon-only patch to change unlock rules.
Page/CSS, availability, building mappings and shared provenance remain unchanged;
only the explicitly reserved six-frame HUD data/consumer was modified.

Canonical D3D EXE SHA-256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
HFX0-0 SHA-256:
`681eb1734fd73f86a6a52a8540415ec69a241a378161b60e9c9da1263d4ee0bf`.
Palette0-c SHA-256:
`6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53`.
Mission1 HDR SHA-256:
`4b89ef6d64e4010bb3ec3b5985d0edc8e710504e8b1bc75a6ae688bd6eb070a6`.

The proof is static descriptors/source-pixel comparison plus current pure-world
observations. No target native execution, browser/OS input, fullcheck/build,
shared asset edit or gameplay repair ran. The first HDR check incorrectly compared
the full616-byte file to its56-byte imported prefix; the corrected check records
both sizes and compares the exact prefix and word, without changing source data.
A missing obsolete `import-rules.py` path and blocked handler reads are retained
as limitations, not used to justify broad discovery or retries. The default149
research commit and unresolved original cadence boundary are preserved.
