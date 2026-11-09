# Rolling Demo: deferred input lock and release

Refs [#16](https://github.com/JohnDeved/populous-new-dawn/issues/16). This static
follow-up closes the deferred-service boundary left open by
[Rolling Demo control](rolling-demo-control.md). It does not implement a replay,
prove OS/browser focus restoration, or evaluate native instructions.

All addresses and literal tables below bind to original D3D executable SHA-256
`3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f`.
[Provenance](rolling-demo-input-evidence/provenance.json) records seven complete
instruction windows, their exact byte hashes and three literal tables. Retained
Ghidra exports are navigation, not authority for names or types. In particular,
the export's `set_input_command_handler` name does not mean `00526a80` merely
installs a callback: its instructions actually dispatch a bounded event batch.

## Separate state, one shared pending mask

Use these descriptive names only within this note:

| Address / flag | Observed role |
| --- | --- |
| byte `005cdb78` | Handler-active guard tested by immediate/deferred operations |
| dword `0089c6b1` | Accumulated lock-owner mask |
| dword `0089c6b5` | Shared pending request mask, for both acquire and release |
| `0089c669 & 0x08000000` | Deferred acquire pending |
| `0089c669 & 0x04000000` | Deferred release pending |
| `0089c669 & 0x10000000` | Current input-lock state |

The old control proof establishes that activation asks `004af0a0(0x20)` and that
keyboard/button interruption consumes the accepted exit input before requesting
the frontend. Do not translate that into independent acquire/release queues or
an unconditional immediate unlock.

### Acquire at `004af0a0`

- If the handler guard is nonzero, `004af19c` sets the acquire-pending flag and
  ORs the requested mask into the shared pending word. It does not apply the
  transition's resets on that branch.
- Otherwise, `004af0b6..004af0ca` clears the pending word and acquire-pending
  flag, then ORs the argument into the accumulated owner mask.
- Only an unlocked-to-locked transition, tested at `004af0d5`, sets lock bit
  `0x10000000` and performs the reset sequence. Adding an owner while already
  locked skips that sequence. This is not a counted lease per request.

### Release at `004af1c0`

- With a nonzero handler guard, `004af321` sets the release-pending flag and ORs
  the requested mask into the same pending word.
- With the guard clear, `004af1db..004af1ed` clears that word and the
  release-pending flag, then removes requested bits from the owner mask.
- `004af1f3..004af209` is important: **argument bit 0 is a force-release flag**.
  If it is set, the routine zeros the entire remaining owner mask. Without it,
  any remaining owner prevents the unlock transition. An already empty mask can
  therefore complete release even when the argument is zero.
- If lock bit `0x10000000` was set, `004af220/004af22a` clears both it and
  `0x20000000`, then performs the reset sequence. The full-release path also
  checks signed tribe fields `+0x92d/+0x931`; if either is positive it calls
  `0047a550(0x0c, tribe)`. This downstream call is not executed or interpreted as
  OS focus behavior here.

The reset sequence repeatedly calls `00526c10` until its result is zero, clears
three 256-byte arrays at `0098e928`, `00984591` and `00984691`, and zeros six
dwords at `00984560/564/568/56c/570/574`. It conditionally calls `004b9150` and
`004ba5d0` when byte `0089c6e7==7`, calls `0047a550(0, tribe)`, clears bytes
`0098e910/0089ce6c` and clears word `0098e908` bits `0x0c00`. These are explicit
memory/call observations, not a proof that all OS events or every input owner
has been reset. External callees and concurrent mutation remain outside scope.

## Where the deferred work actually runs

[The complete service](rolling-demo-input-evidence/service.asm) is `004aa4e0`.
It first calls `004b2670`. The latter returns zero if pointer `00afc2f4` is null,
otherwise it returns dword `005cdc40`. A zero result skips the whole service;
there is no unconditional promise of progress on every call.

The service selects its unlocked or locked branch at `004aa532`. Both branches
call `00526a80(005cdb98, 0, 0)` before testing pending flags, at
`004aa59c` and `004aa700`. They then run the same state-transfer sequence:

1. Test acquire-pending (`004aa5a4` / `004aa708`). If the handler remains active,
   retain the pending acquire and mask. If it is inactive, clear the shared
   pending mask, clear the acquire-pending flag, and OR the captured mask into
   accumulated ownership (`004aa5c3..004aa5d7` / `004aa727..004aa73b`). Perform
   the reset sequence only if lock bit `0x10000000` was previously clear.
2. Test release-pending (`004aa6b6` / `004aa819`). If set, pass the **current**
   shared mask to `004af1c0` (`004aa6c5` / `004aa828`). That callee rechecks the
   handler guard; it is not forcibly bypassed by the service.
3. At common continuation `004aa830`, clear recording flag `0x4000` in word
   `0098f746`. If the outer admission gate returned zero, this clear is skipped
   along with the rest of the service.

**Acquisition precedes release, and they share a word.** If both pending flags
are set when an inactive-handler service reaches this code, successful acquire
consumes the combined pending mask before release reads it. Release then sees
zero, not a separately preserved release mask. For a nonzero resulting owner
mask, release(0) clears its pending flag but leaves ownership and the input lock.
This is an instruction-level conditional, not evidence that ordinary demo entry
and exit naturally create that mixed state. An implementation must not invent
two independent queues or silently reverse the observed order.

## Callback boundary and caller ordering

[`00526a80`](rolling-demo-input-evidence/handler.asm) calls `00526d10` for the
batch count when its second argument is zero, loops over that count and calls
`00526c10` to read each record. For event type 1 it dispatches through its table.
The original 20-byte table at `005cdb98` contains keyboard `004a9d90`, pointer
`004aa1c0`, then three null pointers. The selector table routes codes
`0xf0..0xf2` and `0xf4..0xf6` to the pointer path, while `0xf3` uses the ordinary
keyboard path. Other event types have their own paths or early-return behavior.
No callback target is executed by this research.

The service's pending-mask tests therefore happen **after this dispatcher
returns**, not after each individual event. Additional records in its captured
batch may be dispatched before the deferred transition. The actual caller
cannot be replaced by a single-event immediate acquire/release assumption. This
does not prove how many OS events are pending, that callbacks always terminate,
or that the handler guard is clear on every possible callback return.

The complete caller `004a4960` reaches the service at `004a4b25` only on its
non-teardown branch and when `0089c669 & 0x80000000` is clear. The alternate branch
calls other routines. When subsequent interface-state gates permit continuation,
simulation entry `004a5590` follows at `004a4b6a`. This binds one actual caller
and ordering, not unconditional once-per-frame or per-simulation-turn cadence.

## Demo cleanup requests a forced release

[Cleanup `004b2700`](rolling-demo-input-evidence/cleanup.asm) first masks the
recording flags with `0xff03`, calls several retained state helpers, then tests
CP activity bit 8 at `004b2818`. The set branch requests acquire(0x20). The clear
branch reaches **`004af1c0(1)` at `004b286b/004b286d`**, after its mode-dependent
command and flag updates. That is the force-release operation above, not merely
removal of owner 0x20. The intervening external callees are not evaluated here,
so the post-call activity test is kept explicit rather than treated as constant.

On a consumed exit callback with the handler guard still set, that release
request queues flag `0x04000000` and mask 1. If no competing acquire request
intervenes, the admitted service's subsequent inactive-handler release consumes
that mask, zeros all accumulated owners and unlocks/reset inputs. Cleanup itself
sets recording flag `0x4000` at `004b28ba`; the later admitted service clears it
at `004aa830`. This establishes a deferred request/service boundary, not a global
guarantee against arbitrary callbacks or other state writers.

The existing frontend-state-7 request remains distinct from completion of
frontend resources and OS/browser focus. No world snapshot rollback, exact menu
row, focus target, command replay equivalence or rendered result follows.

## Reproducibility and remaining work

Seven bounded GNU objdump 2.44 invocations inspected the already authenticated
EXE as data. No extraction, download, installer, emulator, native instruction,
application, browser, or camera/parser test ran. The seven selected windows
contain **3,440 consecutive instruction bytes** and include all their returns.
The three separate tables contain **39 bytes**. Each listing byte column was
reassembled and compared to the original PE-mapped slice. Display headers omit
local paths; instruction lines are unchanged. Raw broader exploratory listings
and exact commands are retained separately, not mistaken for executable code at
their embedded table/padding edges.

The absence of generated exports for `00526a80` and `004b2700` was retained as
404 evidence, not bypassed with an export/install run. The original-byte route
was already authorized and provides their source evidence directly.

Still required: actual frontend transition/resource and focus completion;
complete GP/CP command and GM mapping; source-map provenance; error-byte
consumers; replay/current-save/native/browser/performance acceptance; canonical
planning and full-project gates. This note supplies a source contract for a
future controller, not that controller, a behavioral test count or issue closure.
