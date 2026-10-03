# Mission 2 construction base and rebuilding

## Native owner and actual inputs

The original construction producer is `004e5580`; its constructor consumer is
`004c6da0`. Mission 2 was explicitly absent from the live producer's mission list.
Simply enabling that list entry would still confuse the authored outpost Tower
with a base established by AI construction.

Native `00461d70` clears tribe byte `+0x5b4`. `004f6020` returns the Shaman cell at
`+0x5a2` until this byte is set, then returns the retained base cell at `+0x36a`.
The construction consumer's phase 3 establishes that base from an accepted,
ordinary Tower plan's exterior point (`004b9fc0`), masking both coarse coordinates
even. Existing base and exact-placement requests do not rewrite it. A level-placed
outpost is not itself this construction task/phase transition.

Mission 2's native startup profile has construction state enabled, one concurrent
construction task and housing-capacity target 3. Its actual header selects
CPATR074 for Matak; its building masks are `0x2109e,0,0`, permitting huts/towers.
The first ordinary producer opportunity is native turn 60 for tribe 3. Without an
established base it requests a Tower even though the authored outpost exists.
Its origin is the initial Shaman cell `0x8062`; Tower phase 0 applies the authored
coordinate latch `0x8232` to the site search. This distinction is preserved.

After a base is established, surviving Towers and housing capacity suppress new
requests. With no Tower, native requests model 4. With a surviving Tower but no
housing capacity, it requests model 1. One completed model-1 Hut already meets
target 3. Construction needs two idle available people; training's additional
housing-order count does not satisfy this construction predicate. State, task
limit and Tower-mode disable gates remain active.

## Executable evidence

Run `python scripts/check-native-mission2-rebuilding.py /path/to/d3dpoptb.exe`.
The executable must hash to
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
The probe also verifies Mission 2 header and CPATR074 identity. Nine controlled
producer cases execute real initializer, producer, building-availability and
person-availability readers, base lookup and task writer without intercepted
leaves. They cover initial base, losses, capacity threshold, insufficient people,
Tower-mode disable and occupied construction slot. These cases consume no RNG.

The phase-0 search-entry probe intercepts only `004f7aa0` and verifies authored
latch, original request origin and one orientation RNG draw. It does not prove
native site selection. Twelve phase-3 cases execute original consumer and actual
plan geometry for four rotations, existing-base preservation and exact placement;
there are no intercepted leaves in these cases and no RNG draws.

`decomp/generated/004c6da0.c` was exported by Ghidra 12.1.3 from the verified PE,
using the existing isolated project without community metadata. The export wrapper
verified all file-backed section bytes and successful export/save completion.
Its SHA256 is registered in `decomp/exports.json`. Pseudocode is explanatory
output, not recovered source.

## Browser-model implementation and natural checks

Only Mission 2 gains the producer path. Optional `ComputerQueue.constructionBase`
represents the native established-base flag plus cell. It is absent initially,
is written in the added ordinary Tower phase 3, survives Tower destruction and
is retained by checkpoints. Old checkpoints lacking it retain an unestablished
construction base. Other mission producer paths are unchanged.

The existing script defence position is not reused as this base. The remaining
non-construction AI base/radius consumers are not upgraded or certified here.
The existing live placement, worker selection, movement, timber and construction
consumers build the plan; no object completion is injected.

`tests/mission2-rebuilding.test.mjs` separately identifies controlled gate fixtures
and natural acceptance. Ordinary Mission 2 creates and completes its home Tower,
with a phase-3 checkpoint replay preserving tasks, base and numeric RNG state.
In the destruction scenario the player builds three Huts and a school, grows its
population and trains twenty Warriors, then attacks both Towers with real combat
and withdraws. Matak creates and completes a replacement while its first base cell
is unchanged. No entities, damage, population or outcomes are injected in these
natural scenarios.

Rendered branch verification, native terrain/site-search equivalence, every AI
base/radius consumer and complete missions 1–3 parity remain separate. A completed
browser-model rebuild does not establish a full original-game timing match.
