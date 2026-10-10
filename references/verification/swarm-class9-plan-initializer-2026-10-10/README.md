# Class-9 plan constructor ownership

**Result:** the missing class-9 initializer body is now bound. For its supported
record model 1 it inserts the admitted plan at the supplied position, consumes
creation context into plan fields, conditionally initializes state 1, marks the
exterior-point terrain cell and stores its final byte sentinel. Retained state-1
support then reveals a second, shape-centered relocation inside initialization.
The constructor does not assign a new physical ID or directly request another
record. This closes the named body gap, not all transitive helper effects or the
port's missing incoming shared request state.

The single static window is `[004b8070,004b8150)`, 224 bytes. Its selected body
returns at `004b814b` after 220 bytes; the remaining four bytes are `INT3`
padding. Every local branch rejoins within that body. The next retained entry
`004b8150` was only the cap. Canonical input/tool hashes were rechecked before
and after GNU objdump; no original instruction was executed or emulated.

## Constructor sequence and direct owners

The argument points to the already admitted class-9 record. Its physical ID,
allocated-list insertion and counts belong to the preceding `004ed8a0`
transaction, which also clears the record and assigns class/model/tribe/position.
The constructor itself has no allocation-failure return protocol. If that
preceding allocation fails, the constructor is not entered.

| Instruction boundary | Exact effect |
| --- | --- |
| `004b807a–004b8080` | Compare unsigned record model byte `+0x2b` with 1. Any other value branches directly to the common return, with none of the following selected-body effects. This is not a proposed new port rejection guard. |
| `004b808b → 004ee470` | Insert the record using its supplied position at `+0x3d`. The accepted helper owns cell head/links and membership flag. This occurs before consuming context or initializing state. |
| `004b8093–004b80b7` | Set byte `+0x35` bit `0x10`. If flags2 `+0x0c` has `0x400`, clear that bit and decrement context pointer `00892443` by `0x14`, then use the resulting pointer. Otherwise the local context pointer is zero. No new validity guard is invented. |
| `004b80b7–004b80d6` | If the resulting context pointer is nonzero, copy its byte `+0` to plan byte `+0x9b`, low word of dword `+4` to plan word `+0x68`, byte `+8` to plan byte `+0x9e`, and byte `+0x0c` to plan byte `+0x9f`. Context `+0x10` is not read by this body. A missing context skips these copies. |
| `004b80dc–004b80f5` | If byte `+0x0e` bit `0x10` is clear, call retained no-op `004ed6f0`, write state byte `+0x2c = 1`, and call state initializer `004ed640`. If that flag is set, skip this entire state-init block. |
| `004b80fe → 004b9fc0` | Obtain the plan's exterior point into two local words. The existing geometry contract reads the plan's shape, coarse cell and building kind. This is not the completed building's anchor. |
| `004b8103–004b813c` | Extract the high byte of each returned coordinate, form `coarse = (yHigh << 8) | xHigh`, then OR `0x4000` into terrain dword `008a03e4 + 4*((coarse & 0xfe)*2 | (coarse & 0xfe00))`. This marks the containing 512-unit cell. |
| `004b8140` | Write plan byte `+0xa0 = 0xff`, then return. No semantic label beyond the actual byte write is assigned here. |

The retained request contexts in `004b9190` case 2 and `00498140` identify these
copied values as the shape index, coarse footprint start, building model and
rotation. Class-9 record model 1 and its stored building model `+0x9e` are
different fields. `004b8470` later reads that stored building model when it
requests the separate class-2 body; plan `+0x92` receives that body's ID only on
successful admission. The constructor must not pre-fill that alias from a
browser Building ID.

After this initializer returns, the outer `004ed580` type initializer still
owns its common active flag `flags4 |= 0x20000000`, flag3 bit 4 and timestamp
writes. This packet does not move those writes earlier in the sequence.

## Retained state and geometry support

The new body calls `004ed640`, whose retained class-9 state dispatch is
`004b8150`. Since this constructor just stored state 1, that path invokes
retained `004b8220`. The following supporting facts come from those existing
exports, not further disassembly:

- `004b8220` first inspects the terrain's ten-bit body/plan handle at the current
  position. It checks deleted/class-zero before using the referenced record and
  can resolve an associated body from a class-9 record. Do not replace this with
  “any current Building in the cell.”
- It preserves the original x/y words from `+0x3d/+0x3f` into plan `+0x49/+0x4d`.
  It derives a shape-centered position from the stored footprint start and
  shape dimensions, samples its initial height, and invokes the retained
  `add_unit_to_cell` / `004ee580` relocation helper. The first constructor
  insertion is therefore not necessarily its final cell. Existing same-cell
  versus cross-cell ordering rules apply.
- The remaining height branch uses already ported grade-vertex/terrain rules:
  ordinary building kinds choose the sampled/averaged height, round ties down
  to 64-unit steps and clamp to 64–1024; kinds 13/14 use height 1; kind 10 keeps
  the existing height in this branch. `buildingPlanHeight` implements the
  maintained height calculation, not the missing record identity transaction.
- The model-10-only special call to `0042cfc0` remains an uninspected selected-
  export gap. Exterior-point helper `004b9fc0` also has a kind-10 collision path
  through retained `00518200`; its ordinary non-10 path is shape arithmetic.
  These special branches are separate from the newly planned Hut1/Camp7/Temple5
  case. This pass does not recursively decode them or claim blanket absence of
  transitive allocation effects for every building kind.

The accepted cell helpers and existing shape/height owner contracts are reused.
The complete new 220-byte body's four call targets are `004ee470`, `004ed6f0`,
`004ed640` and `004b9fc0`; all have retained bodies. State 2 behavior, the full
placement controller, arbitrary scenery helpers and the conditional
class-6/model-9 `004fc330` body are not expanded here.

## Consequence for the actual port consumer

The [preceding constructor packet][constructor] proves the selected nested
class-6 request is skipped for new Hut1/Camp7/Temple5 plans under the pinned
descriptor values. The [delayed-plan tail][activation] already binds successful
body activation at `004b8a94 → 004ed580` separately from plan state initialization
at `004b8a74 → 004ed640`. Failed body allocation still executes its post-attempt
worker loop.

There is now a concrete source sequence for a supplied, already admitted
ordinary plan record: initial cell insertion, context field copies, state-1
relocation/height, exterior-cell mark, and later separate body allocation. A
future real `placeBuilding → tick → prepareBuildingSite` test can observe the
plan/body alias and retained cell order, plus allocation rejection and its
worker effects. Its controls must supply and identify the preceding shared
allocator state; it must not initialize that state by labeling current browser
arrays or terrain handles as native IDs.

Current `addBuilding(...,{plan:true})` still creates one browser Building,
computes its model-origin position and preparation height, and later clears
preparation on that same ID. It has neither the class-9 slot/context ownership
above nor the incoming shared request/count/failure transaction. Its current
constructor therefore cannot be described as a complete supplied native plan
state merely because its visible height and geometry look correct.

**Stop:** the named class-9 initializer is no longer missing. The next connected
boundary is the actual request feeder and supported initial shared state for
`placeBuilding`/AI plan creation and the concurrent people/scenery/effect
requests. The original class-9 request site `004b9190` case 2 is retained, but
this packet does not bind every caller/guard into that placement mode or
reconstruct a fresh game's full request stream. A controlled supplied-record
test can prove the local consumer; an ordinary World cannot yet supply the
complete state. No detached runtime module, new Swarm candidate admission,
legacy-history fabrication or binary-save requirement follows.

[constructor]: https://github.com/JohnDeved/populous-new-dawn/blob/25d318a7c1ff65a93af77378eb76d8305d210d78/references/verification/swarm-class2-constructor-request-2026-10-10/README.md
[activation]: https://github.com/JohnDeved/populous-new-dawn/blob/9694f1f2156c4c06a6128278f16c6eac1dd35ba2/decomp/research/selection-radius-source-20261010/membership/plan-activation/findings.json
