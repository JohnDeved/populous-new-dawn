# Observer-only proposal after incomplete scheduling attempt01

Prepared for review; **no second native invocation is authorized or executed**.
The original `16c5cde6` probe, launcher and failed raw envelope remain unchanged
in the sibling packet. Its independently accepted result establishes only the
completed calls1–9 prefix: body free on8/reuse on9 and root retirement on8.
Root free and final child retirement remain uncompleted.

`source-delta.patch` is the complete candidate change against that exact probe.
It changes host observations only. The original fixture, native functions and
supplied leaves, memory/register writes,11-call timeline, native assertions,
1s/200k per-call ceiling and20s+5/15CPU/1GiB envelope are unchanged.

## Retained-data diagnosis

The failed packet cannot distinguish the engine's timeout and instruction cap:
it stopped at`00401b99` while observing a real free-list return, but did not
retain timing, instruction counts or the timeout query. It does not prove an
original game defect or justify enlarging a bound.

A host-only event replay of partial call10 finds72 pairs of repeated whole-list
walks,27,835 traversed records,111,484 native-memory read calls and up to3,723,617
Python list-membership comparisons inside the native instruction callback.
These are exact traversal/read counts and a comparison upper bound derived
from retained list operations, not a measured wall-time attribution. The full
per-event derivation is in the prior attempt's`observer-diagnosis.json`.

## Local checks and unchanged complete validation

The proposal replaces those repeated walks with the exact local changes made
by the selected original routines:

- Capture active predecessor/successor, previous retirement head, cell links and
  allocated count at`004edcf0`/`004ef180` entry. At`004ede07`/`004ee190`, verify
  class0, removal flag, counter3, active head/neighbor bypass, retirement prepend,
  both affected cell-link directions, cleared registration and unchanged count.
  The body routine performs its unlink inline; the effect path uses actual
  `004ee4f0`/`00401ba0`. These instructions are pinned in the accepted ABI packet.
- Capture retirement neighbors, previous high-free head and count at`00401b40`.
  At`00401b99`, verify retirement bypass, high-free prepend, class0/counter0 and
  unchanged count. The real caller decrements the allocated count afterward at
  `004ec975`; the complete post-call check still verifies that result.

Generation events retain their old identity/turn/state fields and now include
captured pre-operation links. Host IDs never enter native records. Given the
previous coherent partition and the frozen real routines, these local equations
check the touched links directly. They do not repeat a global acyclicity proof
at every intermediate instruction. The unchanged `ownership()` still checks
the full disjoint active/retiring/free partition of all801 records, counts and
both directions of every terrain cell chain after **every returned call**.
Thus complete per-turn validation and all final lifetime expectations remain.

Host tests extracted only the two local-check functions and exercised144 list
positions/partitions, detecting all792 single-link corruptions attempted. They
did not import the candidate or construct a native CPU. AST comparison proves
all native writes/calls/hooks/mappings, fixture data and post-call assertions
are unchanged; the audit retains exact hashes.

## Raw failure telemetry and exact next envelope

Before any outcome assertion, both normal-return and exception rows now record
monotonic elapsed nanoseconds, instruction callbacks, supplied-entry skips,
native instruction starts and the installed API's `UC_QUERY_TIMEOUT`. Code
hooks run before instructions: these counts are deliberately not labelled as
hardware-retired instructions, and the interrupted final instruction may not
execute. The direct timeout result plus callback count will distinguish the
configured ceilings if another incomplete return occurs. Query errors remain
visible instead of hiding the partial result.

`launch.json` proposes one fresh `...run-20261006-02` worktree and attempt02
output, neither created. It hashes46 inputs plus its own launch file and reuses
the unchanged receipt supervisor, sanitized environment, CPU4 and all original
bounds. The original43 inputs remain bound, alongside the new probe/audit/delta.
No retry follows automatically from this document. No app/runtime change,
capacity sweep, complete mission or ordinary-browser acceptance is implied.
