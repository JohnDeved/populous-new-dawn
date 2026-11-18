# Single-marker Preacher order ownership

The original task-24 phase-5 producer (`004cedd0`) queues model-3 movement
and commits it only to model-4 Preachers, releases state-14 Preachers through
`0041b180`, then queues model-11 guard and commits it to everyone still selected.
The second commit must not exclude every Preacher by model: locked state-14
Preachers and selected Preachers already in another state remain eligible.
`0041b180` resets motion before testing the lock; normal state initialization
clears selection. The task's final all-model release remains separate.

`check-native-single-marker.py EXE` executes this original producer, queue
allocation/commit, motion reset, state release and person initializers. It checks
three supplied boundaries: ordinary mixed group, locked Preacher and selected
already-released Preacher. Only final `004f6440` task cleanup is intercepted.
Inputs are a supplied phase-5 task, linked mixed-model list, explicit nonzero
order allocator cursor, empty world, zero animation-count table and guard scratch
buffer. This is not native recruitment, movement arrival, rendering or a complete
mission. The original initializer immediately enters movement state 33; the
browser begins that controller on its next tick. The probe establishes order and
selection ownership, not equality of that scheduling detail.

The portable tests cover the corresponding queue boundaries, an actual supplied
task-24 phase-5 consumer, flat-land arrival/holding, and checkpoint continuation.
The ordinary Mission 5 startup test additionally follows actual authored recruitment,
move dispatch, return to preaching and checkpoint continuation without supplied
entities. Two-marker patrol coverage remains unchanged. The maintained local-render
scenario covers ordinary Mission 5 UI startup and real-clock Save/Load continuation;
its execution result must be reported separately from portable/native evidence.
The older issue #1059 zero-coordinate claim was not reproduced with the actual
state initializer and must not be marked fixed by this evidence.
