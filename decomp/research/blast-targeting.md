# Blast direct-target seeking and HUD acknowledgement

Research base: `bb5980c2bc85fdfc9bd91d5bdc58eb9866b3bebb` on `codex/worker-3-blast-targeting`.

Canonical original executable: `/Users/johann/populous-browser/work/orchestration/ceo-release/native-run/d3dpoptb.exe`, SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

This note is a bounded issue #74 research result. No runtime, picking, HUD, spell, asset, or checkpoint source was changed. Existing native/current spell, picking, command-target, pointer-bracket, Blast-impact and Blast-wave evidence was reused. No new native execution was performed; the unresolved identity-transport bridge below remains a prerequisite for end-to-end direct-click proof.

## Result

Retained evidence establishes distinct input paths and a conditional target-following mechanism, with an unresolved bridge between them:

- A ground Blast and a direct object/person Blast are distinct native input paths.
- A direct click selects an object/person, uses its click-time position and records its identity for pointer acknowledgement. Its identity transfer into the spell command remains unproved.
- Blast is spell model **2** and its original descriptor has flags `0x44bf`.
- Native targeting code tests bit `0x40` of the descriptor's **high byte** at `0x5a80eb + model*0x3e`; this is full-word flag **`0x4000`**. Blast therefore has the target-following flag.
- Static decomp shows that a supplied spell target ID persists into the class-8 shot and refreshes its destination while valid. This does not independently prove that the clicked object's ID reaches that field.
- If the referenced target dies/disappears/becomes invalid, native clears the target ID and does **not** acquire another target. The projectile continues toward the last destination it had.
- The native frontend also records the clicked target ID for the same pointer-bracket acknowledgement used by normal contextual targeting. Ground Blast instead takes the zero-ID ground branch and creates the ground-click marker.
- This is not evidence that every spell homes. The target-following behavior is descriptor-gated; issue #74 should restore Blast first and must not add blanket seeking to other spells.

## Original normal input producer

The shipped normal spell click is in `004aab80`, case `0xc4`.

After checking the selected spell is usable, the producer builds command `0x84`. The retained expression packs the selected spell model above the low eleven payload bits while preserving the pre-existing low bits of `local_334._2_2_`. It does **not** visibly merge the just-picked `uVar22` ID into those bits. Their provenance is unresolved. A nearby contextual-command branch explicitly merges `uVar13` into low eleven bits; that separate branch is not proof of the spell-click assignment.

The pick order is the native person hit (`unit_index_1`) and then the mixed object hit (`unit_index_2`), with the existing special exclusion for class 10 / type 16. This producer does not itself establish an enemy-only eligibility rule, so a browser repair must not invent one merely because the reported case is an enemy person.

When an object ID is available, the command's position is that object's current native position. When no object is available, the picked ID is zero and the command carries the ground/minimap position instead.

The same branch writes the selected target ID to `DAT_0089bc20`, sets acknowledgement lifetime `DAT_0089bc1e = 5`, and sends:
`set_tribe_command(..., 0x84, payloadWithSpellModel, position)`.

Here the payload name does not imply a proved picked-ID assignment.

Only the zero-ID ground branch allocates the immediate ground-selection marker (effect model `0x3d`). This gives a native distinction between direct target and ground aim before any projectile is created.

### Command-consumer boundary

`0043e8e0`, command `0x84`, decodes the spell model with `payloadHigh >> 11`, performs spell creation/payment work, and decrements stock. The retained evidence does not close **picked object → command `0x84` low eleven bits → spell-unit `+0x6a`**. Both the low-bit provenance in case `0xc4` and its transfer into the spell unit remain unresolved, including the local normal-entry path.

No retained executed checker establishes this bridge. `check-native-command-target.py` covers a different contextual packet family. Before claiming end-to-end direct-click homing or implementing its identity transport as native-equivalent, establish this bridge; the downstream static mechanism alone is insufficient.

## Original target persistence before and during flight

The following mechanism is supported by retained **static decomp**, conditional on a target ID reaching spell `+0x6a`; it is not an executed end-to-end spell-click comparison.

### Spell unit: `004c1d10` (`spell_unit_processing_1`)

The spell unit keeps a target object index at offset `+0x6a`.

On every processing visit, a nonzero target index is validated through `unit_land_array`. If the referenced object is deleted/dead/invalid or has class zero, native clears `+0x6a` to zero.

For descriptor-gated target-following spells, native then refreshes the stored destination from the referenced target's current position.

The gate is:

`DAT_005a80eb[model * 0x3e] & 0x40`

Because `0x5a80eb` is the second byte of the 16-bit spell flags at `0x5a80ea`, this is full-word flag `0x4000`, not `0x0040`.

Blast is model 2 and `spellCharging[2].flags == 0x44bf`, so Blast satisfies the gate.

### Shot allocation: `004c21e0`

The class-8 shot allocator receives the target ID, writes it to shot offset `+0x98`, and copies the current destination.

If target ID is nonzero and the originating spell descriptor has the high-byte `0x40` target-follow bit, it sets bit `4` in shot byte `+0x6e`. Thus a Blast supplied with a target ID carries that identity and a target-following marker into its projectile object.

### Shot processing: `004bae30` (`unit_processing_class_8_shot`)

Before dispatching subtype 4 to Blast motion, the class-8 processor checks shot `+0x6e & 4`.

For a following shot:
- it validates target ID `+0x98`;
- a valid target refreshes destination `+0x76/+0x7a` from that target's **current** position;
- an invalid/dead target clears `+0x98` to zero.

There is no replacement-target search in this path. Clearing identity leaves the last copied destination intact.

### Blast motion: `004bb440`

Subtype 4 moves from the shot's current position toward its current destination and snaps into the arrival sphere. Because `004bae30` refreshes that destination immediately before subtype-4 motion while identity is valid, a Blast supplied with a valid target ID steers toward that moving target. Once identity is cleared, the same motion code continues toward the last destination.

That gives the required death/retarget answer:

- moving target: follow its updated position;
- target removed/dead: stop following, retain last destination;
- retarget to another nearby enemy: **no**.

## Original target HUD acknowledgement

`00475860` renders the existing target pointer brackets. It compares the hovered person's object ID with `DAT_0089bc20`. While the acknowledgement ID matches, alternating frames use the acknowledged/thicker bracket form.

Existing `scripts/check-native-pointer-brackets.py` already proves the geometry/palette behavior and the five-frontend-visit acknowledgement lifetime through `004b0080`:

`[4,target] -> [3,target] -> [2,target] -> [1,target] -> [0,0]`.

The spell input producer uses the same `DAT_0089bc20` acknowledgement slot for direct spell clicks. This is the native basis for the user-described “same target HUD feedback used when ordering units to attack that enemy.”

## Existing range, mana, stock and spell-cursor behavior

These mechanisms are already represented by existing native checkers and current source and are **not** part of the issue #74 defect:

- `scripts/check-native-spell-casting.py` covers original cast-state/range validation, allocation/payment and stock/mana behavior.
- `scripts/check-native-spell-targets.py` covers spell target validity.
- `scripts/check-native-spell-cursor.py` covers generic spell-cursor/readiness/blocked feedback.
- `scripts/check-native-spell-button.py` covers spell stock/button behavior.
- `scripts/check-native-command-target.py` and `scripts/check-native-world-picking.py` provide contextual-command and picking evidence; neither closes the spell-click `0x84` identity bridge.
- `scripts/check-native-blast-impact.py` and `scripts/check-native-blast-wave.py` cover downstream Blast impact/wave behavior.

Blast's extracted model-2 spell row remains:

- cost: `10000`
- normal range: `3072`
- alternate range: `7168`
- normal limit: `4`
- cursor: `41`
- blocked cursor offset: `[11, 9]`
- flags: `0x44bf`
- rate: `30`

A future targeting repair must leave these generic mechanics unchanged.

## Current browser normal-entry gap

The current browser cannot express the original direct-target Blast.

### `app/scene-input-runtime.ts`

During any spell mode, `pointerUp` intentionally suppresses normal person/object picking:

- `pickPerson` is only consulted when `!scene.world.mode`;
- `pickWorldObject` is likewise gated behind `!scene.world.mode`;
- the spell receives `scene.pick(event)`, a terrain point.

The frame update similarly makes `scene.pointer` a ground point while a mode is active and sets `scene.hoveredObject` only when there is **no** mode.

`drawPointer` also requires `!scene.world.mode`, so person target brackets and acknowledgement are hidden during Blast targeting.

The spell cursor therefore reports only generic spell/ground validity and stock/readiness; it cannot expose the picked enemy identity.

### `app/live-command.ts`, `app/spell-casting.ts` and projectile state

Current `cast(w, spell, p)` accepts only a point-like target.

`beginCast` snaps the target to its native cell-center point, spends the existing mana/stock, and creates a projectile with only a point destination.

`Projectile` in `app/world-types.ts` has no direct-target ID field.

`processProjectiles` in `app/spell-effects-runtime.ts` recomputes Blast movement toward the fixed `shot.destination`, but has no target lookup to refresh that destination. This is point-guided Blast only, not native direct-target Blast.

## Concrete current/native gap

| Behavior | Original | Current browser |
| --- | --- | --- |
| Ground Blast | picked ID 0 + ground point; ground marker branch | terrain point only |
| Direct enemy/object Blast | picked object position + acknowledgement proved; command identity bridge unresolved | object identity discarded in spell mode |
| Moving supplied target | static decomp: supplied spell ID reaches class-8 shot and refreshes destination; clicked-ID provenance unresolved | fixed destination; no target ID |
| Target death/removal | clears identity, keeps last destination, no reacquire | no identity to clear; always fixed point |
| Replacement target | none | none, but only because targeting is absent |
| Direct-target HUD | same object-ID pointer acknowledgement slot/brackets as contextual target | person/object brackets disabled while spell mode active |
| Range/mana/stock | descriptor/native rules | already represented; should remain unchanged |

## Exact implementation reservation — not performed in this research task

Subject to first resolving the picked-ID transport bridge, the proposed Blast-only repair would reserve these production owners together. This is a prospective scope, not accepted end-to-end native equivalence:

1. **`app/scene-input-runtime.ts`**
   - For Blast mode only, preserve native object/person picking alongside the terrain point.
   - Distinguish an actual direct picked target from a ground click; do not invent nearest-target/aim-assist behavior.
   - Permit the existing pointer bracket/ack path for the actual direct Blast target while retaining the generic spell cursor and ground behavior.
   - Preserve native eligibility rather than adding an unproved enemy-only filter or broadening other spells.

2. **`app/live-command.ts`**
   - Carry a narrow optional direct-target identity with the Blast cast request while keeping generic `spellTargetError`, range and payment semantics point-based and unchanged.

3. **`app/spell-casting.ts` + `app/world-types.ts`**
   - Preserve the direct target ID in the Blast projectile state.
   - Seed destination from that target's current position at cast creation; ground casts remain ID 0 / point-only.

4. **`app/spell-effects-runtime.ts`**
   - Before Blast motion, refresh destination from a still-valid direct target.
   - If target is gone/dead, clear identity and retain the last destination.
   - Never search for or acquire a replacement target.
   - Do not enable this behavior for other spells solely because Blast has it.

5. **`app/game-store.ts`**
   - Checkpoint migration must default the new projectile target identity to zero/null for older saves so existing point-only projectiles remain valid.

6. **Focused tests/checkers**
   - Direct moving enemy click follows the same enemy.
   - Ground click remains point-guided and takes the ground-feedback path.
   - Target death/removal freezes the last destination and does not retarget.
   - Pointer acknowledgement is attached to the actual clicked target, while generic spell cursor/range behavior remains intact.
   - Out-of-range/direct-target failure, mana debit and stock consumption remain byte/rule-equivalent to current/native spell checks.
   - Save/load preserves an active direct-target Blast identity and old checkpoints migrate to point-only behavior.

No picking-engine rewrite, no generic HUD redesign, no blanket “all spells home,” and no effect/asset change is justified by this evidence.

## Native-proof decision and remaining uncertainty

No new native execution was submitted. Static decomp supports direct-versus-ground selection, click position, acknowledgement assignment and the downstream supplied-ID homing/clear/no-reacquire mechanism. The retained pointer-bracket checker separately executes bracket rendering and acknowledgement expiry; it does not execute the spell-click identity bridge.

The unresolved bridge is the provenance of case `0xc4`'s preserved low eleven payload bits and their transfer through command `0x84` into spell `+0x6a`. This is necessary for the local direct-click claim too, not merely multiplayer or all-transport plumbing. A future source or executed comparison must bind the picked object independently to those fields before end-to-end fidelity is claimed.

The current browser's point-only input/projectile and absent spell-mode brackets are source-supported gaps. They do not fill the missing original transport proof. No new run is required to correct this documentation; no blanket seeking or enemy-only eligibility rule follows from the retained evidence.
