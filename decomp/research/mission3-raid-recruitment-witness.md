# Mission 3 raid recruitment: first controlled origin mismatch

## Executed boundary and result

One independently reviewed, coordinator-granted CPU4 attempt ran on clean source
`cff436a3b1f3e19470fd533b658d607829caad70`. The original foreground session was
95054; the source-bound receipt ran from **2026-10-06 05:55:15.869 to
05:55:17.782 UTC**. Exit 1 and receipt status **failed** retain a real paired
`mismatch`, not a failed import or setup and not a passing implementation.
No retry, runtime repair or additional case ran.

[Raw receipt and streams](../../references/verification/mission3-raid-recruitment-origin-2026-10-06/attempt1/)
retain both native and actual portable records, complete native task/person bytes,
400-byte selector scratch, call arguments, flags and source/input identities.
Receipt SHA256 is
`1851fdbdc7f36859ea07b7179be87cd50c82c553c591c881b191f5d4adc94364`.
The [preflight](mission3-raid-recruitment-preflight.md) defines all supplied state,
comparison fields, wrappers and bounds; its frozen manifest is unchanged.

## Observations

1. **Common-origin control:** original and live adapter both use `0x64fc` and
   select IDs **306,302,303**, with ranks **34,36,38**. All declared selector,
   count, IDs, ranks, flags3, task and RNG fields match. Native radius 0 versus
   portable radius 11 is explicitly retained outside the comparison. This
   state-17 control does not exercise defending-order radius or prove equal
   world inputs.
2. **Unestablished base:** original `004f6020` returns Shaman cell **`0x60da`**;
   the actual live adapter supplies script defense cell **`0x64fc`**. Original
   selects **301,302,303**, with ranks **2,2,4**; the adapter selects
   **306,302,303**, with ranks **34,36,38**. Accordingly original clears flags3
   bit0 on person 301 and leaves 306's bit set, while the port does the reverse.
   The differing declared fields are `selector`, `ids`, `ranks`, and `flags3`.
   Both counts are 3; task projection and RNG match. Recorded non-compared tribe
   inputs differ in `hasBase`, `base`, and `radius`, while Shaman cell agrees.

This is an executed mismatch in the existing adapter's recruitment-origin
ownership for explicitly supplied controller/world inputs. The seven supplied
person records, list order and command inputs matched on both sides before each
original call. Original selection and all reached eligibility leaves executed
without interception. Portable computation used actual `stepComputerTasks`,
`stepAttackTask`, `computerSelectionWorld` and `selectComputerPeople`.

Both native calls stopped **before `004cb6da`**, with EAX count and nine selector
arguments still on the caller stack. Task selected count stayed 0 and selection
cursor became 1. The portable sentinel fired after the live callback copied
flags3 back to the source people, before task membership/count or person actions.
Full before/after assertions permitted no other portable world changes. Native
write guards and byte comparisons permitted only stack/scratch, task visit
counter/cursor and selected flags3; person state/assignment, commands, other
slots and RNG remained unchanged. RNG stayed **305419896** on both sides.

## Bounds and cleanup

Exactly **two portable requests and two native calls** ran, incrementally; pair1
was requested only after pair0 matched. Each native trace contains 64 observed
entries, below its 128-entry bound. Both TCG buffers read **16,777,216 bytes**.
Python/native peak RSS was **145,576 KiB**. The accepted 1 GiB address-space,
30-second CPU, 60-second alarm, per-call instruction/time limits and 65-second
outer timeout remained in force; no limit, forbidden-entry or write assertion
failed. These are resource observations, not a gameplay or hardware benchmark.

Source HEAD, clean tracked diff and all **254 receipt inputs** were identical
before and after execution. Outer stderr is empty. The report separately retains
Node's experimental-module-mocking and namedExports deprecation warnings; there
was no mock/import/shutdown failure. The portable close waited for exit0 and
rejected unsolicited output. The original foreground session terminated; a
subsequent process check found no matching probe or adapter. CPU4 is released.

## Limits and review status

Phase3, existing selection lock, subtype/task, roster, list creation, flat portable
terrain and native world fields were supplied. The authored coordinates do not
make this a naturally occurring raid: no original world loading, population
gates, allocation, full scheduler or campaign run was performed. The first real
raid's original-versus-port member IDs remain unproved.

The distinct-established-base and radius-specific output cases remain unexecuted.
Neither the control's unequal radius inputs nor this origin witness establishes
a radius-behavior mismatch. Later visit/fill behavior, membership, commands,
paths, combat, rendering and complete Mission3 parity are also outside the claim.
Issue227's accepted admission repair remains unchanged and is not broadened.

Independent result review accepted this controlled origin witness. The next
[distinct established-base preflight](mission3-raid-recruitment-established-preflight.md)
is prepared separately; it has not executed or authorized a runtime correction.
All evidence is committed locally and bundled for review, **unpushed and not
reset-durable** while normal Git publication is unavailable.
