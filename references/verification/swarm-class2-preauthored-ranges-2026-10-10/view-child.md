# The 00417270 pre-authored view child

Source-only follow-up to the accepted two-window range/caller packet. Assessment
base remains `f9675f56c597ec83adf02f28e9801bfc6bbd0490`, research head
`05cfd90942f122b08dbb1bba0509b3eda76b562b`. One capped window
`[00417270,00417310)` was authorized and accepted before decoding.

## Closed direct ownership and the exact remaining edge

`00417270` returns at `00417300`; `00417301..0041730f` is padding before the
next retained entry. Its complete local body writes only word `0089c6c3` and
four rectangle words `0088f026`, `0088f028`, `0088f02a`, `0088f02c`. These lie
outside fixed units, their physical-ID/link fields, unit lookup, pool heads,
counts, range globals and terrain cells. It performs no direct record
allocation, retirement, physical-ID mutation or unit membership write.

There is one conditional call, **`0041729c → 0044bb80`**. No selected complete
body or accepted complete-body effect proof was found for that target. Its
return is used as a width deduction, which does not prove it is side-effect
free. The call remains an explicit transitive edge. No further child was
decoded, and no renderer call-graph audit was started.

## Exact local behavior

The retained `00479f00(8,0,-1)` path selects case 7 and invokes this helper
with `DAT_0089c6c3` and 1. The new bytes show:

1. Read the first argument's low unsigned byte `n`; calculate `8*n`.
2. If byte `0089c661` bit `0x4` is clear, byte `0089c666` bit `0x2` is
   clear, and the second argument's low byte is nonzero, call `0044bb80`.
   Otherwise use zero for the width deduction `d`.
3. Read signed screen-width word `0089c6cf`. Continue only if
   `16*n < width-d`; read signed height word `0089c6d1` and require
   `16*n < height`. Failed tests return without the five local global writes.
4. Store `n` to `0089c6c3`, and low-word results to the rectangle:
   `x=d+8*n`, `y=8*n`, `width=width-d-16*n`, `height=height-16*n`.
5. Restore registers and return at `00417300`.

The existing `00417310.c` uses the same `vconfig_struct_0088f004` rectangle and
screen dimensions; this supports the view/configuration correspondence.
It is a neighboring retained consumer, not a callee of this new body. No claim
about that neighbor's entire transitive effects is needed or made here.

## Relevance to actual Swarm identity

This routine's demonstrated local behavior is view configuration. It supplies
no new class-2 lifetime or raw-ID producer to port. The uninspected width call
prevents an exhaustive transitive absence claim, but it is not evidence of a
game-record allocator. Generic heap/resource operations and fixed view writes
must not be equated with native unit allocation: changing the unit identity
state requires a concrete write to its owners or a call into an owner such as
`004ed8a0`, retirement/recycling, or unit cell membership.

The useful identity frontier remains the actual authored allocation edge
**`0042b3c8 → 00484a10`** and the already documented live class-2/Vault
lifetimes. The grouped two-window packet binds the surrounding resource gates
without assuming those resource calls are inert. Native Save/Load is another
finite ownership boundary: determine which physical IDs and allocation/cell
state are stored versus reconstructed, using retained `004f0bd0` and the
`004aab80` Load caller before choosing any missing body. That is necessary for
persistent Swarm target/history identity; recursively proving the renderer is
not a substitute. No Save/Load assessment, new runtime design or synthetic
building-array identity projection is delivered by this view-child result.

## Evidence

Exactly one GNU objdump 2.44 command ran on CPU 4 with a 5-second command timeout
inside a 20-second outer bound; exit 0, empty stderr. Canonical EXE SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f` and tool
SHA-256 `96afb8521834982d0e711b5d6e9785252bf82129fb0106b93a6bd54d83fae11f`
were verified before and after. Actual aligned local control flow and return
establish the body extent. No original-code execution, runtime edit, browser,
probe, installer, archive operation or test ran. The earlier two-window packet
and its accepted findings remain unchanged and are published with this result.
