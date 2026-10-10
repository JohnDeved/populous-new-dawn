# Pre-authored bulk-reset ranges and exact loader callsites

Issue #61. Source assessment remains `f9675f56c597ec83adf02f28e9801bfc6bbd0490`;
research head was clean `05cfd90942f122b08dbb1bba0509b3eda76b562b`.
This is the accepted two-window scope: the complete `00493a40` body and the
aligned `0042b34e..0042b3db` caller continuation. No child was decoded.

## Result

`0042b2b6 → 00493a40` is now closed for physical unit IDs, pool heads/counts,
unit cell membership and native record allocation. Its complete call-free body
writes only `[0093a770,009556e0)`, above the fixed unit storage ending at
`00937a98`; it returns at `00493aef`. This is a numeric owner separation proof,
not a claim that its auxiliary cache/tuning reset has no gameplay effect.

The caller continuation fixes the authored entry at **`0042b3c8 → 00484a10`**
and its immediately preceding object-bank wrapper at **`0042b3b8 → 0040c670`**.
The formerly unbound `d3d_palette_chanage` target is **`0042b3ae → 004b6320`**.
Conditional resource paths and their exact instruction targets are now bound.
Their transitive effects remain uninspected; names such as palette or resource
do not establish absence of native allocation.

## Exact writes and local flow of 00493a40

- `00493a44..00493a4f`: zero `0x6bdc` dwords from `0093a770`.
  `0x6bdc × 4 = 0x1af70`, giving exclusive end `009556e0`.
- `00493a50..00493a7d`: write dwords `0093a77c = 1`, `0093a780 = 3`,
  `0093a784 = 2`, `0093a788 = 1`. The encoded signed threshold comparisons
  read `0093a778` against 1000, 500 and 300. The preceding clear includes
  that dword, and no local call or intervening write changes it, so ordinary
  sequential flow takes the below-300 path and retains those four values.
  The other encoded branches only change `0093a780` and `0093a788`, still
  within the same cleared interval.
- `00493aca..00493aec`: start at `0093a7a0`, zero six dwords per record,
  advance by `0x18`, set the prior record's byte `+1` to 5, and repeat while
  the next pointer is unsigned-less-than `0093b2e0`. The interval length is
  `0xb40 = 120 × 0x18`. All 120 records are zero except that byte. This
  entire second interval is contained within the first bulk-clear interval.
- `00493aed..00493aef`: restore saved registers and return. There are no
  calls, indirect stores through unresolved globals or branches beyond the
  observed body. `00493af0` is the separately retained next entry, not an
  assumed function endpoint.

The write interval is disjoint from fixed units `[008e0428,00937a98)`, their
`+0x24` physical IDs and link/flag fields, terrain cells
`[008a03e4,008e03e4)`, the 2000-entry lookup `[00890390,008922d0)`, pool heads
`0089031c..00890330`, range globals and counts `0089c651/55/59/5d`.
Those owners are carried from the accepted startup/reset/lifecycle sources.
The retained `00493a40.c` named fields are now tied to concrete addresses;
there is no need to infer layout from the `start_1` name.

## Caller gates and targets before authored allocation

The preceding accepted slice ends with `0042b348`'s six-byte branch: signed
word `0089c6dd == 0` skips this entire continuation to `0042b3db`. The new
start `0042b34e` is therefore aligned and on the nonzero-level path.

| Instruction | Gate / effect |
| --- | --- |
| `0042b34e..0042b35b` | Sign-extend byte `0089ce3d` and compare with the full first caller argument. Equality jumps to `0042b3b3`, skipping the level-change resource group. |
| `0042b35d..0042b36a` | On mismatch, save the argument's low byte to `0089ce3d` and `0096ead0`, then call **`0042a140`** with the argument. |
| `0042b372..0042b382` | After that call, require current byte `005d45a8` equal to 2 or 3 to enter the resource group; other values jump to `0042b3b3`. |
| `0042b384` | Call **`00429c70`**. |
| `0042b389..0042b399` | Read current byte `0089ce3d`: if `0x36`, call **`004bd170`** at `0042b392`; otherwise call **`004bd230`** at `0042b399`. `0x36` is the literal byte test, not mission 6. |
| `0042b39e..0042b3a7` | If byte `0089c6f3` is nonzero, OR bit 1 into dword `0089c669`. |
| `0042b3ae` | Call **`004b6320`**, corresponding to the retained caller's `d3d_palette_chanage` name. |
| `0042b3b3..0042b3b8` | All normally returning nonzero-level branches converge here; pass the second caller argument to **`0040c670`**. Its retained wrapper maps argument zero to 2 before `0040c690`. |
| `0042b3c0..0042b3c8` | Re-read signed word `0089c6dd` and pass it to **`00484a10`**. The value is read here after the earlier calls; it is not assumed identical to the initial gate read. |
| `0042b3cd..0042b3d9` | Clean the argument, test the authored loader result, and set the stack success byte to 1 only for nonzero result. Both visible result branches target `0042b3df`, outside this slice. |

The known level-zero rejoin `0042b3db` and later loader-result handling are not
newly decoded. This packet proves the selected callsites and local guards,
not the full `load_level` return, child success, callback behavior or every
caller of fresh initialization. The earlier numeric direct writes in this
slice concern flags/state bytes outside unit ownership, but no no-pool-effect
claim is made for its uninspected resource callees.

## Concrete next ownership boundary and relevance to Swarm

The earliest remaining always-reached named child is
**`0042b319 → 00479f00(8,0,-1) → 00417270(DAT_0089c6c3,1)`**.
The retained dispatch selects case 7 because it subtracts one from the first
argument; both bit-4 flag choices reach that child. Its selected body is absent.
The finite next outcome would be to classify that exact child for writes/calls
that can alter unit pools, physical IDs or cell membership, stopping at its
return or the first precisely identified unresolved leaf. It has not been
decoded here, and no recursive extension is proposed by this checkpoint.

This is a prerequisite for claiming that the exact reset-return unit state
survives to the first authored allocation. It is **not yet evidence that
00417270 affects Swarm identity** or needs a browser implementation change.
Other retained guards still leave `00479f00(10,player,0)`'s sound/timer edges,
`004af1c0(1)`'s cleanup family, and the newly located resource/object loaders
unclassified transitively. If the child proves presentation-only, that removes
one proof boundary; it does not create a new gameplay feature requirement.

The actual positive identity producer remains `0042b3c8 → 00484a10`, with
shared allocation and already known authored initializer allocations
(`00403610` class6/model9, `00485b00` class6/model10 and `004866a0` neutral
class2/model18). Swarm acquisition consumes cell order and remembers raw IDs;
future pursuit permits reused raw IDs without a class-2 recheck. Complete
allocation/reuse composition is therefore relevant to exact native identity.
Current browser terrain IDs, Building-array order and omitted neutral Vault
bodies do not establish that composition. Save restoration and a persistent
port lifetime owner remain separate. No runtime proposal follows from this
negative-effect classification alone.

## Evidence method and limits

Exactly two GNU objdump 2.44 data-only commands ran on CPU 4, with 5-second
per-command and 20-second outer bounds, both exit 0 and empty stderr.
EXE SHA-256 `3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`
and tool SHA-256 `96afb8521834982d0e711b5d6e9785252bf82129fb0106b93a6bd54d83fae11f`
were verified before and after. The frozen two-window proposal was accepted
before decoding. Actual returns and aligned branches determine completeness.
No original instruction was executed; no child decoding, archive extraction,
installer, Ghidra project, runtime change, game/browser run or tests occurred.
