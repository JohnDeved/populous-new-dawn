# One-case ignition/root-release source draft

Status: committed source-only draft for review; **not executed or approved to
run**. Evidence base remains PR244 head
`100d0ba3f89a02e97a587628f76584b7380373ff`. The draft script is
`probe-ignition-root-draft.py` in this directory. No runtime source is changed.

## Accepted plan and remaining gate

The source-only PR244 plan received ACCEPT on 2026-10-06. The independent review
is retained at the workspace's
`review-bundles/hut-smoke-state-exit-plan-review-20261006/review.md`, retained
unchanged here as [plan-review.md](plan-review.md), SHA-256
`8276d44fa42b0228a0cb715a5a02a58837eb66758361f9f22ad2f827de810f46`.
Its accompanying manifest SHA-256 is
`6c5f7ccad3b10f11d59d8e7c9aa315c86c5af2e61ac399a457304965ad784c81`.
This accepts the investigation direction, not this later draft or execution.
The next reviewer must inspect the exact committed draft, fixture, ABI, leaves
and finite launcher before the parent schedules a run.

Reviewer requirements incorporated: one full root and an existing child; declared
failed fire allocations; genuine secondary bounds/list/count; real release and
free-list return; explicit `+0x84=0`; exact root handle/table resolution; unchanged
resident IDs/count/bytes; unchanged child content while permitting list-link
changes; both RNGs and primary seed observed; real `004ed6f0` no-op retained.

## Exact supplied fixture

- Execute accepted pool setup `004ed820`, `004ed880`, `004ee300` after clearing
  `008e0428..00937a97`. Secondary range is `00930ab8..00937a97`, 160 records of
  179 bytes, indices 1840–1999. Allocate full root then child through real
  `004edbd0`; model initialization is supplied during these two allocations.
  Expected list is child→root, count 2, free count 158.
- Both allocations copy primary class-7 seed 37. Root is class7/model74/state61,
  child flag0, lifetime -1. Child is class7/model75/state61, child flag1,
  supplied remaining lifetime9, HFX1385/draw40/f1=20/f2=0. Both positions are
  `(8192,12288,400)`. Both flags2 are exactly zero: neither has cell membership.
  Their historical creation/animation visits are supplied, not re-proved here.
- Completed Blue model1/object107/heading0 building is at scratch `02040000`,
  unit index1, state2, counter32, anchor `(8192,12288)`, flags2=0. All fields not
  explicitly written begin zero, including `+0x84`; `+0x92` points to the actual
  root's native index and its table slot must resolve to that actual pool record.
- Resident slots `+0x86..+0x8b` contain IDs100/101/102; count `+0xa6=3`. Their
  supplied 179-byte class1/model2 records at `02042000/02042100/02042200` have
  matching table pointers. They are not linked into terrain cells or processed.
  Retain every resident byte and each identity/count through ignition. This is
  not a native admission or complete resident initialization proof.
- Cosmetic RNG `0089bc72=123`, gameplay RNG `0089d178=456`, player tribe0.
  Staged 20-byte allocation-parameter stack begins at `02050000`.
- Load original `objects/objs0-2.dat` (8,532 bytes; SHA-256
  `e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d`) and
  `objects/shapes.dat` (4,604 bytes; SHA-256
  `ae1188129d84c266d91a1e9e75d960e99e80cdfd573f85d524742e970a0b2849`)
  using existing `load_native_shapes`. No importer or constants loader runs.

## Native calls, ABI and intercepted boundaries

The actual call under investigation is cdecl
`00408cb0(buildingPointer, attacker=1)`. It must enter real `004ed6f0`,
`004ed640`, `004030c0`, `00408840`, then the initializer cleanup tail. Observers
record those entries without changing instruction flow.

`004ef180(root)` is observed as a **release request**, not stubbed. It must reach
real `004ed530(root)`, whose list mutation is also observed without interception.
After return require root class0, building root handle0, count1, allocated list
containing only the child, and free-list head equal to the released root with
159 valid distinct linked records. At `00403254`, after the real destructor
returns and before the caller clears its handle, independently require class0,
count1 and the root at the free-list head. Retain ordered call/return and watched
building/pool/RNG-write observations, plus full root/child records before/after.
Only child list-link bytes may change at ignition. A call receipt alone does not
satisfy deletion.

Supplied leaves:

- `004ed580(pointer)` during the two setup allocations only: returns without
  running the class/model initializer; fixture fields above are explicit.
- `004ed8a0(5,10,0,point)` inside real `00408840`: every fire request returns0.
  The supplied failure consumes its staged20-byte parameter record and clears
  `0089243a`, matching the reviewed allocator failure contract. It does not
  allocate a primary slot, fire record, class seed or RNG draw. This deliberately
  does **not** model successful fire ownership or match the live Lightning stream.
- `0044e940(x,y)` returns deterministic ground height384.
- `004ee190(pointer)` supplies sunlight bookkeeping after actual removal.

Unexpected resident-removal `00407490` or cell-unlink `004ee4f0` aborts the case.
No interceptor replaces `004ed640` with the burn arm. No release interceptor
zeros classes or edits lists. No animation updater, renderer, whole world loop,
original executable process, import/export tool, or Node/browser subprocess runs.

Each cdecl call gets `ESP=020fd000`, `[ESP]=020fe000` as the stop sentinel,
arguments at `ESP+4`; successful returns require EIP at the sentinel and
ESP advanced by four. The secondary-list slice `004ec924..004ec942` has no
synthetic return address and must restore its entry ESP after its inner calls.
Run that slice once after ignition with actual `004ed700→0050a750→0050c260`.
Only the child should be visited: counter37→38, lifetime9→8, identity, sprite
fields and position retained. No new child, root visit or RNG/seed change occurs.

## Read/write and process limits

`native_cpu` verifies canonical EXE SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` and maps its
PE image at `00400000`, size `0094c000`, exclusive end `00d4c000`. Read-only file
inputs are the EXE, the two geometry files, `scripts/decomp.py`, `decomp/tools.json`,
this draft, the Python interpreter and installed Unicorn package. The script
writes no files and starts no processes. `-B` suppresses bytecode-cache writes.

Native fixture writes stay inside the mapped PE image and additional scratch
`02000000..020fffff`: pool records and index table; allocation HEAD/FREE/count
globals; RNG/seed sentinels; model/shape pointers; supplied building/residents;
allocation-parameter context; and stack. The emulated routines additionally
change the burning building fields and root/neighbor/free-list links. Full
building bytes are retained before/after, and changed offsets are restricted to
`2c,35,92,93,a7,af` for this deliberately zero-initialized fixture.

Seven emulation starts each have a 100,000-instruction ceiling: three pool setup
calls, two allocations, ignition, one secondary pass. Total maximum is700,000
instructions. Unicorn's translation buffer is explicitly64MiB. Mapped guest
memory is9.3MiB plus1MiB scratch. These are configuration bounds, not measured RSS.

Proposed finite launcher after source approval, with the verified absolute
interpreter and EXE paths substituted and a fresh task-owned receipt directory:

```text
/usr/bin/timeout --signal=TERM --kill-after=5s 30s
  /usr/bin/prlimit --as=1073741824 --cpu=20 --
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/venv/bin/python -B
  decomp/research/hut-smoke-state-exit/probe-ignition-root-draft.py
  /workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe
```

One parent-coordinated foreground invocation owns this timeout process group and
its one native Python child, captures stdout/stderr/exit and before/after source
hashes, and waits for termination in the same tool session. No retry, parallel
native call, shared cache, port, browser, Ghidra or fixed output path is requested.
The 1GiB address-space/20CPU-second limits and30+5-second wall limit are hard
ceilings; a limit hit is a failed/inconclusive result, not proof. Installed wheel
metadata says Unicorn2.1.4; its shared library and interpreter are fingerprinted
in the draft manifest without importing or running them.

## Live and ordinary witnesses remain separate

The later caller comparison must obtain actual occupants from normal admission,
retain `world.units` resident IDs and admission slots, and invoke real Lightning
ignition. `ensureBuildingDamage().occupants` is not the resident authority. A
subsequent repair must bind actual state entry and retain completed legacy huts
whose `damageState` is undefined. Preserve children, pool order, RNG ownership and
cadence; do not compensate with a later renderer hide or root-driven child purge.

For ordinary rendered acceptance, use Mission1's authored Lightning reward and
existing Blue hut, normal worship/gift/HUD cast controls, and observe the first
state4 frame with residents present and burn timer above119. Existing staged
Lightning/browser-fire tests are supporting evidence, not this acquisition route.
No ordinary-witness implementation or execution is included in this draft.
