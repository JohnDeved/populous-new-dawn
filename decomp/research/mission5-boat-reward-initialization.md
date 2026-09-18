# Mission 5 linked Boat reward initialization

Bounded retained-source proof for #102 blocking #96. This note does not authorize production edits.

## Provenance

- Verified executable: `d3dpoptb.exe`, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Verified Mission 5 level: `levl2005.dat`, SHA-256 `fce3c6555933d9e6d04490739a90f0cd188bc561a977c0c28e04aa265955f90b`.
- Mission 5 linked vehicle source is object index 100, class 4/model 1/Blue. Raw bytes begin `01 04 00 54 e4 a5 2f ...`.
- Current `scripts/import-level.py` decodes object coordinates as signed little-endian native fixed point. Raw object 100 is native `(-7084,12197)`, browser `(-35.671875,-55.64453125)`.
- Checked-in `app/level-five.ts` still carries the older class-4 reinterpretation `(76.890625,82.81640625)` / native `(21732,-23249)`. This is a separate generated/import prerequisite owned outside Worker6. Regenerating coordinates alone does not solve readiness: the genuine raw point is also open-water category 1 in the current reconstructed terrain.

## Original allocation / initialization chain

Level loading allocates each object with `004ed8a0` and then runs `00485b00` post-processing. Raw disassembly of `004ed8a0` shows that normal allocation calls `004ed580`; its class-4 dispatch calls `004631b0`, which for model 1 calls `00463ba0`.

The reward controller `004fb270` follows the linked source:
1. read the live linked source from `unit_land_array`;
2. call `004ed8a0(source.class, source.model, owner, &source.pos)`;
3. call `004ede10(new, source)`;
4. call `004ed700(new)`;
5. later delete the source and completed head.

Static disassembly of `004ede10` shows that the broad template copy preserves the allocated destination's position, state, unit index/list links and selected flag fields. Therefore the rewarded clone keeps the position produced by its own allocation/vehicle initialization, starting from the linked source's current live position.

## First missing vehicle initializer operation

Raw `00463ba0` is not only a lifetime initializer. Before height, heading, presentation and life fields, it calls:

`00464ae0(vehicle, &vehicle.pos, &vehicle.pos, 0)`

Static disassembly of `00464ae0` shows:
- it first calls native `00464f90` (the recovered Boat disembark predicate) on the current point;
- if invalid, it opens native indexed search (`0049a2f0` / `0049a3f0`);
- it constructs centered candidate cells and tests each with `00464f90`;
- for the non-airborne Boat and the null optional-person argument used by `00463ba0`, the first valid candidate is accepted without a player/AI path prerequisite;
- the accepted candidate is written back to the supplied output position.

Only after that shore correction does `00463ba0` register terrain/list state, compute terrain height, derive heading from the resulting terrain category, set runtime navigation/presentation fields, and copy descriptor life.

This means a template point being open water is legitimate before initialization. It is not evidence that a player must first move something. The initializer itself owns the Boat's shore-ready starting position.

## Existing probe boundary

`scripts/check-native-mission22-gifts.py` already invokes native `00463ba0` for exact authored vehicles and proves descriptor life 5000, but it deliberately supplies `00464ae0`, `004ee470`, and `0044e940`. Its retained result therefore does **not** prove the exact shore position, height, or heading output. It cannot be cited as shore-output proof.

The randomized `scripts/check-native-vehicle-routing.py` proves browser/native parity for `00464f90` (disembark), `004650d0` (approach), `00465650` (ready), boarding and landing primitives, but it does not implement/compare `00464ae0`.

## Browser divergence

Current browser creation in `app/world-initialization.ts` precreates the linked Boat at imported coordinates with no equivalent of `00463ba0 -> 00464ae0`. Reward completion in `app/world-turn.ts` only flips `boat.active = true`.

Focused FIFO `7184f37a-8e7c-498e-b444-c83359db4da9` then observed the naturally rewarded Boat active in open water with `vehicleReady=false`; exact rendered selection/pick was correct, and direct exit-target, Boat-position and ordinary ferry-goal route probes all failed.

## Smallest supported repair reservation

There are two separable prerequisites; neither should be replaced by arbitrary nearest-land relocation:

1. **Static/import owner**: regenerate Mission 5 class-4 object coordinates from the already-correct signed-little-endian importer so object 100 starts from its verified raw native coordinate. Worker6 does not own importer/generated level output.
2. **Vehicle initialization owner**: recover/implement the exact `00464ae0` shore-position initializer semantics using existing vehicle-disembark/indexed-search primitives, and apply the class-4 initialization path to the linked inactive vehicle representation (or equivalently at reward activation from the genuine source position). The faithful final state also needs the downstream `00463ba0` height/heading/runtime initialization fields reviewed, not merely `active=true`.

The runtime reservation should start with the smallest shared surfaces needed to express that recovered initializer (likely `app/vehicle-routing.ts` plus the class-4 construction path in `app/world-initialization.ts`; `app/world-turn.ts` only if the chosen representation requires reward-time reinitialization). Do not reserve navigation engine, `vehicleExitTarget`, level data semantics, or game-store for this fault.

## Exact remaining proof before implementation

The exact Mission 5 shore cell selected by native `00464ae0` is not yet retained. A bounded original probe is justified only if the implementation/reviewer requires that exact output. Its required genuine inputs are:
- the verified executable above;
- the exact raw object-100 record from verified `levl2005.dat`;
- genuine post-level-load Mission 5 terrain/cell state consumed by `00464f90`/indexed search.

Do not seed a desired shore cell/category/readiness value. If genuine post-load terrain cannot be supplied without broad native level execution, port `00464ae0` from the static body and validate its generic semantics against a focused native comparison before claiming an exact Mission 5 target.

## Acceptance after coordinated repair

Focused lifecycle regression should prove an imported linked model-1 Boat receives the recovered shore initialization while inactive, remains linked/hidden until worship, and reward activation preserves the initialized position/readiness without relocation injection.

Canonical #96 browser acceptance then reruns the preserved natural route: real Convert Wild acquisition/cast and converted Brave, Boat-head worship, rendered ordinary boarding/ferry, authored land raises/rewards, natural Dakini objective/victory, persisted Mission 5 completion, and Continue Mission 6.


## 2026-09-18 current-branch implementation boundary

Current branch/head: `codex/pnd08-mission5-natural` at `d4dea003266b388b118bc9bf495c10dd7bf2ba02`.

Before touching shared production, `origin/main` was fetched and compared. `app/vehicle-routing.ts` has no main drift; `app/world-initialization.ts` has unrelated worship-appearance integration changes on main, so any later initializer wiring must be rebased/coordinated rather than overwriting them.

A complete read-only comparison of all Mission 5 object positions against verified `levl2005.dat` found exactly one coordinate mismatch: class-4/model-1 object 100. Checked-in/generated: `(76.890625,82.81640625)`; verified native-loader decode: `(-35.671875,-55.64453125)`. Every other Mission 5 object position matches the native loader decode.

This is the first implementation prerequisite. Wiring recovered `00464AE0` shore search while object100 still has the obsolete seed would search from the wrong world region and could yield a valid-but-incorrect shore. Therefore no production initializer hunk is justified on this branch until the generated object100 coordinate is corrected by its static/import owner (or that ownership is explicitly reassigned).

After that prerequisite lands, the smallest runtime hunk is:
- `app/vehicle-routing.ts`: a Boat-only initializer matching the null-person path of `00464AE0`: exact point first via `vehicleCanDisembark`; if invalid, indexed type-2 search `angle=0, first=0, last=16`, centered candidate cells, first candidate passing `vehicleCanDisembark`; no path/AI/player prerequisite and no guessed nearest-land search.
- `app/world-initialization.ts`: invoke that initializer only for class-4/model-1 construction before insertion, then derive the downstream shore heading/runtime fields from the resulting terrain cell as `00463BA0` does. Do not alter `world-turn` unless coordinated representation proves reward-time reinitialization is required.

Focused acceptance after the prerequisite:
1. lifecycle test: linked Boat object100 initializes to a native-valid disembark shore while remaining inactive/linked; `vehicleReady` true from normal fields; worship activation does not relocate it;
2. preserved Mission5 checker: natural Convert Wild -> converted Brave -> Boat worship -> ordinary boarding/ferry, then full natural victory/profile/Continue6.
