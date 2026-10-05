# Mission 3 Vault knowledge presentation

Research only, 2026-10-05. Application base
`596475b6839c948604897f8b68ff89c6290cf39d`; the same Vault consumers were checked
in the ordinary-spell integration tree
`06e9547b670de331e833afc3e8fd2600f0899b31`. No application, asset, fixture or parity
change. Independent review is required before using this packet for implementation.

## Bounded finding

**The Mission 3 Vault has a confirmed presentation resource mismatch.** Its native
pre-acquisition marker and collected body use **HFX1079**, a 21×23 sprite. The
browser hardcodes 1077 and passes it to `original-units.frames[1077]`, which is
compact person-animation entry **VFRA65**, with Brave body/clothing layers. A raw
1077→1079 substitution would select **VFRA67**, not HFX1079, and would not repair
the resource mismatch. The native pre-acquisition marker also creates its own
**HFX1417** glow (81×68, draw43, morph1, 80 native height units below the marker).
The shipped `makeVaultKnowledgeMarker` creates no glow. The collected gift has a
glow group, but passes 1417 to the same compact person-frame table, yielding
**VFRA727**. These are distinct resource identities, not interchangeable indices.

At the six-visit collection boundary the native local-player class2 dispatcher
also starts the building presentation controller and its companion. It uses
**Temple geometry95, 147 faces and 131 points**. The browser's Vault path has no
such screen consumer; PR211 explicitly gates its new consumer to ordinary spell
gifts. Final original geometry rasterization and full companion composition remain
unresolved. This packet does not claim final-pixel equivalence or a new payout-time
defect, and supports no decorative side flames.

## Authored producer and startup order

The canonical `levl2003.dat` SHA256 is
`eb239eabebbcde37c1e1633b149d48977cedf432348a12fc5ee6b4be74c049bf`.
Zero-based record91 is the mode4 class6/model6 trigger at `(-37,-133)`, with
one-based link93 to record92. Record92 is class6/model2 with payload `[2,5,1,1]`:
building class2, Temple model5, knowledge grant mode1, automatic-collection flag1.
Record104 is the colocated class2/model18 Vault, angle0.

Original startup `00484a10` calls allocation, then `00485b00` authored
post-processing, remaps trigger links with `004851e0`, runs mode3 conversion
`004866a0`, and calls `004edf50` to make linked templates inert. This already-mode4
Mission 3 trigger does not need the mode3 conversion branch.

The new probe executes the actual allocator `004ed8a0`, type initializer
`004ed580`, authored post-processing `00485b00`, and linked-template conversion
`004edf50`. It supplies finite free lists, the trigger allocation/link resolution,
and a Vault occupancy/socket fixture; it does not replay the whole level loader.
The original allocator first initializes the model2 source with default spell3 /
object1059. Authored post-processing changes its payload to building5 and allocates
a **separate class6/model10 marker**. `004edf50` then sets the linked model2 source
state to0. Its stale default object1059 is not the active knowledge marker.

The marker's first actual class dispatch `004ed700 → 004fa8f0 → 004fc570` selects
HFX1079 from descriptor `005a7228 + 5*76 + 10`, applies Vault socket1 through
`00404540`, and allocates a neutral class6/model8 glow. Supplied terrain200 gives
marker height1272 and glow1192. The socket offset is1072. World cell insertion,
terrain height and sunlight are supplied leaves; the socket arithmetic and shape
resource reads execute. The full success-path marker remains separate from the
later reward clone and its separately allocated glow. Exact marker/glow retirement
and animation cadence are not established: `004fbd20` is an intercepted head
presentation leaf and the global animation owner is not run.

## Completion, handoff and resource consumers

The probe supplies the native command33 task's forced-completion bit; it does not
claim to execute the entire Shaman walk/open/worship task again. Original
`004fb270` executes real clone allocation, `004ede10` template copy and
`004ed700` immediate class dispatch. The first reward visit initializes HFX1079
and its glow before the trigger arms timer82 / recipient0 / presentation phase6.
This preserves the source-copy, initialization and timer ordering.

Six subsequent original object visits hide the body, remove that clone's glow,
and call `00481550 → 004819c0 → 00481490` for local recipient0. The building
constructor reads geometry95 from the Temple descriptor at `005a73a4`, reads
147 faces from original bank2 `OBJS[95]`, initializes per-face state, and requests
building HUD slot4. The supplied HUD rectangle `(1,2,31,42)` yields `(16,22)`;
this is a supplied destination, not native HUD-layout proof. Original
`00480ea0(0) → 004839f0` dispatches that geometry to `00473210` (per-face) and later
`00472da0` (whole geometry). Those two renderer bodies are intercepted.

For the world sprites, retained `0046ec80` selects the sprite primitive according
to the draw descriptor. Retained `004673b0`'s primitive1 consumer loads from
`hfx_0_addr + object*8`. The probe additionally executes the exact original
`004689a4..00468a09` resource-selection instructions with the primitive type,
descriptor and stack object pointer supplied. It reads the real HFX1079 dimensions
21×23 and HFX1417 dimensions81×68 from the hash-verified loaded HFX table.
Projection, polygon dispatch/sorting and final raster output are not executed by
that instruction slice. No HFX→VFRA identity assumption is used.

The shipped entry is `world-initialization.ts`'s mode4 / linked-building reward →
`scene-entities.ts:makeShrine` → `vaultKnowledgeFrame` →
`makeVaultKnowledgeMarker` → `animatePerson`. The last function directly indexes
the compact `original-units.frames` table, then resolves HSPR pieces. Collection
goes through the ordinary `stepVaultWork` / `createGift` / `makeFx` caller and
reuses that person-frame path. `createGift` also uses terrain+800, whereas this
occupied Vault's original collected body uses socket offset1072; the probe proves
the native offset under its supplied terrain. A future live check must compare
the current renderer's coordinates, rather than infer pixel displacement here.

Historical ordinary Mission 3 play establishes that this is a reachable gameplay
entry, including Vault acquisition, Temple construction and actual training. See
the [immutable controls evidence](https://github.com/JohnDeved/populous-new-dawn/tree/cdb0c3470a6185fb39237cc2e165ed79905410ab)
and [accepted ordinary-victory record](../../references/verification/mission-three-controls-2026-10-05/README.md).
Those sessions do not establish original visual equivalence or replay this base.

## Countdown and failure boundaries

`004819c0` saves the gift handle at building-controller `+0xe63`. Subsequently
`00481490` clears the companion controller, including its separate `+0x5b`
handle. The late building branch at `00483f56` reads that companion handle,
not the building controller's saved handle. Preserve that ordering; do not copy
the ordinary spell controller's timer behavior into this path.

With geometry and companion leaves intercepted, 175 UI scheduler visits retire the
building controller while the timer stays76. The next76 original reward visits
reach total object visit82, set Temple knowledge bit32 at `0096070e` via
`00408e30`, issue knowledge notification `(0,11,5)` and remove the reward.
Visit81 still has remaining1 and no knowledge bit. The browser's fixed82 Vault
countdown is consistent with this bounded result. The UI visits were intentionally
separate from object visits: this is not a natural wall-clock timing comparison.
The probe intercepts the campaign notification and removal bookkeeping; the
knowledge-bit write executes.

Allocation failures remain distinct. `00485b00` writes payload even if its optional
marker allocation returns0. `004fc570` retains its marker if glow allocation fails.
`004fb270` skips copy/dispatch/reward arming when clone allocation fails.
`004facf0` can continue its gift path without a glow. These branches are retained
source evidence, **not executed failure-matrix claims**. Neither a universal glow
nor successful clone allocation may be assumed in future implementation.

## Evidence and limits

[Probe source](../../scripts/probe-native-vault-knowledge.py),
[complete result](vault-knowledge-presentation/probe-result.json),
[run identity and failed-attempt hashes](vault-knowledge-presentation/run.json),
[raw stdout](vault-knowledge-presentation/stdout.log).
The result includes exact input hashes, source hashes, every selected native entry,
allocation/copy/dispatch event, source/marker/gift snapshots, resource reads,
UI/object countdown rows and every intercepted leaf. EXE SHA256:
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

The final bounded command completed with exit 0 on CPU 4 using Python 3.12.14 /
Unicorn 2.1.4, under a 20-second outer timeout and per-call instruction/time limits.
No Ghidra, browser, dependency installation, full check/build or original OS/game
launch ran. Standard runtime gates are not applicable to this research-only diff.
Focused syntax, evidence identity, link/JSON and diff checks apply.

The orchestration plan exited 0 and reported this new packet/probe as unknown
paths requiring explicit review. Its broad campaign checks came from the index
edit, not changed runtime code, and were not run. The planner's unset-environment
warnings do not describe input availability: the actual probe sourced the verified
environment and checked every listed canonical input.

Two earlier failed probe attempts remain preserved with exact sources and logs:
one asserted an incorrect nonzero companion handle; the other omitted the HFX
table required when the scheduler reached its pulse. The final version preserves
the original zero handle and loads the hash-pinned table. These were harness
corrections, not changes to original bytes or weakened runtime acceptance.

## Smallest supported next boundary

After independent review, the smallest repair is Mission 3's knowledge marker /
collected world body: resolve the original HFX resource family, retain the Temple
descriptor choice, and model the separate pre-acquisition glow and socket anchor.
Existing compact person-animation indices cannot substitute for native HFX IDs.
Asset append/reuse and final rendered comparison still need to be proved; current
HUD metadata contains no 1079 or 1417 rectangle. Do not mass-import sprites or claim
all building rewards repaired from this single Mission 3 case.

The missing building screen acquisition sequence is a second bounded follow-on.
Its unresolved consumer is **00473210 / 00472da0 geometry raster plus the complete
00482290 companion**, including renderer-written per-face flags, actual HUD
destination, replacement, pause and modern elapsed-time integration. No new screen
animation, payout acceleration, decorative fire, runtime test or parity credit is
authorized by this research packet alone.
