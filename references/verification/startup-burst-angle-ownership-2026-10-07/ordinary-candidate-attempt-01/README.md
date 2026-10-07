# Candidate ordinary startup attempt01: failed entry gate

Exact source `c9d8a5e18399e343cc6a99d4d89b7d4c16108a81` ran once under the
reviewed packet and existing sandboxed harness. Host start00:46:20.103682 UTC,
child launch00:46:22.962374, body end00:47:09.388587, terminal00:47:13.854148 on
2026-10-07. Original tool session61609, terminal chunkca127e. Exit1.

The combined initial guard rejected after public Mission1 entry and `bindGame`,
before passive observer installation and before the scenario's Skip click. This
version did not retain individual turn/level/speed/paused fields before throwing,
so the exact failed predicate cannot be claimed. The harness failure screenshot
shows that the mission and stone sequence were running, but is not a substitute
for the missing before/burst/completed same-render captures. No browser acceptance
or before/after correction is claimed from this failed attempt.

Source inspection explains why late binding is an unsafe observation boundary:
GameScene.start schedules the normal first RAF after asset readiness; bindGame
waits for canvas, an error-overlay predicate, and a scene/store/loading predicate.
The latter two use RAF polling, while animate consumes real elapsed time through
advanceGame. Binding can therefore finish after multiple simulation turns. This
is a possible timing explanation, not a measured exact cause for the retained
combined guard failure. No bound was relaxed and no retry was made.

Cleanup is independently inspectable in the same-invocation host receipt:
remaining owned processes empty, verified ownership, no process-read errors,
donor1978923 returned, complete dependency inventory unchanged, and source/tools
unchanged. The transient exec-server transport interruption happened later during
a read-only source command; a read-only retry reconnected successfully. It does
not alter the already terminal browser result or its cleanup record.
