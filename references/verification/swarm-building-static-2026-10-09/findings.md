# Swarm building pursuit/ejection: bounded static contract

Status: static interpretation prepared for independent review. No original game instructions, emulation, Ghidra, native probes, browser checks or tests were executed. No live implementation was changed. This is evidence for a missing behavior, not proof of native/browser equivalence or ordinary reachability.

## Input and retained output

- Canonical input: `../original-data-recovery-20261009/game/d3dpoptb.exe`, 2,275,840 bytes; before/after SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
- Extraction provenance clarification: `../original-data-recovery-20261009/exe-provenance-clarification.json`, SHA-256 `c96b217ecabc8fcd14aa43509049386aa98455d8dab10d61af67671ed9726b3e`, distinguishes game archive `6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`, extractor source archive `2c2d850ef79dd1da41549203b145b8a26ce556d6b1abe4f6262625727a8483d2`, and the canonical executable. It preserves and clarifies the old receipt's ambiguously named `sourceArchiveSha256`; no original receipt is rewritten.
- Data decoder: `/usr/bin/objdump`, GNU Binutils for Debian 2.44. `manifest.json` records executable/tool hashes, all seven bounded commands, output hashes and exit statuses. It has SHA-256 `a09a9ac4b78af79dfdd84f839ba036786bbb1ff957e9c518cc3aa44a30226b99`.
- `supplement.json` records one bounded table-byte dump and exact-main helper/source bindings; SHA-256 `b1344581412af3aece1f09073b2437afbd2c217b12d6b1e2436fb4f8b37d1204`.
- Interpretation source is main `d6cf109474379172728a3ccebf46ef72a15f3a58`; stationary checkout remains `e18fddfe35ad5424b580f7a07fbd058590d32f72`.
- Main artifact is `00510120-00510cb0.asm`; it includes the controller through its return at `00510c0c`, literal switch tables `00510c10..00510c57`, and neighboring destruction helper `00510c60..00510ca4`. Bytes after a routine's return are not interpreted as continuation code. `00510c10-00510c58.tables.txt` displays the three actual jump tables as bytes.
- Other bounded outputs cover initializer `00510020`, child allocator `00510d40`, child convergence `00511020`, target movement `00511180`, jitter `005112d0`, and separately decoded `00510cb0`. The last jitter output also contains the beginning of unrelated `00511340`, which is outside this interpretation.

The earlier retained-prose boundary is resolved for this controller body by direct canonical-byte decoding. The older exports remain unavailable; this artifact is not a recovered Ghidra export. The former note's successful scratch-job IDs establish historical context only.

## Controller fields and initialization

Addresses below are virtual addresses in the verified executable. Field names are analytical descriptions, not recovered original source names.

- `+0x2d` is controller phase; `+0x8d` is building substage. `+0x6c` is signed lifetime, `+0x6e` child-list head, `+0x70` wander/dwell counter, `+0x73` remembered building ID, `+0x75/+0x77` original XY, and ten signed-word history slots start at `+0x79`.
- `00510044..00510054` sets child count 60, lifetime 200 and target ID 0. `005100f6..0051010a` initializes phase 0, copies initial XY to original XY and zeroes all ten history words. `00510063` sets speed 80. `0051010d` sets free-heading flag `flags2 & 0x80`.
- Main switch at `00510143..0051014f`, confirmed by table `00510c10`, maps phases 0/1/2/3 to `00510156`/`00510164`/`00510438`/`005108a5`.
- Phase 0 calls `00510d40`, then jumps directly to the common tail (`00510156..0051015f`). The allocator sets phase 1 at `00511011`. It does not run phase-1 acquisition/wander on that initial visit.

## Building acquisition and target ownership

1. Phase 1 sets free-heading flag `0x80` and speed 80 (`00510164..0051016b`), then runs existing origin-bounded wandering. Acquisition occurs afterwards only when `(remaining & 63) == 0` (`005102e3..005102e7`). This is lifetime cadence, not global turn modulo.
2. The search center is the saved original cast XY at `+0x75/+0x77`, quantized to doubled cell coordinates (`00510174`, `005102ed..0051030e`). It is not the cloud's current position. The scan invokes retained helper `0049c890(originCell, index, 0)` for indices 0 through 166 inclusive (`0051031d..00510325`, `0051040f..00510416`). The helper starts on the surrounding spiral; this loop does not separately scan its center cell.
3. The controller follows each searched cell's native object linked list (`00510334..0051035e`, `00510421..00510430`). It accepts the first object whose class is 2, tribe differs from the controller, and object ID is absent from all ten history words (`00510366..00510399`). This predicate has no building-model, occupancy, completion/progress, HP, diplomacy/alliance or separate flags2-deleted check. Do not add an occupied-only filter merely to improve the witness.
4. It stores target ID in `+0x73`; history insertion uses the first zero slot without RNG. If all ten slots are nonzero, exactly one gameplay RNG draw selects replacement slot by unsigned remainder modulo 10 (`0051039b..005103f5`). It stores the ID, switches to phase 2 and sets substage 0 (`005103f7..00510408`). The same visit then continues through the common tail.
5. Every phase-2 visit resolves the stored ID and rejects ID zero, object flags2 bit 1, or class zero (`00510438..0051045d`). This later validity check does not recheck tribe, class 2, history or occupancy. A captured building is therefore not abandoned merely because ownership changed. Replacement/generation behavior beyond this ID lookup is not inferred.
6. On invalid target, `005108b2` writes only phase 1. In particular it does not clear frozen flag `0x4000` or target/history/substage. Normal completion clears frozen at `0051089c`. Preserve this distinction in the contract; no corrective behavior is proposed for it.

## Building substages, one switch arm per controller visit

Jump table `00510c20..00510c47` establishes all ten mappings. Every arm then joins the common ground scan/movement/children/lifetime tail.

| Substage | Exact body | Observed work |
| --- | --- | --- |
| 0 | `0051047b..00510482` | Set substage 1 only. |
| 1 | `00510487..005104b6` | Call `004044b0(building,&point)` for outside point, copy XY to parent destination `+0x4f/+0x51`, set substage 2, set movement-change flag `0x1000`, clear free-heading flag `0x80`. |
| 2 | `005104bb..005104f2` | Before common movement, require both `abs(sign16(destinationAxis)-sign16(currentAxis)) < 112`; when both pass, set substage 3. These arrival comparisons do not themselves wrap the subtraction. |
| 3 | `005104f7..00510552` | Call `00404420` for inside point. For every existing child in list order, set child phase 1, copy parent outside destination to child `+0x53/+0x55`, copy inside destination to child `+0x4f/+0x51`. Set parent frozen flag `0x4000`; set substage 4. |
| 4 | `00510557..005105a4` | Wait until every remaining child has render-flags word `+0x35` bit `0x10`. An empty list passes. Then set substage 5. |
| 5 | `005105a9..0051066d` | If building inside-count byte `+0xa6` is nonzero, process six physical occupant slots. Ejection order is below. Regardless of occupancy, set substage 6 and counter 4. |
| 6 | `00510672..0051068c` | Decrement the counter; remain while signed result >0, otherwise set substage 7. |
| 7 | `00510691..0051075e` | For every remaining child in list order, set child phase 3 and refill its ten jitter shorts with ten gameplay RNG draws, `(draw & 511)-256`. Set substage 8. |
| 8 | `00510763..005107b0` | Wait until every remaining child's bit `0x10` is clear. An empty list passes. Then set substage 9. |
| 9 | `005107b5..005108a3` | For each child, redraw `+0x49`, `+0x4b`, `+0x4d` in that order, each `draw & 127`. Set parent phase 1 and clear frozen `0x4000`. No same-arm reset of free-heading flag is present; phase 1 sets it next visit. |

No lifetime extension/reset appears in this sequence. The controller still expires through its ordinary common tail.

## Exact occupant ejection order

At `005105be..0051065a`, slots are read in physical order from building `+0x86` for six two-byte entries. Each slot must be nonzero and resolve to an object with flags2 bit 1 clear and class nonzero (`005105c4..005105e8`). There is no per-person tribe, model/Shaman, state-23 or person-descriptor immunity gate here. Those filters belong to the separate ground scan and must not be reused as building eligibility.

For each valid slot:

1. Call retained `00407490(building, occupant)` to remove that requested occupant (`005105ea..005105f1`). Existing reviewed helper clears the real slot, decrements occupancy, reveals the person, updates training/tower/indicator state, and establishes the outside exit target; it does not teleport the person to the door.
2. Clear flags2 bit `0x10` after removal (`005105f4..005105fa`). This cancels the forced-exit movement flag established by that helper.
3. Unless flags2 `0x100000`, save previous state, call `004ed6f0`, set state 26 and call `004ed640` (`005105fd..0051061d`). Retained C identifies `004ed6f0` as empty and `004ed640` as normal class initializer dispatch. Existing live panic helper is the integration owner; initializer internals were not newly executed.
4. If flags4 bit `0x800`, call generic removal `004ef180` (`00510620..0051062c`). Unlike the ground scan, there is no branch skipping the next damage call after removal.
5. Call `004da080(occupant, controllerTribe, DAT_005aa514, 0)` (`0051062f..00510641`). Imported `SWARM_PERSON_DAMAGE` is 100 native HP / 5 browser HP; existing damage helper still owns level/Shields and attacker semantics.
6. If occupant model 5, call `004de7f0` to reveal its actual tribe (`00510644..00510650`). This comes after damage here, unlike the separate ground scan.

Ground-person scanning continues immediately after the selected controller arm whenever `(remaining & 7)==0` (`005108b6` onwards). An ejected person may therefore be eligible for that separate scan in the same visit; do not add unconditional de-duplication between distinct native operations.

## Child entry/exit movement and common scheduling

- Child switch table is `00510c48..00510c57`, selected at `00510af0..00510afa` after parent motion.
- Child phase 0 calls existing convergence `00511020` (`00510b01`). Phase 1 first calls jitter decay `005112d0`, then `00511180(child,outside,1,200)`; on arrival it becomes phase 2 (`00510b0d..00510b32`). Phase 2 calls `00511180(child,inside,0,200)` and sets bit `0x10` on arrival (`00510b34..00510b50`). Phase 3 calls `00511180(child,outside,0,200)` and on arrival clears bit `0x10`, returning to phase 0 (`00510b52..00510b70`).
- `00511180` computes differences from separately sign-extended coordinate words (`00511193..005111a3`), without the wrapping correction present in `00511020`. With reset=true it first writes velocity X/Y as truncation-toward-zero of difference/2 (`005111a5..005111c0`). It returns arrived immediately when Manhattan distance is strictly less than 200, before movement or height update (`005111c4..005111ed`). Otherwise it adds truncation-toward-zero `delta*32/distance`, clamps horizontal velocities to [-64,64], moves, and applies the existing terrain-relative downward height rule (`005111ee..005112c3`). Reset=true is supplied on every child phase-1 visit, not only the first.
- Frozen flag `0x4000` skips parent movement and parent terrain-height update (`00510a11..00510a17`). Otherwise free-heading flag `0x80` selects stored heading; with it clear the parent faces its destination. Movement uses current speed, then height becomes terrain+200 (`00510a1d..00510ad3`). The visit acquiring a building and substage 0 still use prior free-heading motion; substage 1 starts targeted movement; substage 3 freezes immediately.
- Child iteration and tail removal follow after parent movement. Child low-nibble cleanup and signed lifetime handling remain active in all substages (`00510b74..00510c02`). The low-nibble comparison also runs at remaining 0 before decrement/expiry; negative signed remaining skips decrement/expiry and is retained indefinitely. Normal initialized lifetime 200 still decrements to 0, removes survivors and controller; pursuit does not get a fresh 200 visits.
- `00510cb0` is a separate child callback for phase >=4 attached movement via another target field; phases 0..3 here return immediately. Retained `decomp/generated/00509c10.c:112..117` maps model 27 (switch model-minus-one case 0x1a) to state byte `+0x2c = 0x43`; `decomp/generated/0050a750.c:341..343` maps state-minus-one case 0x42 to this callback. It is not called by `00510120` and is not its destructor. The building route sets only child phases 0..3. No claim is made about other producers of phase >=4. Its presence is not required to invent another building substage.

## Existing integration owners and bounded remaining work

The helper/source hashes in `supplement.json` bind retained `00404420`, `004044b0`, `00407490`, `0049c890`, `004ed640`, `004ed6f0`, `004da080`, `004ef180`, and `004de7f0` plus actual current-main adapters. They are existing Ghidra pseudocode/ports, not independently re-executed originals in this task.

- `app/building-shapes.ts` already exposes outside/inside geometry.
- `app/building-occupants.ts` owns physical slots and `removeBuildingOccupant`; `app/live-building-entry.ts:leaveBuildingEntry` reconciles browser occupancy through that owner. Do not bypass it by assigning `u.inside = null`.
- `app/live-people.ts:initializeLivePanic` and `app/person-update.ts:damagePerson` already own person effects, but the building-specific order and filters above must remain distinct.
- `leaveBuildingEntry` returns the actual removed person; preserve that identity. `initializeLivePanic` defaults to `cancelBuildingEntry` and order cancellation. The new building adapter must justify active-person/order ownership against the retained state-26 initializer before choosing cancellation versus preservation. This analysis has not established that generic default is correct for the ejection path.
- Current `app/swarm.ts` has only initializing/wandering phases and ordinary child motion. Current `stepSwarm` skips every inside occupant and does not search buildings. A complete pursuit/ejection lifecycle is the smallest useful behavior slice; acquisition-only plumbing or helper-only ejection would not complete it.
- A live acquisition adapter still needs an explicit native-cell ordering mapping for class-2 buildings. `World.objectCells` currently has a person-oriented maintenance path; choosing the nearest building, using arbitrary array order, scanning only occupied buildings, or substituting footprint flags for object-list membership is not yet justified by this analysis. Reuse and verify existing world/building cell owners before implementation. This is an integration dependency, not unavailable original input.
- Raw flags and offsets belong in this evidence. Production should use meaningful phases, targets/history and explicit movement/visibility states while preserving the established visit ordering, RNG and checkpoint serialization.

## Ordinary early-mission prerequisite and acceptance boundary

PR281 already proves earned Mission 3 player Swarm through public controls. `tests/mission3-recurring.test.mjs` expresses naturally constructed Chumara Tower/Temple and trained Preacher, so an occupied enemy building can arise in ordinary play. There is no initial authored Chumara building in this mission. Tower completion does not prove a garrison; Temple training occupancy can be transient; Hut housing occurs later. PR281 ended without retaining a checkpoint and records Brave 53, not an occupied building. A particular eligible, occupied building near the player's cast origin, with sufficient remaining lifetime for approach/insect entry, has not been observed here; the parent has assigned separate source-only feasibility work.

Proposed eventual playable acceptance: ordinary M3 player earns/charges Swarm, casts near a naturally occupied Chumara building, the original acquisition/approach/insect-entry sequence runs, real occupancy is removed in the recovered slot order, and the actual person enters the recovered response. Preserve full lifespan, ongoing ground scan, player/AI ownership, original insect presentation, invalid-target behavior and checkpoint continuity. Controlled state vectors can supplement this route but cannot replace it.

Before any runtime change, independent review must check this static interpretation and the live cell-order/occupancy mappings. Original execution, emulator probes, browser QA, source-change gates and live proof are all **not run** in this task. No parity or issue closure is claimed.
