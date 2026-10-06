# Bounded repair re-review

**ACCEPT for the single declared CPU4 probe**, subject to the coordinator's
resource grant, at exact clean head
`ee5f596d043bed6c9150be74146fa4d4acd95938`. Review covers only the repair delta
from `e2bcc32a6fd0a088e3ef4f9f092f7bab3af8b984`, not a runtime result.

Both prior launch blockers are resolved:

- Guest writes now require exact full-span containment in named mutable actor,
  allocation-context, stack, alert, RNG, allocation flag/pointer or four land-list
  head ranges. Page permissions independently keep original code and immutable
  animation data read-only; the fixture is read-only except declared pages and
  the initializer thunk is RX. Byte guards protect unrelated data on shared
  mutable pages. An unexpected native write aborts; this approval permits no
  range expansion after a failure.
- Each fixture and visit-before state reaches disk before emulation. Exceptions
  retain partial state, PC/SP/EAX, events, case/visit and terminal error. Child
  stdout/stderr are disk-backed from start; timeout/error cleanup addresses only
  the unreaped direct Popen child, with TERM then KILL and wait4 confirmation,
  exact child RSS and retained log hashes. Terminal failure is saved afterward.
  Uncatchable interruption remains a retained running/unknown state, never success.

The host-only checks at the exact head verify range boundaries/immutable-address
rejection, exception/timeout/assertion retention, ordinary direct-child completion
and a TERM-ignoring child that is killed and reaped. The timeout receipt reports
failed, reaped=true, returnCode=-9, sentTerm=true, sentKill=true and no cleanupError.
These checks do not prove Unicorn or the application comparison executes.

Fixed ordering is now honest: eight person native cases, eight building native
cases, one 16-case actual-port batch, then a comparison sweep. The first mismatch
file identifies the first difference in comparison order; it promises no early
stop at a difference. Setup/input/write/instruction/resource failures still abort
immediately. Existing case, call, instruction, event, process, time, memory and
output bounds are retained. No new cases or result-driven adaptation is approved.

Native assignment 0x200, f2=0/f1=1, first decrement and wait-phase hold remain
observable through the unchanged real setters. Descriptor 13/14 identity remains
explicit. The ordinary command-21 acquisition/movement route remains a source
plan, with no browser launch readiness or firing witness claimed.

Validation reused and independently checked: `host-check-01.json` and
`source-preflight-02.json` both passed with unchanged clean exact-head identity;
raw artifact/stdout hashes agree. `git diff --check e2bcc32a..ee5f596d` passed,
exit 0. No emulator, actual port, browser, package or full gate ran during review.

Nonblocking documentation correction: preflight.md:146 calls Python's 512 MiB
address-space limit hard. The code sets **soft 512 MiB / hard 8 GiB**, permitting
the Node child's 8 GiB cap. This acceptance uses those actual enforced code limits,
not the inaccurate word in that sentence. Parent Python never raises its own
soft limit during the proposed run.
