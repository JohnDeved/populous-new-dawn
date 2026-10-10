# Automatic training panel load reset

2026-10-09, finite static addendum to the [request/latch contract](training-panel-auto-contract.md).
The earlier missing-input result is preserved at `ce899202ff0c83688f4d9b815eff7f3a82e8baca`.
Later authorized data-only recovery supplied the canonical executable and closed
the exact two previously missing routine bodies. No game process, installer,
original instruction, native probe or browser session ran.

**`00503f60` clears the panel table, deletes its UI objects and clears the primary
objects' bit-23 latches on the retained load/restore paths. `00503230` is unrelated
to that reset.** This removes the specific native post-load orphan-latch question;
it does not establish every new-level/restart caller or the complete save format.

## Exact reset body

The [176-byte function](training-panel-auto-reset/00503f60.asm.txt),
`00503f60..<00504010`, ends at the `ret` at `0050400f`:

| Instruction sites | Effect |
| --- | --- |
| `00503f61..00503f6f` | EAX=0; zero `0x4f3` dwords starting at `00895fad`. The exclusive end is `00897379`: the 12-byte prefix plus all 32 contextual records (`32*0x9e`). This clears record count, automatic flags, phases and target/UI IDs together. |
| `00503f71..00503f7a` | Set word `0089ce51=0xffff` and word `0089c6cd=0`. No user-facing names are inferred for these words. |
| `00503f80..00503fa9` | Walk secondary allocated list `00890330` using next pointer `+4`, saving next before deletion. For class10/model3 only, call `004ef180`. |
| `00503fab..00503fcd` | Walk primary allocated list `00890324` via `+4`. Test dword `object+0x14 & 0x800000`; clear that bit with `0xff7fffff`. This includes an active building restored with the latch set. Activity at `+0x9c` is not changed. |
| `00503fcf..0050400a` | Zero two separate `0x300`-byte blocks at `00897681` and `00897381`; rebuild three fields from `00897379/0089737d`. Their wider control/animation meanings are outside this pass. |

The existing [pool research](hut-smoke-secondary-owner.md) and retained list
reconstruction [004ee300](../generated/004ee300.c) bind these allocated lists.
The existing [004ef180 class10/model3 branch](../generated/004ef180.c) decrements
the secondary count, sets class0 and returns the object through `004ed530`; the
reset does not merely hide the old DOM-equivalent object. No new execution of
either helper was performed.

`00503f60` does not call `00509290`, allocate a replacement panel, reset building
activity, or write tooltip T/D. The broader load callers can have other effects;
these negative claims apply to this exact routine, not the whole loading system.

## The other missing body is not a panel reset

The [108-byte function](training-panel-auto-reset/00503230.asm.txt),
`00503230..<0050329c`, ends at `0050329b`. It zeroes dword `0089c65d`, walks the
secondary allocated list and counts class10/model16 records. It then derives byte
`0089ce61`: 0 for counts above 32, 8 for 22..32, 4 for 13..21, and 2 for 0..12.
It has no calls and no writes to the contextual record table or object flags3.
Do not infer its gameplay name from the nearby panel reset or class number.

## Consequence for load and port ownership

Retained [00443260](../generated/00443260.c) invokes `00503f60` after successful
load and list reconstruction. [00442b50](../generated/00442b50.c) invokes the same
reset after reconstruction. Therefore those paths discard the old UI records and
clear loaded primary-object latches even though the latch's field lies inside
the saved state block and the record table lies outside it. Pre-save helper
transformations and the complete manual-save file codec remain outside this proof.

An active restored local model7 building is consequently eligible for a new automatic
request on its next ordinary `00405b80` visit. The reset itself does not replay a
request or create a record; no particular real-time delay or frame is established.
This directly supports clearing transient browser record/latch ownership when
loading into a new Scene, and avoiding a persisted latch with no surviving owner.
The actual callback may use a transient Scene binding keyed to the live World;
that architecture remains a **port design recommendation**, not recovered native
architecture. Ordinary Save without World/Scene replacement must not be silently
turned into a new-Scene event. A fresh game's existing zero initialization and
the complete native new-level/restart caller chain are separate questions.

## Input recovery, provenance and limits

The supplied archive was verified at 322676040 bytes, SHA-256
`6aa6c366809ea1d9575ec1d31a24527a95c7332f0a1d2ab692f7a602e7e10702`.
The unchanged maintained `scripts/extract-reference.py` selected **Component0,
`d3dpoptb.exe` only**. Extraction completed exit 0 in 6.237 seconds on CPU4, with a
120-second wall limit and 4-GiB address-space limit. Archive and script hashes
were unchanged. Output is 2275840 bytes, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.

Only the required official PyPI runtime dependency `pure-magic-rs==0.5.1` was
added task-locally to the already verified `binary-refinery==0.10.11` source.
Its cp312/manylinux x86_64 wheel hash and the source archive hash are pinned in
the [manifest](training-panel-auto-reset-source.json). The earlier missing-module
import failure was preserved; successful import is a parser prerequisite, not
evidence about original behavior. No project dependency or package file changed.

GNU objdump 2.44 decoded file-backed bytes only. Initial bounded discovery windows
included adjacent bytes; the published excerpts end at the two exact returns,
and **no conclusions use neighboring functions**. The manifest pins PE offsets,
function-byte hashes, exact commands, raw-output hashes, published-excerpt hashes,
retained helper hashes and the extraction receipt. Raw archives, executable and
runtime dependency files remain local. This is static source evidence, not a
dynamic save/load or full-game equivalence result. Gameplay implementation,
ordinary runtime acceptance and parity credit remain separate.

The next proposed port step is the [model7 implementation contract](training-panel-auto-implementation.md), which keeps source facts separate from browser adaptations.
