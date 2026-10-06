# Firewarrior firing comparison preflight review

Reviewed exact head `e2bcc32a6fd0a088e3ef4f9f092f7bab3af8b984`, base
`b0208188b8de345a6ad5e86cb7c49769624dda86`. **BLOCK CPU4 execution pending the
two repairs below.** No emulator, actual port, browser, install or full gate ran.
The retained source-preflight receipt is passed at the clean exact head; its raw
stdout digest and before/after identities were verified independently.

## Launch blockers

1. **Guard native writes and preserve immutable original bytes.**
   `probe.py:71–73` uses a mapper that maps the entire PE with default RWX
   permissions. `probe.py:106–142` guards instruction addresses only; no memory
   write hook or section protection exists. Add the existing raid probe's
   `UC_HOOK_MEM_WRITE` pattern with named permitted native data ranges and fixture/
   stack ranges. Reject writes to original executable code, immutable animation
   row/object/descriptor data and supplied frame-count records. Validate complete
   write spans. Bound host-side leaf writes and thunk destinations too. Keep
   original code-byte identity checked rather than assuming a known EXE hash also
   proves its emulated bytes remained unchanged. Do not patch original code or
   broaden the fixture after a rejected write.

2. **Retain partial evidence and terminal cleanup on failure.**
   Native artifacts are first written at `probe.py:233`, after all native cases
   and the observed-entry assertion. A failing hook, native exception, call limit
   or timeout can therefore leave no snapshots/events for the actual failing case.
   Save the fixture and before-state before each call, completed visits as they
   finish, and the failing case/address/events/error in bounded evidence. Preserve
   the actual state, never synthesize a successful after-state. Node stdout/stderr
   are written only after `subprocess.run` returns normally (`238–243`);
   TimeoutExpired and signal exceptions bypass those writes and final RSS/status.
   Use a bounded try/except/finally path that retains available output, exception,
   call totals, RSS and explicit kill/reap or normal-exit evidence for only the
   owned child. Reuse the existing raid probe's failure/cleanup approach.

## Accepted shape and explicit batching clarification

The port load hook verifies the actual caller hash and appends only its export;
it does not replace the controller, setters, readiness or launch. The source
preflight conservatively binds 216 local application dependency files and rejects
bare package imports. It proves syntax/source identity, not import execution.

Native command `0051a2a0` starts at the real entry and must return to the supplied
stop. Row/object setters `004d3ff0 → 004d4040 → 004ee700`, native readiness, launch,
class initialization and cleanup remain real. The four supplied leaves are
declared; source/target/flat terrain, allocation slots and frame-count table are
explicit synthetic inputs. No world animation or cooldown update is claimed.

The eight named cases for each of person/building targets cover two prior frames,
phase 44 recovery, phase 40 entry/present/gone, and phase 45 entry/expiry/cleared:
16 cases, at most 70 native and 70 port visits. Assignment, object/draw/f1/f2,
flags, phases, timer, cooldown, completion and the mapped projectile role are
compared; excluded raw target/stateObject/stamp fields remain retained and scoped.
Descriptor 13/14 records are explicitly identical. Real snapshots expose native
assignment 0x200, f2=0/f1=1, the initial decrement and post-shot hold rather than
inventing their expected output. Completion differences still need outer-caller
interpretation before becoming live-defect claims.

The coordinator accepts **one fixed batch: all 16 native cases, all 16 port cases,
then comparisons**. No new parked-peer framework is required solely to reorder
it. Revised wording must make clear that comparisons are deferred and that the
first difference is identified afterward, not an early-stop or incremental
comparison promise. Setup/input/write/instruction/resource failures still abort
immediately and retain partial evidence. Known baseline differences return a
failed comparison; they are not parity passes.

CPU affinity via the exact taskset CPU4 CLI, finite instruction/call/event limits,
16 MiB TCG configuration before mapping, less-than-16 MiB mapped image/fixture,
foreground timeout, Node heap/time limits and output limits are a finite proposed
envelope. Clarify that Python RLIMIT_AS is **soft 512 MiB / hard 8 GiB**, not hard
512 MiB: the raised hard limit permits the child's declared address-space cap.
Record actual TCG/mapping/affinity where available. No bound expansion is approved.

The ordinary route is acceptable **as a source plan only**: Mission 10 training,
ordinary ground Move and natural rest enable automatic command 21 at the authored
Tower. A Tower click would issue 19 and is excluded. Source 48 baseline detection
uses real owner/phase/launch identity, and source 296 is correctly excluded as a
firing predicate. Browser checker/import/guardian closure is not frozen or ready.

Re-review only the two repairs and revised explicit batch/resource wording at a
new frozen head. No implementation, new cases or broader audit is requested.
