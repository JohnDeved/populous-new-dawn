# Three pre-authored initialization calls: finite class-2 ownership classification

Issue #61. Source assessment remains `f9675f56c597ec83adf02f28e9801bfc6bbd0490`;
research branch was clean at `b79c2b4e4aca0bb78ea83b776a7306d04b1bd317`.
This pass classifies only `0042c8f0`, `00430bb0`, and `00448ea0` from
`load_level` (`0042b230`), plus four direct helpers of the first call and the final named limiter leaf. It does
not reconstruct the full allocation stream or change runtime code.

## Result

Two named functions are proved to make only fixed non-unit zero writes, without
calls: `00430bb0` and `00448ea0`. They cannot allocate/retire records, alter
physical IDs, change unit pool heads/counts, or alter unit cell membership.

`0042c8f0` is now also closed for these four unit-owner questions: its complete
local body, four newly inspected direct helpers, three retained timer helpers,
and the final specifically authorized `0049cfa0` leaf have no pool/count/ID/cell
writes or record allocation. The limiter leaf has no further calls.

Existing accepted [worship handoff research](../../../decomp/research/worship-grant-handoff.md)
identified limiter-bit clearing while intercepting that setter in its probe.
The new complete-body bytes independently establish that absence of pool effects
and additionally expose a conditional fixed dword copy. This supersedes the
first packet's explicit uninspected-child qualification; the original findings
and input manifest are retained. It does not strengthen the old probe's scope.

## Caller order and guards

The accepted fresh-reset packet binds `0042b258 → 004eef50 → 004ee300` and
subsequent terrain clearing. Its caller slice ends exactly at `0042b286`.
The new aligned slice continues there through `0042b34e` (exclusive):

1. `0042b286` tests caller argument mask `0x1`. Both branches update bit 2 of
   `00895da8` and rejoin at `0042b29d`.
2. `0042b29f → 00443910(0)` precedes `0042b2a7 → 0042c8f0`.
3. A fixed dword zero at `0096aa7e`, then `0042b2b6 → 00493a40`, precede
   flag masks at `0089d17c` and a zero fill of `[00969e9d,0096a1bf)`
   (200 dwords plus one word).
4. `0042b309 → 00430bb0` then `0042b30e → 00448ea0` are consecutive.
5. Only afterward come `00479f00(8,0,-1)`, `00479f00(10,player,0)` and
   `004af1c0(1)`. The `level_number == 0` branch at `0042b348` is later still.

There is no local conditional skip of the three selected calls from the joined
argument branch through `0042b313`. This statement assumes the intervening calls
return; it is not a claim about their failures, external callbacks or all callers
of `load_level`. The retained `0042b230.c` supplies subsequent resource loading
and `00484a10` context. Those later calls and `00493a40`'s transitive effects are
not newly audited here.

## Complete selected bodies

| Entry and return | Concrete effects | Unit ownership classification |
| --- | --- | --- |
| `00430bb0`, return `00430bce` | Zero `[00683b70,006841ea)` (414 dwords + one word) and `[0096a1bf,0096a4bf)` (192 dwords). No branch or call. | No pool/count/ID/cell writes or allocation. |
| `00448ea0`, return `00448eb0` | Zero `[00969bd2,00969d8e)` (111 dwords). No branch or call. | No pool/count/ID/cell writes or allocation. |
| `0042c8f0`, return `0042c9fc` | Fixed globals and flags; zero `[00899ed3,00899f8b)` (46 dwords); seven direct calls listed below. No local branch. | No pool/count/ID/cell writes or allocation across the bound call chain. |

`0042c8f0`'s fixed writes are: word `0089c6e1 = ffff`; zero dwords
`008922e8`, `008922d8`, `008922e4`, `0089bc22`, `0089bc26`; zero bytes
`0089ce43`, `0089d160`, `0089bb67`, `0089ce60`, `0089d166`, `0089ce34`;
byte `0089d165 = ff`; dword `0096aa74 = 0096aaba`; and bit clears in
`0089c669`, `0089c66d`, `00895da4`, `0089c661`, `0089b739`, `00895da8`.
The constant pointer write does not dereference the pointed record.

These addresses/ranges do not overlap the accepted fixed unit storage
`[008e0428,00937a98)`, terrain cells `[008a03e4,008e03e4)`, heads
`0089031c..00890330`, counts `0089c651/55/59/5d`, range globals or the lookup
at `00890390`. This is checked address separation, not a semantic inference
from decompiler names. Whole-function claims exclude neighboring entries and
padding in the retained diagnostic decode ranges.

## The first call's immediate helpers

| Callsite → entry | Bound effect | Return / remaining edge |
| --- | --- | --- |
| `0042c93e → 00480e70` | Zero six bytes: `00985b56`, `00987a1e`, `00988a96`, `00988a76`, `00986bae`, `0098c5b6`, matching retained acquisition-controller active fields. Then pass 4 to `0049cfa0`. | Return `00480e9a`; final named leaf `00480e92 → 0049cfa0(4)` is bound below. |
| `0042c943 → 004a9c40` | Zero byte `0098e91c`; no call. | Return `004a9c47`. |
| `0042c948 → 004f0de0` | Dword `0089c6a1 = ffffffff`; zero dwords `008922dc`, `008922e0`, `0089c6a5`; no dereferenced write or call. | Return `004f0dfb`. |
| `0042c961 → 00422fa0` | Zero `[006513e0,0065ad4e)` (9819 dwords + one word); no call. | Return `00422fb2`. |
| `0042c9e8 → 004a5d20(0,0)` | Retained timer setter stores remaining/decrement zero and flags 3. | Existing manifest-bound export. |
| `0042c9f0 → 004a5eb0` | Retained timer helper clears bit 1. | Existing manifest-bound export. |
| `0042c9f5 → 004a5ee0` | Retained timer helper clears bit 2. Together the three leave the timer's remaining/flags/decrement zero at `0096a85c/60/64`. | Existing exports plus accepted Mission 15 timer research. |

The four direct helper bodies have no local branches. Only `00480e70` has a
call. Its final named child `0049cfa0` reads the argument's low byte, inverts it,
and ANDs byte `0096ead4` with that mask (`0049cfa0..0049cfab`). If the resulting
byte is nonzero, `0049cfac` jumps directly to the common return `0049cfb8`.
If it is zero, `0049cfae..0049cfb7` additionally copy dword `005ca848` to
`005ca850`, then return at the same address. There is no call or dereferenced
record write. With argument 4 the byte operation clears bit `0x4`; the dword
copy is conditional on all resulting limiter bits being zero, not merely on
bit 4 having been set. Both fixed destinations lie outside unit identity,
pool and cell owners. No further leaf was followed.

The retained `00480ea0.c` binds the six controller-byte labels in the table;
the numeric writes themselves are established by the new assembly. These
complete helper bodies close the first function's transitive unit-owner effect
classification without inventing a native execution or wall-clock observation.

## Method and proof limits

The existing EXE was read as data only, SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
GNU objdump 2.44 (`/usr/bin/objdump`) SHA-256
`96afb8521834982d0e711b5d6e9785252bf82129fb0106b93a6bd54d83fae11f`
was checked before and after each bounded group. Commands used `-d -M intel`,
explicit address bounds, CPU 4 and short timeouts. All 16 decoder calls exited 0
with empty stderr. Seven initial wider ranges are retained locally, including
unrelated neighboring bodies/partial neighboring instructions; the publication
selections retain only the nine caller/complete-body ranges identified in the
manifest. Completeness follows actual aligned flow and returns, not endpoints.
No original instruction was executed. No installer, extractor, Ghidra project,
probe, game/browser run, test, dependency change or raw binary publication occurred.

This narrows the post-reset/pre-authored interval; it does not establish a clean
allocator state immediately before `00484a10`. The already accepted startup
range/index calls, conditional reset-return order, authored insertion/relocation,
linked deactivation and retirement/recycling proofs stand. Known authored
allocation producers (`00403610` class6/model9, `00485b00` class6/model10,
`004866a0` neutral class2/model18) are unchanged and outside this pass.
Their full composition, native Save writer/reader, and the current port's absent
shared class-2/Vault physical-ID and lifetime owner remain separate prerequisites.
No arbitrary building-array alias projection or Swarm gameplay parity follows.

Independent source review accepted these findings, SHA-256
`23ad13c0c723c50903e042b249a14bb6151a21af2ddeebda3193ba6e7dc35cb6`.
The [manifest](manifest.json) pins source inputs, selected unchanged assembly,
all decoder command receipts and the preserved qualified predecessor.
