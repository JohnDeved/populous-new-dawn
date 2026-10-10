# Phase3 snapshot read surface and controlled contract

Source preparation and controlled qualification only; check statuses live in the
source-bound receipt, and no authored mission run is authorized. This supersedes the observer
read-surface description on this proposal branch, not the historical result or
accepted contract at485ed5c3.

The snapshot retains the existing sequence: serialize live world; enforce16MiB;
structuredClone once; serialize detached graph; collect scalar/array rows; finally
serialize and compare the complete live graph then the complete detached graph.
Both strict byte comparisons remain mandatory with no terrain/view exceptions.
The first mismatch writes the already-created before/after buffers with `wx`,
emits hashes and scope, and throws. A collector error is recorded before the
finally guards. Capture failures before a usable pair exists may have no pair.

Only these new observation helpers are called:

- `pick`: property reads and a new plain object via Object.fromEntries; absent
  fields appear null and `absentFields` identifies missing registered fields.
- `aliases`: a new object containing the six retained unit references; no owner
  is created, registered, reset or chosen by precedence.
- `registeredPeople`: direct Map entries plus plain array/object operations.
  Select only registered class1/tribe2; record every model/state/hp/assignment,
  including zero-hp and unlisted people. Unit matching is by ID/key or exact alias
  identity. Equality checks occur within the one detached graph; structuredClone
  preserves its ordinary shared references. The output is a scalar projection,
  never a reference to a world object.
- `phase3Outcome`: reads before/after task phase, selected count and active flag.
  It labels a controller transition; the decisive cohort is still the subsequent
  dispatcher-complete snapshot, after every select action ran.

No production helper is invoked by snapshot. Removed calls/imports are
computerResponseWorld, collectDefenseTargets, objectsInCell and currentPersonOrder;
the already-removed optional distance/nativePosition query stays absent. There is
no runtime export addition. The unchanged declaration wrapper invokes the real
stepComputerTasks once and observes after return. Actual select/selectShaman inputs
are wrapped once solely at their consumed call; their result and immediate stage
are recorded before returning the original value to the actual controller.

The proposed five tests import Node built-ins only and source-extract this exact
bounded helper block. Plain supplied objects include all models3/4/5/6/7, an
unlisted hp0 state14 person, stale native versus authoritative entry/resident,
unmatched registry entries and an ID/key mismatch. They verify retained cohort
and identity diagnostics. The exact source-extracted observer controller/dispatcher wrappers are exercised
with a supplied selector/controller/action batch: every delegate runs once, the
original return survives, and the decisive snapshot follows the full action batch.
This is controlled wrapper proof, not execution of the production dispatcher.
Injected collector mutations verify strict live/detached failure, original error
retention, exact rejection buffers and oversize refusal. These are observer
contracts, not actual recruitment/dispatcher cases or historical-failure replay.

Output limits remain JSONL32MiB, summary1MiB and rejection pair32MiB. The prospective
outer receipt caps each stdout/stderr at1MiB and itself at1MiB: at most68MiB total.
Keep failure buffers local. A V8 byte mismatch remains failure even if a later
read-only value comparison succeeds; the prior original typed-view/backing
identity question is unresolved and no guard repair is proposed here.
