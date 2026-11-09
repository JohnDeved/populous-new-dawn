# Building-completion feedback ownership

Refs #58. This is a bounded static owner/context comparison, not a new native
execution or proof that no completion-related campaign feedback exists anywhere.
The original language-bank comparison alone did not justify removing a toast.

## Actual completion owner

The browser's `completeBuildingConstruction` is reached when ordinary hauled
work crosses the building's capacity, and from the world-turn construction
completion check. It previously added an unconditional `[Building name] completed.`
message to the shared nine-second status slot. Its built counter, upgrade reset
and hut breeding timer are independent of that message.

The retained original transition is:

- [`004ba2c0`](../generated/004ba2c0.c#L52-L58): work reaches capacity, geometry
  stage becomes four, then the unblocked building enters state two.
- [`004ed6f0`](../generated/004ed6f0.c) is the empty release hook;
  [`004ed640`](../generated/004ed640.c#L12-L14) dispatches class two to
  [`004030c0`](../generated/004030c0.c#L43-L45).
- [`004049d0`](../generated/004049d0.c) owns completed geometry, linked geometry,
  timber-search invalidation, footprint/terrain and smoke cleanup, and the
  breeding clock. Models 13/14 additionally use effect 83 and sound 215 under
  the original terrain condition. These are not a generic text dispatch.

The inspected completion owner and its bounded helpers contain no operation
which dispatches the browser's unconditional generic completion status. Preserve
model-specific audio/effects, campaign/tutorial messages and compatibility/error
channels. Remove only that status assignment; do not replace it with language
entry 736 or infer that the other three #58 feedback decisions are resolved.

## Reused and newly bounded sources

Existing Ghidra exports retain their `decomp/exports.json` identities; names and
types are inferred pseudocode, not recovered source. Reviewed helper ownership
includes `00493770` (timber search), `004b9ef0`/`0040b860` (footprint/terrain),
`0040afd0` (smoke/terrain refresh), `00403a00` (land registration), `0041b3f0`
(breeding cost), and the existing object/audio/allocation controllers. The prior
hut-birth oracle supplies unrelated completion callbacks and is not proof of a
fully executed completion presentation path.

Three previously unexported leaf windows are retained as small original-byte
assembly proof, not generated gameplay run output:

- [00404c50](building-completion-feedback/00404c50.asm): coordinate packing only,
  ending at 00404c7b; no callees or indirect transfer.
- [004be230](building-completion-feedback/004be230.asm): terrain-brightness helper,
  with returns at 004be310/004be326; no callees or indirect transfer.
- [004bf1b0](building-completion-feedback/004bf1b0.asm): terrain texture/fade helper,
  ending at 004bf621; no callees or indirect transfer.

Input: original `d3dpoptb.exe`, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
Tool: GNU objdump (GNU Binutils for Debian) 2.44. Static read only, no original
instructions executed or emulated. Reproduce with `objdump -d --start-address=START
--stop-address=STOP <verified-executable>` for windows 0x404c50–0x404c80,
0x4be230–0x4be330 and 0x4bf1b0–0x4bf630. Trailing line whitespace is trimmed;
original instruction bytes and trailing breakpoint padding are retained.

## Regression boundaries

Maintained regressions preserve a pre-existing status and its lifetime through
real hauling completion, and check direct completion bookkeeping for new,
upgrading and repaired Huts/Temples. These are port tests, not fresh original
execution or rendered before/after evidence. Standard source gates and rendered
acceptance must retain their actual run status; this note grants no parity credit.
