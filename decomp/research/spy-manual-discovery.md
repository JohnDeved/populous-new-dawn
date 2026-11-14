# Manual right-click Spy discovery

Issue [#1009](https://github.com/JohnDeved/populous-new-dawn/issues/1009) concerns
the player's inspection action, not automatic combat or proximity reveal. This
note records native input/command evidence. It does not complete the browser feature.

## Existing owners and live prerequisites

Class-1/model-5 Spies already have training, disguise, sabotage, combat, rendering
and checkpoint owners. Reuse [Mission 12 Spy evidence](mission12-spy-sabotage.md).
The shipped Help article 45 in `app/original-help.json` explicitly says to move the
pointer over a disguised enemy Spy and right-click to blow its cover. This is a
stronger product reference than the community hints PDF cited in the issue.

Source inspection used main `e7428912491fffdb3d229216f121765eaa529e5d`, tree
`392ddbc90418953a61a84f248a09441b7653bf8a`. At that source:

- `app/scene-input-runtime.ts` admits ordinary inspection on unmodified right
  press with no selection or armed mode. Its `pickUnit` returns only orderable
  Blue people. `pickWorldObject` returns vehicles/buildings/shrines, not enemy people.
- `app/scene-picking.ts` already has the visible mixed-object/person hit owner.
  Discovery should not add a distance scan that bypasses this owner's occlusion.
- `app/live-people.ts`, `app/live-building-combat.ts` and combat/spell owners already
  reset disguise to `realTribe << 6` when their respective reveal paths apply.
- The app does not yet expose the original shared, one-slot player tribe-command
  staging owner. Person order pools and AI `pendingCommands` are different owners.

## Original route and observations

The verified executable is `d3dpoptb.exe`, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Existing exports suffice except that `0047b1d0.c` loses an indirect branch; bounded
disassembly and actual CPU execution resolve that branch without editing the export.

1. Default record table `005d5de8`, constructed by `00489300`, binds right pointer
   scan `0xf1`, no modifiers, press phase 1 to action `0x72` through `004feed0`.
   The predicate requires cursor flag `0087cabc & 1` and interaction mode
   `0089c6e7 == 0`. The record has gate bit 1: `00489470` does **not** reject it
   merely because both land flag 8 and the current overlay's flag 4 are set.
2. `process_cmd` at `004aab80`, action `0x72`, requires modal query
   `00451370(2) == 0` and level flag `0089c669 & 0x20 == 0`. It then calls
   `0047ae00(1, 1)`.
3. `0047ae00` validates the first and then second picked unit references at
   `0087cac2` / `0087cace` through `unit_land_array` at `00890390`. A reference
   must have nonzero class and clear removal bit `flags2 & 1`.
4. `0047b1d0` handles the foreign class-1 branch. Real tribe must differ from
   the player; apparent tribe from `004de720` must equal the player. The latter
   uses real tribe while the low six disguise bits are nonzero, so a foreign Spy
   still changing disguise is not admitted.
5. At `0047b246`, constant `0x42` selects the queue-admission table entry at
   `0047b45a`, whose value 6 leads through `0047b414` to `0047b25f`. It requires
   the per-player slot at `00897997 + player * 15` to have command byte `+0xc == 0`.
   Land flag `0089c661 & 0x800` also blocks this producer.
6. Admission writes command `0x4e`, argument `+4 = 0`, target index `+8`. The
   inspected person is unchanged. The branch returns zero, so it does not itself
   acquire an inspection panel or feedback marker/sound.
7. `process_tribe_cmd` at `0043e8e0`, case `0x4e`, re-resolves a nonzero, nonremoved,
   nonzero-class target and calls `004de7f0`, which writes `realTribe << 6` to `+0xb2`.
   The consumer does not repeat the producer's apparent-tribe or model checks.

The local foreign-person producer contains no alliance or model-5 test. This is a
byte-based native branch, not evidence that arbitrary non-Spy people should become
discoverable in the browser. Neither this branch nor the command consumer proves
upstream visibility/occlusion behavior. Do not infer those gates from the absence
of checks after picking.

## Reusable probe and boundaries

```sh
python -B scripts/check-native-spy-discovery.py /path/to/d3dpoptb.exe
```

`scripts/check-native-spy-discovery.py` uses the existing hash-verifying
`decomp.native_cpu`, Unicorn 2.1.4 and a 16 MiB TCG buffer. It maps the executable
as data; it does not launch Windows or the original game. Run it in the serialized
native lane with a 30-second wall limit, 25-second CPU limit and 1 GiB address-space
limit. Recheck resource admission under `engineering/resource-budget.md`.

The complete supplied-state matrix passed:

- 576 foreign-person inspection cases across all four player/real/target tribes,
  countdowns 0/1/63, empty/occupied command slots and land flag 0/0x800.
- 1,536 default-mapper → right-press dispatcher → inspection → queued-command
  consumer cases across modes 0/7/12, all eight low modifier combinations,
  press/release, cursor eligibility, land/overlay flags, modal and level flags.
- 12 consumer cases across class zero/person/vehicle, removed/live and zero/live
  references. Only the reference guards are tested; malformed references are not
  a supported native input domain.

Only `operator_new` during default input construction is intercepted, supplying
188 owned 15-byte nodes. Keyboard translation executes against a supplied empty
map. Producer, input predicates, dispatcher, queue write and reveal consumer execute
unmodified. Terrain/picked-person/command globals are supplied. No own-person panel
allocation, upstream hit production, original UI, renderer, browser, app execution,
whole-game behavior or visual parity is claimed.

Research retained two failed attempts: an initial 100,000-instruction constructor
bound was too small; it now uses the existing constructor harness's 1,000,000 bound.
A second attempt wrongly expected land8/overlay4 to reject action `0x72`; its gate-1
record and `00489470` show why that assumption was wrong. Both flag combinations
remain in the final matrix. Resource limits and acceptance assertions were not
relaxed to hide either outcome.

## Remaining implementation and acceptance

Integrate discovery with the existing visible-person hit and disguise owners,
preserving native deferred command admission and occupied-slot behavior. Do not
introduce a second unrelated AI/order queue or write disguise directly inside a
generic selection helper. Preserve ordinary own-person inspection, cancellation,
armed/selected modes and right-drag camera input.

Still required: actual native upstream picking/visibility boundaries; browser
admission and command scheduling; friendly/ordinary/already-exposed/in-progress
Spy cases; stale target and world replacement; invisible/occluded cases; combat,
AI and checkpoint regression; rendered trusted right-click evidence; independent
review and applicable full code-change gates. This research closes none of those
acceptance obligations and does not close #1009.

## Browser adapter and remaining acceptance

`app/live-spy-discovery.ts` stages a single manual discovery from the ordinary
canvas right-press handler. `ScenePicking.pickPerson` supplies the visible mixed
painter hit; discovery does not scan nearby or hidden people. The adapter uses the
existing live animation/native person and checks viewer-colour completed disguise,
removed/dead/inside/vehicle/invisible status, input selection/mode and native gates.
`stepTurn` consumes the staged discovery before tribe/object work, resetting only
the same person's disguise. Removed/replaced units or person owners are discarded.
No sound, panel, order, RNG or invisibility mutation is added by discovery.

This deliberately narrow browser adapter is not a port of the shared tribe-command
scheduler: other player actions still dispatch through their existing owners. The
pending event is World-owned frontend input and is not checkpoint state. Pausing
retains it on the same World until a logical tick; replacing/loading the World
starts without it. Once consumed, the existing person's disguise is checkpointed
normally, without a format change. Original save/pause scheduling was not probed.

The portable tests supply a Spy and dry terrain inside the compatibility grid,
exercise the actual pointer handlers with supplied picker/DOM ports, and run real
logical ticks, current Save/Load and live person ownership. These are not rendered
browser input, ordinary enemy production or full-game parity evidence. Trusted
rendered right-click, real occlusion/invisibility, camera-drag preservation, visual
review, full check/build and downstream combat/AI coverage remain acceptance gates.
The issue remains open and no parity credit is claimed by this adapter alone.
