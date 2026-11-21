# Computer marker guards: single-marker order preparation

Issue [#1059](https://github.com/JohnDeved/populous-new-dawn/issues/1059), base main
`4496d39f62a0bbc78ff7414bcde61d93ddf83b39`. Static, read-only evidence from the original
`d3dpoptb.exe` (SHA-256 `3a5065c7…dfbe4f`, `decomp/tools.json`): Capstone 5.0.7
disassembly plus the tracked Ghidra exports `004cedd0`, `004359b0`, `0041b180`,
`00418ce0`, `004d2740`, `00445750` and `004e9b40`. No original execution, emulation,
fixture recording or parity claim. Field names are inferred.

Probe: `python3 -I scripts/check-static-computer-marker-guards.py "$POPULOUS_EXE"`
verifies 65 reviewed instruction tuples (`passed`, exit 0; wrong executable rejected,
exit 1).

Related: two-marker routes in [player-patrol.md](player-patrol.md) P5–P6 and
[guard-posts.md](guard-posts.md) section 6; task phases in
[mission2-startup-commands.md](mission2-startup-commands.md).

## Phase 5 of the type-24 marker task (`004cedd0`)

The non-special branch (`task +0x2a == 0`, `004cf0c5`) commits the staged people,
who are all selected (`+0x7a & 0x80`) and in state 14:

| Route | Sequence |
| --- | --- |
| Two markers (`004cf0de..004cf13a`) | `00435730(11, 0x606, primary)`, `00435730(11, 0x606, secondary)`, `004359b0(-1,-1,-1)`, `00418ce0(14)`, `004f6440`. `0043b010` rewrites the pair to command 25. |
| One marker (`004cf150..004cf1be`) | point = task dword `[edi]`, or the marker word when it is -1. `00435730(3, 0, point)`, then **`004359b0(4,-1,-1)`**, then **`0041b180(14, 4,-1,-1)`**, then `00435730(11, 0x606, point)`, `004359b0(-1,-1,-1)`, `00418ce0(14)`, `004f6440`. |

`004359b0` (`00435aa7..00435acd`) visits only selected people whose model equals one
of the three filters, where a first filter of -1 means every model. It clears each
visited person's queue and cursor, then attaches the records that the person's model
accepts. It does not set `flags2 & 0x10`. Nothing restarts the person until a state
initializer runs.

`0041b180(ai, state, m1, m2, m3)` visits the tribe's people in `state` with a matching
model. It calls `004e9b40` (motion reset). Unless `flags2 & 0x100000`, it stores
`+0x7d = state` and switches to the model's default state (`0x5a7064`, 10 for
Preachers) through `004ed6f0`/`004ed640`. The person initializer `004d2740` begins
with previous state 14 → `00445750(person, 0, 0)`, which clears `+0x7a & 0x80`
(`004457ba`). Starting state 10 runs `00432260`, which draws a speed and configures the
current command.

Consequences for one marker:

- **Preachers (model 4)** get the command-3 move, are restored at once and start it.
  They are then **deselected**, so the second commit skips them. They keep only the
  move and never receive the guard. After arrival their own state-10 behavior
  continues; in the browser that is the automatic sermon (command 17).
- **Everyone else** receives only the command-11 guard (area `marker`, extents
  `0x606`), with no leading move. `00418ce0(14)` then restores them, and the guard
  starts. The browser's port of the command-11 body (`00519f10`, `stepGuardOrder`)
  walks into the area and holds it. The native body was not re-read for this note.

## Browser difference (main `4496d39f`)

`appendLiveGuardOrders` queued `[3, 11]` in one group for every member. Warriors and
other models therefore walked through a command-3 move before guarding. Preachers
were given the guard too.

When a caller supplied no state-14 → 10 restore, nothing configured the command-3
slot. Examples are the isolated probes behind #1059, which commit to a person already
in state 10. Its goal and destination stayed 0, which is the "x = 0" observation, and
the person never walked. Ordinary campaign tasks always restore. In those tasks the
walk happened, but through the wrong order composition.

## Browser implementation (#1059)

`app/live-movement.ts` `appendLiveGuardOrders` follows the native sequence for one
marker: a command-3 commit filtered to model 4, the `0041b180` restore of those
state-14 Preachers (`resetPersonMotion`, default state, deselected by the state-14
exit), then one command-11 commit to everyone still selected. The caller's existing
`00418ce0` restore (`app/computer-runtime.ts`) starts the guards.

Browser scope: `0041b180` and `00418ce0` visit the whole tribe list. The browser
restores the task's own members. This assumes that the computer selection lock leaves
no other state-14 people in the tribe. That assumption was not separately verified.

Tests: `tests/ai-single-marker-guard.test.mjs`.
