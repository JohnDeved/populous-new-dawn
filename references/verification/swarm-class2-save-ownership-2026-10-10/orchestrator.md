# Swarm prerequisite: actual ordinary Save target

`00427220` is a complete orchestration body through its final return at
`00427722`. It has a concrete header-buffer transfer request and slot/path work,
but both major branches first require `00426d70` to return nonzero. That is the
next exact state-persistence candidate; its body is absent from selected
exports. The present body does not establish which native unit identities or
cell/allocation lists are saved. No child was decoded.

This follows the accepted command binding `004ab82b → 00427220` for command
`0x9c`, submode 3. Assessment base remains `f9675f56`; research head remains
`4037f8ba`. Only the approved `[00427220,00427730)` data window was decoded,
using the unchanged canonical EXE and objdump. Every local branch target is
inside the body. Its eight returns are `00427286`, `0042735f`, `00427496`,
`004274a5`, `004274e5`, `004275be`, `00427716`, and `00427722`. The last 13
bytes are `int3` padding, excluded from body behavior. There is no tail jump or
indirect call in this body; the numeric callees remain separate operations.

## Guard and state preparation

At entry, the function clears mask `0x3e00` in dword `0089d17c`, then ORs a
single bit selected by byte `0089c6ec + 9` under x86 shift-count semantics.
It calls `004aef50(1)` at `0042724b`, then tests bit 0 of `0089d17c` after
that call. The callee is uninspected; no claim that it preserves this field or
unit state is made.

| Tested bit 0 | Before the prerequisite call | Prerequisite and failure |
| --- | --- | --- |
| Set | Copy low byte `0089c6dd` to `0089b73f`, zero-extend it into `ebx` | `0042726f → 00426d70(ebx)`; zero returns 0 at `00427286` |
| Clear | Set/clear dword `0089b739` bit `0x02000000` according to byte `0088f000 == 10`; zero-extend byte `0089b73f` into `ebx` | `004274ce → 00426d70(ebx)`; zero returns 0 at `004274e5` |

After either successful prerequisite call, the next call is
`00427288/004274e7 → 004860c0(ebx)`. The existing retained
campaign contract supplies only that callee's memory-snapshot behavior and
sentinel-99 exception. This packet does not enlarge its schema or treat it as
unit-state serialization.

The direct absolute writes in this body are to `0089d17c`, `0089b73f`, and
`0089b739`; other visible destination construction is on the local stack.
The arguments and transitive effects of child calls are distinct from this
direct-write inventory.

## Header-buffer boundary

Both branches construct local strings using the caller's single argument
(the dispatch supplies 9 or 10), call `004a3200` and `004a3d20`, and resolve a
local path through `005001b0` into `0089cd23`. Then:

| Operation | First branch | Second branch |
| --- | --- | --- |
| `00526280(&localHandle, 0089cd23, 0xc0000010)` | `004272fe` | `0042755d` |
| Require zero open result | `00427308` | `00427567` |
| `005265e0(handle, 0089a3a9, 0x1398, &localCount)` | `0042731e` | `0042757d` |
| Require `localCount == 0x1398`, then close through `00526370` | `0042732a–00427344` | `00427589–004275a3` |

The accepted sky/path research already identifies `00526280` as the open
adapter with zero success and `00526370` as close. The `005265e0` body is absent
from selected exports, so this pass binds its exact transfer arguments and
count check without claiming a completed OS write or a byte-compatible file.
The return register from `005265e0` itself is not tested here.

The requested buffer is exactly `[0089a3a9,0089b741)`, 5,016 bytes. It excludes
the accepted fixed-unit storage `[008e0428,00937a98)`, terrain/cell-head block
`[008a03e4,008e03e4)`, unit lookup `[00890390,008922d0)`, pool heads near
`0089031c`, and counts near `0089c651`. Therefore this particular header-buffer
request does not directly include those live owner address ranges. Address
separation does not exclude copied or encoded IDs or other derived state already
in the header. It also does not constrain what the prerequisite `00426d70` or
other uninspected children do.

## Remaining local path work and returns

On header-request failure the function returns 0. On success it performs
additional stack-string/path operations using numeric children `004fffe0`,
`0055b450`, `00526480`, `00526500`, and `00526560`. Existing path evidence
identifies `00526480` as an existence check; meanings of the other newly exposed
file-operation bodies are not inferred from their call shapes. The first local
loop supplies indices 0 through 29, then replaces 30 with sentinel 99. The
set-bit branch then handles the selected `ebx` path. The clear-bit branch has
a second loop whose path body is gated by `edi == ebx`, retaining the literal
30-to-99 rewrite and its local comparisons. No broad slot/file format contract
is needed for the identity question.

The local return convention is 0 for a prerequisite/header failure or a
nonzero checked `00526560` result, and 1 after the success path. These static
branches establish the caller's status handling, not a real save operation.
No originals, user saves, or files named by this body were opened or written.

## Exact remaining persistence frontier

The selected-export availability receipt records all immediate callees.
`004860c0`, `004a3200`, and `005001b0` have selected generated bodies; the
other eleven numeric targets do not. Accepted path research supplies the limited
adapter facts explicitly reused above. No complete transitive effect claim is
made for the other available bodies.

The smallest next ownership question is **`00426d70`**, called on both major
Save branches before the header request, with the zero-extended level byte as
its sole pushed argument. Its body is missing from the selected export set and
has not been decoded here. It could establish the live unit-state writer or
lead to another bounded producer; its role is not settled by the dependency
alone. `00427730` remains the independently bound but uninspected user-Load
target. Scheduler `004ec9fa → 004f0bd0` remains a separate, body-uninspected edge.

This packet closes the route-to-orchestrator distinction and isolates the
header span. It does not establish restored allocation order, physical-ID reuse,
cell membership, pending retirement, Swarm target/history continuity, or
modern checkpoint fields. Original binary-save compatibility remains outside
the promised goal, and current browser arrays cannot fabricate missing native
identity history.
