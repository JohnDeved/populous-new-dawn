# Issue 248: Preacher placement and command17 ownership

The newly decoded `004f5770` has no person mutation: its executed helper closure is read-only except for the caller's packed-cell and ten-cell scratch outputs. `0043b790` preserves the actual person, computer assignment `+0xaf`, and byte `+0x7f` in the concrete ordinary dry-ground order-replacement case below. Its successful attachment does clear a different flags3 bit, `+0x14 & 0x02000000`; it does not clear the membership mask `0x2000`. This closes a finite Preacher4 source boundary. It neither supplies the missing actual M6 phase3 full cohort nor authorizes admission activation.

Only these two missing bodies were decoded. All other code cited below is a hash-matched existing export at `4754e12d3590bde18656416514871b033de164be`. There was no native, emulator, port, browser or campaign execution. `provenance.json` binds the two commands, exact executable/tool identity, instruction ranges, existing source inputs and accepted reports. `SHA256SUMS` binds the frozen packet.

## Source boundaries and actual caller

Original EXE: 2,275,840 bytes, SHA256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`. GNU objdump 2.44, SHA256 `96afb8521834982d0e711b5d6e9785252bf82129fb0106b93a6bd54d83fae11f`.

- `004f5770.asm.txt`: function starts `004f5770`, last RET `004f594a`, padding starts `004f594b`; 475 instruction bytes, SHA256 `38e68b1da1d84b699f7e26abfb73674a7816876b6fe6920976e811187a87ff0a`.
- `0043b790.asm.txt`: function starts `0043b790`, last RET `0043b8d9`, padding starts `0043b8da`; 330 instruction bytes, SHA256 `88475fe0b668dd3f80d883baff89bcda91833a7d25ec9e08856c547f52a1996d`.

The accepted `004ce2c0` maintenance excerpt counts a matching ordinary model4 person before this work (`004ce43d`). At the first unlatch visit it supplies `(tribe, &packedTaskTarget, tenCellScratch)` to `004f5770`; only a nonzero result calls `0043b790(person, preparedCell)`. It then sets person flags4 `+0x10` bit `0x40` even when placement/order allocation fails. Later idle/non-sermon and chosen-target cadence paths call the same pair. These are the callsites already bound by the accepted historical model4 inventory; there is no direct assignment release in this model4 branch. The helpers' return values do not undo the already incremented visit count. The separate `+0x7f` special-bit branch is outside this ordinary-model closure.

The caller passes stack scratch, not a person-field alias, to the placement helper. Its scratch list is shared among the visited Preachers in that maintenance call. A successful placement can consume a scratch entry before a subsequent order allocation fails.

## 004f5770: exact placement operation

Arguments are tribe pointer, writable WORD packed cell, and ten DWORD used-cell entries. It first tries the supplied cell, with each packed byte masked even and centered as `(evenByte + 1) << 8` for its point checks. `0044e940` obtains height; `00518200(point, 0)` must return low byte zero; `004f5680(tribe, originalPackedCell, 0)` must return zero; the original packed cell must not equal any of the ten entries.

On success it writes the cell to the first `0xffffffff` scratch slot if one exists and returns1. A full scratch list does not itself make the candidate fail. The initial successful cell is not rewritten through the caller's WORD pointer.

If the initial candidate fails, it tries up to24 candidates from `0049c890(originalPackedCell, index, 0)`, indices0..23. Each undergoes the same centered point, occupancy and duplicate checks. The first accepted candidate is written through the caller's WORD pointer and optionally into the first empty scratch slot; return1. If all24 fail, return0 without those output writes. This helper consumes no RNG.

Existing helper closure:

- `0044e940` reads terrain height/triangulation and returns height; no calls or writes to persons.
- `00518200` reads cell flags, category flags and four standability bits. It rejects occupied/restricted/unsuitable cells and has no nested calls or persistent writes.
- `004f5680(..., 0)` walks the supplied cell's object chain, tests class1, matching tribe, and `004df0e0`. Its optional whole-tribe branch is skipped because the third argument is zero. `004df0e0` is a pure state10/33, current uncancelled command17/31/32 predicate. No assignment write occurs in either body.
- `0049c890` computes deterministic wrapped square-ring offsets from its scalar arguments; only locals are written.

Thus the full placement call cannot retire or replace a person. This conclusion uses the existing actual export bodies, not the helpers' descriptive names.

## 0043b790: allocate before cleanup, then attach

Arguments are the existing person pointer and packed cell. Its inline allocator scans at most800 ten-byte order records, starting at signed WORD cursor `0096aa78`, wrapping at slot800 to slot1. A free record has reference count zero. Allocation clears its model, flags and associated-object WORD, advances the cursor, and leaves the payload until preparation. It does not acquire a reference yet.

With valid cursor1..799 and every usable record referenced, the helper returns0 without person, pool or cursor mutation and makes no calls. Cursor0 is excluded: it can reset slot0/advance before returning the failure sentinel.

On a nonzero allocated ID it centers the packed cell as `(evenByte + 1) << 8` on both axes and calls `00438730(id, 17, &point, 0)` at `0043b85f`. It then:

1. Sets person flags2 `+0x0c` bit `0x10` and resets order cursor `+0xa6` to0.
2. Calls `004364d0` for every nonzero queued slot0..7 and then for a nonzero immediate order.
3. Clears flags2 mask `0x08000000` and flags4 mask `0x200`.
4. Calls `00436d00(person, newId, rereadCursor)` and returns1.

There is no direct write to state/substate, identity, `+0xaf` or `+0x7f`. The reread cursor matters: the successful queued-attachment conclusion requires cleanup that preserves cursor0, as in the finite case below.

## Composed ordinary case: same person and membership survive

Supply one valid class1/model4 person, with state10 and the following explicit ordinary conditions. They are a source case, not an assertion that every captured M6 field has been observed:

- `+0x76 & 0x20 == 0`; no shared fight-release branch.
- Cursor0, immediate order0, one uncancelled current command17 in queued slot0, reference count1, associated object0; other slots empty. The pool active count is valid and the allocator cursor is1..799. A different free usable order slot exists for the successful case.
- The prepared destination is an unoccupied ordinary dry cell: cell flags lack `0x200`, and its category flags have `(flags & 0x3c) == 0`. The complete placement call additionally supplies its ordinary pass/fail terrain/occupancy/list prerequisites.

Command17's descriptor flags are exactly `0x20081`, verified in both `original-rules.json` and the original four bytes at `005a7f40` (`command17-table.json`). Thus `00438730` writes command17 and its point payload, the supplied dry category skips `004ec630`, no cell-building flag means `004044b0` is skipped, and mask `0x80000` is absent, excluding target-model rewriting. Preparation has no remaining executed callee in this finite case.

For the old command17, `004da1d0` returns false: its active-work predicate requires command19/21, so no `+0x89` target release occurs regardless of the stale target word. Command17 also skips the model7/model30 special cleanup. Its reference goes1→0 and active count decrements; associated object0 excludes `004ef180`. The old slot and command status `+0xa7` clear. `00501be0` does nothing because bit0x20 is clear. Cursor0 survives. This is the same accepted cleanup body with a command17 predicate exclusion; the earlier command19 proof's conditional target mutation is not silently carried into this case.

`00436d00(person, newId, 0)` increments the fresh order reference0→1 and active count, clears flags3 mask `0x02000000`, clears WORD orderLocation `+0x83`, writes the new ID to slot0, and calls `0043b010`. The resulting queue contains only command17, so `0043b010` finds no route11/25 run and writes nothing. The person is never removed, allocated or replaced.

Final observables: same person identity, state/substate, `+0xaf`, `+0x7f`, and membership flags3 mask0x2000; new centered command17 in slot0/reference1, cursor0, immediate0, status0, orderLocation0; flags2/flags4 and flags3 mutations exactly as listed above. No simulation or cosmetic RNG is consumed. This command17 replacement cannot justify retirement of the raid assignment. A failed allocator retains the old queue/person; the outer maintenance caller may still set its latch and count the person in that visit.

## Deliberate remaining boundaries and port representation

Successful dry ordinary replacement is closed. For other terrain, the next preparation branch is the existing `004ec630` coast adjustment (and its direction producer `004655f0`); this pass does not claim all terrain effects. For other queues, the explicit remaining ownership branches are `00501be0→004d4f40` when bit0x20 is set, and `004ef180` on final release of an associated object. Model30 cleanup has its separate tribe/Shaman/RNG effects. Those exclusions must not be silently generalized.

The maintained Preacher interruption/restart material and actual-caller tests were checked as reuse: `automatic-preacher-and-raid-ownership.md`, `preacher-automatic-response.test.mjs`, `preacher-terminal-restart.test.mjs`, and the shared-order sections of `references/reverse-engineering.md`. They already distinguish retained controller identity, supplied native boundaries and world-effect exclusions. Restart/automatic32 proof does not establish this specific phase16 placement producer; it also does not authorize skipping associated-object/fight cleanup.

Current port state can represent the finite case using the registered person, known flags4/flags3, existing order pool/cursor/reference/object fields, terrain data, and a per-visit local used-cell list. `nativeFlags7f` may remain absent: preservation does not require inventing a byte. The actual type20 runtime currently emits its own command17 at group attack dispatch, using `appendLiveOrders`; it does not compose this original phase16 placement/latch/used-cell operation. `computerPreachingAt` also includes a whole-tribe/payload alternative, so it is not automatically interchangeable with the native third-argument0 cell-only call. This report supplies source expectations for a later actual-caller test; no test or runtime change is made here.

The accepted M6 selected IDs show model3 Warriors plus model4 Preacher, not Spy5/Shaman7. Their selected array is still not the entire original phase3 state14 set. The historical inventory froze before these two new bodies existed; its body-absence statement is historical, while its full-cohort observation gap remains current. No Warrior-only or arbitrary3/4 activation gate follows from this report.
