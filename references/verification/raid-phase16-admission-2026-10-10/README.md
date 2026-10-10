# Ordinary raid phase16 admission supplement

Refs #248. Source-only supplement to the [combined diagnostic](../../../decomp/research/raid-phase16-target-persistence.md). No gameplay/parity credit or runtime repair is claimed.

## Finite findings

- ATTACK opcode1059 dispatches through registered `0048cc60` to `0048fc50`. The ninth script argument tokens1078/1079/1080 become0/1/2 and reach native allocator `004e5fd0` as argument10. Its write at `004e6291` targets `tribe + slot*0x52 + 0x5c`, exactly task `+0x26`.
- A specific override writes1 at `004e62b7`: decoded target mode2, resolved class1/model7 target, and its object-table-resolved word `+0x9f` nonzero. Existing person evidence identifies this word as attached-vehicle ownership. This condition is not a generic browser `inside` flag.
- Task `+0x26 == 0` selects ordinary `004cb400`; nonzero delegates to `004cceb0` and returns before the ordinary prelude/dispatch. The alternate routine has its own phase table; its phase16 is not ordinary `004cc112`.
- Ordinary phases above5 first find the first assigned state23 person in the tribe chain. A second full chain scan retains the last assigned model4 and last assigned model7 person. Prefer the model4 helper, otherwise model7; with neither, do nothing. No additional deletion, special-flag, distance, command-model or cadence filter is present in these scans.
- The prelude calls `0043b540(helper, state23PersonEvenPackedCell)` and then unconditionally ORs mask0x2 into helper DWORD `+0x14`, even if the callee returned0. It increments task DWORD `+0x08` afterward, before phase dispatch. The entity pointer was resolved before the prelude.
- `0043b540` attempts shared order allocation, prepares command19 with extra bytes4/4, resets cursor `+0xa6`, releases queued/immediate orders, then calls `00436d00` with the cursor reread after release. Shared `00438730` can adjust payload coordinates; `004364d0` has cleanup and RNG-capable branches. In `00436d00`, a nonnegative signed cursor attaches a queued order and invokes `0043b010`; a negative cursor installs an immediate order. Cursor preservation across the uncomposed releases remains unproved. This is the deliberate shared-owner stop.
- Native task `+0x08` counts controller visits and is reset by ordinary phase0. Phase16 maintenance tests its incremented low bits for the once-per-four-visits coordinate selector. The current port's phase6 `elapsed` does not establish this native counter.

The known first Mission6 Chumara vector uses1078 and target token1071, so its decoded native constructor writes routing0 and cannot take the target-mode2 override. This is a conditional source fact, not a captured native visit or proof of the whole history. Current source retains neither a direct task `+0x26` projection nor the native visit counter, and does not compose the prelude. `task.mode` stores the marker byte corresponding to `+0x23` instead. Actual phase16 admission, complete chain/assignment and `+0x7f` ownership, and ordered world-list composition remain required. Mission1–3 mixed-phase16 reachability is still unknown.

## Evidence and validation

Inspected source is `4754e12d3590bde18656416514871b033de164be`. The [manifest](provenance.json) records the canonical EXE/tool identities, immutable source links and hashes, five full disassembly-input hashes, byte-preserving excerpt ranges/hashes, and the retained local report/provenance/inventory hashes. The executable and complete raw packet are not included. No world/storage snapshots, archives, binaries or broad source copies are published.

The original finite pass made 24 artifact-producing reads and verified twelve registered exports. It performed no native/emulated execution, browser, simulation, tests, dependency operations or runtime changes. Publication validation is limited to JSON parsing, exact instruction-line/source comparison, hashes and `git diff --check`; code/build/TypeScript checks are not applicable to this documentation-only projection. The shared-owner cursor qualification is the narrow independent-review correction, not new release research.
