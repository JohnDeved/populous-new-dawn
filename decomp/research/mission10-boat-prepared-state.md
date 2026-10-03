# Mission 10 Boat preparation: field bindings and exact-state boundary

## Status

**Exact authored prepared state is not proved. No runtime implementation is
reserved by this note.** The first unprovided original-world input is the native
Mission 10 terrain/cell state read by `00464f90` during Boat object 109 allocation.
This is a data/state boundary, not a missing executable or an unknown source point.

This follow-up adds a material correction to the earlier
[Mission 5 initializer note](mission5-boat-reward-initialization.md): **the first
valid candidate cell center is not the final Boat position.** On successful
non-airborne preparation, `00464ae0` calls `004ec630(position, 0xa2)` before
publishing XY. Omitting this 162-unit category-directed adjustment would be an
incomplete port even after the correct shoreline candidate is selected.

Only this research note is changed. PR118's checker, production, assets and accepted
head `56f9e798b9b4f0dbdc8e761dbaf7c98fea05b06a` remain frozen. No exact shore,
height, heading or readiness value is invented; no CPU emulation or browser rerun
was performed in this bounded task.

## Original identities and reuse

| Input | SHA-256 |
|---|---|
| `d3dpoptb.exe` | `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` |
| `levels/levl2010.dat` | `0b0e073e0214597db814d3b69ba565127ea3df58cf5f46e6796466b7059c9f5d` |
| `levels/levl2010.hdr` | `2576ff6cddb23ff12afe86c9fc5b8680a035947f1f1e583568c95ea8be4f7bbb` |
| `data/mwsearch.dat` | `0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0` |

Mission 10 object 109 is class4/model1/Blue. Its record at file offset87982 starts
`01 04 00 56 26 56 18`; signed little-endian XY at87985 is `(9814,6230)`, matching
`app/level-ten.ts` and live Boat 62 in the retained PR118 receipt. Boat 62 and
Warriors 111-114 are **Mission 10**, not Mission 5. The historical Mission 5 generated
coordinate paragraph predates PR106; it is not an unresolved Mission 10 input fault.

Retained exports are hash-verified against `decomp/exports.json`: `00484a10`,
`004ed8a0`, `0044ddf0`, `0044df40`, `00464f90`, `0044e940`, `004ec630`,
`004655f0` and `004ee700`. The allocation/class-dispatch chain is retained in the
Mission 5 note; this task independently decodes bounded original-byte windows for
`00463ba0`, `00464ae0` and `00464f90` with the existing SHA-locked PE32 reader and
Capstone 5.0.7. No Ghidra project or export was modified.

## Exact position-producing sequence

The decoded caller at `00463ba9` tests byte `vehicle+0x94` bit 0x20 (dword
navigation flag 0x00200000). Unless set, `00463bbb..00463bc3` passes the same
`vehicle+0x3d` pointer as source and output, plus null optional person, to
`00464ae0`. The caller does not test its return value before continuing.

The callee tests the exact starting point via `00464f90` at `00464b1c`. On failure
it opens native indexed search type 2 with arguments `(2,0,0,16)` at `00464b2c..32`,
iterates `0049a3f0`, constructs wrapped centered candidate cells and retests
`00464f90` at `00464bed`. For this null-person Boat path, `00464c05..07` skips the
optional person's route test. The search handle is released by `0049a5d0` at
`00464c98`.

The success flag and non-airborne test at `00464ca7..00464cb0` gate the final
adjustment: `00464cb6` pushes **0xa2**, and `00464cbc` calls **004ec630** on the
selected point. This also applies when the starting point itself was accepted.
The retained `004ec630.c` calls `004655f0` to read the terrain category direction
and applies the original signed/wrapped sine/cosine displacement. Only then does
`00464ccc` write the final packed XY through the output pointer. On failure the
original point is written back without this success-only adjustment.

Consequently, neither a guessed nearest-land cell, the first admissible cell
center, nor the unprocessed source point is justified as the native result.

## Prepared-field bindings for the construction owner

These are **operations and sources**, not an executed Mission 10 snapshot. Offsets
refer to the original vehicle record; browser representations may differ.

| Original instruction / field | Binding that must be represented |
|---|---|
| `00463bb0..b3`, byte `+0xa1` | Copy the incoming tribe/owner byte from `+0x2f`. |
| `00463bc3`, words `+0x3d/+0x3f` | Run the actual guarded shore preparation, including the success-only 162-unit adjustment. |
| `00463bd0`, `004ee470` | Register the vehicle in its prepared position's object-cell chain. |
| `00463be1`, `0044e940`; `00463bfb`, word `+0x41` | Read original terrain height at the prepared XY and store the returned word. |
| `00463bec`, dword `+0x10` | Clear bit 0x400 while preserving the other flags. |
| `00463c22..4d`, word `+0x26` | Read the prepared cell category's signed direction: negative gives 0; otherwise heading is `((direction+4)&7)<<8`. |
| `00463c63..6e`, graphics at `+0x33` | Call `004ee700` with draw 2 and model descriptor word at `0x5a793c + model*23`; retain the helper's flags/frame/palette initialization. |
| `00463c86`, dword `+0x92` | OR navigation flag 0x80, preserving other bits. |
| `00463c96`, byte `+0x35` | OR presentation bit 0x80 after the graphics helper. |
| `00463c90..9a`, word `+0x98` | Copy the model descriptor's life word from `0x5a7938 + model*23`; the retained life oracle establishes shipped 5000. |

Identity, class/model, physics, speed and passenger/reservation fields also affect
later consumers but are not all written by `00463ba0`; their inherited values
belong to the surrounding allocation/class initializer. This table is not
permission to substitute invented defaults or to promise readiness on a failed
shore search. `app/world-initialization.ts:146-167` currently constructs from the
raw point without this preparation sequence.

## Exact missing input / leaf

**First unresolved leaf for the requested concrete output: `00464f90` with genuine
Mission 10 pre-Boat native terrain/cell state.** Its original body is available;
what is missing is the authenticated state it consumes at this call boundary:

- The 16-byte cell records rooted at `0x8a03e4`, including flags at+0, height at+4,
  object-chain head at+6 and terrain category at+12 for all visited candidates.
- The corresponding live object-pointer table at `0x890390` and next links at
  object+0x20, so class4 occupancy is not replaced with an assumed empty chain.
- The original indexed-search state and verified MWSEARCH data. The table bytes
  are available, but that alone does not establish the loader's runtime state.

The same prepared-cell category feeds `004655f0/004ec630` and the heading branch;
its heights/diagonal feed `0044e940`. Stubbing any of these with the desired
answer would destroy exact-state proof.

`00484a10.c` shows why raw DAT coordinates/heights alone are insufficient: the
loader clears level state, populates heights, performs native terrain processing
and walk-map setup, reads three 0x4000 blocks (the third contributes blocking
flag 4), and then allocates/post-processes objects in source order. A fixture must
preserve relevant effects from that real prefix through the Boat allocation,
not merely run the terrain category pass on browser-generated or zero-filled data.

Inspected retained Mission 10 native results under `mission10-opening` and
`mission10-deadline-defeat-final2` execute script/timer branches and report the raw
Boat record; they contain no prepared Boat or pre-allocation terrain snapshot.
The Mission22 lifetime oracle explicitly supplies `00464ae0`, `004ee470` and
`0044e940`; it proves life handling, not this shoreline result. The generic vehicle
routing oracle proves predicates on its supplied cases, not the missing original
Mission 10 state. No new exact-state emulation was attempted with fabricated input.

## Conditional minimum reservation and focused acceptance

The state contract is **not closed**, so the next owner action is evidence recovery:
retain a genuine native Mission 10 loader-prefix snapshot immediately before
object 109's initialization (or an equivalently proved prefix), then execute the
unmodified preparation, registration and height/direction consumers. Record the
starting state hashes, all calls/intercepts, selected candidate, final 162-unit
adjustment, complete output record and readiness/admission results. Do not require
success by seeding a shore/category/readiness flag.

After that proof, the smallest likely implementation reservation is a Boat-only
preparation helper in `app/vehicle-routing.ts`, composed with existing indexed
search/category/movement primitives, and the class4/model1 construction site in
`app/world-initialization.ts`. Preserve the native guard, failure semantics, final
adjustment and field sources above. Do not reserve the PR118 checker, generic
navigation, reward timing, unrelated vehicle models or clock code for this fault.

Focused acceptance should compare exact accepted-source native output to browser
construction before dispatch, including XY, height, heading, cell membership,
owner/navigation/presentation/life and inherited readiness inputs. Cover an
already-valid point, a search result and failure without forcing readiness. Then
the unchanged PR118 normal route must pass Boat boarding/crossing, root 71 worship,
linked 72 heading 1024/picking, work/RNG/reward invariance and checkpoint continuity.
This note earns no gameplay or native end-to-end parity credit.

## Receipts and bounded result

One shared serialized job, `147e363d-45b7-4c24-9d90-4503e11f58b6`, passed the static
original-byte extraction with no CPU execution. Its `native-binding/binding.json`
records input/window hashes and disassembly. The ignored continuation packet
`work/orchestration/issue21-static149/mission10-native-preparation/field-contract.json`
checks 33 exact instruction bindings and verified retained leaf exports. Its
`bind-native.py` is scratch evidence, not a production or shipped checker change.

Original-byte window hashes:

- `00463ba0` (272 bytes): `fa013680ddc9154e287f1dea03562fc3dcbdc7071d28d4d19fe86f0e465ec40b`.
- `00464ae0` (512 bytes): `7922041978f8c4b3ef965fc8f2efc661aa89727ec93f55d160a55c7abfe88a62`.
- `00464f90` (320 bytes): `99d0a2dbb2cc4e6605996376813b3935363e0c92434329970a280831e3dcf0df`.

**Result:** field/call binding advanced; exact authored shoreline/prepared state
remains BLOCKED at the genuine native terrain/cell-state input. No guessed state,
production patch, native proof-budget expansion or unchanged browser retry.
