# Automatic Preacher sermon creation: static trigger and proof plan

Source-only investigation at `a00eadc811e227559f9a2713eedbee5cd08af1c1`,
2026-10-06. Original instructions were **disassembled, not executed**. No runtime,
test, fixture, parity or generated Ghidra export was changed. This does not explain
earlier Mission 3 deaths or establish original campaign behavior.

## Result

Static instructions show that the original automatic response can create immediate **command32 at the Preacher's
current position** when it is not already in an active stationary sermon and a
nearby non-Preacher/non-Shaman enemy can target it. The primary scan seeks enemy
Preachers/Shamans; the secondary scan reverses person eligibility. The secondary
result is a person pointer, not a listener count. Its radius arguments `(2,2)` visit
**3 by 3 whole terrain cells**, not 2 by 2 cells.

The secondary call's return is discarded. A successful32 allocation/attachment
still returns zero from `0051e7b0`; therefore compare immediate/queue ownership and
pool writes, not a boolean return. Production `startPreacherResponse` currently
uses generic `0051eab0`-style detection and creates/shares only command21. Its
`prepareCellOrder(..., 32, ...)` argument is flags32, not model32.

## Evidence and naming

Complete instruction ranges, raw-byte hashes, tool/command/exit receipts and source
hashes are in [the static packet](preacher-response-trigger/manifest.json):

- [004df140](preacher-response-trigger/004df140.asm), `004df140..004df1b0`.
- [0051f030](preacher-response-trigger/0051f030.asm), `0051f030..0051f465`.
- [0051e7b0](preacher-response-trigger/0051e7b0.asm), `0051e7b0..0051e99f`.

GNU objdump 2.44 read the canonical PE32 executable SHA256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Retained Ghidra exports of the producer, dispatcher, range, disguise and order
leaves agree with the inspected call sites. The two missing Ghidra exports are
not needed to read these bounded instruction paths; no Ghidra resource is requested.
Names below follow existing port/probe layouts; addresses and offsets are the
primary evidence. In particular `+0x5f` is **speed**, not turning state.

This supersedes the unresolved leaves and ambiguous "2-by-2 scan" description in
the prior ignored assessment, hash
`385e50b23626bedef9d705e22e3c97ccee178d289caba50b416c0cfce5e56788`, manifest
`3c6dd4669af9f16bfe9d0eb615745df32100b59f23a2058a3abcacb631f92f26`.
It preserves that assessment's lack of an ordinary command32 witness.

## Exact predicate: 004df140

It returns AL=1 iff every condition below holds; otherwise AL=0. No callees or
memory writes occur.

1. Person state byte `+0x2c` is10 or33.
2. Select immediate order index word `+0x9b` when nonzero, else queued index
   `+0x8b + 2 * byte(+0xa6)`. The selected index is nonzero.
3. The 10-byte record at `0x938830 + index*10` has flags bit1 clear and model
   byte17,31 or32.
4. Unsigned substate byte `+0x2d` is greater than1.
5. Speed word `+0x5f` is zero.

This predicate does not check assignment64, listener existence, health, model or
tribe. The caller checks model4 before invoking it. A cancelled immediate order
does not cause fallback to a queued sermon.

## Exact scan: 0051f030

The nine cdecl argument slots are `(person, packedCenter, radiusX, radiusY,
unused5, collectFriendlyListener, outFriendlyListener, reverseMode, outThreat)`.
Only the low byte of each mode argument and low word of the center are consumed.
Slot5 is unused. Primary mode zeroes `*outFriendlyListener` if the pointer exists;
reverse mode unconditionally zeroes `*outThreat` and leaves the friendly output
untouched. AL is initially0 and becomes2 on the first qualifying enemy.

Both modes subtract each radius from its center byte, iterate `radius+1` positions
in steps of2, wrap byte coordinates, and read the cell's signed16-bit head at
`0x8a03e4 + cell*16 + 6`. Object pointers come from `0x890390 + index*4`; the next
index is unsigned16-bit object `+0x20`. Rows are outermost, columns then cell-chain
order. Search stops at the first successful enemy. There is no distance, terrain
category, collision, visibility-ray, fight-object or building scan here.

Primary mode (`0051f067..0051f284`):

- Consider class1 only. Model4/7 candidates require word `+0x9d == 0`, flags2
  `+0x0c & 0x800000 == 0`, and state table `0x5a6f7a + state*5` bit4 clear
  (the port's state-flags bit0x400).
- Their signed life `+0x6e` must be positive, flags2 bit0x10000 clear, and vehicle
  word `+0x9f` zero. They must pass source-to-candidate eligibility below.
  A successful candidate produces AL=2, without writing its pointer.
- Other models cannot trigger that enemy result. If collectFriendlyListener and
  its output pointer are nonzero, same-tribe state23 people instead overwrite the
  friendly pointer. This path does not apply the enemy health/flags/vehicle filters;
  it retains the last such person visited before stopping/exhausting the scan.

Shared directed eligibility, with attacker A and target T, is expanded inline:
T's life is positive; T flags2 bit0x10000 and flags4 bit0x1000 are clear; both
tribes are non-wild and different; `alliances[A.tribe] & (1 << T.tribe)` is zero;
`004de7b0(T,A.tribe)` and `004de7b0(A,T.tribe)` both return0. That retained leaf
tests model5 disguise. Model4 A requires game-flags bit2 or T model4/7; model6 A
rejects T model7 when game-flags bit2 is set; other A accept iff A model8 or
T model is not8. Globals are `0x9608b6` (alliance bytes), `0x89d17c` (game flags).

Reverse mode (`0051f28f..0051f454`):

- Candidate must be class1 and **not model4 or7**.
- Apply directed eligibility with **A=candidate, T=source Preacher**. Thus the
  life, flags2 bit0x10000 and invisibility checks here concern the Preacher, and
  alliance direction is candidate-to-Preacher. Both disguise checks still run.
- Additionally require candidate tribe !=-1, word `+0x9d == 0`, and state !=23.
  Write that candidate pointer to `*outThreat`, return AL=2.
- Do not import primary-only candidate life, inside, state-table or vehicle
  filters into this branch. Those fields are not read on this path. This is an
  instruction-level finding, not a claim that an ordinary world retains arbitrary
  dead/inside candidates in these chains.

## Producer decisions and outputs: 0051e7b0

1. Execute `0051ff60`; range0 returns0 without scanning. Otherwise truncate half
   the range, multiply by2, and align the person's XY high bytes to even values.
2. Initially both mode bytes are0. For model4, predicate false enables reverse
   mode; predicate true with assignment `+0x76 & 64 == 0` enables friendly mode.
3. Run primary `0051f030` at the derived radius, argument5=0, friendly output
   provided, reverseMode=0 and outThreat=null. Save AL in BL.
4. Only if saved AL=0 and reverse mode is enabled, run the same scanner with
   radii2,2 and an outThreat pointer. Do **not** copy this call's AL into BL.
5. A nonzero outThreat selects32 immediately. Otherwise a retained friendly
   listener's `+0x89` may resolve a nondeleted, nonzero-class object: center the
   command21 area on that object's cell and set BL=5. If none and BL=0, return0.
6. For32, execute `00436c20`. On success call `00438730(id,32,&personXY,32)`, set
   person flags2 bit16, then `00436d00(person,id,-1)`. There is **no00520480 share**.
   Allocation failure performs none of those writes. Return the saved BL, zero
   for this branch, whether allocation succeeded or failed.
7. For the alternate21 response, use the selected cell/radii payload, prepare
   flags32, set flags2 bit16, attach immediate and call `00520480`. Return BL
   (2 for primary enemy detection,5 for friendly-listener fallback), even on
   allocation failure. Return value therefore never certifies allocation.

The ordinary dispatcher `004d4690` already suppresses a model4 active17/31/32
with assignment64, before entering this producer. Keep that separate from the
stationary-sermon predicate. Eligibility/range, pending-scan cadence and ghost
dispatch are additional caller conditions, not missing tests inside these leaves.

## Smallest predeclared paired proof (not run)

Use two supplied people in a dry category0 cell, no buildings/fights/vehicles,
no listeners, no special flags or disguises, and zero alliances/game flags.
Source: class1/model4, tribe0, life1000, state10, substate1, speed40, counter0,
assignment0, XY `(0x2100,0x2100)`, queued active model3/flags0 at index1,
commandStatus3, immediate0, queue cursor0. Enemy: class1/model2, tribe1,
life1000, state17, word+0x9d=0, XY `(0x2180,0x2100)`. Supply the cell chain
source→enemy→null and all unit-table pointers. Pool1 has one reference; pool2 is free; cursor2;
active count1; unused records have zero references. Unit-table index0 and every
unused cell head are null. Initialize all other fields explicitly rather than
relying on unknown memory.

Expected decisions: range1 yields primary radii0,0 (one cell); predicate0;
primary ignores the model2 enemy and returns0/friendly=null; secondary radii2,2
finds that same enemy through reverse eligibility, returns2 and writes its pointer;
producer retains return0 but allocates2/model32/flags32 with raw XY payload.
Immediate index becomes2; queued index1 and its reference remain intact; new
references1, active count2, allocation cursor3, flags2 gains16 and orderLocation
becomes0x2021 when flags3 bit0x02000000 is clear. No sharing call occurs. On this
dry cell, command preparation must preserve raw XY. Never infer this from AL alone.

Native boundary: enter the real `004d4690` dispatcher with the supplied record;
execute eligibility, range, `0051e7b0`, both scan calls, disguise leaves,
`00436c20`, `00438730` and `00436d00`. Record entry/exit and pool/person changes
with observation-only hooks. **Intercept none** of these. Reuse the complete
automatic-order harness's mapped constants/terrain/pool setup; configure shipped
`levels/constant.dat` and hash it. No existing immediate order means no unrelated
cleanup leaf is expected; fail on unexpected world calls rather than stub them.
Record `0051e7b0` AL at its return, because the outer dispatcher is void.

Port boundary: use actual `startLiveCombatResponse` and its private
`startPreacherResponse`, with the supplied people/queue represented in a real World;
observe `allocateLiveCombatResponse`, pool, source/native ownership, paths and
registration. Do not compare a newly handwritten scanner or call a private replica.
The static prediction at the pinned production head is that generic detection
rejects the enemy Brave, produces no immediate order and returns false. Neither
side of this predeclared mismatch has been executed by this investigation.

Required small controls: enemy absent; enemy same tribe; reverse-direction alliance
bit only; source already stationary active17/substate3/speed0; source speed nonzero
with that same17; enemy model4 (primary21 path); exhausted pool (no32 attachment);
enemy at adjacent diagonal cell (inside secondary3x3) then two cells away (outside).
Observe that no-share by a call counter; a third supplied friendly person is only
needed later to check peer state. Do not expand into a random suite before this
positive and its ownership snapshots agree with the declared branch path.

## Reuse, live continuation and remaining boundaries

- `scripts/check-native-melee-engagement.py` already compares eligibility/range
  and dispatcher selection, but **intercepts0051e7b0**. It cannot prove this writer.
- `scripts/check-native-combat-orders.py` executes all callees of0051e5e0 with
  pool/reference/person snapshots, ordinary cleanup and coast preparation. Reuse
  its setup/snapshot design; it is not existing coverage of0051e7b0 or model32.
- `scripts/check-native-orders.py` covers immediate attachment/queue preservation
  and removal; its payload preparation and world effects are intercepted. Combined
  reuse reduces new work but does not make either harness an automatic-sermon proof.
- The accepted [gesture packet](preacher-sermon-gestures.md) already contains the
  odd-counter32 expiry discrepancy: supplied counter17/timer32 becomes timer33,
  AL0, events[]. Its queue, state, counts, scheduling and named world/audio leaves
  are supplied; the outer queue completion and preceding producer are absent.
  Reuse those unchanged rows; do not rerun or implement expiry to claim production.
- Ordinary Blue Mission3 Temple unlock/build/training and authored-Brave conversion
  exist in `scripts/mission3-natural-preacher-scenario.mjs` and
  `tests/mission3-natural-preacher.test.mjs`. Their observed sermon is17. Reuse that
  acquisition path, then issue a normal movement command past an authored enemy
  and prospectively observe the first natural automatic32; do not write32 into a
  fixture, teleport actors, alter health/scheduling or infer it from `[17,31,32]`.
- Live integration needs more than adding a branch: `startLiveCombatResponse`
  currently populates its adoption list only by invoking the `peers` callback
  through sharing. A faithful no-share32 path must still adopt/register/cancel
  movement for the initiating person. Test that explicit ownership boundary.
- Follow the produced immediate through startup (`startPersonOrders`), exact
  commandStatus32 and substate5, real `stepLivePreaching`, listener acquisition,
  removal and queued-command resumption. Those runtime/native-controller layers,
  checkpoint continuation, rendered feedback and original ordinary campaign history
  remain unproved by this static packet or the proposed supplied two-person proof.

Next authorized step is independent review of these predicates and the predeclared
boundaries. Native/application execution, implementation and broader gameplay
acceptance remain separate. No Ghidra, browser, native-emulation or check/build
resource is held. Docs-only checks verify JSON, retained hashes, links and the
complete staged diff; application check/build and TypeScript quality checks are
not applicable to this source-only deliverable and were not run.
