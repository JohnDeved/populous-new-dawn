# Two releases before mode-command consumption

This addendum supplements, without modifying, the frozen `findings.md`
SHA-256 `8e2f2c8925df21f4259b4b4f15fccab6dca8130623e7f8b26a51a3f84a821051`
and original `source-correspondence.json`
SHA-256 `98267199af7d3a426a9195131c888cf8d804ccab44cb65a7ce1d5607cc595179`.
Source checkout remains `92907866646e418747dd2bda44236d9949835bc5`.

## Source-derived result

Given two completed ordinary release callbacks before the native tribe command
slot is consumed, they request the same destination mode. They do not toggle the
authoritative flag twice. The first request is accepted into an empty slot; the
second cannot overwrite the occupied slot. Both callbacks request the same
directional audio cue before admission is decided. Actual audible playback remains
subject to the original sound producer's gates.

| Initial authoritative bit | First release | Second release before consumption | After consuming accepted request |
| --- | --- | --- | --- |
| 0, global | Request cue0x6e; queue command0x5f/value1 | Request cue0x6e; same command/value1 rejected because slot is occupied | Bit0x80 set, nearby |
| 0x80, nearby | Request cue0x6f; queue command0x5f/value0 | Request cue0x6f; same command/value0 rejected because slot is occupied | Bit0x80 clear, global |

This assumes normal callback arrival, initial slot empty and global admission
flag0x800 clear. If the slot is already occupied by another command, both mode
requests are rejected; the callbacks still issue their respective cue requests.
If global admission flag0x800 is set, the producer writes neither request.

After the first request has actually been consumed, a later release reads the new
authoritative flag and legitimately requests the reverse transition. Thus the
observable distinction is whether consumption happened between releases, not an
arbitrary debounce duration or number of JavaScript events.

## Exact evidence

- `callback-refresh-004a1680-004a1720.asm`: each callback reads actual tribe bit0x80
  at004a1697. It chooses cue0x6e/value1 or cue0x6f/value0, then invokes00479cf0.
  There is no immediate flag write in the callback.
- `command-producer-00479cf0-00479dd0.asm`: command0x5f takes the default path
  at00479d2c. Nonzero slot+0x0c branches to00479d4e with DL still zero, so the
  writes at00479d56/00479d5d/00479d60 are skipped. It does not enqueue a second
  record or replace the first value.
- `nearby-bit-writer-004404e2-00440530.asm`: only the consumed command's data+4
  selects OR0x80 or AND0xffffff7f on the tribe field.
- Refresh004a16f0 mirrors the unchanged authoritative flag into the transient
  control before input processing; generic type3 release then invokes the callback
  normally. The original press/release derivation is in the main findings.

This is a deduction from recorded static branches, not a native runtime trace.
It does not establish how often the full original scheduler can present two
completed releases before consumption or the exact input-to-turn timing.

## Smallest port opportunity and exact boundary

The current follower input path is immediate:
`page.tsx::followerControl` → `GameScene.chooseFollowers` →
`scene-input-runtime.ts::chooseFollowers` → selection helpers → `scene.onChange()`.
`game-store.ts::change` likewise mutates and publishes directly. No shared queued
human tribe-command admission owner was found. `world.ai.pendingCommands` is AI
script state and must not be repurposed for this control.

An immediate `flags ^= 128` on every release would produce global after two
unconsumed releases starting global, contradicting the source-derived result.
Neither immediate double XOR nor a generic time-based debounce is supported.

The narrow opportunity is a mode-specific pending **desired value**, accepted
once until committed, with the existing flag remaining the committed display and
selection owner. Repeated releases before that commitment must not cancel the
pending transition or overwrite it with the opposite value. The cue choice derives
from the committed mode and is requested for each ordinary activation, matching
the callback boundary. This does not justify a general command framework.

The port already has an explicit fixed-turn boundary:
`GameScene.animate` → `advanceGame` (`app/game-clock.ts`) →
`tick` (`app/world-turn.ts:447`) → observer.beforeTurn / stepTurn / observer.afterTurn.
That is a concrete integration opportunity, but choosing it as the consumption
cadence is an explicit modern-port contract, not proved native timing. `tick`
returns when paused, and `advanceGame` can run presentation work while simulation
is paused. A simulation-only pending slot would therefore remain pending during
pause. Its intended paused behavior and pending-save lifecycle need an explicit
bounded implementation decision and acceptance; they cannot be inferred from the
original control callback. Do not silently attach gameplay work to
`afterCurrentGameTurn`: that helper is documented as transient presentation-only
work and returns false outside an active turn.

If the implementation preserves the port's immediate-input contract instead, it
must document the repeated-release divergence and cannot claim this edge matches
the original. A mode-specific pending owner can preserve this edge without claiming
contention equivalence against every other human command in a nonexistent shared
port queue. That cross-command contention remains an explicit limit.

No full original outer scheduler or save-codec investigation is proposed. Review
should decide the narrow commitment point, paused behavior and pending request
checkpoint ownership before live implementation. The existing committed mode
remains in `castingTribes.flags`, already included in ordinary world checkpoints.

## Acceptance consequence

Add a meaningful state-transition check: two releases before the chosen dispatch
boundary yield one transition and two directional cue requests; release, consume,
release yields two opposite transitions. Cover both starting modes and ensure
request state does not survive into an unrelated restarted/replaced World. Keep
the ordinary Mission1 counts/selection episode from the main findings as the
playable acceptance; this focused sequencing check supplies the edge evidence.

No runtime code, tests or browser/native execution was performed for this addendum.
